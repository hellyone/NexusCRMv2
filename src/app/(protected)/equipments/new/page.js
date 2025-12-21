import EquipmentForm from '@/components/EquipmentForm';
import { getClientsForSelect } from '@/actions/clients';

export default async function NewEquipmentPage() {
    const clients = await getClientsForSelect();

    return (
        <div>
            <EquipmentForm clients={clients} />
        </div>
    );
}
