'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTechnician, updateTechnician } from '@/actions/technicians';
import { TECHNICIAN_SPECIALTIES } from '@/utils/constants';
import { Save, X } from 'lucide-react';
import { maskCPF, maskPhone, maskCurrency } from '@/utils/masks';

export default function TechnicianForm({ initialData = null }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone ? maskPhone(initialData.phone) : '',
        whatsapp: initialData?.whatsapp ? maskPhone(initialData.whatsapp) : '',
        document: initialData?.document ? maskCPF(initialData.document) : '',
        professionalId: initialData?.professionalId || '',
        specialty: initialData?.specialty || '',
        certifications: initialData?.certifications || '',
        costPerHour: initialData?.costPerHour ? maskCurrency(initialData.costPerHour.toFixed(2)) : '',
        hireDate: initialData?.hireDate ? new Date(initialData.hireDate).toISOString().split('T')[0] : '',
        isActive: initialData ? initialData.isActive : true,
    });

    // Future: User selection if users exist

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'phone' || name === 'whatsapp') {
            setFormData(prev => ({ ...prev, [name]: maskPhone(value) }));
            return;
        }
        if (name === 'document') {
            setFormData(prev => ({ ...prev, [name]: maskCPF(value) }));
            return;
        }
        if (name === 'costPerHour') {
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
                if (key === 'costPerHour') {
                    const cleanPrice = String(formData[key]).replace(/\D/g, '') / 100;
                    payload.append(key, cleanPrice);
                } else {
                    payload.append(key, formData[key]);
                }
            }
        });

        const result = initialData
            ? await updateTechnician(initialData.id, payload)
            : await createTechnician(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/technicians');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {initialData ? 'Editar Técnico' : 'Novo Técnico'}
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
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Identificação Profissional</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Nome Completo *</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="input" required />
                </div>

                <div className="form-group">
                    <label className="label">CPF</label>
                    <input name="document" value={formData.document} onChange={handleChange} className="input" placeholder="000.000.000-00" />
                </div>

                <div className="form-group">
                    <label className="label">Registro (CREA/CFT)</label>
                    <input name="professionalId" value={formData.professionalId} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Especialidade</label>
                    <select name="specialty" value={formData.specialty} onChange={handleChange} className="input">
                        <option value="">Selecione...</option>
                        {TECHNICIAN_SPECIALTIES.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>

                {/* Contato */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Contato</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">E-mail *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Telefone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="(00) 0000-0000" />
                </div>

                <div className="form-group">
                    <label className="label">WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="input" placeholder="(00) 00000-0000" />
                </div>

                {/* Adm */}
                <div className="col-span-full mt-4">
                    <h3 className="text-sm font-bold text-muted uppercase mb-2">Administrativo</h3>
                    <hr className="border-border mb-4" />
                </div>

                <div className="form-group">
                    <label className="label">Data de Admissão</label>
                    <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="input" />
                </div>

                <div className="form-group">
                    <label className="label">Custo Hora Interno (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                        <input name="costPerHour" value={formData.costPerHour} onChange={handleChange} className="input pl-10" placeholder="0,00" />
                    </div>
                </div>

                <div className="form-group col-span-full">
                    <label className="label">Certificações (NRs, Cursos)</label>
                    <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        className="input min-h-[80px]"
                        placeholder="Ex: NR-10, NR-35, SEP..."
                    />
                </div>

                <div className="col-span-1 flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4"
                        />
                        <span>Colaborador Ativo?</span>
                    </label>
                </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Save size={18} />
                    {loading ? 'Salvando...' : 'Salvar Técnico'}
                </button>
            </div>
        </form>
    );
}
