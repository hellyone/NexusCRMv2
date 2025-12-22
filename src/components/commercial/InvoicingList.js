'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, ExternalLink, FileCheck, Search, Banknote } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';
import { updateServiceOrderStatus } from '@/actions/service-order-items';
import CommercialDetailsModal from './CommercialDetailsModal';

export default function InvoicingList({ orders }) {
    const router = useRouter();
    const [selectedOS, setSelectedOS] = useState(null);

    // Auto-refresh logic same as ApprovalList
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    const handleInvoice = async (os) => {
        const isRejectedReturn = os.statusHistory?.some(h => h.status === 'REJECTED');
        const actionText = isRejectedReturn ? 'Confirmar liberação de devolução sem reparo?' : 'Confirmar faturamento e liberar saída?';

        if (!confirm('Confirmar faturamento? O técnico será notificado para entregar o equipamento na expedição.')) return;

        const res = await updateServiceOrderStatus(os.id, 'INVOICED');
        if (res.error) {
            alert(res.error);
        }
    };

    if (orders.length === 0) return null;

    return (
        <div className="card bg-white border p-0 overflow-hidden shadow-sm mb-8">
            <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center gap-2">
                <Banknote className="text-emerald-600" size={20} />
                <h3 className="font-bold text-emerald-900">Aguardando Faturamento / Entrega</h3>
                <span className="badge bg-emerald-200 text-emerald-800 border-none font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500">OS</th>
                            <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500">Cliente</th>
                            <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500">Equipamento</th>
                            <th className="text-right py-3 px-6 text-xs font-bold uppercase text-gray-500">Valor Total</th>
                            <th className="text-left py-3 px-6 text-xs font-bold uppercase text-gray-500">Conclusão</th>
                            <th className="text-center py-3 px-6 text-xs font-bold uppercase text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
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
                                    <div className="font-medium text-gray-800">{os.equipment?.name || 'N/A'}</div>
                                    <div className="text-xs text-muted">SN: {os.equipment?.serialNumber || '-'}</div>
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-gray-900">
                                    R$ {maskCurrency(os.total?.toFixed(2) || '0')}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600">
                                    {os.finishedAt ? new Date(os.finishedAt).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => setSelectedOS(os)}
                                            className="btn btn-sm btn-ghost text-primary hover:bg-blue-50"
                                            title="Ver Detalhes"
                                        >
                                            <Search size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleInvoice(os)}
                                            className={`btn btn-sm text-white border-none gap-2 shadow-sm ${os.statusHistory?.some(h => h.status === 'REJECTED')
                                                ? 'bg-orange-500 hover:bg-orange-600'
                                                : 'bg-emerald-600 hover:bg-emerald-700'
                                                }`}
                                        >
                                            {os.statusHistory?.some(h => h.status === 'REJECTED') ? (
                                                <> <ExternalLink size={16} /> Autorizar Devolução </>
                                            ) : (
                                                <> <FileCheck size={16} /> Emitir Nota Fiscal </>
                                            )}
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
