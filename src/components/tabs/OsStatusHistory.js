'use client';

import { useEffect, useState } from 'react';
import { getServiceOrderStatusHistory } from '@/actions/service-order-items';
import { SERVICE_ORDER_STATUS } from '@/utils/status-machine';
import { Clock, User } from 'lucide-react';

export default function OsStatusHistory({ serviceOrderId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await getServiceOrderStatusHistory(serviceOrderId);
                setHistory(data);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [serviceOrderId]);

    if (loading) {
        return <div className="text-center p-4 text-muted">Carregando histórico...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="text-center p-8 text-muted">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mudança de status registrada.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Histórico de Mudanças de Status</h3>
            <div className="space-y-3">
                {history.map((entry, index) => (
                    <div
                        key={entry.id}
                        className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock size={18} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {entry.fromStatus && (
                                            <>
                                                <span className="badge badge-outline">
                                                    {SERVICE_ORDER_STATUS[entry.fromStatus] || entry.fromStatus}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                            </>
                                        )}
                                        <span className="badge badge-primary">
                                            {SERVICE_ORDER_STATUS[entry.toStatus] || entry.toStatus}
                                        </span>
                                    </div>
                                    {entry.notes && (
                                        <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 text-right flex-shrink-0">
                                    {new Date(entry.createdAt).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                            {entry.changedBy && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <User size={14} />
                                    <span>{entry.changedBy.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

