import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract role from cookies
  const authRole = request.cookies.get('buyers-auth-role')?.value;
  
  // Define locales
  const locales = ['ar', 'en'];
  const localePattern = `^/(${locales.join('|')})`;
  
  // 1. Protect Manager (Super Admin) Routes
  const isManagerPath = pathname.match(new RegExp(`${localePattern}/manager`)) || pathname.startsWith('/manager');
  const isManagerLogin = pathname.match(new RegExp(`${localePattern}/manager/login`)) || pathname.startsWith('/manager/login');

  if (isManagerPath && !isManagerLogin) {
    if (authRole !== 'admin') {
      const segments = pathname.split('/');
      const locale = locales.includes(segments[1]) ? segments[1] : 'ar';
      const redirectUrl = new URL(`/${locale}/manager/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Protect Merchant Admin Routes
  const isAdminPath = pathname.match(new RegExp(`${localePattern}/admin`)) || pathname.startsWith('/admin');
  const isAdminLogin = pathname.match(new RegExp(`${localePattern}/admin/login`)) || pathname.startsWith('/admin/login');

  if (isAdminPath && !isAdminLogin) {
    // Optimization: Allow client-side data fetches or prefetching to pass to avoid redirection loops
    // The AdminLayout.tsx on the client also has its own auth check for double security.
    const isDataRequest = request.headers.get('x-nextjs-data') || request.headers.get('purpose') === 'prefetch';
    
    if (!isDataRequest && authRole !== 'merchant' && authRole !== 'admin' && authRole !== 'employee') {
      const segments = pathname.split('/');
      const locale = locales.includes(segments[1]) ? segments[1] : 'ar';
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
