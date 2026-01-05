'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Search, Archive, CheckCircle } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';
import CommercialDetailsModal from './CommercialDetailsModal';
import { getServiceOrderSummary } from '@/utils/service-order-summary';

export default function FinishedList({ orders }) {
    const [selectedOS, setSelectedOS] = useState(null);

    if (orders.length === 0) return null;

    return (
        <div className="card bg-white border p-0 overflow-hidden shadow-sm">
            <div className="bg-gray-100 border-b border-gray-200 p-4 flex items-center gap-2">
                <Archive className="text-gray-600" size={20} />
                <h3 className="font-bold text-gray-800">Finalizadas (Coletado / Entregue)</h3>
                <span className="badge bg-gray-200 text-gray-800 border-none font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full table-fixed border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-left w-[110px]">OS</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-left w-[20%]">Cliente</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-left w-[25%]">Equipamento</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-left w-[110px]">Entrada</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-left w-[110px]">Saída</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-center w-[120px]">Resultado</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-right w-[130px]">Valor Final</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-center w-[150px]">Status</th>
                            <th className="py-3 px-4 text-[10px] font-bold uppercase text-gray-500 text-center w-[80px]">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {orders.map((os) => {
                            const summary = getServiceOrderSummary(os);
                            return (
                                <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 align-middle">
                                        <Link href={`/service-orders/${os.id}`} className="font-bold text-gray-800 text-xs hover:underline whitespace-nowrap">
                                            {os.code}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <div className="font-bold text-gray-900 text-xs truncate" title={os.client.name}>
                                            {os.client.name}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-gray-800 text-[11px] truncate uppercase">{os.equipment?.name || 'N/A'}</span>
                                            <span className="text-[10px] text-gray-500 truncate font-mono italic uppercase">SN: {os.equipment?.serialNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-xs">{os.entryInvoiceNumber || 'S/N'}</span>
                                            <span className="text-[10px] text-gray-500">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-xs">{os.exitInvoiceNumber || 'S/N'}</span>
                                            <span className="text-[10px] text-gray-500">{os.updatedAt ? new Date(os.updatedAt).toLocaleDateString('pt-BR') : '-'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 align-middle text-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-tight block w-fit ${summary.bgColor} ${summary.color}`}>
                                            {summary.label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 align-middle text-right">
                                        <span className="font-bold text-gray-900 text-xs">
                                            {maskCurrency(os.total || 0)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 align-middle">
                                        <div className="flex justify-center">
                                            {(() => {
                                                if (os.status !== 'DISPATCHED') {
                                                    const badgeClass = os.status === 'SCRAPPED'
                                                        ? 'bg-gray-100 text-gray-600 border-gray-200'
                                                        : 'bg-green-100 text-green-700 border-green-200';

                                                    return (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-tight block w-fit ${badgeClass}`}>
                                                            {os.status === 'SCRAPPED' ? 'Descartado' : 'Finalizado'}
                                                        </span>
                                                    );
                                                }

                                                const dispatchEvent = os.statusHistory?.find(h => h.toStatus === 'DISPATCHED' || h.status === 'DISPATCHED');
                                                const note = dispatchEvent?.notes || '';

                                                let badgeClass = 'bg-green-100 text-green-700 border-green-200';
                                                let label = 'Coletado';

                                                if (note.includes('Transportadora')) {
                                                    badgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                                                    label = 'Transportadora';
                                                } else if (note.includes('Entrega realizada') || note.includes('Entrega Própria')) {
                                                    badgeClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                                    label = 'Motorista';
                                                } else if (note.includes('Retirada')) {
                                                    badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                                    label = 'Balcão';
                                                }

                                                return (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-tight block w-fit ${badgeClass}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 align-middle text-center">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => setSelectedOS(os)}
                                                className="btn btn-xs btn-ghost text-gray-500 px-1"
                                                title="Ver Detalhes"
                                            >
                                                <Search size={14} />
                                            </button>
                                            <Link href={`/service-orders/${os.id}`} className="btn btn-xs btn-ghost text-primary px-1">
                                                <ExternalLink size={14} />
                                            </Link>
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
