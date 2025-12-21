'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';
import { SERVICE_ORDER_STATUS } from '@/utils/status-machine';
import { updateServiceOrderStatus } from '@/actions/service-order-items';
import { Search } from 'lucide-react';
import CommercialDetailsModal from './CommercialDetailsModal';

export default function ApprovalList({ orders }) {
    const router = useRouter();
    const [deadlines, setDeadlines] = useState({});
    const [selectedOS, setSelectedOS] = useState(null);

    // Auto-refresh every 30 seconds to catch new pending approvals
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    const handleAction = async (id, status) => {
        const actionText = status === 'APPROVED' ? 'aprovar' : 'reprovar';
        const deadline = deadlines[id];

        if (status === 'APPROVED' && !deadline) {
            alert('Por favor, defina um prazo para a execução antes de aprovar.');
            return;
        }

        if (!confirm(`Deseja realmente ${actionText} este orçamento?`)) return;

        const res = await updateServiceOrderStatus(id, status, null, deadline);
        if (res.error) {
            alert(res.error);
        }
    };

    if (orders.length === 0) {
        return (
            <div className="card bg-gray-50 border border-dashed p-12 text-center">
                <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600">Nenhum orçamento pendente</h3>
                <p className="text-sm text-muted">Todos os orçamentos foram processados ou não há novas solicitações.</p>
            </div>
        );
    }

    return (
        <div className="card bg-white border p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left py-3 px-6">OS</th>
                            <th className="text-left py-3 px-6">Cliente</th>
                            <th className="text-left py-3 px-6">Equipamento</th>
                            <th className="text-right py-3 px-6">Valor Total</th>
                            <th className="text-left py-3 px-6">Prazo de Execução</th>
                            <th className="text-center py-3 px-6">Detalhes</th>
                            <th className="text-center py-3 px-6">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map((os) => (
                            <tr key={os.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 font-bold text-primary">
                                    <Link href={`/service-orders/${os.id}`} className="hover:underline flex items-center gap-2">
                                        {os.code} <ExternalLink size={14} className="text-muted" />
                                    </Link>
                                </td>
                                <td className="py-4 px-6 text-sm">
                                    <div className="font-bold text-gray-900">{os.client.name}</div>
                                    <div className="text-xs text-muted">{os.client.city} - {os.client.state}</div>
                                </td>
                                <td className="py-4 px-6 text-sm">
                                    {os.equipment ? (
                                        <>
                                            <div className="font-medium text-gray-800">{os.equipment.name}</div>
                                            <div className="text-xs text-muted">{os.equipment.serialNumber}</div>
                                        </>
                                    ) : (
                                        <span className="text-xs italic text-muted">Não informado</span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-gray-900">
                                    R$ {maskCurrency(os.total.toFixed(2))}
                                </td>
                                <td className="py-4 px-6">
                                    <input
                                        type="date"
                                        className="input input-sm border-gray-200 focus:border-primary text-xs w-36"
                                        value={deadlines[os.id] || ''}
                                        onChange={(e) => setDeadlines(prev => ({ ...prev, [os.id]: e.target.value }))}
                                    />
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <button
                                        onClick={() => setSelectedOS(os)}
                                        className="btn btn-sm btn-ghost text-primary hover:bg-blue-50 gap-1"
                                        title="Ver Rastreabilidade e Financeiro"
                                    >
                                        <Search size={14} /> Detalhes
                                    </button>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => handleAction(os.id, 'APPROVED')}
                                            className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200 border-none px-3"
                                            title="Aprovar com Prazo"
                                        >
                                            <CheckCircle size={14} className="mr-1" /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleAction(os.id, 'REJECTED')}
                                            className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 border-none px-3"
                                            title="Reprovar"
                                        >
                                            <XCircle size={14} className="mr-1" /> Reprovar
                                        </button>
                                    </div>
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
