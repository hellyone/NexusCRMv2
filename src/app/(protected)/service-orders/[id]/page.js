import { notFound } from 'next/navigation';
import { getServiceOrder } from '@/actions/service-orders';
import { auth } from '@/auth';
import { ServiceOrderActionProvider } from '@/context/ServiceOrderActionContext';
import ServiceOrderClientContainer from '@/components/ServiceOrderClientContainer';

export default async function ServiceOrderDetailPage({ params }) {
    const session = await auth();
    const { id } = await params;
    const os = await getServiceOrder(id);

    if (!os) notFound();

    return (
        <ServiceOrderActionProvider>
            <ServiceOrderClientContainer os={os} user={session?.user} />
        </ServiceOrderActionProvider>
    );
}
