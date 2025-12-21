'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { createServiceOrder } from '@/actions/service-orders';
import { getClients } from '@/actions/clients'; // We need this action exposed or use a client-side search approach

// For simplicity in MVP, lets fetch top 50 clients to select. 
// A real autocomplete would be better but requires more complex UI code.
// Ideally we should reuse a ComboBox component if we had one.

export default function FieldNewOSForm({ clients }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);

    const [formData, setFormData] = useState({
        clientId: '',
        reportedDefect: '',
        priority: 'NORMAL',
        serviceLocation: 'CLIENT_SITE', // Default for field tech
        requesterName: '',
    });

    useEffect(() => {
        if (!searchTerm) {
            setFilteredClients(clients.slice(0, 5));
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredClients(clients.filter(c => c.name.toLowerCase().includes(lower) || c.document.includes(lower)).slice(0, 10));
        }
    }, [searchTerm, clients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));
        // Default hidden fields
        payload.append('type', 'CORRECTIVE');
        payload.append('origin', 'APP_MOBILE');
        // Need to pass other required fields if server validation fails? 
        // createServiceOrder checks: clientId, reportedDefect.

        const result = await createServiceOrder(payload);

        if (result.success) {
            router.push(`/field/os/${result.id}`);
        } else {
            alert('Erro: ' + result.error);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <button type="button" onClick={() => router.back()} className="btn btn-ghost btn-circle btn-sm">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-lg">Nova OS Rápida</h1>
            </div>

            <div className="p-4 space-y-6">

                {/* Seleção de Cliente Simplificada */}
                <div className="form-group">
                    <label className="label">Buscar Cliente</label>
                    <div className="relative">
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder="Nome ou CPF/CNPJ..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="label">Cliente Selecionado</label>
                    <div className="grid grid-cols-1 gap-2">
                        {filteredClients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => setFormData({ ...formData, clientId: client.id, requesterName: client.contactName || client.name })}
                                className={`p-3 rounded border cursor-pointer transition-all ${formData.clientId === client.id ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-white border-gray-200'}`}
                            >
                                <div className="font-bold text-sm">{client.name}</div>
                                <div className="text-xs text-gray-500">{client.city || 'Sem cidade'}</div>
                            </div>
                        ))}
                    </div>
                    {formData.clientId === '' && <div className="text-xs text-red-500">* Selecione um cliente da lista</div>}
                </div>

                <div className="form-group">
                    <label className="label">Solicitante (No Local)</label>
                    <input
                        className="input"
                        value={formData.requesterName}
                        onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                        placeholder="Quem recebeu?"
                    />
                </div>

                <div className="form-group">
                    <label className="label">Defeito Relatado *</label>
                    <textarea
                        className="textarea h-32"
                        placeholder="Descreva o problema..."
                        required
                        value={formData.reportedDefect}
                        onChange={e => setFormData({ ...formData, reportedDefect: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="label">Prioridade</label>
                    <div className="flex gap-2">
                        {['NORMAL', 'HIGH', 'CRITICAL'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setFormData({ ...formData, priority: p })}
                                className={`flex-1 py-2 rounded text-xs font-bold border ${formData.priority === p ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}
                            >
                                {p === 'NORMAL' ? 'Normal' : p === 'HIGH' ? 'Alta' : 'Crítica'}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <button type="submit" className="btn btn-primary w-full h-12 text-lg" disabled={loading || !formData.clientId}>
                    <Save size={20} className="mr-2" />
                    {loading ? 'Abrindo...' : 'Abrir OS'}
                </button>
            </div>
        </form>
    );
}
