import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Safe decoding helper
  const decodeSafe = (val: string | undefined) => {
    if (!val) return undefined;
    try { return decodeURIComponent(val); } catch { return val; }
  };

  // Extract role and signature from cookies (decode safely to get raw values)
  const authRole = request.cookies.get('buyers-auth-role')?.value;
  const authUser = decodeSafe(request.cookies.get('buyers-auth-user')?.value);
  const authSig = decodeSafe(request.cookies.get('buyers-auth-sig')?.value);
  
  // SECURITY: Verify signature to prevent role spoofing
  const isValidSession = (role: string | undefined, user: string | undefined, sig: string | undefined) => {
    if (!role || !user || !sig) return false;
    
    // Signature was generated using EXACT raw user string
    const expectedSig = (user + role + 'buyers-secret-v1').split('').reverse().join('');
    return sig === expectedSig;
  };

  const isVerified = isValidSession(authRole, authUser, authSig);
  
  // Define locales
  const locales = routing.locales;
  const localePattern = `^/(${locales.join('|')})`;
  
  // 1. Protect Manager (Super Admin) Routes
  const isManagerPath = pathname.match(new RegExp(`${localePattern}/manager`)) || pathname.startsWith('/manager');
  const isManagerLogin = pathname.match(new RegExp(`${localePattern}/manager/login`)) || pathname.startsWith('/manager/login');

  if (isManagerPath && !isManagerLogin) {
    if (!isVerified || authRole !== 'admin') {
      const segments = pathname.split('/');
      const locale = locales.includes(segments[1] as any) ? segments[1] : routing.defaultLocale;
      const redirectUrl = new URL(`/${locale}/manager/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Protect Merchant Admin Routes
  const isAdminPath = pathname.match(new RegExp(`${localePattern}/admin`)) || pathname.startsWith('/admin');
  const isAdminLogin = pathname.match(new RegExp(`${localePattern}/admin/login`)) || pathname.startsWith('/admin/login');

  if (isAdminPath && !isAdminLogin) {
    const isDataRequest = request.headers.get('x-nextjs-data') || request.headers.get('purpose') === 'prefetch';
    
    if (!isDataRequest && (!isVerified || (authRole !== 'merchant' && authRole !== 'admin' && authRole !== 'employee'))) {
      const segments = pathname.split('/');
      const locale = locales.includes(segments[1] as any) ? segments[1] : routing.defaultLocale;
      const redirectUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }


  // 3. Handle Locale Redirection for other routes (Root, Store, etc.)
  return intlMiddleware(request);
}

// Optimization: Apply proxy to management routes and root/locales
export const config = {
  matcher: [
    '/',
    '/(ar|en)/:path*',
    '/manager/:path*',
    '/admin/:path*'
  ],
};
