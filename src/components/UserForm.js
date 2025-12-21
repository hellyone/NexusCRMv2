'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, updateUser } from '@/actions/users';
import { Save, X, Eye, EyeOff, Shield, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import { MAINTENANCE_AREAS } from '@/utils/status-machine';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'BACKOFFICE', label: 'Backoffice' },
    { value: 'TECH_INTERNAL', label: 'Técnico Interno' },
    { value: 'TECH_FIELD', label: 'Técnico Campo' },
];

export default function UserForm({ initialData = null }) {
    const router = useRouter();
    // Tab state
    const [activeTab, setActiveTab] = useState('access');

    const [formData, setFormData] = useState({
        // User Fields
        name: initialData?.name || '',
        username: initialData?.username || '',
        email: initialData?.email || '', // Now in professional/contact
        password: '',
        role: initialData?.role || 'TECH_FIELD',
        isActive: initialData ? initialData.isActive : true,

        // Technician Fields (merged)
        // If initialData.technician exists, populate from it
        phone: initialData?.technician?.phone || '',
        whatsapp: initialData?.technician?.whatsapp || '',
        document: initialData?.technician?.document || '',
        professionalId: initialData?.technician?.professionalId || '',
        costPerHour: initialData?.technician?.costPerHour || '',
        specialty: initialData?.technician?.specialty || '', // Main specialty string

        // Special field for Internal Techs (JSON array)
        specialties: initialData?.specialties ? JSON.parse(initialData.specialties) : [],
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'specialties') {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, specialties: selected }));
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
        setFieldErrors({});

        const payload = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'specialties') {
                payload.append(key, JSON.stringify(formData[key]));
            } else if (key === 'password') {
                // Only append password if it's not empty
                if (formData[key] && formData[key].trim() !== '') {
                    payload.append(key, formData[key]);
                }
            } else if (formData[key] !== null && formData[key] !== undefined) {
                payload.append(key, formData[key]);
            }
        });

        try {
            let result;
            if (initialData?.id) {
                result = await updateUser(initialData.id, payload);
            } else {
                result = await createUser(payload);
            }

            if (result.error) {
                setError(result.error);
                if (result.fieldErrors) {
                    const errorsObj = {};
                    result.fieldErrors.forEach(err => {
                        errorsObj[err.path] = err.message;
                    });
                    setFieldErrors(errorsObj);
                }
                setLoading(false);
            } else {
                router.push('/users');
                router.refresh();
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'access', label: 'Dados de Acesso', icon: Shield },
        { id: 'professional', label: 'Dados Profissionais', icon: Briefcase },
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/users" className="btn btn-ghost p-2">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Editar Membro da Equipe' : 'Novo Membro da Equipe'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {initialData ? 'Atualize os dados do funcionário' : 'Cadastre um novo funcionário'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary min-w-[120px]" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                        Salvar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex flex-col gap-2">
                    <span className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        {error}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Sidebar / Tabs */}
                <div className="md:col-span-1 flex flex-col gap-1 bg-white p-2 rounded-xl border border-border sticky top-4">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                                    activeTab === tab.id
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-4">

                    {/* TAB: ACCESS */}
                    {activeTab === 'access' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Shield size={20} className="text-secondary-foreground" />
                                    Identificação e Acesso
                                </h2>
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Nome Completo <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={cn("input", fieldErrors.name && "border-red-500")}
                                    required
                                    placeholder="Ex: João Silva"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Nome de Usuário (Login) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={cn("input", fieldErrors.username && "border-red-500")}
                                    required
                                    placeholder="Ex: joao.silva"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">
                                    {initialData ? 'Nova Senha (opcional)' : <>{'Senha '} <span className="text-red-500">*</span></>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input pr-10"
                                        required={!initialData}
                                        minLength={!initialData ? 4 : undefined}
                                        placeholder={initialData ? '••••' : 'Mínimo 4 caracteres'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Perfil de Acesso <span className="text-red-500">*</span></label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    {ROLES.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-12 pt-2">
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50/50">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        id="activeCheck"
                                    />
                                    <label htmlFor="activeCheck" className="text-sm font-medium cursor-pointer select-none text-gray-700">
                                        Membro Ativo (Acesso Liberado)
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PROFESSIONAL */}
                    {activeTab === 'professional' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Briefcase size={20} className="text-secondary-foreground" />
                                    Dados Profissionais
                                </h2>
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Email (Contato)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="usuario@dominio.com"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Telefone / Celular</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Whatsapp (Link Automático)</label>
                                <input
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">CPF</label>
                                <input
                                    name="document"
                                    value={formData.document}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Registro Profissional (CREA/CFT)</label>
                                <input
                                    name="professionalId"
                                    value={formData.professionalId}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: 12345/TD"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-8">
                                <label className="label-text">Especialidade Principal</label>
                                <input
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Ex: Eletrônica Industrial"
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Custo Hora (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="costPerHour"
                                    value={formData.costPerHour}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Especialidades (para TECH_INTERNAL) */}
                            {formData.role === 'TECH_INTERNAL' && (
                                <div className="col-span-12 space-y-3 pt-4 border-t mt-4">
                                    <h3 className="font-semibold text-gray-900 border-l-4 border-primary pl-2">Áreas de Atuação (Interno)</h3>
                                    <div className="form-group">
                                        <label className="label-text mb-2 block">Selecione as áreas que este técnico atende:</label>
                                        <select
                                            name="specialties"
                                            multiple
                                            value={formData.specialties}
                                            onChange={handleChange}
                                            className="input min-h-[120px]"
                                            size={6}
                                        >
                                            {Object.entries(MAINTENANCE_AREAS).map(([key, label]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Segure Ctrl (ou Cmd) para selecionar várias opções.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <style jsx>{`
                .label-text {
                    @apply block text-sm font-medium mb-1 text-gray-700;
                }
            `}</style>
        </form>
    );
}
