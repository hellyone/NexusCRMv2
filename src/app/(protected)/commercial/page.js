import { getServiceOrders } from '@/actions/service-orders';
import ApprovalList from '@/components/commercial/ApprovalList';
import CommercialTracker from '@/components/commercial/CommercialTracker';
import { Clock, Activity, Search } from 'lucide-react';

export default async function CommercialPage({ searchParams }) {
    const { query } = await searchParams;

    // Fetch pending approvals (Specifically for the action list)
    const { serviceOrders: pendingApprovals = [] } = await getServiceOrders({
        status: 'WAITING_APPROVAL',
        page: 1
    });

    // Fetch all active orders for tracking (Analysis, Approved, In Progress, Waiting Parts)
    // For now we fetch all and let the component handle filtering/sorting
    const { serviceOrders: activeOrders = [] } = await getServiceOrders({
        query: query || '',
        page: 1
    });

    // Filter active orders based on business needs
    const trackedOrders = activeOrders.filter(os =>
        ['IN_ANALYSIS', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED'].includes(os.status)
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Acompanhamento Comercial</h1>
                    <p className="text-muted text-sm tracking-tight">Status em tempo real das ordens de serviço para contato com o cliente</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <form action="">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar OS ou Cliente..."
                            className="input pl-10 w-64 bg-white border-gray-200 focus:border-primary"
                        />
                    </form>
                </div>
            </div>

            {/* Pending Approvals Section - High Priority */}
            {pendingApprovals.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="text-primary" size={20} />
                        <h2 className="text-xl font-bold text-gray-800">Orçamentos Aguardando Aprovação</h2>
                        <span className="badge badge-primary">{pendingApprovals.length}</span>
                    </div>
                    <ApprovalList orders={pendingApprovals} />
                </div>
            )}

            {/* General Tracking Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    <h2 className="text-xl font-bold text-gray-800">Status de Execução e Análise</h2>
                </div>
                <CommercialTracker orders={trackedOrders} />
            </div>
        </div>
    );
}
