'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';

export async function authenticate(prevState, formData) {
    try {
        const result = z.object({
            username: z.string().min(1),
            password: z.string().min(1),
        }).safeParse(Object.fromEntries(formData));

        if (!result.success) {
            return 'Preencha os campos corretamente.';
        }

        const { username, password } = result.data;

        await signIn('credentials', { username, password, redirectTo: process.env.APP_URL || '/' });
    } catch (error) {
        console.log('Action: Caught error', error);
        if (error instanceof AuthError) {
            console.error('AuthError Context:', error.type);
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciais inválidas.';
                case 'CallbackRouteError':
                    return 'Erro no callback de autenticação.';
                default:
                    return 'Algo deu errado no login.';
            }
        }
        // Redirect errors must be re-thrown
        throw error;
    }
}
