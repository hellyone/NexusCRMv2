import { getServiceOrders } from '@/actions/service-orders';
import ApprovalList from '@/components/commercial/ApprovalList';
import PricingList from '@/components/commercial/PricingList';
import InvoicingList from '@/components/commercial/InvoicingList';
import FinishedList from '@/components/commercial/FinishedList';
import CommercialTracker from '@/components/commercial/CommercialTracker';
import { Clock, Activity, Search } from 'lucide-react';

export default async function CommercialPage({ searchParams }) {
    const { query } = await searchParams;

    // Fetch pending approvals (Specifically for the action list)
    const { serviceOrders: pendingApprovals = [] } = await getServiceOrders({
        status: ['WAITING_APPROVAL', 'NEGOTIATING'],
        page: 1
    });

    // Fetch orders waiting for pricing
    const { serviceOrders: pricingOrders = [] } = await getServiceOrders({
        status: 'PRICING',
        page: 1
    });

    // Fetch finished orders (Ready for Invoicing)
    // REJECTED não deve aparecer aqui - só aparece após técnico marcar como FINISHED
    const { serviceOrders: invoicingOrders = [] } = await getServiceOrders({
        status: 'FINISHED',
        page: 1
    });

    // Fetch Historically Finished Orders (Closed Cycle)
    const { serviceOrders: closedOrders = [] } = await getServiceOrders({
        status: ['DISPATCHED', 'SCRAPPED', 'ABANDONED', 'WARRANTY_RETURN'],
        page: 1,
        limit: 10 // Limit older ones? Or create pagination later. Default limit is usually safe.
    });

    // Fetch all active orders for tracking (Analysis, Approved, In Progress, Waiting Parts)
    // For now we fetch all and let the component handle filtering/sorting
    const { serviceOrders: activeOrders = [] } = await getServiceOrders({
        query: query || '',
        page: 1
    });

    // Filter active orders based on business needs (Exclude everything else)
    const trackedOrders = activeOrders.filter(os =>
        ['OPEN', 'IN_ANALYSIS', 'PRICING', 'WAITING_APPROVAL', 'NEGOTIATING', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED', 'REJECTED', 'TESTING', 'REWORK', 'INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP'].includes(os.status)
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

            {/* Pending Pricing Section - TOP Priority */}
            {pricingOrders.length > 0 && (
                <PricingList orders={pricingOrders} />
            )}

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

            {/* Invoicing Section - High Priority */}
            {invoicingOrders.length > 0 && (
                <InvoicingList orders={invoicingOrders} />
            )}

            {/* General Tracking Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={20} />
                    <h2 className="text-xl font-bold text-gray-800">Status de Execução e Análise</h2>
                </div>
                <CommercialTracker orders={trackedOrders} />
            </div>

            {/* Archive / History Section */}
            {closedOrders.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <FinishedList orders={closedOrders} />
                </div>
            )}
        </div>
    );
}
