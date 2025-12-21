'use client';

import { useServiceOrderActions } from '@/context/ServiceOrderActionContext';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS } from '@/utils/status-machine';
import ReportButton from '@/components/reports/ReportButton';
import ServiceOrderTabs from '@/components/ServiceOrderTabs';

export default function ServiceOrderClientContainer({ os, user }) {
    const { actions } = useServiceOrderActions();

    return (
        <div className="flex flex-col gap-6">
            <div className="border-b pb-4 flex justify-between items-start bg-white/50 sticky top-0 z-20 backdrop-blur-sm -mx-4 px-4 pt-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">{os.code}</h1>
                        <span className="badge badge-primary font-bold uppercase py-3">{SERVICE_ORDER_STATUS[os.status]}</span>
                    </div>
                    <div className="text-muted-foreground flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                        <span>Cliente: <b className="text-gray-900">{os.client.name}</b></span>
                        {os.equipment && <span>Equipamento: <b className="text-gray-900">{os.equipment.name}</b></span>}
                        <span>Prioridade: <b className="text-gray-900">{PRIORITY_OPTIONS[os.priority]}</b></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ReportButton os={os} />
                    {/* Render actions registered by tabs */}
                    {actions.map(action => (
                        <div key={action.id}>{action.component}</div>
                    ))}
                </div>
            </div>

            <ServiceOrderTabs os={os} user={user} />
        </div>
    );
}
