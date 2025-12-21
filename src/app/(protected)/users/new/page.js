import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UserForm from '@/components/UserForm';

export default async function NewUserPage() {
    const session = await auth();
    
    // Only ADMIN can access
    if (session?.user?.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    return <UserForm />;
}

