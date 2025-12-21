import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClient } from '@/actions/clients';
import ClientForm from '@/components/ClientForm';

export default async function EditClientPage({ params }) {
    const { id } = await params; // Next.js 15+ needs await
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    return (
        <div>
            <ClientForm initialData={client} />
        </div>
    );
}
