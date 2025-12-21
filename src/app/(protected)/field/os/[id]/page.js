import { notFound } from 'next/navigation';
import { getServiceOrder } from '@/actions/service-orders';
import FieldServiceOrderView from '@/components/field/FieldServiceOrderView';

export default async function FieldOSPage({ params }) {
    const { id } = await params;
    const os = await getServiceOrder(id);

    if (!os) {
        notFound();
    }

    return <FieldServiceOrderView os={os} />;
}
