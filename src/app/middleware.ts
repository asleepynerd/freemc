import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = [
  '/dashboard',
  '/servers',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.includes('/ws')) {
    return NextResponse.next();
  }
  
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/servers/:path*'],
}; 