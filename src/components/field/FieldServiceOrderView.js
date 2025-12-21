'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, CheckCircle, Package, MapPin, Phone, User, Monitor } from 'lucide-react';
import { updateServiceOrderStatus } from '@/actions/service-orders';
import { useRouter } from 'next/navigation';

export default function FieldServiceOrderView({ os }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (!confirm('Confirmar alteração de status?')) return;
        setLoading(true);
        await updateServiceOrderStatus(os.id, newStatus);
        setLoading(false);
        router.refresh();
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            OPEN: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
            FINISHED: 'bg-green-100 text-green-800',
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/field" className="btn btn-ghost btn-circle btn-sm">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="font-bold text-lg">OS #{os.code}</h1>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={os.status} />
                        <span className="text-xs text-gray-500">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Cliente */}
                <div className="card bg-white p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                        <User size={14} /> Cliente
                    </h3>
                    <div>
                        <div className="font-bold text-lg">{os.client.name}</div>
                        {os.client.phone && (
                            <a href={`tel:${os.client.phone}`} className="flex items-center gap-2 text-blue-600 mt-1">
                                <Phone size={14} /> {os.client.phone}
                            </a>
                        )}
                    </div>
                    {os.serviceAddress && (
                        <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                            <MapPin className="text-red-500 mt-1" size={16} />
                            <div className="text-sm">
                                <div className="font-medium">Local do Serviço</div>
                                <div className="text-gray-600">{os.serviceAddress}</div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(os.serviceAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 font-bold mt-1 block uppercase"
                                >
                                    Abrir no Maps
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Equipamento e Defeito */}
                <div className="card bg-white p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Monitor size={14} /> Equipamento
                    </h3>
                    <div className="text-gray-800">
                        {os.equipment ? `${os.equipment.name} (${os.equipment.brand}/${os.equipment.model})` : 'Equipamento Geral'}
                    </div>

                    <h3 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2 mt-4">
                        Defeito Relatado
                    </h3>
                    <div className="bg-red-50 border border-red-100 p-3 rounded text-sm text-gray-800">
                        {os.reportedDefect}
                    </div>
                </div>

                {/* Descrição Técnica (Se Em Andamento/Finalizado) */}
                {(os.status === 'IN_PROGRESS' || os.status === 'FINISHED') && (
                    <div className="card bg-white p-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Diagnóstico / Solução</h3>
                        <div className="text-sm text-gray-600 italic">
                            Disponível na versão desktop para edição detalhada.
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {os.status === 'OPEN' && (
                    <button
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        disabled={loading}
                        className="btn btn-primary flex-1 h-12 text-lg"
                    >
                        <Play size={20} className="mr-2" /> Iniciar
                    </button>
                )}

                {os.status === 'IN_PROGRESS' && (
                    <>
                        <button className="btn btn-outline flex-1 h-12 flex-col gap-0 items-center justify-center">
                            <Package size={20} />
                            <span className="text-[10px] leading-none">Peças</span>
                        </button>
                        <button
                            onClick={() => handleStatusChange('FINISHED')}
                            disabled={loading}
                            className="btn btn-success flex-[2] h-12 text-lg text-white"
                        >
                            <CheckCircle size={20} className="mr-2" /> Finalizar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
