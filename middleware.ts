import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Libera recursos internos do Next.js, API, assets estáticos e a própria página /desktop-blocked
  if (
    pathname.startsWith('/desktop-blocked') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/i.test(pathname)
  ) {
    if (
      request.nextUrl.searchParams.get('mode') === 'standalone' ||
      request.nextUrl.searchParams.get('display-mode') === 'standalone'
    ) {
      const response = NextResponse.next();
      response.cookies.set('ml_pwa_standalone', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
      return response;
    }
    return NextResponse.next();
  }

  // 2. Detecção de Mobile e PWA Standalone
  const userAgent = request.headers.get('user-agent') || '';
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile');
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent) ||
    secChUaMobile === '?1';

  // Exceção: PWA instalado em modo standalone (display-mode: standalone)
  const isStandalone =
    request.cookies.get('ml_pwa_standalone')?.value === 'true' ||
    request.nextUrl.searchParams.get('mode') === 'standalone' ||
    request.nextUrl.searchParams.get('display-mode') === 'standalone';

  // 3. Bloqueio TOTAL de Desktop em TODAS as telas da aplicação (inclusive /login, /, /menu, /rdo, etc.)
  if (!isMobile && !isStandalone) {
    const blockedUrl = new URL('/desktop-blocked', request.url);
    return NextResponse.redirect(blockedUrl);
  }

  // 4. Proteção de autenticação
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

  // Se já logado e acessar /login, redireciona para /menu
  if (pathname === '/login' && sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.usuario_id) {
        return NextResponse.redirect(new URL('/menu', request.url));
      }
    } catch {
      // Cookie corrompido, deixa ir pro login
    }
  }

  const response = NextResponse.next();

  // Se o request veio com ?mode=standalone, grava o cookie de sessão standalone
  if (
    request.nextUrl.searchParams.get('mode') === 'standalone' ||
    request.nextUrl.searchParams.get('display-mode') === 'standalone'
  ) {
    response.cookies.set('ml_pwa_standalone', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)',
  ],
};

