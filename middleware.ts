import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith('/menu') ||
    pathname.startsWith('/rdo') ||
    pathname.startsWith('/ocorrencia');

  const sessionCookie = request.cookies.get('ml_rdo_session')?.value;

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se já logado e acessar /login ou /, redireciona para /menu
  if ((pathname === '/login') && sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.usuario_id) {
        return NextResponse.redirect(new URL('/menu', request.url));
      }
    } catch {
      // Cookie corrompido, deixa ir pro login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/menu/:path*', '/rdo/:path*', '/ocorrencia/:path*', '/login'],
};
