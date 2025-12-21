'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEquipment, updateEquipment } from '@/actions/equipments';
import { Save, X } from 'lucide-react';

export default function EquipmentForm({ initialData = null, clients = [] }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        partNumber: initialData?.partNumber || '',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        serialNumber: initialData?.serialNumber || '',
        patrimony: initialData?.patrimony || '',
        voltage: initialData?.voltage || '',
        power: initialData?.power || '',
        location: initialData?.location || '',
        status: initialData?.status || 'active',
        clientId: initialData?.clientId || '',
        imageUrl: initialData?.images?.[0]?.url || '', // Simple URL handling
        manufactureDate: initialData?.manufactureDate ? new Date(initialData.manufactureDate).toISOString().split('T')[0] : '',
        purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split('T')[0] : '',
        warrantyEnd: initialData?.warrantyEnd ? new Date(initialData.warrantyEnd).toISOString().split('T')[0] : '',
        isWarranty: initialData?.isWarranty || false,
    });

    // Status validation state
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;

        if (['name', 'brand', 'model', 'serialNumber', 'patrimony', 'location'].includes(name)) {
            value = value.toUpperCase();
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
                payload.append(key, formData[key]);
            }
        });

        const result = initialData
            ? await updateEquipment(initialData.id, payload)
            : await createEquipment(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/equipments');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {initialData ? 'Editar Equipamento' : 'Novo Equipamento'}
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
                {/* Identificação */}
                <div className="col-span-full">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Identificação</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Cliente <span className="text-red-500">*</span></label>
                    <select
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleChange}
                        className="input"
                        required
                    >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group font-bold">
                    <label className="label">Part Number</label>
                    <input
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={(e) => setFormData({ ...formData, partNumber: e.target.value.toUpperCase() })}
                        placeholder="Ex: PN-123456"
                        className="input font-medium border-gray-300"
                    />
                </div>

                <div className="form-group">
                    <label className="label">Nome/Tipo <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: MOTOR ELÉTRICO, INVERSOR"
                        className="input font-medium"
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="label">Marca</label>
                    <input name="brand" value={formData.brand} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Modelo</label>
                    <input name="model" value={formData.model} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Nº Série</label>
                    <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="input font-bold" />
                </div>

                <div className="form-group">
                    <label className="label">Patrimônio</label>
                    <input name="patrimony" value={formData.patrimony} onChange={handleChange} className="input" />
                </div>

                {/* Especificações */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Especificações Técnicas</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Tensão (V)</label>
                    <input name="voltage" value={formData.voltage} onChange={handleChange} className="input" placeholder="Ex: 220V, 380V" />
                </div>

                <div className="form-group">
                    <label className="label">Potência</label>
                    <input name="power" value={formData.power} onChange={handleChange} className="input" placeholder="Ex: 5CV, 10kW" />
                </div>

                {/* Datas e Garantia */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Histórico e Garantia</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Data Fabricação</label>
                    <input type="date" name="manufactureDate" value={formData.manufactureDate} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Data Compra</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Fim da Garantia</label>
                    <input type="date" name="warrantyEnd" value={formData.warrantyEnd} onChange={handleChange} className="input" />
                </div>

                <div className="form-group flex items-center h-full pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isWarranty"
                            checked={formData.isWarranty}
                            onChange={handleChange}
                            className="w-4 h-4"
                        />
                        <span>Em Garantia?</span>
                    </label>
                </div>

                {/* Localização e Imagem */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Localização e Mídia</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Localização/Setor</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="input" placeholder="Ex: Galpão A, Linha 2" />
                </div>

                <div className="form-group">
                    <label className="label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="input">
                        <option value="active">Ativo</option>
                        <option value="maintenance">Em Manutenção</option>
                        <option value="inactive">Inativo/Descarte</option>
                    </select>
                </div>

                <div className="col-span-full form-group">
                    <label className="label">URL da Imagem (Opcional)</label>
                    <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input" placeholder="https://..." />
                </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Salvar Equipamento'}
                </button>
            </div>
        </form>
    );
}
