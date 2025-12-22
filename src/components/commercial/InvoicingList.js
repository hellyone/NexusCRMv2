'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, ExternalLink, FileCheck, Search, Banknote, MapPin } from 'lucide-react';
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
        if (!confirm('Confirmar faturamento? O técnico será notificado para entregar o equipamento na expedição.')) return;

        const res = await updateServiceOrderStatus(os.id, 'INVOICED');
        if (res.error) {
            alert(res.error);
        }
    };

    if (orders.length === 0) return null;

    return (
        <div className="card bg-white border border-emerald-100 p-0 overflow-hidden shadow-sm mb-8">
            <div className="bg-emerald-50/50 border-b border-emerald-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Banknote className="text-emerald-600" size={18} />
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Aguardando Faturamento / Entrega</h3>
                        <p className="text-[10px] text-emerald-700 font-medium">Equipamentos concluídos prontos para emissão de nota e despacho</p>
                    </div>
                </div>
                <span className="badge bg-emerald-100 text-emerald-800 border-none font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-4 text-left w-[140px]">OS</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Equipamento</th>
                            <th className="py-3 px-4 text-right w-[150px]">Valor Total</th>
                            <th className="py-3 px-4 text-left w-[120px]">Conclusão</th>
                            <th className="py-3 px-4 text-center w-[160px]">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((os) => {
                            const isRejectedReturn = os.statusHistory?.some(h => h.status === 'REJECTED' || h.toStatus === 'REJECTED');

                            return (
                                <tr key={os.id} className="hover:bg-emerald-50/20 transition-colors">
                                    <td className="py-2.5 px-4 align-middle whitespace-nowrap">
                                        <Link href={`/service-orders/${os.id}`} className="font-bold text-sm text-primary font-mono hover:underline inline-flex items-center gap-1.5">
                                            {os.code} <ExternalLink size={10} className="text-muted" />
                                        </Link>
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
                                            R$ {maskCurrency(os.total?.toFixed(2) || '0')}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 align-middle text-xs text-gray-600">
                                        {os.finishedAt ? new Date(os.finishedAt).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="py-2.5 px-4 align-middle">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setSelectedOS(os)}
                                                className="btn btn-xs btn-ghost text-primary hover:bg-blue-50 px-1"
                                                title="Ver Detalhes"
                                            >
                                                <Search size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleInvoice(os)}
                                                className={`btn btn-xs text-white border-none gap-1.5 shadow-sm font-bold ${isRejectedReturn
                                                    ? 'bg-orange-500 hover:bg-orange-600'
                                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                                    }`}
                                            >
                                                {isRejectedReturn ? (
                                                    <> <ExternalLink size={12} /> Autorizar Devolução </>
                                                ) : (
                                                    <> <FileCheck size={12} /> Faturar </>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedOS && (
                <CommercialDetailsModal os={selectedOS} onClose={() => setSelectedOS(null)} />
            )}
        </div>
    );
}
