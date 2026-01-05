'use client';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/login` })}
            className="flex items-center gap-3 p-3 w-full rounded-md hover:bg-white/10 hover:text-white transition-colors text-sm font-medium mt-auto text-gray-300"
        >
            <LogOut size={20} />
            Sair
        </button>
    );
}
