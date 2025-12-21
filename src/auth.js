
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const { username, password } = credentials;

                if (!username || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { username },
                });

                if (!user) return null;

                if (!user.isActive) {
                    throw new Error('Conta desativada.');
                }

                // Brute Force Check (Simplificado)
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    throw new Error('Conta bloqueada temporariamente.');
                }

                const passwordsMatch = await bcrypt.compare(password, user.password);

                if (!passwordsMatch) {
                    // Update failed attempts
                    const attempts = user.failedAttempts + 1;
                    const lockData = {};
                    if (attempts >= 5) {
                        lockData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
                    }
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { failedAttempts: attempts, ...lockData }
                    });

                    return null;
                }

                // Login Success: Reset attempts
                await prisma.user.update({
                    where: { id: user.id },
                    data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() }
                });

                return {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    specialties: user.specialties,
                    technicianId: user.technicianId,
                };
            },
        }),
    ],
    secret: process.env.AUTH_SECRET || (() => {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('AUTH_SECRET deve ser definido em produção. Verifique seu arquivo .env');
        }
        console.warn('⚠️  AUTH_SECRET não definido. Usando valor temporário para desenvolvimento.');
        return 'dev-secret-temporary-change-in-production';
    })(),
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours
    },
});
