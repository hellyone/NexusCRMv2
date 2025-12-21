'use client';

import Link from 'next/link';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';

export default function ServiceOrderCardMobile({ os }) {
    const statusColors = {
        OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        WAITING_PARTS: 'bg-orange-100 text-orange-800 border-orange-200',
        FINISHED: 'bg-green-100 text-green-800 border-green-200',
        CANCELED: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const priorityColors = {
        LOW: 'border-l-4 border-l-gray-400',
        NORMAL: 'border-l-4 border-l-blue-500',
        HIGH: 'border-l-4 border-l-orange-500',
        CRITICAL: 'border-l-4 border-l-red-600',
    };

    return (
        <Link href={`/service-orders/${os.id}`} className={`block bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-3 active:scale-[0.98] transition-transform ${priorityColors[os.priority] || 'border-l-4 border-l-gray-300'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-gray-500">#{os.code}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[os.status] || 'bg-gray-100'}`}>
                    {os.status}
                </span>
            </div>

            <h3 className="font-bold text-gray-800 truncate">{os.client.name}</h3>

            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1 mb-2">
                <MapPin size={14} />
                <span className="truncate">{os.serviceLocation === 'INTERNAL' ? 'Laboratório Interno' : (os.serviceAddress || 'Endereço não informado')}</span>
            </div>

            <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50">
                <div className="flex flex-col text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {os.scheduledAt ? new Date(os.scheduledAt).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
            </div>
        </Link>
    );
}
