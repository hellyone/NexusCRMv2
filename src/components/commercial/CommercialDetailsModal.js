'use client';

import { useState } from 'react';
import { Activity, FileText, Save } from 'lucide-react';
import { SERVICE_ORDER_STATUS } from '@/utils/status-machine';
import { cn } from '@/lib/utils';
import { updateCommercialDetails } from '@/actions/service-orders';
import { maskCurrency } from '@/utils/masks';

export default function CommercialDetailsModal({ os, onClose }) {
    const [entryInvoice, setEntryInvoice] = useState(os.entryInvoiceNumber || '');
    const [serviceInvoice, setServiceInvoice] = useState(os.serviceInvoiceNumber || '');
    const [exitInvoice, setExitInvoice] = useState(os.exitInvoiceNumber || '');
    const [saving, setSaving] = useState(false);
    
    // Verifica se é fluxo de reprovação (somente NF de retorno)
    const isRejectionFlow = os.statusHistory?.some(h => h.status === 'REJECTED' || h.toStatus === 'REJECTED' || h.fromStatus === 'REJECTED');

    const handleSave = async () => {
        setSaving(true);
        await updateCommercialDetails(os.id, {
            entryInvoiceNumber: entryInvoice,
            serviceInvoiceNumber: serviceInvoice,
            exitInvoiceNumber: exitInvoice
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="text-primary" /> Rastreabilidade da OS
                        </h2>
                        <p className="text-sm text-muted">{os.code} - {os.client.name}</p>
                    </div>
                    <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">✕</button>
                </div>

                <div className="p-6 space-y-8">

                    {/* 1. NFs Section */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 flex items-center gap-2">
                            <FileText size={16} /> Dados Fiscais
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="form-control">
                                <label className="label-text text-xs font-bold mb-1">NF Entrada / Remessa</label>
                                <input
                                    type="text"
                                    className="input input-sm input-bordered w-full"
                                    placeholder="Número da NF de entrada..."
                                    value={entryInvoice}
                                    onChange={(e) => setEntryInvoice(e.target.value)}
                                />
                            </div>
                            {!isRejectionFlow && (
                                <div className="form-control">
                                    <label className="label-text text-xs font-bold mb-1 text-green-600">NF de Serviço</label>
                                    <input
                                        type="text"
                                        className="input input-sm input-bordered w-full border-green-200 bg-green-50 focus:border-green-500"
                                        placeholder="Número da NF de serviço (quando aprovado)..."
                                        value={serviceInvoice}
                                        onChange={(e) => setServiceInvoice(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Apenas para OS aprovadas com reparo</p>
                                </div>
                            )}
                            <div className="form-control">
                                <label className="label-text text-xs font-bold mb-1 text-blue-600">NF de Retorno / Saída</label>
                                <input
                                    type="text"
                                    className="input input-sm input-bordered w-full border-blue-200 bg-blue-50 focus:border-blue-500"
                                    placeholder="Número da NF de retorno..."
                                    value={exitInvoice}
                                    onChange={(e) => setExitInvoice(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Sempre emitida ao devolver o equipamento</p>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-sm btn-primary gap-2"
                            >
                                {saving ? 'Salvando...' : <><Save size={14} /> Salvar NFs</>}
                            </button>
                        </div>
                    </section>

                    {/* 2. Timeline Section */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                            <Activity size={16} /> Linha do Tempo
                        </h3>
                        <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                            {(os.statusHistory || [])
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .map((history, idx) => (
                                    <div key={idx} className={cn(
                                        "relative p-4 rounded-xl transition-all duration-300",
                                        idx === 0 ? "bg-blue-50 border border-blue-200 border-l-4 border-l-primary shadow-md" : "bg-transparent border-l-4 border-l-transparent"
                                    )}>
                                        <div className={cn(
                                            "absolute -left-[22px] top-6 w-3 h-3 rounded-full border-2 border-white ring-2 ring-gray-50",
                                            idx === 0 ? "bg-primary animate-pulse" : "bg-gray-300"
                                        )} />
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-sm font-bold",
                                                        idx === 0 ? "text-primary" : "text-gray-700"
                                                    )}>
                                                        Mudança para {SERVICE_ORDER_STATUS[history.status]}
                                                    </span>
                                                    {idx === 0 && (
                                                        <span className="px-1.5 py-0.5 rounded bg-primary text-[10px] text-white font-bold uppercase tracking-wider">
                                                            Atual
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                    {new Date(history.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-gray-500">
                                                    {new Date(history.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[11px] text-gray-300">•</span>
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    por {history.changedBy?.name || 'Sistema'}
                                                </span>
                                            </div>
                                            {history.notes && (
                                                <div className="mt-3 p-3 rounded-lg bg-white/60 border border-gray-100 shadow-inner">
                                                    <p className="text-xs text-gray-600 italic leading-relaxed">
                                                        "{history.notes}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white ring-2 ring-gray-100" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-600">Abertura da OS</span>
                                    <span className="text-xs text-gray-500">{new Date(os.createdAt).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Financial Summary */}
                    <section className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Serviços:</span>
                            <span className="font-bold">{maskCurrency((os.totalServices || 0).toFixed(2))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-500">Total Peças:</span>
                            <span className="font-bold">{maskCurrency((os.totalParts || 0).toFixed(2))}</span>
                        </div>
                        <div className="divider my-2"></div>
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-gray-800">Total Geral:</span>
                            <span className="font-bold text-primary">R$ {maskCurrency((os.total || 0).toFixed(2))}</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
