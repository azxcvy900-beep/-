import { NextRequest } from 'next/server';
import { proxy } from './proxy';

export function middleware(request: NextRequest) {
  return proxy(request);
}

// Ensure the matcher is synced with what we have in proxy.ts or defined here
export const config = {
  matcher: [
    '/',
    '/(ar|en)/:path*',
    '/manager/:path*',
    '/admin/:path*'
  ],
};
