import { notFound } from 'next/navigation';
import { getPart } from '@/actions/parts';
import PartForm from '@/components/PartForm';

export default async function EditPartPage({ params }) {
    const { id } = await params;
    const part = await getPart(id);

    if (!part) {
        notFound();
    }

    return (
        <div>
            <PartForm initialData={part} />
        </div>
    );
}
