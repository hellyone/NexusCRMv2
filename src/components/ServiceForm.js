'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createService, updateService } from '@/actions/services';
import { SERVICE_CATEGORIES } from '@/utils/constants';
import { Save, X } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';

export default function ServiceForm({ initialData = null }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        code: initialData?.code || '',
        description: initialData?.description || '',
        category: initialData?.category || '',
        price: initialData?.price ? maskCurrency(initialData.price.toFixed(2)) : '',
        priceType: initialData?.priceType || 'FIXED',
        serviceCode: initialData?.serviceCode || '',
        estimatedMinutes: initialData?.estimatedMinutes || '',
        requiresChecklist: initialData?.requiresChecklist || false,
    });

    // Manual category input state if "Outros" is selected, or just let them type if simple input?
    // Let's stick to Select for strictness based on requirements, but allow custom if needed later.

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'price') {
            setFormData(prev => ({ ...prev, [name]: maskCurrency(value) }));
            return;
        }

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
                if (key === 'price') {
                    // Clean currency mask
                    const cleanPrice = formData[key].replace(/\D/g, '') / 100;
                    payload.append(key, cleanPrice);
                } else {
                    payload.append(key, formData[key]);
                }
            }
        });

        const result = initialData
            ? await updateService(initialData.id, payload)
            : await createService(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/services');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {initialData ? 'Editar Serviço' : 'Novo Serviço'}
                </h2>
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="col-span-1">
                    <label className="label">Nome do Serviço *</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input"
                        required
                        placeholder="Ex: Limpeza de Inversor"
                    />
                </div>

                <div className="col-span-1">
                    <label className="label">Código Interno</label>
                    <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className="input"
                        placeholder="Ex: SRV-001"
                    />
                </div>

                <div className="col-span-full">
                    <label className="label">Descrição</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input min-h-[80px]"
                        placeholder="Detalhes sobre o serviço..."
                    />
                </div>

                <div className="col-span-1">
                    <label className="label">Categoria</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="input">
                        <option value="">Selecione...</option>
                        {SERVICE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-1">
                    <label className="label">Código Municipal (NFS-e)</label>
                    <input
                        name="serviceCode"
                        value={formData.serviceCode}
                        onChange={handleChange}
                        className="input"
                        placeholder="Ex: 14.01"
                    />
                </div>

                <h3 className="col-span-full text-sm font-bold text-muted uppercase mt-2 mb-2">Valores e Tempo</h3>
                <hr className="col-span-full border-border mb-2" />

                <div className="col-span-1">
                    <label className="label">Preço Base (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                        <input
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="input pl-10"
                            placeholder="0,00"
                        />
                    </div>
                </div>

                <div className="col-span-1">
                    <label className="label">Tipo de Cobrança</label>
                    <select name="priceType" value={formData.priceType} onChange={handleChange} className="input">
                        <option value="FIXED">Valor Fixo</option>
                        <option value="HOURLY">Por Hora</option>
                    </select>
                </div>

                <div className="col-span-1">
                    <label className="label">Tempo Estimado (minutos)</label>
                    <input
                        type="number"
                        name="estimatedMinutes"
                        value={formData.estimatedMinutes}
                        onChange={handleChange}
                        className="input"
                        placeholder="Ex: 60"
                    />
                </div>

                <div className="col-span-1 flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="requiresChecklist"
                            checked={formData.requiresChecklist}
                            onChange={handleChange}
                            className="w-4 h-4"
                        />
                        <span>Requer Checklist Técnico?</span>
                    </label>
                </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Salvar Serviço'}
                </button>
            </div>
        </form>
    );
}
