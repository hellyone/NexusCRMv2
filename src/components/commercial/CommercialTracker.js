'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, User, Wrench, Calendar, MapPin, Search, FileText, Activity, Save } from 'lucide-react';
import { SERVICE_ORDER_STATUS } from '@/utils/status-machine';
import { cn } from '@/lib/utils';
import { updateCommercialDetails } from '@/actions/service-orders';
import { maskCurrency } from '@/utils/masks';
import CommercialDetailsModal from './CommercialDetailsModal';

export default function CommercialTracker({ orders }) {
    const router = useRouter();
    const [selectedOS, setSelectedOS] = useState(null); // For Modal
    const [loading, setLoading] = useState(false);

    // Auto-refresh logic
    useEffect(() => {
        const interval = setInterval(() => router.refresh(), 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (orders.length === 0) {
        return (
            <div className="card bg-gray-50 border border-dashed p-10 text-center">
                <p className="text-gray-500 italic">Nenhuma ordem de serviço ativa no momento.</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'IN_ANALYSIS': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'WAITING_APPROVAL': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'WAITING_PARTS': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'PAUSED': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {orders.map((os) => (
                <div key={os.id} className="card bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">

                        {/* Summary Info (Same as before) */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-lg text-primary">{os.code}</span>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", getStatusColor(os.status))}>
                                    {SERVICE_ORDER_STATUS[os.status]}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">{os.client.name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted">
                                <MapPin size={12} /> {os.client.city} - {os.client.state}
                            </div>
                        </div>

                        {/* Equipment */}
                        <div className="flex-1 min-w-[200px] border-l border-gray-100 pl-4 h-full hidden md:block">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Wrench size={14} className="text-gray-400" />
                                <span className="font-medium">{os.equipment?.name || 'N/A'}</span>
                            </div>
                            {os.executionDeadline && (
                                <div className="mt-2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                                    Prazo: {new Date(os.executionDeadline).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                            <button
                                onClick={() => setSelectedOS(os)}
                                className="btn btn-sm btn-primary gap-2 shadow-sm hover:scale-105 transition-transform"
                            >
                                <Search size={14} /> Mais Detalhes
                            </button>
                            <Link href={`/service-orders/${os.id}`} className="btn btn-sm btn-ghost text-gray-400 hover:text-primary">
                                <ExternalLink size={16} />
                            </Link>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-b-xl overflow-hidden flex">
                        <div className={cn(
                            "h-full transition-all duration-500",
                            os.status === 'IN_ANALYSIS' ? 'w-[20%] bg-blue-400' :
                                os.status === 'WAITING_APPROVAL' ? 'w-[40%] bg-purple-400' :
                                    os.status === 'APPROVED' ? 'w-[60%] bg-green-500' :
                                        os.status === 'IN_PROGRESS' ? 'w-[80%] bg-amber-500' :
                                            'w-[100%] bg-emerald-500'
                        )} />
                    </div>
                </div>
            ))}

            {/* Traceability Modal */}
            {selectedOS && (
                <CommercialDetailsModal os={selectedOS} onClose={() => setSelectedOS(null)} />
            )}
        </div>
    );
}
