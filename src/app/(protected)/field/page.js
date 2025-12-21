import { getServiceOrders } from '@/actions/service-orders';
import FieldDashboard from '@/components/field/FieldDashboard';

export default async function FieldPage({ searchParams }) {
    const params = await searchParams;
    const initialOrders = await getServiceOrders({
        query: params?.query || '',
        page: 1
    });

    return (
        <div className="bg-gray-100 min-h-screen pb-20">
            {/* Header Simples */}
            <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
                <h1 className="text-lg font-bold">Meus Atendimentos</h1>
                <p className="text-xs opacity-80">Nexus OS Mobile</p>
            </div>

            <FieldDashboard initialOrders={initialOrders} />
        </div>
    );
}
