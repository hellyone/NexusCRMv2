
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function ProtectedLayout({ children }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar user={session.user} />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background lg:ml-0">
                {children}
            </main>
        </div>
    );
}
