'use client';

import Link from 'next/link';
import { ExternalLink, DollarSign, MapPin } from 'lucide-react';

export default function PricingList({ orders }) {
    if (orders.length === 0) {
        return null;
    }

    return (
        <div className="card bg-white border border-yellow-100 p-0 overflow-hidden shadow-sm">
            <div className="bg-yellow-50/50 px-4 py-3 border-b border-yellow-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-yellow-600" />
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Aguardando Precificação</h2>
                        <p className="text-[10px] text-yellow-700 font-medium">Equipamentos analisados que aguardam montagem de orçamento</p>
                    </div>
                </div>
                <span className="badge bg-yellow-100 text-yellow-800 border-none font-bold">{orders.length}</span>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-3 px-4 text-left w-[140px]">OS</th>
                            <th className="py-3 px-4 text-left">Cliente</th>
                            <th className="py-3 px-4 text-left">Equipamento</th>
                            <th className="py-3 px-4 text-left">Defeito Reportado</th>
                            <th className="py-3 px-4 text-center w-[120px]">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {orders.map((os) => (
                            <tr key={os.id} className="hover:bg-yellow-50/20 transition-colors">
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
                                <td className="py-2.5 px-4 align-middle text-xs text-gray-600 italic line-clamp-1 max-w-xs">
                                    {os.reportedDefect || '-'}
                                </td>
                                <td className="py-2.5 px-4 align-middle text-center">
                                    <Link
                                        href={`/service-orders/${os.id}?tab=commercial`}
                                        className="btn btn-xs bg-yellow-500 hover:bg-yellow-600 text-white border-none gap-1 font-bold shadow-sm"
                                    >
                                        <DollarSign size={12} /> Precificar
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
