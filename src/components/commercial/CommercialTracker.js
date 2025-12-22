'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, User, Wrench, Calendar, MapPin, Search, FileText, Activity, Save } from 'lucide-react';
import { getPublicStatus } from '@/utils/status-machine';
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

    // Helper to render Tech status
    const TechStatusBadge = ({ os }) => {
        const { label, color } = getPublicStatus(os, 'TECH');
        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border block w-fit whitespace-nowrap", color)}>
                {label}
            </span>
        );
    };

    // Helper to render Commercial status
    const CommercialStatusBadge = ({ os }) => {
        const { label, color } = getPublicStatus(os, 'BACKOFFICE');
        return (
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border block w-fit whitespace-nowrap", color)}>
                {label}
            </span>
        );
    };

    return (
        <div className="card bg-white border p-0 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-4 text-left w-[140px]">OS</th>
                            <th className="py-3 px-4 text-left w-[140px]">Status Técnico</th>
                            <th className="py-3 px-4 text-left w-[140px]">Status Comercial</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Equipamento</th>
                            <th className="py-3 px-4 text-left w-[140px] hidden md:table-cell">Prazo</th>
                            <th className="py-3 px-4 text-center w-[100px]">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((os) => (
                            <tr key={os.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                                    <span className="font-bold text-sm text-gray-900 font-mono">{os.code}</span>
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <TechStatusBadge os={os} />
                                </td>
                                <td className="py-2.5 px-4 align-middle">
                                    <CommercialStatusBadge os={os} />
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
                                        <span className="text-xs font-medium text-gray-700 line-clamp-1">{os.equipment?.name || '-'}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{os.equipment?.serialNumber || 'SN: N/A'}</span>
                                    </div>
                                </td>
                                <td className="py-2.5 px-4 align-middle hidden md:table-cell">
                                    {os.executionDeadline ? (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 font-medium">
                                            <Calendar size={12} /> {new Date(os.executionDeadline).toLocaleDateString('pt-BR')}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="py-2.5 px-4 align-middle text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setSelectedOS(os)}
                                            className="btn btn-sm btn-ghost btn-square text-gray-500 hover:text-primary hover:bg-blue-50"
                                            title="Ver Detalhes"
                                        >
                                            <Search size={16} />
                                        </button>
                                        <Link href={`/service-orders/${os.id}`} className="btn btn-sm btn-ghost btn-square text-gray-400 hover:text-primary hover:bg-gray-100">
                                            <ExternalLink size={16} />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Traceability Modal */}
            {selectedOS && (
                <CommercialDetailsModal os={selectedOS} onClose={() => setSelectedOS(null)} />
            )}
        </div>
    );
}
