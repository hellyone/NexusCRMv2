'use client';

import { useState } from 'react';
import { updateServiceOrderHeader, updateServiceOrderStatus } from '@/actions/service-orders'; // We need status action export
// Oops, logic for status update is in 'service-order-items.js' or 'service-orders.js'? 
// I put `updateServiceOrderStatus` in `actions/service-order-items.js` previously. 
// I should move/import correctly.
import { updateServiceOrderStatus as updateStatusAction } from '@/actions/service-order-items';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS, ALLOWED_TRANSITIONS } from '@/utils/status-machine';
import { Save, AlertTriangle, CheckCircle, Play, Pause, XCircle, Clock, Microscope, MapPin, FileText, Package } from 'lucide-react';

export default function OsGeneralTab({ os }) {
    const [formData, setFormData] = useState({
        reportedDefect: os.reportedDefect || '',
        diagnosis: os.diagnosis || '',
        solution: os.solution || '',
        internalNotes: os.internalNotes || '',
        accessories: os.accessories || '',
        serviceAddress: os.serviceAddress || '',
        entryInvoiceNumber: os.entryInvoiceNumber || '',
    });
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setLoading(true);
        const payload = new FormData();
        Object.keys(formData).forEach(k => payload.append(k, formData[k]));

        // We reuse the update header action
        await updateServiceOrderHeader(os.id, payload);
        setLoading(false);
    };

    // Calculate allowed actions based on current status
    const handleStatusChange = async (newStatus) => {
        if (!confirm(`Deseja alterar o status para ${SERVICE_ORDER_STATUS[newStatus]}?`)) return;

        setStatusLoading(true);
        const res = await updateStatusAction(os.id, newStatus);
        if (res.error) alert(res.error);
        setStatusLoading(false);
    };

    const allowed = ALLOWED_TRANSITIONS[os.status] || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Technical Report & Logistics */}
            <div className="lg:col-span-2 space-y-6">

                {/* Logistics / Type Info Card */}
                <div className={`p-4 rounded-xl border-l-4 flex justify-between items-center ${os.serviceLocation === 'EXTERNAL' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${os.serviceLocation === 'EXTERNAL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {os.serviceLocation === 'EXTERNAL' ? <MapPin size={24} /> : <Microscope size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">
                                {os.serviceLocation === 'EXTERNAL' ? 'Assistência Externa' : 'Serviço em Laboratório'}
                            </h3>
                            <p className="text-xs text-gray-600 font-medium">
                                {os.serviceLocation === 'EXTERNAL' ? 'Atendimento realizado no cliente/campo' : 'Equipamento recebido na oficina'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conditional Logistics Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                    {os.serviceLocation === 'INTERNAL' && (
                        <>
                            <div className="form-group col-span-full">
                                <label className="label flex items-center gap-2"> <Package size={14} /> Acessórios e Itens Recebidos</label>
                                <input
                                    name="accessories"
                                    value={formData.accessories}
                                    onChange={handleChange}
                                    className="input bg-blue-50/20"
                                    placeholder="Cabos, malas, manuais..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="label flex items-center gap-2"> <FileText size={14} /> NF de Entrada / Remessa</label>
                                <input
                                    name="entryInvoiceNumber"
                                    value={formData.entryInvoiceNumber}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Nº da Nota Fiscal"
                                />
                            </div>
                        </>
                    )}
                    {os.serviceLocation === 'EXTERNAL' && (
                        <div className="form-group col-span-full">
                            <label className="label flex items-center gap-2"> <MapPin size={14} /> Endereço de Atendimento</label>
                            <textarea
                                name="serviceAddress"
                                value={formData.serviceAddress}
                                onChange={handleChange}
                                className="input min-h-[60px] bg-orange-50/20"
                                placeholder="Endereço onde o serviço será realizado..."
                            />
                        </div>
                    )}
                </div>

                <div className="form-group border-t pt-4">
                    <label className="label">Defeito Relatado (Cliente)</label>
                    <textarea
                        name="reportedDefect"
                        value={formData.reportedDefect}
                        onChange={handleChange}
                        className="input min-h-[80px]"
                    />
                </div>

                <div className="form-group">
                    <label className="label">Diagnóstico Técnico</label>
                    <textarea
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        className="input min-h-[120px] bg-blue-50/50 border-blue-200"
                        placeholder="Análise técnica do problema..."
                    />
                </div>

                <div className="form-group">
                    <label className="label">Solução Efetuada</label>
                    <textarea
                        name="solution"
                        value={formData.solution}
                        onChange={handleChange}
                        className="input min-h-[120px] bg-green-50/50 border-green-200"
                        placeholder="O que foi feito para resolver..."
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Salvar Dados'}
                    </button>
                </div>
            </div>

            {/* Right Column: Workflow & Info */}
            <div className="space-y-6">

                {/* Workflow Actions */}
                <div className="card bg-gray-50 border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-muted mb-3">Fluxo de Trabalho</h3>
                    <div className="flex flex-col gap-2">
                        {allowed.includes('IN_ANALYSIS') && (
                            <button onClick={() => handleStatusChange('IN_ANALYSIS')} disabled={statusLoading} className="btn w-full justify-start gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-sm font-bold text-xs uppercase">
                                <AlertTriangle size={16} /> Iniciar Análise
                            </button>
                        )}
                        {allowed.includes('IN_PROGRESS') && (
                            <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={statusLoading} className="btn w-full justify-start gap-2 bg-amber-100 text-amber-700 hover:bg-amber-200 border-none shadow-sm font-bold text-xs uppercase">
                                <Play size={16} /> Iniciar Execução
                            </button>
                        )}
                        {allowed.includes('WAITING_APPROVAL') && (
                            <button onClick={() => handleStatusChange('WAITING_APPROVAL')} disabled={statusLoading} className="btn w-full justify-start gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none shadow-sm font-bold text-xs uppercase">
                                <Clock size={16} /> Aguardar Aprovação
                            </button>
                        )}
                        {allowed.includes('FINISHED') && (
                            <button onClick={() => handleStatusChange('FINISHED')} disabled={statusLoading} className="btn w-full justify-start gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-sm font-bold text-xs uppercase">
                                <CheckCircle size={16} /> Finalizar Serviço
                            </button>
                        )}
                        {allowed.includes('CANCELED') && (
                            <button onClick={() => handleStatusChange('CANCELED')} disabled={statusLoading} className="btn btn-ghost w-full justify-start gap-1.5 text-red-600 hover:bg-red-50 text-[11px] font-bold uppercase">
                                <XCircle size={14} /> Cancelar OS
                            </button>
                        )}
                        {allowed.length === 0 && (
                            <p className="text-sm text-center text-muted italic">Nenhuma ação disponível neste status.</p>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="form-group">
                    <label className="label">Observações Internas (Equipe)</label>
                    <textarea
                        name="internalNotes"
                        value={formData.internalNotes}
                        onChange={handleChange}
                        className="input min-h-[100px] text-sm text-muted-foreground bg-amber-50/10 border-amber-100"
                        placeholder="Anotações visíveis apenas para a equipe..."
                    />
                </div>

                <div className="card p-3 bg-white border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-muted">
                        <span className="font-bold">Abertura:</span>
                        <span>{os.createdAt ? new Date(os.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    {os.startedAt && (
                        <div className="flex justify-between items-center text-muted">
                            <span className="font-bold">Início:</span>
                            <span>{new Date(os.startedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )}
                    {os.finishedAt && (
                        <div className="flex justify-between items-center text-green-700 font-bold">
                            <span>Conclusão:</span>
                            <span>{new Date(os.finishedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
