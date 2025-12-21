import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUser } from '@/actions/users';
import UserForm from '@/components/UserForm';
import { notFound } from 'next/navigation';

export default async function EditUserPage({ params }) {
    const session = await auth();
    
    // Only ADMIN can access
    if (session?.user?.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    const { id } = await params;
    const user = await getUser(id);

    if (!user) {
        notFound();
    }

    return <UserForm initialData={user} />;
}

