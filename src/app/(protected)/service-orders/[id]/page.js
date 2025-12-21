import { notFound } from 'next/navigation';
import { getServiceOrder } from '@/actions/service-orders';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS } from '@/utils/status-machine';
import ServiceOrderTabs from '@/components/ServiceOrderTabs';
import ReportButton from '@/components/reports/ReportButton';

export default async function ServiceOrderDetailPage({ params }) {
    const { id } = await params;
    const os = await getServiceOrder(id);

    if (!os) notFound();

    return (
        <div className="flex flex-col gap-6">
            <div className="border-b pb-4 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold">{os.code}</h1>
                        <span className="badge badge-primary">{SERVICE_ORDER_STATUS[os.status]}</span>
                    </div>
                    <div className="text-muted flex gap-4 text-sm">
                        <span>Cliente: <b>{os.client.name}</b></span>
                        {os.equipment && <span>Equipamento: <b>{os.equipment.name}</b></span>}
                        <span>Prioridade: <b>{PRIORITY_OPTIONS[os.priority]}</b></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ReportButton os={os} />
                    {/* Other Actions could go here */}
                </div>
            </div>

            <ServiceOrderTabs os={os} />
        </div>
    );
}
