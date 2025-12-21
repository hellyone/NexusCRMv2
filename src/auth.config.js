
export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Rotas públicas
            if (pathname === '/login' || pathname.startsWith('/api/auth')) {
                return true;
            }

            // Rotas protegidas requerem autenticação
            if (!isLoggedIn) {
                return false;
            }

            // Verificação de roles (complementa o middleware)
            const role = auth?.user?.role;
            const roleBasedRoutes = {
                '/users': ['ADMIN'],
                '/technicians': ['ADMIN'],
                '/settings': ['ADMIN'],
                '/parts': ['ADMIN', 'BACKOFFICE'],
                '/finance': ['ADMIN', 'BACKOFFICE'],
            };

            for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
                if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
                    return false;
                }
            }

            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.specialties = user.specialties;
                token.technicianId = user.technicianId;
            }
            if (trigger === "update" && session) {
                // Allow updating session from client
                return { ...token, ...session.user };
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.specialties = token.specialties;
                session.user.technicianId = token.technicianId;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.js
};
