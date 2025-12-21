'use client';

import { useState } from 'react';
import { adjustStock } from '@/actions/stock';
import { Loader, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StockAdjustmentModal({ partId, currentStock, onClose }) {
    const [type, setType] = useState('IN');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('ADJUSTMENT'); // ADJUSTMENT, PURCHASE, RETURN
    const [unitCost, setUnitCost] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await adjustStock({
                partId,
                quantity,
                type,
                reason,
                unitCost: type === 'IN' ? unitCost : undefined
            });
            router.refresh();
            onClose();
        } catch (error) {
            alert('Erro ao ajustar estoque: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-lg font-bold mb-4">Ajuste de Estoque</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setType('IN')}
                            className={`flex-1 py-2 rounded-md font-bold flex items-center justify-center gap-2 ${type === 'IN' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100'}`}
                        >
                            <Plus size={18} /> Entrada
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('OUT')}
                            className={`flex-1 py-2 rounded-md font-bold flex items-center justify-center gap-2 ${type === 'OUT' ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-gray-100'}`}
                        >
                            <Minus size={18} /> Saída
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Quantidade</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>

                    {type === 'IN' && (
                        <div>
                            <label className="block text-sm font-medium">Custo Unitário (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={unitCost}
                                onChange={e => setUnitCost(e.target.value)}
                                className="input input-bordered w-full"
                                placeholder="Opcional - Atualiza histórico"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium">Motivo</label>
                        <select
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="ADJUSTMENT">Ajuste / Inventário</option>
                            <option value="PURCHASE">Compra</option>
                            <option value="RETURN">Devolução</option>
                            <option value="LOSS">Perda / Quebra</option>
                            {/* SERVICE_ORDER is usually automatic */}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader className="animate-spin" /> : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
