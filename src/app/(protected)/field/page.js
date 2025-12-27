import { getServiceOrders } from '@/actions/service-orders';
import FieldDashboard from '@/components/field/FieldDashboard';
import { auth } from '@/auth';

export default async function FieldPage({ searchParams }) {
    const session = await auth();
    const params = await searchParams;

    // Fetch a bit more data so we can separate Mine vs Queue locally
    // Ideally we would have separate endpoints, but for now we fetch recent items
    const initialOrders = await getServiceOrders({
        query: params?.query || '',
        page: 1,
        // We might want to remove strict filtering here if we want to see the Queue
        // But getServiceOrders might restrict by role. Let's check that later.
    });

    return (
        <div className="bg-gray-100 min-h-screen pb-20">
            {/* Header Simples */}
            <div className="bg-primary text-primary-foreground p-4 sticky top-16 z-10 shadow-md">
                <h1 className="text-lg font-bold">Meus Atendimentos</h1>
                <p className="text-xs opacity-80">Nexus OS Mobile</p>
            </div>

            <FieldDashboard initialOrders={initialOrders} user={session?.user} />
        </div>
    );
}
