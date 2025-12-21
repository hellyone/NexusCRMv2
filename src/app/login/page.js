'use client';

import { useActionState } from 'react';
import { authenticate } from '@/actions/auth';
import { Loader } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">Nexus OS</h1>
                    <p className="text-gray-500">Acesse sua conta</p>
                </div>

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Usuário</label>
                        <input
                            className="input input-bordered w-full"
                            type="text"
                            name="username"
                            placeholder="Seu usuário"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <input
                            className="input input-bordered w-full"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                            minLength={4}
                        />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full"
                        aria-disabled={isPending}
                        disabled={isPending}
                    >
                        {isPending ? <Loader className="animate-spin" /> : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
