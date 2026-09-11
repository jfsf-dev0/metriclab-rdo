import { NextResponse, type NextRequest } from 'next/server';

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
    pathname === '/og-image.jpg' ||
    pathname === '/og-preview.jpg' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Detecção de crawlers e robôs de redes sociais (WhatsApp, Facebook, etc.)
  const userAgent = request.headers.get('user-agent') || '';
  const isCrawler =
    /bot|crawler|spider|slurp|facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Slackbot|SkypeUriPreview|meta-externalagent|Googlebot|bingbot|Applebot/i.test(
      userAgent
    );

  if (isCrawler) {
    return NextResponse.next();
  }

  // 3. Verificação de exceção de auditoria oficial (header x-playwright-audit)
  const PLAYWRIGHT_SECRET = process.env.PLAYWRIGHT_SECRET || 'metriclab_audit_2026';
  const auditHeader = request.headers.get('x-playwright-audit');
  const isAuditBypass = auditHeader === PLAYWRIGHT_SECRET;

  // 4. Detecção de mobile por User-Agent e Sec-CH-UA-Mobile
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile');
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent) ||
    secChUaMobile === '?1';

  // 5. Bypass de standalone (APENAS em development ou com secret de auditoria)
  const isDev = process.env.NODE_ENV === 'development';
  const hasStandaloneCookie = request.cookies.get('ml_pwa_standalone')?.value === 'true';
  const hasStandaloneParam =
    request.nextUrl.searchParams.get('mode') === 'standalone' ||
    request.nextUrl.searchParams.get('display-mode') === 'standalone';

  const isStandaloneAllowed = (isDev || isAuditBypass) && (hasStandaloneCookie || hasStandaloneParam);

  // 6. BLOQUEIO DE DESKTOP — CAMADA MAIS EXTERNA
  // Se desktop (não mobile, nem audit bypass, nem standalone em dev) → redirecionar para /desktop-blocked
  // Independente de autenticação, sessão ou rota
  if (!isMobile && !isAuditBypass && !isStandaloneAllowed) {
    const blockedUrl = new URL('/desktop-blocked', request.url);
    return NextResponse.redirect(blockedUrl);
  }

  // 7. Ao acessar / ou /login: limpa sessão residual
  if (pathname === '/login' || pathname === '/') {
    const response = NextResponse.next();
    if (request.cookies.has('ml_rdo_session')) {
      response.cookies.delete('ml_rdo_session');
    }
    if (isStandaloneAllowed && hasStandaloneParam) {
      response.cookies.set('ml_pwa_standalone', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  }

  // 8. Proteção de autenticação para rotas internas
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

  const response = NextResponse.next();
  if (isStandaloneAllowed && hasStandaloneParam) {
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
