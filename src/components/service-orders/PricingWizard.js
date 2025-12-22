'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import {
    Coins,
    Plus,
    Trash2,
    Calculator,
    AlertCircle,
    Search,
    Wrench,
    Package
} from 'lucide-react';
import { addPartToServiceOrder, removePartFromServiceOrder, updateServiceOrderPart } from '@/actions/service-order-items';
import { updateServiceOrderHeader } from '@/actions/service-orders';
import { updateServiceOrderStatus } from '@/actions/service-order-items';
import { getPartsForSelect } from '@/actions/parts';
import { useToast } from '@/components/ToastContainer';

export default function PricingWizard({ os, isReadOnly = false }) {
    const toast = useToast();
    // Local state for calculations preview
    const [parts, setParts] = useState(os.parts || []);
    const [laborHours, setLaborHours] = useState(os.laborHours || 0);
    const [laborCost, setLaborCost] = useState(os.laborCost || 0);
    const [displacement, setDisplacement] = useState(os.displacement || 0);
    const [discount, setDiscount] = useState(os.discount || 0);
    const [margin, setMargin] = useState(0); // Optional input for user reference

    // Add Part Modal State
    const [isAddPartOpen, setIsAddPartOpen] = useState(false);
    const [availableParts, setAvailableParts] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState('');
    const [partQty, setPartQty] = useState(1);
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync from props
    useEffect(() => {
        setParts(os.parts || []);
        setLaborHours(os.laborHours || 0);
        setLaborCost(os.laborCost || 0);
        setDisplacement(os.displacement || 0);
        setDiscount(os.discount || 0);
    }, [os]);

    // Financial Totals
    const totalParts = parts.reduce((acc, p) => acc + (p.subtotal || 0), 0);
    // Note: totalServices is from ServiceOrderItem (separate table), assuming we keep it simple for now or fetch it too
    const totalServicesPredefined = os.services?.reduce((acc, s) => acc + (s.subtotal || 0), 0) || 0;

    // We treat Labor Cost as the manual entry, separate from predefined services
    const subtotal = totalParts + totalServicesPredefined + parseFloat(laborCost || 0) + parseFloat(displacement || 0);
    const totalFinal = subtotal - parseFloat(discount || 0);

    const loadParts = async () => {
        setIsLoadingParts(true);
        try {
            const res = await getPartsForSelect({ usageType: ['BOTH', 'SERVICE'] });
            setAvailableParts(res);
        } catch (e) {
            toast.error('Erro ao buscar peças');
        } finally {
            setIsLoadingParts(false);
        }
    };

    const handleAddPart = async () => {
        if (!selectedPartId) return;
        setIsSaving(true);
        try {
            const res = await addPartToServiceOrder(os.id, selectedPartId, partQty);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Peça adicionada!');
                setIsAddPartOpen(false);
                setSelectedPartId('');
                setPartQty(1);
            }
        } catch (e) {
            toast.error('Erro ao adicionar peça');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemovePart = async (itemId) => {
        if (!confirm('Remover esta peça?')) return;
        setIsSaving(true);
        try {
            const res = await removePartFromServiceOrder(itemId);
            if (res.error) toast.error(res.error);
            else toast.success('Peça removida');
        } catch (e) {
            toast.error('Erro ao remover peça');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveFinancials = async () => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append('laborHours', laborHours);
        formData.append('laborCost', laborCost);
        formData.append('displacement', displacement);
        formData.append('discount', discount);
        // We use updateServiceOrderHeader for these fields
        const res = await updateServiceOrderHeader(os.id, formData);

        setIsSaving(false);
        if (res.error) toast.error(res.error);
        else toast.success('Valores atualizados');
    };

    const handleSendBudget = async () => {
        if (!confirm('Confirma a emissão deste orçamento? O status mudará para Aguardando Aprovação.')) return;

        // Save first just in case
        await handleSaveFinancials();

        setIsSaving(true);
        const res = await updateServiceOrderStatus(os.id, 'WAITING_APPROVAL', 'Orçamento emitido pelo Comercial');
        setIsSaving(false);

        if (res.error) toast.error(res.error);
        else toast.success('Orçamento enviado com sucesso!');
    };

    const m = parseFloat(margin) || 0;
    const simulatedTotal = m > 0 && m < 100 ? subtotal / (1 - (m / 100)) : 0;
    const profitAmount = simulatedTotal - subtotal;

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-700">
                    <Coins className="text-orange-600" size={20} />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Precificação e Orçamento</h3>
                </div>
                {!isReadOnly && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveFinancials}
                            disabled={isSaving}
                            className="btn btn-xs btn-ghost text-slate-500"
                        >
                            Salvar Rascunho
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Parts & Materials */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                            <Package size={14} /> Peças e Materiais
                        </h4>
                        {!isReadOnly && (
                            <button
                                onClick={() => { setIsAddPartOpen(true); loadParts(); }}
                                className="btn btn-xs btn-outline border-slate-200 hover:bg-slate-50 text-slate-600"
                            >
                                <Plus size={12} /> Adicionar
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-md">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                                <tr>
                                    <th className="p-2 pl-3">Item</th>
                                    <th className="p-2 text-center">Qtd</th>
                                    <th className="p-2 text-right">Unit.</th>
                                    <th className="p-2 text-right">Total</th>
                                    {!isReadOnly && <th className="p-2 w-8"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {parts.map(part => (
                                    <tr key={part.id} className="hover:bg-slate-50/50">
                                        <td className="p-2 pl-3 font-medium text-slate-700">
                                            {part.part?.name || 'Item Desconhecido'}
                                            <div className="text-[10px] text-slate-400 font-mono">{part.part?.sku}</div>
                                        </td>
                                        <td className="p-2 text-center text-slate-600">{part.quantity}</td>
                                        <td className="p-2 text-right text-slate-600">
                                            {part.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="p-2 text-right font-medium text-slate-800">
                                            {part.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        {!isReadOnly && (
                                            <td className="p-2 text-right">
                                                <button
                                                    onClick={() => handleRemovePart(part.id)}
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {parts.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-slate-400 italic">
                                            Nenhuma peça selecionada
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50/50 font-bold text-slate-700 border-t border-slate-100">
                                <tr>
                                    <td colSpan="3" className="p-2 text-right uppercase text-[10px] tracking-wide text-slate-500">Total Peças</td>
                                    <td className="p-2 text-right">
                                        {totalParts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* RIGHT: Labor & Totals */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                            <Wrench size={14} /> Mão de Obra e Serviços
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text text-xs text-slate-500 mb-1 block">Tempo Estimado (h)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    disabled={isReadOnly}
                                    value={laborHours}
                                    onChange={(e) => setLaborHours(e.target.value)}
                                    className="input input-sm w-full border-slate-200 focus:border-orange-500"
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="label-text text-xs text-slate-500 mb-1 block">Valor Mão de Obra (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    disabled={isReadOnly}
                                    value={laborCost}
                                    onChange={(e) => setLaborCost(e.target.value)}
                                    className="input input-sm w-full border-slate-200 focus:border-orange-500 font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                            <div>
                                <label className="label-text text-xs text-slate-500 mb-1 block">Deslocamento (R$)</label>
                                <input
                                    type="number"
                                    disabled={isReadOnly}
                                    value={displacement}
                                    onChange={(e) => setDisplacement(e.target.value)}
                                    className="input input-sm w-full border-slate-200 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="label-text text-xs text-slate-500 mb-1 block">Desconto (R$)</label>
                                <input
                                    type="number"
                                    disabled={isReadOnly}
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="input input-sm w-full border-slate-200 focus:border-orange-500 text-green-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Final Totals */}
                    <div className="bg-slate-900 text-white p-5 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-2 text-slate-400 text-xs uppercase tracking-wider">
                            <span>Margem de Lucro Target %</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500">Markup</span>
                                <input
                                    type="number"
                                    className="bg-slate-800 border-none w-16 text-right text-white rounded p-1 text-xs"
                                    placeholder="0"
                                    value={margin}
                                    onChange={(e) => setMargin(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Simulation Result */}
                        {simulatedTotal > 0 && (
                            <div className="mb-4 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-orange-400">Preço Sugerido:</span>
                                    <span className="font-bold text-orange-400">{simulatedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                                    <span>Lucro Bruto:</span>
                                    <span>{profitAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1 mb-4 text-xs text-slate-300">
                            <div className="flex justify-between">
                                <span>Peças</span>
                                <span>{totalParts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Serviços / MO</span>
                                <span>{(parseFloat(laborCost) + totalServicesPredefined).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Outros</span>
                                <span>{(parseFloat(displacement) - parseFloat(discount)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3 flex justify-between items-end">
                            <div className="text-slate-400 text-xs font-bold uppercase">Total Orçamento</div>
                            <div className="text-2xl font-bold text-green-400">
                                {totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        </div>

                        {!isReadOnly && (
                            <button
                                onClick={handleSendBudget}
                                disabled={isSaving}
                                className="w-full mt-4 btn bg-orange-600 hover:bg-orange-700 text-white border-none shadow-orange-900/20 shadow-lg font-bold uppercase tracking-wider"
                            >
                                <Coins size={16} /> Emitir Orçamento
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Part Modal */}
            {isAddPartOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Adicionar Peça</h3>
                            <button onClick={() => setIsAddPartOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="label-text text-xs font-bold uppercase text-slate-500 mb-1 block">Selecione a Peça</label>
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={selectedPartId}
                                    onChange={(e) => setSelectedPartId(e.target.value)}
                                    disabled={isLoadingParts}
                                >
                                    <option value="">Selecione...</option>
                                    {availableParts.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku}) - {p.stockQuantity} un - R$ {p.salePrice}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label-text text-xs font-bold uppercase text-slate-500 mb-1 block">Quantidade</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={partQty}
                                    onChange={(e) => setPartQty(e.target.value)}
                                    className="input input-sm w-full border-slate-200"
                                />
                            </div>
                            <button
                                onClick={handleAddPart}
                                disabled={!selectedPartId || isSaving}
                                className="btn btn-primary w-full"
                            >
                                {isSaving ? 'Salvando...' : 'Adicionar Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
