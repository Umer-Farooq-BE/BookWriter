// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/home', '/settings'];

export async function middleware(req: NextRequest) {
//   const url = req.nextUrl.clone();
//   if (!PROTECTED.some(p => url.pathname.startsWith(p))) return NextResponse.next();

//   // quick presence check – you can upgrade this to a server call if needed
//   const access = req.cookies.get('access_token');
//   if (!access) {
//     url.pathname = '/login';
//     url.searchParams.set('next', req.nextUrl.pathname);
//     return NextResponse.redirect(url);
//   }
  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/settings/:path*']
};