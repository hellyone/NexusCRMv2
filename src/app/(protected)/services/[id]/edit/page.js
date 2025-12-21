import { notFound } from 'next/navigation';
import { getService } from '@/actions/services';
import ServiceForm from '@/components/ServiceForm';

export default async function EditServicePage({ params }) {
    const { id } = await params;
    const service = await getService(id);

    if (!service) {
        notFound();
    }

    return (
        <div>
            <ServiceForm initialData={service} />
        </div>
    );
}
