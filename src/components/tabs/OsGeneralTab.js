'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateServiceOrderHeader, updateServiceOrderStatus, markDeliveredToExpedition } from '@/actions/service-orders'; // We need status action export
// Oops, logic for status update is in 'service-order-items.js' or 'service-orders.js'? 
// I put `updateServiceOrderStatus` in `actions/service-order-items.js` previously. 
// I should move/import correctly.
import { updateServiceOrderStatus as updateStatusAction } from '@/actions/service-order-items';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS, ALLOWED_TRANSITIONS, canTransition } from '@/utils/status-machine';
import { Save, AlertTriangle, CheckCircle, Play, Pause, XCircle, Clock, Microscope, MapPin, FileText, Package, Activity, Check, Printer, Truck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceOrderActions } from '@/context/ServiceOrderActionContext';

export default function OsGeneralTab({ os, user }) {
    const router = useRouter();
    const userRole = user?.role || 'GUEST';
    const isCommercial = ['ADMIN', 'BACKOFFICE'].includes(userRole);
    const isTech = userRole.startsWith('TECH');
    const isAdmin = userRole === 'ADMIN';

    // Auto-refresh every 30 seconds to catch status changes from other users
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [router]);

    const [formData, setFormData] = useState({
        reportedDefect: os.reportedDefect || '',
        diagnosis: os.diagnosis || '',
        solution: os.solution || '',
        internalNotes: os.internalNotes || '',
        accessories: os.accessories || '',
        serviceAddress: os.serviceAddress || '',
        entryInvoiceNumber: os.entryInvoiceNumber || '',
        type: os.type || 'CORRECTIVE',
    });
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [expeditionChecks, setExpeditionChecks] = useState({
        accessoriesPresent: false,
        equipmentSealed: false,
        backupVerified: false
    });

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
        router.refresh();
    };

    const handleSaveType = async () => {
        // Salva apenas o tipo (garantia) sem precisar salvar tudo
        setLoading(true);
        const payload = new FormData();
        payload.append('type', formData.type);
        await updateServiceOrderHeader(os.id, payload);
        setLoading(false);
        router.refresh();
    };

    const handleMarkDelivered = async () => {
        if (!confirm('Confirmar que o equipamento e laudo técnico foram entregues na expedição?')) return;
        setDeliveryLoading(true);
        const res = await markDeliveredToExpedition(os.id);
        if (res.error) {
            alert(res.error);
        } else {
            router.refresh();
        }
        setDeliveryLoading(false);
    };

    const { registerAction, unregisterAction } = useServiceOrderActions();

    useEffect(() => {
        const actionId = 'save-os-header';
        registerAction(actionId, (
            <button
                onClick={handleSave}
                className="btn btn-primary btn-sm shadow-md hover:scale-105 transition-all gap-2 px-6"
                disabled={loading}
            >
                {loading ? <span className="loading loading-spinner loading-xs"></span> : <Save size={16} />}
                {loading ? 'Salvando...' : 'Salvar Dados'}
            </button>
        ));

        return () => unregisterAction(actionId);
    }, [registerAction, unregisterAction, loading]); // Update whenever loading state changes

    const [executionDeadline, setExecutionDeadline] = useState('');

    // Calculate allowed actions based on current status and role
    const handleStatusChange = async (newStatus, dispatchNote = null) => {
        // Validação adicional no frontend para técnicos
        if (newStatus === 'WAITING_APPROVAL' && isTech) {
            if (!formData.diagnosis?.trim() || !formData.solution?.trim()) {
                alert('O diagnóstico e a solução devem estar preenchidos para finalizar a análise técnica.');
                return;
            }
        }

        if (newStatus === 'APPROVED' && !executionDeadline && isCommercial) {
            alert('Por favor, informe a data máxima para finalização do serviço.');
            return;
        }

        const actionMsg = newStatus === 'WAITING_APPROVAL' ? 'Finalizar análise técnica e enviar para o comercial?' : `Deseja alterar o status para ${SERVICE_ORDER_STATUS[newStatus]}?`;
        if (!confirm(actionMsg)) return;

        setStatusLoading(true);
        // Pass dispatchNote as the 'notes' argument to record how it was dispatched
        const res = await updateStatusAction(os.id, newStatus, dispatchNote, executionDeadline);
        if (res.error) alert(res.error);
        setStatusLoading(false);
    };

    const allowed = (ALLOWED_TRANSITIONS[os.status] || []).filter(status => canTransition(os.status, status, userRole));

    // Status indicando um fluxo de rejeição/devolução
    // Verifica o histórico para qualquer evento de rejeição. Histórico grava 'toStatus' ou apenas verifica existência.
    // Verificamos se ALGUMA VEZ passou por REJECTED.
    const wasRejected = os.statusHistory?.some(h => h.status === 'REJECTED' || h.toStatus === 'REJECTED' || h.fromStatus === 'REJECTED');

    // É um fluxo de rejeição se está ATUALMENTE rejeitado, OU se FOI rejeitado e está em um estágio posterior (Finalizado/Faturado/Expedido/Coleta)
    const isRejectionFlow = ['REJECTED', 'WAITING_PICKUP', 'SCRAPPED', 'ABANDONED'].includes(os.status) ||
        (['FINISHED', 'INVOICED', 'DISPATCHED', 'WAITING_COLLECTION'].includes(os.status) && wasRejected);

    // ... (rest of code)

    // Dispatch Buttons Component (Reuse for both statuses)
    const DispatchActions = () => (
        <div className="flex flex-col gap-2 mt-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1 block text-center w-full">Método de Saída</span>

            <button
                onClick={() => handleStatusChange('DISPATCHED', 'Retirada pelo cliente no balcão')}
                disabled={statusLoading}
                className="btn btn-sm w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 shadow-sm font-bold uppercase justify-start h-auto py-2"
            >
                <User size={14} className="mr-2" /> Retirada Balcão (Cliente)
            </button>

            <button
                onClick={() => handleStatusChange('DISPATCHED', 'Enviado/Coletado por Transportadora')}
                disabled={statusLoading}
                className="btn btn-sm w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300 shadow-sm font-bold uppercase justify-start h-auto py-2"
            >
                <Package size={14} className="mr-2" /> Transportadora / Correios
            </button>

            <button
                onClick={() => handleStatusChange('DISPATCHED', 'Entrega realizada por equipe própria')}
                disabled={statusLoading}
                className="btn btn-sm w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300 shadow-sm font-bold uppercase justify-start h-auto py-2"
            >
                <Truck size={14} className="mr-2" /> Entrega Própria (Motorista)
            </button>
        </div>
    );



    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Technical Report & Logistics */}
            <div className="lg:col-span-2 space-y-6">

                {/* Section Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Relatório Técnico</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Gestão de Diagnóstico e Logística</p>
                        </div>
                    </div>
                </div>

                {/* Logistics / Type Info Card */}
                <div className={`p-5 rounded-xl border flex justify-between items-center transition-all ${os.serviceLocation === 'EXTERNAL' ? 'bg-orange-50/50 border-orange-200' : 'bg-blue-50/50 border-blue-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-sm ${os.serviceLocation === 'EXTERNAL' ? 'bg-white text-orange-600' : 'bg-white text-blue-600'}`}>
                            {os.serviceLocation === 'EXTERNAL' ? <MapPin size={24} strokeWidth={2.5} /> : <Microscope size={24} strokeWidth={2.5} />}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 leading-tight uppercase text-xs tracking-tight">
                                {os.serviceLocation === 'EXTERNAL' ? 'Assistência Técnica Externa' : 'Reparo em Laboratório Especializado'}
                            </h3>
                            <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                                {os.serviceLocation === 'EXTERNAL' ? 'Local: Atendimento realizado diretamente no cliente' : 'Local: Unidade de reparo interna da Nexus OS'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form Fields */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    {/* Logistics specific fields */}
                    {(os.serviceLocation === 'INTERNAL' || os.serviceLocation === 'EXTERNAL') && (
                        <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-gray-50">
                            {os.serviceLocation === 'INTERNAL' && (
                                <>
                                    <div className="form-group col-span-full">
                                        <label className="label text-[11px] font-black uppercase text-gray-500 tracking-wider">Acessórios e Itens Recebidos</label>
                                        <input
                                            name="accessories"
                                            value={formData.accessories}
                                            onChange={handleChange}
                                            className="input bg-gray-50 border-gray-100 focus:bg-white"
                                            placeholder="Descreva cabos, malas, manuais acompanhando o item..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label text-[11px] font-black uppercase text-gray-500 tracking-wider">NF de Entrada / Remessa</label>
                                        <input
                                            name="entryInvoiceNumber"
                                            value={formData.entryInvoiceNumber}
                                            onChange={handleChange}
                                            className="input bg-gray-50 border-gray-100 focus:bg-white"
                                            placeholder="Número da nota fiscal"
                                        />
                                    </div>
                                </>
                            )}
                            {os.serviceLocation === 'EXTERNAL' && (
                                <div className="form-group col-span-full">
                                    <label className="label text-[11px] font-black uppercase text-gray-500 tracking-wider">Endereço de Atendimento</label>
                                    <textarea
                                        name="serviceAddress"
                                        value={formData.serviceAddress}
                                        onChange={handleChange}
                                        className="input min-h-[60px] bg-gray-50 border-gray-100 focus:bg-white p-3"
                                        placeholder="Endereço completo para o atendimento externo..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="form-group">
                            <label className="label text-[11px] font-black uppercase text-gray-500 tracking-wider">Defeito Relatado (Cliente)</label>
                            <textarea
                                name="reportedDefect"
                                value={formData.reportedDefect}
                                onChange={handleChange}
                                className="input min-h-[80px] bg-gray-50 border-gray-100 focus:bg-white text-sm"
                                placeholder="..."
                            />
                        </div>

                        <div className="grid md:grid-cols-1 gap-6">
                            <div className="form-group">
                                <label className="label text-[11px] font-black uppercase text-blue-600 tracking-wider">Diagnóstico Técnico</label>
                                <textarea
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                    className="input min-h-[120px] bg-blue-50/20 border-blue-100 focus:bg-white text-sm"
                                    placeholder="Detalhes técnicos da análise realizada..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="label text-[11px] font-black uppercase text-green-600 tracking-wider">Solução Efetuada</label>
                                <textarea
                                    name="solution"
                                    value={formData.solution}
                                    onChange={handleChange}
                                    className="input min-h-[120px] bg-green-50/20 border-green-100 focus:bg-white text-sm"
                                    placeholder="Descreva o procedimento realizado para o reparo..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Workflow & Info */}
            <div className="space-y-6">

                {/* Visual Workflow Stepper */}
                <div className="card bg-gray-50 border-gray-200 p-5 shadow-md ring-1 ring-black/5">
                    <h3 className="text-xs font-black uppercase text-gray-700 mb-6 flex items-center gap-2 tracking-widest border-b pb-3 border-gray-200">
                        <Activity size={14} className="text-primary" /> Fluxo de Trabalho
                    </h3>

                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-z-10 before:h-full before:w-0.5 before:bg-gray-200">

                        {/* 1. Entrada */}
                        <WorkflowStep
                            title="Entrada do Equipamento"
                            description="Equipamento recebido e triagem realizada"
                            isDone={true}
                            isActive={false}
                        />

                        {/* 2. Análise */}
                        <WorkflowStep
                            title="Análise Técnica"
                            description={
                                os.status === 'IN_ANALYSIS' ? "Técnico realizando o diagnóstico" :
                                    ['OPEN'].includes(os.status) ? "Aguardando início da análise" : "Diagnóstico concluído"
                            }
                            isDone={['PRICING', 'WAITING_APPROVAL', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED', 'TESTING', 'REWORK', 'FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED', 'WARRANTY_RETURN', 'SCRAPPED', 'ABANDONED'].includes(os.status)}
                            isActive={os.status === 'IN_ANALYSIS'}
                        >
                            {allowed.includes('IN_ANALYSIS') && (
                                <button onClick={() => handleStatusChange('IN_ANALYSIS')} disabled={statusLoading} className="btn btn-xs bg-blue-600 text-white hover:bg-blue-700 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                    <AlertTriangle size={12} /> Iniciar Análise
                                </button>
                            )}
                            {os.status === 'IN_ANALYSIS' && isTech && (
                                <div className="flex flex-col gap-2 mt-2">
                                    {/* Opção para marcar como garantia */}
                                    {formData.type !== 'WARRANTY' && (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm checkbox-primary"
                                                    checked={formData.type === 'WARRANTY'}
                                                    onChange={(e) => {
                                                        const newType = e.target.checked ? 'WARRANTY' : 'CORRECTIVE';
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            type: newType
                                                        }));
                                                        // Salva automaticamente quando marca/desmarca
                                                        setTimeout(() => {
                                                            const payload = new FormData();
                                                            payload.append('type', newType);
                                                            updateServiceOrderHeader(os.id, payload).then(() => {
                                                                router.refresh();
                                                            });
                                                        }, 100);
                                                    }}
                                                />
                                                <span className="text-xs font-bold text-blue-800 uppercase">
                                                    Marcar como Garantia
                                                </span>
                                            </label>
                                            <p className="text-[10px] text-blue-600 mt-1 ml-6">
                                                Equipamento retornou em até 30 dias da última OS
                                            </p>
                                        </div>
                                    )}
                                    {formData.type === 'WARRANTY' && (
                                        <div className="p-2 bg-blue-100 border border-blue-300 rounded-lg mb-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1">
                                                    <CheckCircle size={12} /> OS Marcada como Garantia
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, type: 'CORRECTIVE' }));
                                                        const payload = new FormData();
                                                        payload.append('type', 'CORRECTIVE');
                                                        updateServiceOrderHeader(os.id, payload).then(() => {
                                                            router.refresh();
                                                        });
                                                    }}
                                                    className="text-[10px] text-blue-700 hover:text-blue-900 font-bold"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {formData.type === 'WARRANTY' ? (
                                        <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={statusLoading} className="btn btn-sm w-full bg-green-600 text-white hover:bg-green-700 border-none shadow-sm font-bold uppercase gap-2">
                                            <CheckCircle size={14} /> Iniciar Reparo (Garantia)
                                        </button>
                                    ) : (
                                        <button onClick={() => handleStatusChange('PRICING')} disabled={statusLoading} className="btn btn-sm w-full bg-yellow-500 text-white hover:bg-yellow-600 border-none shadow-sm font-bold uppercase gap-2">
                                            <FileText size={14} /> Emitir Laudo Técnico
                                        </button>
                                    )}
                                    <button onClick={() => handleStatusChange('REJECTED')} disabled={statusLoading} className="btn btn-sm w-full bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-sm font-bold uppercase gap-2">
                                        <XCircle size={14} /> Reprovar (Sem Conserto)
                                    </button>
                                </div>
                            )}
                        </WorkflowStep>

                        {/* 3. Laudo e Orçamento */}
                        <WorkflowStep
                            title="Proposta Comercial / Negociação"
                            description={
                                ['PRICING'].includes(os.status) ? "Comercial precificando" :
                                    ['WAITING_APPROVAL'].includes(os.status) ? "Orçamento enviado" :
                                        ['NEGOTIATING'].includes(os.status) ? "Negociando com cliente" :
                                            ['OPEN', 'IN_ANALYSIS'].includes(os.status) ? "Pendente (Aguardando Laudo)" :
                                                "Processo comercial concluído"
                            }
                            isDone={['APPROVED', 'REJECTED', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED', 'TESTING', 'REWORK', 'FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED', 'WARRANTY_RETURN', 'SCRAPPED', 'ABANDONED'].includes(os.status)}
                            isActive={['PRICING', 'WAITING_APPROVAL', 'NEGOTIATING'].includes(os.status)}
                        >
                            <div className="mt-2">
                                {os.status === 'PRICING' && isCommercial && (
                                    <div className="p-3 bg-orange-50 border border-orange-100 rounded text-xs text-orange-800">
                                        <p className="font-bold mb-1">Aguardando Precificação</p>
                                        <p>Acesse a aba <span className="font-bold">COMERCIAL</span> para montar o orçamento e emitir a proposta.</p>
                                    </div>
                                )}
                            </div>

                            {(os.status === 'WAITING_APPROVAL' || os.status === 'NEGOTIATING') && isCommercial && (
                                <div className="space-y-3 mt-2 p-3 bg-white rounded-lg border border-purple-100 shadow-sm">
                                    {os.status === 'WAITING_APPROVAL' && (
                                        <button onClick={() => handleStatusChange('NEGOTIATING')} disabled={statusLoading} className="btn btn-xs w-full mb-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                            Negociar (Cliente pediu alteração)
                                        </button>
                                    )}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase text-purple-600">Prazo Estimado</label>
                                        <input
                                            type="date"
                                            value={executionDeadline}
                                            onChange={(e) => setExecutionDeadline(e.target.value)}
                                            className="input input-xs border-purple-100 focus:border-purple-400"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusChange('APPROVED')} disabled={statusLoading} className="btn btn-xs flex-1 bg-green-600 text-white hover:bg-green-700 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                            Aprovar
                                        </button>
                                        <button onClick={() => handleStatusChange('REJECTED')} disabled={statusLoading} className="btn btn-xs flex-1 bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                            Reprovar
                                        </button>
                                    </div>
                                </div>
                            )}
                            {os.status === 'ABANDONED' && (
                                <div className="mt-2 p-2 bg-gray-800 text-white rounded text-[10px] font-bold uppercase text-center">Os Abandonada (+90d)</div>
                            )}
                        </WorkflowStep>

                        {/* 4. Execução / Devolução */}
                        <WorkflowStep
                            title={isRejectionFlow ? "Devolução (Sem Reparo)" : "Execução (Reparo)"}
                            description={
                                os.status === 'REJECTED' ? "Aguardando liberação técnica para devolução" :
                                    os.status === 'WAITING_PICKUP' ? "Liberado. Aguardando Retirada (Cliente)" :
                                        os.status === 'SCRAPPED' ? "Equipamento descartado" :
                                            os.status === 'APPROVED' ? "Aguardando início do reparo" :
                                                os.status === 'IN_PROGRESS' ? "Técnico realizando reparo" :
                                                    ['WAITING_PARTS', 'PAUSED'].includes(os.status) ? "Reparo pausado" :
                                                        ['OPEN', 'IN_ANALYSIS', 'PRICING', 'WAITING_APPROVAL', 'NEGOTIATING'].includes(os.status) ? "Pendente" :
                                                            "Procedimento concluído"
                            }
                            isDone={['TESTING', 'REWORK', 'FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'DISPATCHED', 'WARRANTY_RETURN', 'WAITING_PICKUP'].includes(os.status)}
                            isActive={['APPROVED', 'REJECTED', 'IN_PROGRESS', 'WAITING_PARTS', 'PAUSED', 'SCRAPPED', 'REWORK'].includes(os.status)}
                            color={os.status === 'REJECTED' || os.status === 'SCRAPPED' ? 'bg-red-500' : 'bg-amber-500'}
                        >
                            <div className="flex flex-col gap-2 mt-2">
                                {os.status === 'REJECTED' && (isTech || isAdmin) && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-red-100">
                                            <span className="text-[10px] font-black uppercase text-red-800">Checklist para Devolução</span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs checkbox-error mt-0.5"
                                                    checked={expeditionChecks.accessoriesPresent}
                                                    onChange={(e) => setExpeditionChecks(prev => ({ ...prev, accessoriesPresent: e.target.checked }))}
                                                />
                                                <span className="text-[11px] text-gray-700 group-hover:text-red-600 transition-colors leading-tight">Opcionais/Acessórios conferidos para devolução</span>
                                            </label>
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs checkbox-error mt-0.5"
                                                    checked={expeditionChecks.equipmentSealed}
                                                    onChange={(e) => setExpeditionChecks(prev => ({ ...prev, equipmentSealed: e.target.checked }))}
                                                />
                                                <span className="text-[11px] text-gray-700 group-hover:text-red-600 transition-colors leading-tight">Equipamento remontado/fechado</span>
                                            </label>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Ações do Técnico: Liberar para Expedição (Pronto para Faturar) */}
                                            {(isTech || isAdmin || isCommercial) && (
                                                <button
                                                    onClick={() => handleStatusChange('FINISHED')}
                                                    disabled={statusLoading || !expeditionChecks.accessoriesPresent || !expeditionChecks.equipmentSealed}
                                                    className="btn btn-xs w-full bg-indigo-600 text-white hover:bg-indigo-700 border-none shadow-sm font-bold uppercase py-2 h-auto text-[10px]"
                                                >
                                                    <Package size={12} /> Marcar como Concluído
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {/* Admin Actions */}
                                            {isAdmin && (
                                                <button onClick={() => handleStatusChange('SCRAPPED')} disabled={statusLoading} className="btn btn-xs bg-gray-500 text-white hover:bg-gray-600 border-none shadow-sm font-bold uppercase py-2 h-auto text-[10px] w-full">
                                                    <XCircle size={12} /> Descartar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {os.status === 'SCRAPPED' && (
                                    <div className="mt-2 p-2 bg-gray-200 text-gray-500 rounded text-[10px] font-bold uppercase text-center">Processo de Descarte Registrado</div>
                                )}
                                {allowed.includes('IN_PROGRESS') && ['APPROVED', 'WAITING_PARTS', 'PAUSED'].includes(os.status) && (
                                    <button onClick={() => handleStatusChange('IN_PROGRESS')} disabled={statusLoading} className="btn btn-xs bg-amber-600 text-white hover:bg-amber-700 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                        <Play size={12} /> Iniciar Reparo
                                    </button>
                                )}

                                {/* Transição para Teste em vez de Finalizado diretamente */}
                                {['IN_PROGRESS', 'REWORK'].includes(os.status) && (isTech || isAdmin) && (
                                    <button onClick={() => handleStatusChange('TESTING')} disabled={statusLoading} className="btn btn-xs bg-cyan-600 text-white hover:bg-cyan-700 border-none shadow-sm font-bold uppercase py-2 h-auto">
                                        <Microscope size={12} /> Finalizar Reparo e Iniciar Testes
                                    </button>
                                )}
                            </div>
                        </WorkflowStep>

                        {/* 5. Teste e Validação (Pulado se rejeitado) */}
                        {!isRejectionFlow && (
                            <WorkflowStep
                                title="Teste & Validação"
                                description={
                                    os.status === 'TESTING' ? "Controle de qualidade em andamento" :
                                        os.status === 'REWORK' ? "Falha no teste (Retrabalho)" :
                                            ['FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'DISPATCHED', 'WARRANTY_RETURN'].includes(os.status) ? "Qualidade verificada" :
                                                "Pendente"
                                }
                                isDone={['FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'DISPATCHED', 'WARRANTY_RETURN'].includes(os.status)}
                                isActive={['TESTING'].includes(os.status)}
                                color='bg-cyan-500'
                            >
                                <div className="flex flex-col gap-2 mt-2">
                                    {os.status === 'TESTING' && (isTech || isAdmin) && (
                                        <>
                                            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg space-y-3">
                                                <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                                                    <span className="text-[10px] font-black uppercase text-emerald-800">Checklist para Liberação</span>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-xs checkbox-success mt-0.5"
                                                            checked={expeditionChecks.accessoriesPresent}
                                                            onChange={(e) => setExpeditionChecks(prev => ({ ...prev, accessoriesPresent: e.target.checked }))}
                                                        />
                                                        <span className="text-[11px] text-gray-700 group-hover:text-emerald-600 transition-colors leading-tight">Opcionais/Acessórios conferidos</span>
                                                    </label>
                                                    <label className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-xs checkbox-success mt-0.5"
                                                            checked={expeditionChecks.equipmentSealed}
                                                            onChange={(e) => setExpeditionChecks(prev => ({ ...prev, equipmentSealed: e.target.checked }))}
                                                        />
                                                        <span className="text-[11px] text-gray-700 group-hover:text-emerald-600 transition-colors leading-tight">Equipamento fechado e limpo</span>
                                                    </label>
                                                    <label className="flex items-start gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-xs checkbox-success mt-0.5"
                                                            checked={expeditionChecks.backupVerified}
                                                            onChange={(e) => setExpeditionChecks(prev => ({ ...prev, backupVerified: e.target.checked }))}
                                                        />
                                                        <span className="text-[11px] text-gray-700 group-hover:text-emerald-600 transition-colors leading-tight">Backup verificado</span>
                                                    </label>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleStatusChange('FINISHED')} 
                                                        disabled={statusLoading || !expeditionChecks.accessoriesPresent || !expeditionChecks.equipmentSealed} 
                                                        className="btn btn-xs flex-1 bg-emerald-600 text-white hover:bg-emerald-700 border-none shadow-sm font-bold uppercase py-2 h-auto"
                                                    >
                                                        <CheckCircle size={12} /> Aprovar (Concluir)
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange('REWORK')} 
                                                        disabled={statusLoading} 
                                                        className="btn btn-xs flex-1 bg-red-100 text-red-600 hover:bg-red-200 border-none shadow-sm font-bold uppercase py-2 h-auto"
                                                    >
                                                        <AlertTriangle size={12} /> Reprovar (Retrabalho)
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </WorkflowStep>
                        )}

                        {/* 6. Conclusão & Faturamento */}
                        <WorkflowStep
                            title={isRejectionFlow ? "NF de Devolução / Retorno" : "Conclusão Técnica / Faturamento"}
                            description={
                                os.status === 'FINISHED' ? "Aguardando faturamento" :
                                    os.status === 'INVOICED' ? (isRejectionFlow ? "NF de retorno emitida, liberar expedição" : "NF emitida, liberar expedição") :
                                        ['WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED', 'WARRANTY_RETURN'].includes(os.status) ? "NF Processada" :
                                            "Pendente"
                            }
                            isDone={['INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED', 'WARRANTY_RETURN'].includes(os.status)}
                            isActive={os.status === 'FINISHED' || os.status === 'REJECTED' || (os.status === 'INVOICED' && !['WAITING_PICKUP', 'WAITING_COLLECTION', 'DISPATCHED'].includes(os.status))}
                        >
                            {/* Técnico marca entrega na expedição */}
                            {os.status === 'FINISHED' && (isTech || isAdmin) && !os.deliveredToExpeditionAt && (
                                <button
                                    onClick={handleMarkDelivered}
                                    disabled={deliveryLoading}
                                    className="btn btn-xs bg-green-600 text-white hover:bg-green-700 border-none shadow-sm font-bold uppercase py-2 h-auto mt-2 w-full"
                                >
                                    <Truck size={12} /> Confirmar Entrega na Expedição
                                </button>
                            )}

                            {os.status === 'FINISHED' && os.deliveredToExpeditionAt && (isTech || isAdmin) && (
                                <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-100 text-green-800">
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase">
                                        <CheckCircle size={14} /> Entregue na Expedição
                                    </div>
                                    <div className="text-[10px] text-center mt-1 opacity-75">
                                        {new Date(os.deliveredToExpeditionAt).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                            )}


                            {/* Commercial Action: Invoice */}
                            {/* REJECTED não deve ter botão de faturamento - aguarda técnico marcar como FINISHED primeiro */}
                            {os.status === 'FINISHED' && isCommercial && (
                                <button 
                                    onClick={() => handleStatusChange('INVOICED')} 
                                    disabled={statusLoading || (!os.deliveredToExpeditionAt && !isRejectionFlow && os.type !== 'WARRANTY')}
                                    className="btn btn-xs bg-teal-600 text-white hover:bg-teal-700 border-none shadow-sm font-bold uppercase py-2 h-auto mt-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={
                                        (!os.deliveredToExpeditionAt && !isRejectionFlow && os.type !== 'WARRANTY')
                                            ? 'Aguardando entrega do técnico na expedição'
                                            : ''
                                    }
                                >
                                    <FileText size={12} /> {isRejectionFlow ? 'Emitir NF de Retorno' : os.type === 'WARRANTY' ? 'Emitir NF (Garantia)' : 'Emitir NF (Faturar)'}
                                </button>
                            )}

                            {os.status === 'FINISHED' && isCommercial && !os.deliveredToExpeditionAt && !isRejectionFlow && os.type !== 'WARRANTY' && (
                                <div className="mt-2 p-2 rounded-lg border bg-yellow-50 border-yellow-100 text-yellow-800 text-[10px] text-center">
                                    ⚠️ Aguardando técnico entregar equipamento na expedição
                                </div>
                            )}

                            {os.status === 'FINISHED' && os.type === 'WARRANTY' && isCommercial && (
                                <div className="mt-2 p-2 rounded-lg border bg-blue-50 border-blue-100 text-blue-800 text-[10px] text-center">
                                    ℹ️ OS de Garantia - Pode emitir NF diretamente
                                </div>
                            )}



                            {/* Ação Final de Despacho (Auto-habilitado no próximo passo) */}
                            {os.status === 'INVOICED' && !isRejectionFlow && isCommercial && (
                                <div className="mt-3 p-3 rounded-lg border bg-indigo-50 border-indigo-100 text-indigo-800">
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase">
                                        <CheckCircle size={14} /> Faturamento Concluído
                                    </div>
                                    <div className="text-[10px] text-center mt-1 opacity-75">
                                        Libere a expedição no passo abaixo
                                    </div>
                                </div>
                            )}
                            
                            {/* Mensagem para Técnicos após Faturamento */}
                            {os.status === 'INVOICED' && !isRejectionFlow && isTech && (
                                <div className="mt-3 p-3 rounded-lg border bg-green-50 border-green-100 text-green-800">
                                    <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase">
                                        <CheckCircle size={14} /> NF Emitida - Aguardando Comercial
                                    </div>
                                    <div className="text-[10px] text-center mt-1 opacity-75">
                                        O comercial irá escolher o método de coleta (transportadora, balcão ou entrega própria)
                                    </div>
                                </div>
                            )}

                            {/* Seleção de Despacho Legado / Padrão (Se não for fluxo de rejeição ou vindo de fluxo genérico) */}
                            {os.status === 'INVOICED' && !isRejectionFlow && false && ( // Disabled, using new unified flow above
                                <div className={cn(
                                    "mt-3 p-3 rounded-lg space-y-3",
                                    isRejectionFlow ? "bg-orange-50 border border-orange-100" : "bg-indigo-50 border border-indigo-100"
                                )}>
                                    <div className={cn(
                                        "flex justify-between items-center pb-2 border-b",
                                        isRejectionFlow ? "border-orange-100 text-orange-800" : "border-indigo-100 text-indigo-800"
                                    )}>
                                        <span className="text-[10px] font-black uppercase">Checklist para Liberação</span>
                                        {!isRejectionFlow && (
                                            <button
                                                onClick={() => window.print()}
                                                className="btn btn-xs btn-ghost text-indigo-600 hover:bg-indigo-100 gap-1 h-6 min-h-0"
                                                title="Imprimir Laudo Técnico"
                                            >
                                                <Printer size={12} /> Laudo
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-start gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className={cn("checkbox checkbox-xs mt-0.5", isRejectionFlow ? "checkbox-warning" : "checkbox-primary")}
                                                checked={expeditionChecks.accessoriesPresent}
                                                onChange={(e) => setExpeditionChecks(prev => ({ ...prev, accessoriesPresent: e.target.checked }))}
                                            />
                                            <span className="text-[11px] text-gray-700 group-hover:text-primary transition-colors leading-tight">Opcionais/Acessórios conferidos</span>
                                        </label>
                                        <label className="flex items-start gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className={cn("checkbox checkbox-xs mt-0.5", isRejectionFlow ? "checkbox-warning" : "checkbox-primary")}
                                                checked={expeditionChecks.equipmentSealed}
                                                onChange={(e) => setExpeditionChecks(prev => ({ ...prev, equipmentSealed: e.target.checked }))}
                                            />
                                            <span className="text-[11px] text-gray-700 group-hover:text-primary transition-colors leading-tight">Equipamento fechado e limpo</span>
                                        </label>
                                        {!isRejectionFlow && (
                                            <label className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-xs checkbox-primary mt-0.5"
                                                    checked={expeditionChecks.backupVerified}
                                                    onChange={(e) => setExpeditionChecks(prev => ({ ...prev, backupVerified: e.target.checked }))}
                                                />
                                                <span className="text-[11px] text-gray-700 group-hover:text-primary transition-colors leading-tight">Backup verificado</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusChange('WAITING_COLLECTION')}
                                            disabled={statusLoading || !expeditionChecks.accessoriesPresent || !expeditionChecks.equipmentSealed}
                                            className={cn("btn btn-xs flex-1 text-white border-none shadow-sm font-bold uppercase py-2 h-auto", isRejectionFlow ? "bg-orange-600 hover:bg-orange-700" : "bg-indigo-600 hover:bg-indigo-700")}
                                        >
                                            <Truck size={12} /> Coleta/Transportadora
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('WAITING_PICKUP')}
                                            disabled={statusLoading || !expeditionChecks.accessoriesPresent || !expeditionChecks.equipmentSealed}
                                            className={cn("btn btn-xs flex-1 text-white border-none shadow-sm font-bold uppercase py-2 h-auto", isRejectionFlow ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}
                                        >
                                            <User size={12} /> Retirada Balcão
                                        </button>
                                    </div>
                                </div>
                            )}
                        </WorkflowStep>

                        {/* 7. Expedição (Final) */}
                        <WorkflowStep
                            title="Expedição"
                            description={
                                os.status === 'WAITING_COLLECTION' ? "Aguardando coleta" :
                                    os.status === 'WAITING_PICKUP' ? "Aguardando cliente retirar" :
                                        os.status === 'DISPATCHED' ? "Em garantia / Encerrado" :
                                            os.status === 'WARRANTY_RETURN' ? "Equipamento retornou (Garantia)" :
                                                "Pendente"
                            }
                            isDone={['DISPATCHED', 'WARRANTY_RETURN'].includes(os.status)}
                            isActive={['INVOICED', 'WAITING_COLLECTION', 'DISPATCHED', 'WARRANTY_RETURN', 'WAITING_PICKUP'].includes(os.status)}
                            isLast={true}
                        >
                            {/* 1. Ações de Despacho (Apenas Comercial escolhe método de coleta) */}
                            {(os.status === 'INVOICED' || os.status === 'WAITING_COLLECTION' || os.status === 'WAITING_PICKUP') && (isCommercial || isAdmin) && (
                                <DispatchActions />
                            )}

                        </WorkflowStep>

                        {/* Admin Action: Cancel */}
                        {allowed.includes('CANCELED') && isAdmin && (
                            <div className="mt-8 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleStatusChange('CANCELED')}
                                    disabled={statusLoading}
                                    className="btn btn-ghost w-full justify-center gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 text-[10px] font-black uppercase tracking-tight border border-dashed border-red-200"
                                >
                                    <XCircle size={14} /> Cancelar OS (Admin)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4">
                    <div className="form-group pb-2">
                        <label className="label text-[11px] font-black uppercase text-gray-500 tracking-wider">Observações Internas (Equipe)</label>
                        <textarea
                            name="internalNotes"
                            value={formData.internalNotes}
                            onChange={handleChange}
                            className="input min-h-[100px] text-sm text-gray-700 bg-amber-50/10 border-amber-100 focus:border-amber-300 transition-colors"
                            placeholder="Anotações visíveis apenas para a equipe..."
                        />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-2 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Cronologia da OS</span>
                            <Clock size={12} className="text-gray-400" />
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-400 uppercase">Abertura:</span>
                                <span className="text-sm font-black text-gray-700">{os.createdAt ? new Date(os.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                            </div>

                            {os.startedAt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Início Técnico:</span>
                                    <span className="text-sm font-black text-gray-700">{new Date(os.startedAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            )}

                            {os.finishedAt && (
                                <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg border border-green-100">
                                    <span className="text-[11px] font-black text-green-700 uppercase">Conclusão:</span>
                                    <span className="text-sm font-black text-green-700">{new Date(os.finishedAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            )}

                            {os.executionDeadline && (
                                <div className="flex justify-between items-center py-2 px-3 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-200">
                                    <span className="text-[11px] font-black uppercase flex items-center gap-1"><Clock size={12} /> Prazo OS:</span>
                                    <span className="text-sm font-black">{new Date(os.executionDeadline).toLocaleDateString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div >
        </div >
    );
}

function WorkflowStep({ title, description, isDone, isActive, isLast = false, color = 'bg-primary', children }) {
    return (
        <div className={cn("relative pl-8 pb-6", isLast && "pb-0")}>
            {/* Status Dot */}
            <div className={cn(
                "absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all duration-500 z-10",
                isDone ? "bg-emerald-500 text-white" :
                    isActive ? cn(color, "animate-pulse ring-4 ring-opacity-30 ring-current scale-110") :
                        "bg-gray-200 text-gray-400"
            )}>
                {isDone ? (
                    <Check size={14} strokeWidth={4} />
                ) : (
                    <div className={cn("w-2 h-2 rounded-full bg-white", !isActive && "opacity-0")} />
                )}
            </div>

            <div className="flex flex-col">
                <h4 className={cn(
                    "text-xs font-black uppercase tracking-tight transition-colors",
                    isDone ? "text-emerald-700" : isActive ? "text-gray-900" : "text-gray-400"
                )}>
                    {title}
                </h4>
                <p className={cn(
                    "text-[10px] leading-tight mt-0.5",
                    isActive ? "text-gray-600 font-medium" : "text-gray-400"
                )}>
                    {description}
                </p>
                {children && <div className="mt-3">{children}</div>}
            </div>
        </div>
    );
}
