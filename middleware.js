import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Rotas públicas que não requerem autenticação
const publicRoutes = ['/login', '/api/auth', '/api/health'];

// Rotas protegidas com requisitos de role específicos
const roleBasedRoutes = {
    '/users': ['ADMIN'],
    '/technicians': ['ADMIN'],
    '/settings': ['ADMIN'],
    '/parts': ['ADMIN', 'BACKOFFICE'],
    '/finance': ['ADMIN', 'BACKOFFICE'],
    '/clients': ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL'],
    '/equipments': ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL'],
};

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Permitir rotas públicas
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Permitir arquivos estáticos e assets
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
    ) {
        return NextResponse.next();
    }

    // Verificar autenticação para rotas protegidas
    if (!session?.user) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Verificar permissões baseadas em role
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
        if (pathname.startsWith(route)) {
            if (!allowedRoles.includes(session.user.role)) {
                return NextResponse.redirect(new URL('/unauthorized', req.url));
            }
        }
    }

    // Adicionar headers de segurança
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy (antiga Feature-Policy)
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP básico (ajuste conforme necessário)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        );
    }

    return response;
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|).*)'],
};
