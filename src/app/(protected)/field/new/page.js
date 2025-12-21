import { getClients } from '@/actions/clients';
import FieldNewOSForm from '@/components/field/FieldNewOSForm';

export default async function FieldNewOSPage() {
    // Fetch all clients (or top 100) for client-side filtering in the simplified form
    // Optimization: Implement server-side search later if list grows too big.
    const { clients } = await getClients({ pageSize: 100 });

    return <FieldNewOSForm clients={clients} />;
}
