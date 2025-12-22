'use client';

import Link from 'next/link';
import { ExternalLink, DollarSign, ArrowRight } from 'lucide-react';

export default function PricingList({ orders }) {
    if (orders.length === 0) {
        return null;
    }

    return (
        <div className="card bg-white border border-yellow-200 p-0 overflow-hidden shadow-sm">
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Aguardando Precificação</h2>
                        <p className="text-xs text-yellow-700 font-medium">Estes equipamentos já foram analisados e precisam de orçamento</p>
                    </div>
                </div>
                <span className="badge bg-yellow-100 text-yellow-800 border-yellow-200 font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="text-left py-3 px-6">OS</th>
                            <th className="text-left py-3 px-6">Cliente</th>
                            <th className="text-left py-3 px-6">Equipamento</th>
                            <th className="text-left py-3 px-6">Defeito Reportado</th>
                            <th className="text-center py-3 px-6">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((os) => (
                            <tr key={os.id} className="hover:bg-yellow-50/30 transition-colors">
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
                                <td className="py-4 px-6 text-sm max-w-xs truncate text-gray-600">
                                    {os.reportedDefect || '-'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <Link
                                        href={`/service-orders/${os.id}?tab=commercial`}
                                        className="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white border-none gap-2 shadow-sm font-bold w-full"
                                    >
                                        <DollarSign size={16} /> Precificar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
