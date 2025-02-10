import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken');

  // Se não houver token e não estiver na rota inicial, redirecionar para "/"
  if (!token && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se houver token na rota inicial, redirecionar para "/dashboard/overview"
  if (token && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*']
};
