'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPartsForSelect } from '@/actions/parts';
import { addPartToServiceOrder, removePartFromServiceOrder, updateServiceOrderPart } from '@/actions/service-order-items';
import { Plus, Trash2, Package, Edit2, Check, X } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';

export default function OsPartsTab({ os }) {
    const router = useRouter();
    const [availableParts, setAvailableParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addItemLoading, setAddItemLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ quantity: '', unitPrice: '' });

    // Form State
    const [selectedPartId, setSelectedPartId] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const load = async () => {
            // Filter: Only list parts that can be used in SERVICES (SERVICE or BOTH).
            // Exclude parts that are strictly for SALE.
            const parts = await getPartsForSelect({ usageType: ['SERVICE', 'BOTH'] });
            setAvailableParts(parts);
        };
        load();
    }, []);

    const selectedPartData = availableParts.find(p => p.id === parseInt(selectedPartId));

    const handleAddPart = async (e) => {
        e.preventDefault();
        if (!selectedPartId || quantity <= 0) return;

        setAddItemLoading(true);
        const res = await addPartToServiceOrder(os.id, selectedPartId, quantity);
        if (res.error) {
            alert(res.error);
        } else {
            setSelectedPartId('');
            setQuantity(1);
        }
        setAddItemLoading(false);
    };

    const handleRemovePart = async (itemId) => {
        if (!confirm('Remover item? O estoque será devolvido.')) return;
        setLoading(true);
        await removePartFromServiceOrder(itemId);
        router.refresh();
        setLoading(false);
    };

    const handleStartEdit = (item) => {
        setEditingItem(item.id);
        setEditForm({
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
        });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditForm({ quantity: '', unitPrice: '' });
    };

    const handleSaveEdit = async (itemId) => {
        setLoading(true);
        const result = await updateServiceOrderPart(
            itemId,
            editForm.quantity,
            editForm.unitPrice
        );
        if (result.error) {
            alert(result.error);
        } else {
            setEditingItem(null);
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Add Part Form */}
            <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-4">
                <form onSubmit={handleAddPart} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="label text-xs uppercase text-muted font-bold">Adicionar Peça / Material</label>
                        <select
                            className="input bg-white"
                            value={selectedPartId}
                            onChange={e => setSelectedPartId(e.target.value)}
                        >
                            <option value="">Selecione um item...</option>
                            {availableParts.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                                    {p.name} (Saldo: {p.stockQuantity}) - R$ {maskCurrency(p.salePrice.toFixed(2))}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-24">
                        <label className="label text-xs uppercase text-muted font-bold">Qtd.</label>
                        <input
                            type="number"
                            min="1"
                            max={selectedPartData ? selectedPartData.stockQuantity : 999}
                            className="input bg-white text-center"
                            value={quantity}
                            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedPartId || addItemLoading}
                        className="btn btn-primary whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Adicionar
                    </button>
                </form>
                {selectedPartData && (
                    <p className="text-xs text-muted mt-2 ml-1">
                        Estoque Disponível: <b>{selectedPartData.stockQuantity}</b> un. | Preço Unit: R$ {maskCurrency(selectedPartData.salePrice.toFixed(2))}
                    </p>
                )}
            </div>

            {/* Parts List */}
            <div className="table-container border rounded-lg">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="text-center">Qtd.</th>
                            <th className="text-right">Unitário</th>
                            <th className="text-right">Subtotal</th>
                            <th className="text-right text-gray-500 w-16">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {os.parts && os.parts.map(item => (
                            <tr key={item.id} className={editingItem === item.id ? 'bg-blue-50' : ''}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Package size={16} className="text-muted" />
                                        <span className="font-medium">{item.part.name}</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    {editingItem === item.id ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            className="input text-sm w-20 text-center"
                                            value={editForm.quantity}
                                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                        />
                                    ) : (
                                        <span className="font-bold text-gray-700">{item.quantity}</span>
                                    )}
                                </td>
                                <td className="text-right">
                                    {editingItem === item.id ? (
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="input text-sm w-24 text-right"
                                            value={editForm.unitPrice}
                                            onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                                        />
                                    ) : (
                                        <span className="font-mono text-muted text-sm">
                                            R$ {maskCurrency(item.unitPrice.toFixed(2))}
                                        </span>
                                    )}
                                </td>
                                <td className="text-right font-mono font-medium">
                                    {editingItem === item.id ? (
                                        <span className="text-xs text-blue-600">
                                            = R$ {maskCurrency((parseFloat(editForm.quantity || 0) * parseFloat(editForm.unitPrice || 0)).toFixed(2))}
                                        </span>
                                    ) : (
                                        <span>R$ {maskCurrency(item.subtotal.toFixed(2))}</span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {editingItem === item.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(item.id)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-green-600 hover:bg-green-50 p-2 h-8 w-8"
                                                    title="Salvar"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-gray-600 hover:bg-gray-50 p-2 h-8 w-8"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-blue-600 hover:bg-blue-50 p-2 h-8 w-8"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemovePart(item.id)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-red-600 hover:bg-red-50 p-2 h-8 w-8"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!os.parts || os.parts.length === 0) && (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-muted italic">
                                    Nenhuma peça utilizada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {os.parts && os.parts.length > 0 && (
                        <tfoot>
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan="3" className="text-right uppercase text-xs text-muted">Total Peças:</td>
                                <td className="text-right">R$ {maskCurrency(os.totalParts.toFixed(2))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
