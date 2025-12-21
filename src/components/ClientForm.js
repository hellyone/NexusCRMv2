'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Building, MapPin, Wallet, Wrench, Settings, Plus, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { createClient, updateClient } from '@/actions/clients';
import { getTechniciansForSelect } from '@/actions/technicians';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/utils/masks';
import { cn } from '@/lib/utils';

export default function ClientForm({ initialData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [activeTab, setActiveTab] = useState('general');
    const [technicians, setTechnicians] = useState([]);

    useEffect(() => {
        getTechniciansForSelect().then(setTechnicians).catch(console.error);
    }, []);

    const [formData, setFormData] = useState({
        // Geral
        name: '',
        tradeName: '',
        document: '',
        personType: 'PJ',
        stateRegistry: '',
        cityRegistry: '',
        cnae: '',
        taxRegime: '',

        // Endereço
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',

        // Contato
        phonePrimary: '',
        phoneSecondary: '',
        whatsapp: '',
        emailPrimary: '',
        emailSecondary: '',

        // Responsável Técnico
        techName: '',
        techDocument: '',
        techClassId: '',
        techContact: '',

        // Financeiro
        segment: '',
        creditLimit: '',
        paymentTerms: '',
        bankName: '',
        bankAgency: '',
        bankAccount: '',
        pixKey: '',

        // Configurações
        observations: '',
        operatingHours: '', // JSON string handled as text for now or specific UI
        notificationSettings: '',
        isActive: true,

        ...initialData
    });

    // Certifications state (handled separately for UI list, but will be part of submission)
    // For now we don't have nested creation in this form fully wired without complex UI, 
    // but let's prep the state if we want to add it.
    // const [certifications, setCertifications] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;

        // Apply masks
        if (name === 'document') {
            finalValue = formData.personType === 'PF' ? maskCPF(value) : maskCNPJ(value);
        }
        if (name === 'techDocument') {
            finalValue = maskCPF(value);
        }
        if (['phonePrimary', 'phoneSecondary', 'whatsapp'].includes(name)) {
            finalValue = maskPhone(value);
        }
        if (name === 'zipCode') {
            finalValue = maskCEP(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleBlurCEP = async () => {
        const cep = formData.zipCode.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }));
                }
            } catch (err) {
                console.error("Erro ao buscar CEP", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFieldErrors({});

        const payload = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'certifications') {
                // Send as JSON string because FormData doesn't support arrays of objects naturally well without parsing
                // server action needs to handle this
                payload.append('certifications', JSON.stringify(formData[key]));
            } else if (formData[key] !== null && formData[key] !== undefined) {
                payload.append(key, formData[key]);
            }
        });

        try {
            let result;
            if (initialData?.id) {
                result = await updateClient(initialData.id, payload);
            } else {
                result = await createClient(payload);
            }

            if (result.error) {
                setError(result.error);
                if (result.fieldErrors) {
                    const errorsObj = {};
                    result.fieldErrors.forEach(err => {
                        errorsObj[err.path] = err.message;
                    });
                    setFieldErrors(errorsObj);

                    // Auto-switch to tab with error (heuristic)
                    if (errorsObj.name || errorsObj.document) setActiveTab('general');
                    else if (errorsObj.zipCode) setActiveTab('address');
                }
                setLoading(false);
            } else {
                router.push('/clients');
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro inesperado.');
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'Geral', icon: Building },
        { id: 'address', label: 'Endereço & Contato', icon: MapPin },
        { id: 'financial', label: 'Financeiro', icon: Wallet },
        { id: 'technical', label: 'Resp. Técnico', icon: Wrench },
        { id: 'documents', label: 'Documentos', icon: FileText },
        { id: 'config', label: 'Configurações', icon: Settings },
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/clients" className="btn btn-ghost p-2">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
                        </h1>
                        <p className="text-sm text-muted-foreground">Preencha os dados completos do cliente</p>
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
                    {Object.keys(fieldErrors).length > 0 && (
                        <ul className="list-disc ml-5 text-sm opacity-90">
                            {Object.entries(fieldErrors).map(([field, msg]) => (
                                <li key={field}>
                                    <span className="font-semibold capitalize">{field}:</span> {msg}
                                </li>
                            ))}
                        </ul>
                    )}
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

                    {/* --- TAB: GERAL --- */}
                    {activeTab === 'general' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Building size={20} className="text-secondary-foreground" />
                                    Identificação e Tributário
                                </h2>
                            </div>

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Tipo de Pessoa</label>
                                <select name="personType" value={formData.personType} onChange={handleChange} className="input">
                                    <option value="PJ">Pessoa Jurídica</option>
                                    <option value="PF">Pessoa Física</option>
                                </select>
                            </div>

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">
                                    {formData.personType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="document"
                                    value={formData.document}
                                    onChange={handleChange}
                                    className={cn("input", fieldErrors.document && "border-red-500")}
                                    placeholder={formData.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                                />
                            </div>

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Status</label>
                                <div className="flex items-center h-10 gap-2 border rounded-md px-3 bg-gray-50/50">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        id="activeCheck"
                                    />
                                    <label htmlFor="activeCheck" className="text-sm font-medium cursor-pointer select-none text-gray-700">Cliente Ativo</label>
                                </div>
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">
                                    {formData.personType === 'PJ' ? 'Razão Social' : 'Nome Completo'} <span className="text-red-500">*</span>
                                </label>
                                <input name="name" value={formData.name} onChange={handleChange} className={cn("input", fieldErrors.name && "border-red-500")} />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Nome Fantasia / Apelido</label>
                                <input name="tradeName" value={formData.tradeName || ''} onChange={handleChange} className="input" />
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Inscrição Estadual</label>
                                <input name="stateRegistry" value={formData.stateRegistry || ''} onChange={handleChange} className="input" />
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Inscrição Municipal</label>
                                <input name="cityRegistry" value={formData.cityRegistry || ''} onChange={handleChange} className="input" />
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">CNAE</label>
                                <input name="cnae" value={formData.cnae || ''} onChange={handleChange} className="input" placeholder="00000-00" />
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Regime Tributário</label>
                                <select name="taxRegime" value={formData.taxRegime || ''} onChange={handleChange} className="input">
                                    <option value="">Selecione...</option>
                                    <option value="Simples Nacional">Simples Nacional</option>
                                    <option value="Lucro Presumido">Lucro Presumido</option>
                                    <option value="Lucro Real">Lucro Real</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ADDRESS --- */}
                    {activeTab === 'address' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <MapPin size={20} className="text-secondary-foreground" />
                                    Endereço e Contatos
                                </h2>
                            </div>

                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">CEP</label>
                                <input name="zipCode" value={formData.zipCode || ''} onChange={handleChange} onBlur={handleBlurCEP} className="input" placeholder="00000-000" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Logradouro</label>
                                <input name="street" value={formData.street || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Número</label>
                                <input name="number" value={formData.number || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Bairro</label>
                                <input name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Cidade</label>
                                <input name="city" value={formData.city || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Estado</label>
                                <input name="state" value={formData.state || ''} onChange={handleChange} className="input" maxLength={2} />
                            </div>

                            <div className="col-span-12 my-4 border-t" />

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Telefone Principal</label>
                                <input name="phonePrimary" value={formData.phonePrimary || ''} onChange={handleChange} className="input" placeholder="(00) 0000-0000" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">WhatsApp</label>
                                <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="input" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">E-mail Principal</label>
                                <input type="email" name="emailPrimary" value={formData.emailPrimary || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">E-mail Secundário (NFe)</label>
                                <input type="email" name="emailSecondary" value={formData.emailSecondary || ''} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    )}

                    {/* --- TAB: FINANCIAL --- */}
                    {activeTab === 'financial' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Wallet size={20} className="text-secondary-foreground" />
                                    Dados Bancários e Financeiros
                                </h2>
                            </div>

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Banco</label>
                                <input name="bankName" value={formData.bankName || ''} onChange={handleChange} className="input" placeholder="Ex: Banco do Brasil" />
                            </div>
                            <div className="col-span-12 sm:col-span-2">
                                <label className="label-text">Agência</label>
                                <input name="bankAgency" value={formData.bankAgency || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Conta</label>
                                <input name="bankAccount" value={formData.bankAccount || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <label className="label-text">Chave PIX</label>
                                <input name="pixKey" value={formData.pixKey || ''} onChange={handleChange} className="input" />
                            </div>

                            <div className="col-span-12 my-2 border-t" />

                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Segmento</label>
                                <input name="segment" value={formData.segment || ''} onChange={handleChange} className="input" placeholder="Ex: Indústria, Varejo" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Limite de Crédito</label>
                                <input type="number" name="creditLimit" value={formData.creditLimit || ''} onChange={handleChange} className="input" placeholder="0.00" />
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                                <label className="label-text">Termos de Pagamento</label>
                                <input name="paymentTerms" value={formData.paymentTerms || ''} onChange={handleChange} className="input" placeholder="Ex: 30 dias" />
                            </div>
                        </div>
                    )}

                    {/* --- TAB: TECHNICAL (Responsible) --- */}
                    {activeTab === 'technical' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Wrench size={20} className="text-secondary-foreground" />
                                    Responsável Técnico do Cliente
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Dados do engenheiro ou responsável técnico da empresa contratante.
                                </p>
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Nome do Responsável</label>
                                <input name="techName" value={formData.techName || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">CPF do Responsável</label>
                                <input name="techDocument" value={formData.techDocument || ''} onChange={handleChange} className="input" placeholder="000.000.000-00" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Registro Profissional (CREA/CFT)</label>
                                <input name="techClassId" value={formData.techClassId || ''} onChange={handleChange} className="input" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Contato (Tel/Email)</label>
                                <input name="techContact" value={formData.techContact || ''} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DOCUMENTS (Internal/Integration) --- */}
                    {activeTab === 'documents' && (
                        <div className="card border space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <FileText size={20} className="text-secondary-foreground" />
                                        Documentos e Integrações
                                    </h2>
                                    <p className="text-sm text-gray-500 max-w-lg mt-1">
                                        Gerencie integrações (NR-10, NR-35) e contratos da sua empresa com este cliente.
                                        Vincule ao técnico que realizou a integração.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newCert = {
                                            _tempId: Date.now(),
                                            name: '',
                                            code: '',
                                            technicianId: '',
                                            issuedAt: '',
                                            expiresAt: '',
                                            alertDays: 30
                                        };
                                        setFormData(prev => ({
                                            ...prev,
                                            certifications: [...(prev.certifications || []), newCert]
                                        }));
                                    }}
                                    className="btn btn-sm btn-primary"
                                >
                                    <Plus size={16} className="mr-1" />
                                    Adicionar
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(formData.certifications || []).length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                                        Nenhum documento cadastrado.
                                    </p>
                                ) : (
                                    (formData.certifications || []).map((cert, index) => (
                                        <div key={cert.id || cert._tempId || index} className="p-4 bg-gray-50 rounded-lg border flex flex-col gap-4 relative group">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                                                <div className="lg:col-span-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nome/Descrição</label>
                                                    <input
                                                        type="text"
                                                        value={cert.name}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], name: e.target.value };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-full text-sm bg-white px-2 py-1.5 border rounded-md"
                                                        placeholder="Ex: NR-10, Contrato..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Código</label>
                                                    <input
                                                        type="text"
                                                        value={cert.code || ''}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], code: e.target.value };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-full text-sm bg-white px-2 py-1.5 border rounded-md"
                                                        placeholder="Opcional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Vencimento</label>
                                                    <input
                                                        type="date"
                                                        value={cert.expiresAt ? cert.expiresAt.split('T')[0] : ''}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], expiresAt: e.target.value };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-full text-sm bg-white px-2 py-1.5 border rounded-md"
                                                    />
                                                </div>
                                                <div className="lg:col-span-2">
                                                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Técnico Vinc.</label>
                                                    <select
                                                        value={cert.technicianId || ''}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], technicianId: e.target.value };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-full text-sm bg-white px-2 py-1.5 border rounded-md"
                                                    >
                                                        <option value="">(Nenhum - Genérico)</option>
                                                        {technicians.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 items-center border-t pt-3 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-medium">Alertar antes (dias):</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={cert.alertDays || 30}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], alertDays: parseInt(e.target.value) || 30 };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-16 text-sm bg-white px-2 py-1 border rounded-md"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className="text-xs text-gray-500 font-medium">Emissão:</span>
                                                    <input
                                                        type="date"
                                                        value={cert.issuedAt ? cert.issuedAt.split('T')[0] : ''}
                                                        onChange={(e) => {
                                                            const newCerts = [...(formData.certifications || [])];
                                                            newCerts[index] = { ...newCerts[index], issuedAt: e.target.value };
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="w-auto text-sm bg-white px-2 py-1 border rounded-md"
                                                    />
                                                </div>
                                                <div className="ml-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newCerts = (formData.certifications || []).filter((_, i) => i !== index);
                                                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                                                        }}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                                                    >
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: CONFIG --- */}
                    {activeTab === 'config' && (
                        <div className="card grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="col-span-12 border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg flex items-center gap-2">
                                    <Settings size={20} className="text-secondary-foreground" />
                                    Configurações Avançadas e Observações
                                </h2>
                            </div>

                            <div className="col-span-12">
                                <label className="label-text">Observações Gerais</label>
                                <textarea name="observations" rows={4} value={formData.observations || ''} onChange={handleChange} className="input h-auto" />
                            </div>

                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Horário de Funcionamento</label>
                                <input name="operatingHours" value={formData.operatingHours || ''} onChange={handleChange} className="input" placeholder="Ex: Seg-Sex 08:00 às 18:00" />
                            </div>
                            <div className="col-span-12 sm:col-span-6">
                                <label className="label-text">Notificações</label>
                                <input name="notificationSettings" value={formData.notificationSettings || ''} onChange={handleChange} className="input" placeholder="Configuração JSON ou texto" disabled />
                                <span className="text-[10px] text-muted-foreground">Configuração detalhada em desenvolvimento</span>
                            </div>
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
