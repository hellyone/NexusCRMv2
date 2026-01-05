'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceOrder } from '@/actions/service-orders';
import { getClientsForSelect } from '@/actions/clients';
import { getProductByPartNumber, getProductSuggestions } from '@/actions/product-catalog';
import { getEquipmentHistory } from '@/actions/equipments';
import { Save, X, Search, FileText, Receipt, Microscope, MapPin, Map, Loader2, AlertTriangle, Info, History, CheckCircle2, ExternalLink } from 'lucide-react';
import { PRIORITY_OPTIONS, SERVICE_LOCATIONS, MAINTENANCE_AREAS } from '@/utils/status-machine';



export default function ServiceOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Dropdown Data
    const [clients, setClients] = useState([]);
    const [searchingProduct, setSearchingProduct] = useState(false);
    const [productFound, setProductFound] = useState(false);
    const [partNumberError, setPartNumberError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);

    // Tracking & Warranty State
    const [warrantyInfo, setWarrantyInfo] = useState(null);
    const [activeOS, setActiveOS] = useState(null);
    const [checkingHistory, setCheckingHistory] = useState(false);
    const [historyConflict, setHistoryConflict] = useState(null);
    const [clientConflict, setClientConflict] = useState(null); // Novo: conflito de cliente
    const [useClientAddress, setUseClientAddress] = useState(true);
    const [fetchingCep, setFetchingCep] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        clientId: '',
        equipmentId: '',
        technicianId: '',
        priority: 'NORMAL',
        type: 'CORRECTIVE',
        origin: 'PHONE',
        serviceLocation: 'INTERNAL',
        maintenanceArea: '',
        reportedDefect: '',
        internalNotes: '',
        requesterName: '',
        scheduledAt: '',
        // Dynamic Equipment Fields
        partNumber: '',
        equipmentName: '',
        equipmentBrand: '',
        equipmentModel: '',
        equipmentSerialNumber: '',
        // Conditional Fields
        accessories: '',
        serviceAddress: '',
        serviceZipCode: '',
        serviceStreet: '',
        serviceNumber: '',
        serviceComplement: '',
        serviceNeighborhood: '',
        serviceCity: '',
        serviceState: '',
        serviceReference: '',
        externalEquipmentDescription: '',
        entryInvoiceNumber: ''
    });

    useEffect(() => {
        // Load initial data
        const loadInit = async () => {
            const cls = await getClientsForSelect();
            setClients(cls);
        };
        loadInit();
    }, []);



    const handleChange = async (e) => {
        let { name, value } = e.target;

        if (name === 'partNumber' || name === 'equipmentSerialNumber') {
            value = value.toUpperCase();
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear global error on any change to re-enable the button

        if (name === 'partNumber') {
            setPartNumberError('');
            setProductFound(false); // Reset when typing
            if (value.length > 0) {
                const results = await getProductSuggestions(value);
                setSuggestions(results);
                setShowSuggestions(true);
                setSuggestionIndex(-1);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
                // Clear equipment fields when Part Number is empty
                setFormData(prev => ({
                    ...prev,
                    equipmentName: '',
                    equipmentBrand: '',
                    equipmentModel: '',
                }));
            }
        }

        if (name === 'equipmentSerialNumber') {
            setWarrantyInfo(null);
            setActiveOS(null);
            setHistoryConflict(null);
            setPartNumberError('');
            setProductFound(false);
            setFormData(prev => ({
                ...prev,
                partNumber: '',
                equipmentName: '',
                equipmentBrand: '',
                equipmentModel: '',
            }));
        }
    };

    const handleSelectSuggestion = (product) => {
        setFormData(prev => ({
            ...prev,
            partNumber: product.partNumber,
            equipmentName: product.name,
            equipmentBrand: product.brand || '',
            equipmentModel: product.model || '',
        }));
        setProductFound(true);
        setShowSuggestions(false);
        setSuggestions([]);
        setPartNumberError('');
    };

    const handlePartNumberLookup = async (e) => {
        const pn = e.target.value;
        if (!pn) {
            setProductFound(false);
            return;
        }

        setSearchingProduct(true);
        const product = await getProductByPartNumber(pn);

        if (product) {
            setFormData(prev => ({
                ...prev,
                equipmentName: product.name,
                equipmentBrand: product.brand || '',
                equipmentModel: product.model || '',
            }));
            setProductFound(true);
        } else {
            setProductFound(false);
            setPartNumberError('Part Number não encontrado. Verifique ou cadastre em Configurações.');
        }
        setSearchingProduct(false);
    };

    const handleSerialBlur = async () => {
        const serial = formData.equipmentSerialNumber;
        const clientId = formData.clientId;

        if (!serial) {
            setWarrantyInfo(null);
            setHistoryConflict(null);
            setActiveOS(null);
            return;
        }

        setCheckingHistory(true);
        const history = await getEquipmentHistory(serial, clientId);
        setCheckingHistory(false);

        if (history) {
            const { equipment, warrantyStatus, activeOS: foundActiveOS } = history;
            setWarrantyInfo(warrantyStatus);
            setActiveOS(foundActiveOS);

            // Check for Client conflict - equipamento pode ter sido vendido para outro cliente
            if (equipment.client && formData.clientId) {
                const equipmentClientId = String(equipment.client.id);
                const formClientId = String(formData.clientId);
                
                if (equipmentClientId !== formClientId) {
                    // Cliente diferente - mostrar aviso
                    setClientConflict({
                        equipmentClientId: equipment.client.id,
                        equipmentClientName: equipment.client.name,
                        formClientId: formData.clientId,
                        equipmentName: equipment.name,
                        brand: equipment.brand,
                        model: equipment.model
                    });
                } else {
                    setClientConflict(null);
                }
            } else if (equipment.client && !formData.clientId) {
                // Equipamento encontrado mas cliente não foi selecionado - sugerir cliente
                setClientConflict({
                    equipmentClientId: equipment.client.id,
                    equipmentClientName: equipment.client.name,
                    formClientId: null,
                    equipmentName: equipment.name,
                    brand: equipment.brand,
                    model: equipment.model,
                    suggestClient: true
                });
            } else {
                setClientConflict(null);
            }

            // Check for Part Number conflict
            if (formData.partNumber && equipment.partNumber && formData.partNumber !== equipment.partNumber) {
                setHistoryConflict({
                    currentPN: formData.partNumber,
                    historicalPN: equipment.partNumber,
                    equipmentName: equipment.name,
                    brand: equipment.brand,
                    model: equipment.model
                });
            } else {
                setHistoryConflict(null);
                // Pre-fill if current PN is empty
                if (!formData.partNumber && equipment.partNumber) {
                    setFormData(prev => ({
                        ...prev,
                        partNumber: equipment.partNumber,
                        equipmentName: equipment.name,
                        equipmentBrand: equipment.brand || '',
                        equipmentModel: equipment.model || '',
                    }));
                    setProductFound(true);
                    setPartNumberError('');
                }
            }
        } else {
            setWarrantyInfo(null);
            setHistoryConflict(null);
            setClientConflict(null);
        }
    };

    const handleCepBlur = async (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setFetchingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    serviceStreet: data.logradouro,
                    serviceNeighborhood: data.bairro,
                    serviceCity: data.localidade,
                    serviceState: data.uf
                }));
            }
        } catch (err) {
            console.error('Erro ao buscar CEP:', err);
        } finally {
            setFetchingCep(false);
        }
    };

    const handleAcceptHistoricalPN = () => {
        if (historyConflict) {
            setFormData(prev => ({
                ...prev,
                partNumber: historyConflict.historicalPN,
                equipmentName: historyConflict.equipmentName,
                equipmentBrand: historyConflict.brand || '',
                equipmentModel: historyConflict.model || '',
            }));
            setProductFound(true);
            setPartNumberError('');
            setHistoryConflict(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeOS) {
            alert(`Aviso: Este equipamento já possui uma Ordem de Serviço aberta (${activeOS.code}). Não é possível criar outra.`);
            return;
        }

        setLoading(true);
        setError('');

        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));

        const result = await createServiceOrder(payload);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            // Redirect to the Management Page of the new OS
            // createSuccessResponse wraps data in a 'data' property
            router.push(`/service-orders/${result.data.id}`);
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState('identification');

    // Effect to clear equipment data when switching to EXTERNAL
    // Placed after activeTab state declaration to avoid ReferenceError
    useEffect(() => {
        if (formData.serviceLocation === 'EXTERNAL') {
            setWarrantyInfo(null);
            setActiveOS(null);
            setHistoryConflict(null);
            setPartNumberError('');
            setProductFound(false);
            setFormData(prev => ({
                ...prev,
                partNumber: '',
                equipmentName: '',
                equipmentBrand: '',
                equipmentModel: '',
                equipmentSerialNumber: '',
                maintenanceArea: 'TECHNICAL_ASSISTANCE' // Auto-assign for External
            }));

            // Force tab away from fiscal if it was active
            if (activeTab === 'fiscal') {
                setActiveTab('identification');
            }
        }
    }, [formData.serviceLocation, activeTab]);

    const tabs = [
        { id: 'identification', label: 'Identificação', icon: Search },
        { id: 'details', label: 'Solicitação', icon: FileText }, // Using FileText for better fit
        { id: 'fiscal', label: 'Fiscal', icon: Receipt }, // Using Receipt for better fit
    ];

    // ... existing handlers ...

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => router.back()} className="btn btn-ghost p-2">
                        <X size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
                        <p className="text-sm text-gray-600 font-medium">Abertura de atendimento</p>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary min-w-[120px]" disabled={loading || !!error}>
                    <Save size={18} className="mr-2" />
                    {loading ? 'Criando...' : 'Criar OS'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Sidebar / Tabs */}
                <div className="md:col-span-1 flex flex-col gap-1 bg-white p-2 rounded-xl border border-border sticky top-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab('identification')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${activeTab === 'identification' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Search size={18} /> Identificação
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${activeTab === 'details' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FileText size={18} /> Solicitação
                    </button>
                    {formData.serviceLocation === 'INTERNAL' && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('fiscal')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${activeTab === 'fiscal' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Receipt size={18} /> Dados Fiscais
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="md:col-span-3 space-y-4">

                    {/* TAB: IDENTIFICATION */}
                    {activeTab === 'identification' && (
                        <div className="card space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg text-gray-800">Tipo de Atendimento e Cliente</h2>
                            </div>

                            {/* Service Type Selection - Professional Feel */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, serviceLocation: 'INTERNAL' }))}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.serviceLocation === 'INTERNAL' ? 'border-primary bg-blue-50 text-primary shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                >
                                    <Microscope size={32} />
                                    <div className="text-center">
                                        <div className="font-bold text-sm">Laboratório</div>
                                        <div className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Interno / Oficina</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, serviceLocation: 'EXTERNAL' }))}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.serviceLocation === 'EXTERNAL' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                >
                                    <MapPin size={32} />
                                    <div className="text-center">
                                        <div className="font-bold text-sm">Assistência Técnica</div>
                                        <div className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Externo / Campo</div>
                                    </div>
                                </button>
                            </div>

                            <div className="form-group border-t pt-4">
                                <label className="label font-bold text-gray-800">Cliente <span className="text-red-500">*</span></label>
                                <select name="clientId" value={formData.clientId} onChange={handleChange} className="input font-medium text-gray-900 border-gray-300 focus:border-primary" required>
                                    <option value="">Selecione o Cliente...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Conditional Address Handling for External */}
                            {formData.serviceLocation === 'EXTERNAL' && (
                                <div className="space-y-4 border-t pt-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <label className="label font-bold text-orange-800 flex items-center gap-2">
                                            <Map size={16} /> Local de Atendimento
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={useClientAddress}
                                                onChange={(e) => setUseClientAddress(e.target.checked)}
                                                className="checkbox checkbox-xs checkbox-primary"
                                            />
                                            <span className="text-[10px] font-black text-gray-700 uppercase">Mesmo endereço do cliente</span>
                                        </label>
                                    </div>

                                    {!useClientAddress && (
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-orange-50/30 rounded-xl border border-orange-100 shadow-inner">
                                            <div className="md:col-span-2">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">CEP</label>
                                                <div className="relative">
                                                    <input
                                                        name="serviceZipCode"
                                                        value={formData.serviceZipCode}
                                                        onChange={handleChange}
                                                        onBlur={handleCepBlur}
                                                        className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                        placeholder="00000-000"
                                                    />
                                                    {fetchingCep && <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-orange-500" />}
                                                </div>
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">Rua / Logradouro</label>
                                                <input
                                                    name="serviceStreet"
                                                    value={formData.serviceStreet}
                                                    onChange={handleChange}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">Nº</label>
                                                <input
                                                    name="serviceNumber"
                                                    value={formData.serviceNumber}
                                                    onChange={handleChange}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">Bairro</label>
                                                <input
                                                    name="serviceNeighborhood"
                                                    value={formData.serviceNeighborhood}
                                                    onChange={handleChange}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">Cidade</label>
                                                <input
                                                    name="serviceCity"
                                                    value={formData.serviceCity}
                                                    onChange={handleChange}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">UF</label>
                                                <input
                                                    name="serviceState"
                                                    value={formData.serviceState}
                                                    onChange={handleChange}
                                                    maxLength={2}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold uppercase"
                                                />
                                            </div>
                                            <div className="md:col-span-full">
                                                <label className="label text-[10px] font-black uppercase text-orange-700 p-0 mb-1">Referência / Complemento</label>
                                                <input
                                                    name="serviceReference"
                                                    value={formData.serviceReference}
                                                    onChange={handleChange}
                                                    className="input input-sm border-orange-200 focus:border-orange-500 font-bold"
                                                    placeholder="Ex: Próximo à portaria 2..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                                <h4 className="text-sm font-bold text-blue-900 mb-3 uppercase flex items-center gap-2 border-b pb-2">
                                    {formData.serviceLocation === 'INTERNAL' ? 'Identificação do Equipamento (Laboratório)' : 'Máquina / Equipamento para Assistência'}
                                </h4>

                                {formData.serviceLocation === 'INTERNAL' ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="form-group col-span-full">
                                            <label className="label text-sm font-bold text-gray-800 flex justify-between">
                                                <span>Número de Série (Obrigatório) <span className="text-red-500">*</span></span>
                                                {checkingHistory && <Loader2 size={14} className="animate-spin text-primary" />}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    name="equipmentSerialNumber"
                                                    value={formData.equipmentSerialNumber || ''}
                                                    onChange={handleChange}
                                                    onBlur={handleSerialBlur}
                                                    className={`input text-sm font-bold border-gray-300 ${activeOS ? 'ring-2 ring-red-600 border-red-600 bg-red-50/50' : warrantyInfo?.inWarranty ? 'ring-2 ring-red-500 border-red-500' : ''}`}
                                                    placeholder="Digite o Serial..."
                                                    required={formData.serviceLocation === 'INTERNAL'}
                                                />
                                                {warrantyInfo?.inWarranty && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
                                                        <AlertTriangle size={18} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Warranty, activeOS & Conflict Alerts (Positioned near Serial) */}
                                        <div className="col-span-full space-y-3 mt-2">
                                            {activeOS && (
                                                <div className="bg-red-600 border-l-4 border-red-900 p-4 rounded shadow-md animate-in slide-in-from-top-2 text-white">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="text-white mt-0.5" size={20} />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black uppercase leading-none mb-1">Bloqueio: Ordem de Serviço em Aberto</h4>
                                                            <p className="text-xs font-medium opacity-90">
                                                                Este equipamento já possui a OS <b>#{activeOS.code}</b> com status <b>{activeOS.status}</b>.
                                                                Por regras do sistema, não é permitido múltiplas OS ativas para o mesmo Serial.
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open(`/service-orders/${activeOS.id}`, '_blank')}
                                                                    className="text-[10px] bg-white text-red-600 px-2 py-1 rounded font-bold uppercase hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm"
                                                                >
                                                                    <ExternalLink size={12} /> Ver OS Ativa
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {warrantyInfo?.inWarranty && !activeOS && (
                                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm animate-in slide-in-from-top-2">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-red-800 uppercase leading-none mb-1">Equipamento em Garantia!</h4>
                                                            <p className="text-xs text-red-700 font-medium">
                                                                Este item foi entregue em <b>{new Date(warrantyInfo.lastOS.finishedAt || warrantyInfo.lastOS.updatedAt).toLocaleDateString()}</b>.
                                                                Restam <b>{warrantyInfo.remainingDays} dias</b> de garantia.
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open(`/service-orders/${warrantyInfo.lastOS.id}`, '_blank')}
                                                                    className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold uppercase hover:bg-red-700 transition-colors flex items-center gap-1"
                                                                >
                                                                    <History size={12} /> Ver OS Anterior (#{warrantyInfo.lastOS.code})
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {historyConflict && (
                                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm animate-in slide-in-from-top-2">
                                                    <div className="flex items-start gap-3">
                                                        <Info className="text-amber-600 mt-0.5" size={20} />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-amber-800 uppercase leading-none mb-1">Conflito de Identificação</h4>
                                                            <p className="text-xs text-amber-700 font-medium">
                                                                Este Serial pertence ao Part Number <b>{historyConflict.historicalPN}</b> no histórico, mas você selecionou <b>{historyConflict.currentPN}</b>.
                                                            </p>
                                                            <div className="mt-3 flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAcceptHistoricalPN}
                                                                    className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded font-bold uppercase hover:bg-amber-700 transition-colors"
                                                                >
                                                                    Usar Dados do Histórico
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHistoryConflict(null)}
                                                                    className="text-[10px] border border-amber-300 text-amber-700 px-2 py-1 rounded font-bold uppercase hover:bg-amber-100 transition-colors"
                                                                >
                                                                    Manter Seleção Atual
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-group col-span-full">
                                            <label className="label text-sm font-bold text-gray-800 flex justify-between">
                                                <span>Part Number / Código do Produto <span className="text-red-500">*</span></span>
                                                {searchingProduct && <Loader2 size={14} className="animate-spin text-primary" />}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="partNumber"
                                                    autoComplete="off"
                                                    value={formData.partNumber}
                                                    onChange={handleChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown') {
                                                            setSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                                                            e.preventDefault();
                                                        } else if (e.key === 'ArrowUp') {
                                                            setSuggestionIndex(prev => Math.max(prev - 1, 0));
                                                            e.preventDefault();
                                                        } else if (e.key === 'Enter' && suggestionIndex >= 0) {
                                                            handleSelectSuggestion(suggestions[suggestionIndex]);
                                                            e.preventDefault();
                                                        } else if (e.key === 'Escape') {
                                                            setShowSuggestions(false);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // Delay to allow clicking a suggestion
                                                        setTimeout(() => {
                                                            setShowSuggestions(false);
                                                            // Only lookup if not already found by selection
                                                            if (!productFound && formData.partNumber) {
                                                                handlePartNumberLookup({ target: { value: formData.partNumber } });
                                                            }
                                                        }, 200);
                                                    }}
                                                    className={`input text-sm font-bold border-gray-300 ${productFound ? 'border-green-300 bg-green-50/10' : partNumberError ? 'border-red-300 bg-red-50' : ''}`}
                                                    placeholder="Digite o Part Number..."
                                                    required={formData.serviceLocation === 'INTERNAL'}
                                                />

                                                {/* Autocomplete Suggestions */}
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        {suggestions.map((p, idx) => (
                                                            <div
                                                                key={p.id}
                                                                onMouseDown={(e) => {
                                                                    // Use onMouseDown instead of onClick to beat onBlur
                                                                    e.preventDefault();
                                                                    handleSelectSuggestion(p);
                                                                }}
                                                                className={`p-3 cursor-pointer border-b last:border-0 transition-colors flex flex-col gap-0.5 ${idx === suggestionIndex ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-bold text-sm text-primary font-mono">{p.partNumber}</span>
                                                                    {p.brand && (
                                                                        <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                            {p.brand}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-600 font-medium truncate italic">{p.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {productFound && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-bold uppercase">
                                                        Identificado
                                                    </div>
                                                )}
                                            </div>
                                            {partNumberError && (
                                                <p className="text-xs text-red-600 font-bold mt-1 bg-red-100 p-2 rounded border border-red-200 animate-in slide-in-from-top-1">
                                                    {partNumberError}
                                                </p>
                                            )}
                                            {!partNumberError && (
                                                <p className="text-[10px] text-muted mt-1 uppercase font-bold">Pressione TAB ou clique fora para buscar</p>
                                            )}
                                        </div>

                                        <div className="form-group col-span-full">
                                            <label className="label text-sm font-bold text-gray-800">Equipamento (Nome/Modelo)</label>
                                            <input
                                                type="text"
                                                name="equipmentName"
                                                value={formData.equipmentName || ''}
                                                readOnly={true}
                                                className="input text-sm font-medium bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed select-none"
                                                placeholder="Aguardando Part Number..."
                                                required={formData.serviceLocation === 'INTERNAL'}
                                                tabIndex="-1"
                                            />
                                        </div>

                                        <div className="form-group col-span-full">
                                            <label className="label text-sm font-bold text-gray-800">Marca / Fabricante</label>
                                            <input
                                                type="text"
                                                name="equipmentBrand"
                                                value={formData.equipmentBrand || ''}
                                                readOnly={true}
                                                className="input text-sm font-medium bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed select-none"
                                                placeholder="-"
                                                tabIndex="-1"
                                            />
                                        </div>

                                        {!activeOS && !warrantyInfo?.inWarranty && warrantyInfo?.lastOS && (
                                            <div className="col-span-full bg-blue-50/50 border border-blue-100 p-3 rounded flex items-center gap-3 mt-2">
                                                <CheckCircle2 className="text-blue-500" size={16} />
                                                <p className="text-[10px] text-blue-700 font-bold uppercase">
                                                    Equipamento já passou por aqui anteriormente. Garantia expirada há {Math.abs(warrantyInfo.remainingDays)} dias.
                                                </p>
                                            </div>
                                        )}

                                        <div className="form-group col-span-full animate-in slide-in-from-top-2">
                                            <label className="label font-bold text-blue-800 uppercase text-[10px]">Acessórios Inclusos / Observações de Recebimento</label>
                                            <input
                                                name="accessories"
                                                value={formData.accessories}
                                                onChange={handleChange}
                                                className="input border-blue-200"
                                                placeholder="Ex: Cabos, Manuais, Maleta..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in duration-500">
                                        <div className="bg-blue-900/5 border border-blue-900/10 p-4 rounded-xl">
                                            <label className="label text-sm font-black text-blue-900 uppercase flex items-center gap-2">
                                                <Search size={16} /> Identificação da Máquina / Equipamento
                                            </label>
                                            <textarea
                                                name="externalEquipmentDescription"
                                                value={formData.externalEquipmentDescription}
                                                onChange={handleChange}
                                                className="input border-blue-200 min-h-[120px] text-sm font-medium focus:ring-blue-500/20"
                                                placeholder="Ex: Torno CNC Romi G280, Injetora Himmer 150 Ton, Centro de Usinagem Haas VF-2..."
                                                required={formData.serviceLocation === 'EXTERNAL'}
                                            />
                                            <p className="text-[10px] text-blue-700 font-bold uppercase mt-2 opacity-70">
                                                Descreva detalhadamente a máquina ou tipo de equipamento que receberá a assistência.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: DETAILS */}
                    {activeTab === 'details' && (
                        <div className="card space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg text-gray-800">Detalhes da Solicitação</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label">Solicitante (Nome) <span className="text-red-500">*</span></label>
                                    <input
                                        name="requesterName"
                                        value={formData.requesterName}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Nome do Solicitante"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Tipo de Serviço</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="input">
                                        <option value="CORRECTIVE">Manutenção Corretiva</option>
                                        <option value="PREVENTIVE">Manutenção Preventiva</option>
                                        <option value="INSTALLATION">Instalação</option>
                                        <option value="CALIBRATION">Calibração</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="label">Prioridade</label>
                                    <select name="priority" value={formData.priority} onChange={handleChange} className="input">
                                        {Object.entries(PRIORITY_OPTIONS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.serviceLocation === 'INTERNAL' && (
                                    <div className="form-group">
                                        <label className="label">Setor / Área de Atendimento <span className="text-red-500">*</span></label>
                                        <select
                                            name="maintenanceArea"
                                            value={formData.maintenanceArea}
                                            onChange={handleChange}
                                            className="input"
                                            required
                                        >
                                            <option value="">Selecione o Setor...</option>
                                            {Object.entries(MAINTENANCE_AREAS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}



                                <div className="form-group col-span-full">
                                    <label className="label">Relato do Problema / Solicitação <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="reportedDefect"
                                        value={formData.reportedDefect}
                                        onChange={handleChange}
                                        className="input min-h-[100px]"
                                        placeholder="Descreva o problema relatado pelo cliente..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: FISCAL */}
                    {activeTab === 'fiscal' && formData.serviceLocation === 'INTERNAL' && (
                        <div className="card space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="border-b pb-2 mb-2">
                                <h2 className="font-semibold text-lg text-gray-800">Dados Fiscais de Entrada</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label">Número da NF de Remessa / Entrada</label>
                                    <input
                                        type="text"
                                        name="entryInvoiceNumber"
                                        value={formData.entryInvoiceNumber || ''}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Ex: 123456"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form >
    );
}
