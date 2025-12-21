'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPart, updatePart } from '@/actions/parts';
import { Save, X } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';

export default function PartForm({ initialData = null }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        // sku: removed
        partNumber: initialData?.partNumber || '',
        description: initialData?.description || '',
        brand: initialData?.brand || '',
        // model: removed
        ncm: initialData?.ncm || '',
        category: initialData?.category || '',
        unit: initialData?.unit || 'UN',
        location: initialData?.location || '',

        usageType: initialData?.usageType || 'BOTH',

        stockQuantity: initialData?.stockQuantity || 0,
        minStock: initialData?.minStock || 0,
        maxStock: initialData?.maxStock || '',

        // Prices hidden (default 0)
        costPrice: '0,00',
        salePrice: '0,00',

        isActive: initialData ? initialData.isActive : true,
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                if (key === 'costPrice' || key === 'salePrice') {
                    // Send 0
                    payload.append(key, 0);
                } else {
                    payload.append(key, formData[key]);
                }
            }
        });

        const result = initialData
            ? await updatePart(initialData.id, payload)
            : await createPart(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/parts');
        }
    };

    // Label style helper - using darker text
    const Label = ({ children }) => <label className="block text-sm font-semibold text-gray-800 mb-1">{children}</label>;

    return (
        <form onSubmit={handleSubmit} className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    {initialData ? 'Editar Item' : 'Novo Item de Estoque'}
                </h2>
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Identificação */}
                <div className="col-span-full">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Identificação</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group col-span-2">
                    <Label>Nome do Item *</Label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input font-medium"
                        required
                        placeholder="Ex: Servomotor Yaskawa 400W"
                    />
                </div>

                <div className="form-group">
                    <Label>Part Number (Código Fabricante)</Label>
                    <input name="partNumber" value={formData.partNumber} onChange={handleChange} className="input" placeholder="Ex: SGM7G-03AFC61" />
                </div>

                <div className="form-group">
                    <Label>Marca</Label>
                    <input name="brand" value={formData.brand} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <Label>Categoria</Label>
                    <input name="category" value={formData.category} onChange={handleChange} className="input" placeholder="Ex: Motores" />
                </div>

                <div className="form-group">
                    <Label>Tipo de Estoque (Uso)</Label>
                    <select name="usageType" value={formData.usageType} onChange={handleChange} className="input">
                        <option value="BOTH">Ambos (Venda e Consumo)</option>
                        <option value="SALE">Apenas Venda</option>
                        <option value="SERVICE">Apenas Consumo Interno</option>
                    </select>
                </div>

                {/* Fiscal e Estoque */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Fiscal & Estoque</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <Label>NCM (Fiscal)</Label>
                    <input name="ncm" value={formData.ncm} onChange={handleChange} className="input" placeholder="Ex: 8544.49.00" />
                </div>

                <div className="form-group">
                    <Label>Unidade</Label>
                    <select name="unit" value={formData.unit} onChange={handleChange} className="input">
                        <option value="UN">Unidade (UN)</option>
                        <option value="M">Metro (M)</option>
                        <option value="KG">Quilo (KG)</option>
                        <option value="L">Litro (L)</option>
                        <option value="CX">Caixa (CX)</option>
                        <option value="PC">Peça (PC)</option>
                        <option value="CJ">Conjunto (CJ)</option>
                    </select>
                </div>

                <div className="form-group">
                    <Label>Localização</Label>
                    <input name="location" value={formData.location} onChange={handleChange} className="input" placeholder="Ex: A1-05" />
                </div>

                <div className="form-group">
                    <Label>Estoque Atual (Total)</Label>
                    <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="input font-bold text-gray-800" />
                </div>

                <div className="form-group">
                    <Label>Estoque Mínimo (Alerta)</Label>
                    <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <Label>Estoque Máximo</Label>
                    <input type="number" name="maxStock" value={formData.maxStock} onChange={handleChange} className="input" />
                </div>

                {/* Descrição */}
                <div className="col-span-full mt-4">
                    <Label>Descrição / Obs</Label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input h-24"
                        placeholder="Detalhes adicionais..."
                    />
                </div>

                {/* Financeiro Removido conforme solicitado */}
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                <button type="button" onClick={() => router.back()} className="btn btn-ghost font-medium">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary font-bold px-8" disabled={loading}>
                    <Save size={18} className="mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Item'}
                </button>
            </div>
        </form>
    );
}
