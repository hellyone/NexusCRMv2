'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, ExternalLink, Search, MapPin, Clock } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';
import CommercialDetailsModal from './CommercialDetailsModal';

export default function ApprovalList({ orders }) {
    const router = useRouter();
    const [selectedOS, setSelectedOS] = useState(null);

    // Auto-refresh every 30 seconds to catch new pending approvals
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (orders.length === 0) {
        return (
            <div className="card bg-gray-50 border border-dashed p-10 text-center">
                <ClipboardList className="mx-auto text-gray-300 mb-4" size={40} />
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-tight">Nenhum orçamento pendente</h3>
                <p className="text-xs text-gray-400 mt-1">Todos os orçamentos foram processados ou não há novas solicitações.</p>
            </div>
        );
    }

    return (
        <div className="card bg-white border border-gray-200 p-0 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-primary" />
                    <div>
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Orçamentos Aguardando Aprovação</h2>
                        <p className="text-[10px] text-gray-500 font-medium italic">Fila de prioridade para acompanhamento comercial</p>
                    </div>
                </div>
                <span className="badge bg-primary/10 text-primary border-none font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-4 text-left w-[140px]">OS</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Equipamento</th>
                            <th className="py-3 px-4 text-right w-[150px]">Valor Total</th>
                            <th className="py-3 px-4 text-center w-[80px]">Detalhes</th>
                            <th className="py-3 px-4 text-center w-[120px]">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((os) => (
                            <tr key={os.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                                    <span className="font-bold text-sm text-gray-900 font-mono">{os.code}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800 line-clamp-1">{os.client.name}</span>
                                        <span className="text-[10px] text-gray-500 flex items-center gap-1 line-clamp-1">
                                            <MapPin size={10} /> {os.client.city}-{os.client.state}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-gray-700 line-clamp-1 uppercase">{os.equipment?.name || '-'}</span>
                                        <span className="text-[10px] text-gray-400 font-mono uppercase">{os.equipment?.serialNumber || 'SN: N/A'}</span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle text-right">
                                    <span className="font-bold text-gray-900 text-sm">
                                        R$ {maskCurrency(os.total.toFixed(2))}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 align-middle text-center">
                                    <button
                                        onClick={() => setSelectedOS(os)}
                                        className="btn btn-xs btn-ghost text-primary hover:bg-blue-50 px-1"
                                        title="Ver Detalhes"
                                    >
                                        <Search size={16} />
                                    </button>
                                </td>
                                <td className="py-2.5 px-4 align-middle text-center">
                                    <Link
                                        href={`/service-orders/${os.id}`}
                                        className="btn btn-xs btn-primary gap-1 font-bold shadow-sm"
                                    >
                                        <ExternalLink size={12} /> Ver Fluxo
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedOS && (
                <CommercialDetailsModal os={selectedOS} onClose={() => setSelectedOS(null)} />
            )}
        </div>
    );
}
