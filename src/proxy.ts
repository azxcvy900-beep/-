import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract role from cookies
  const authRole = request.cookies.get('buyers-auth-role')?.value;
  
  // Define locales (should match next-intl config)
  const locales = ['ar', 'en'];
  const localePattern = `^/(${locales.join('|')})`;
  
  // 1. Protect Manager (Super Admin) Routes
  const isManagerPath = pathname.match(new RegExp(`${localePattern}/manager`)) || pathname.startsWith('/manager');
  const isManagerLogin = pathname.match(new RegExp(`${localePattern}/manager/login`)) || pathname.startsWith('/manager/login');

  if (isManagerPath && !isManagerLogin) {
    if (authRole !== 'admin') {
      const locale = pathname.split('/')[1] || 'ar';
      const redirectUrl = new URL(`/${locale}/manager/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Protect Merchant Admin Routes
  const isAdminPath = pathname.match(new RegExp(`${localePattern}/admin`)) || pathname.startsWith('/admin');
  const isAdminLogin = pathname.match(new RegExp(`${localePattern}/admin/login`)) || pathname.startsWith('/admin/login');

  if (isAdminPath && !isAdminLogin) {
    if (authRole !== 'merchant' && authRole !== 'admin') {
      const locale = pathname.split('/')[1] || 'ar';
      const redirectUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

// Optimization: Apply proxy only to management routes
export const config = {
  matcher: [
    '/ar/manager/:path*', 
    '/en/manager/:path*',
    '/ar/admin/:path*',
    '/en/admin/:path*',
    '/manager/:path*',
    '/admin/:path*'
  ],
};
