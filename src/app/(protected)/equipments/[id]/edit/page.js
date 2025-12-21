import { notFound } from 'next/navigation';
import { getEquipment } from '@/actions/equipments';
import { getClientsForSelect } from '@/actions/clients';
import EquipmentForm from '@/components/EquipmentForm';

export default async function EditEquipmentPage({ params }) {
    const { id } = await params;
    const [equipment, clients] = await Promise.all([
        getEquipment(id),
        getClientsForSelect()
    ]);

    if (!equipment) {
        notFound();
    }

    return (
        <div>
            <EquipmentForm initialData={equipment} clients={clients} />
        </div>
    );
}
