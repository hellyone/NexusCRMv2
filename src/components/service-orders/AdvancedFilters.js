'use client';

import { useState } from 'react';
import { Filter, X, Calendar, User, AlertCircle, Wrench } from 'lucide-react';
import { getClientsForSelect } from '@/actions/clients';
import { getTechniciansForSelect } from '@/actions/technicians';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS, MAINTENANCE_AREAS } from '@/utils/status-machine';

const SERVICE_TYPES = {
    CORRECTIVE: 'Manutenção Corretiva',
    PREVENTIVE: 'Manutenção Preventiva',
    INSTALLATION: 'Instalação',
    CALIBRATION: 'Calibração',
};

export default function AdvancedFilters({ initialFilters = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: initialFilters.status || '',
        clientId: initialFilters.clientId || '',
        technicianId: initialFilters.technicianId || '',
        priority: initialFilters.priority || '',
        type: initialFilters.type || '',
        maintenanceArea: initialFilters.maintenanceArea || '',
        dateFrom: initialFilters.dateFrom || '',
        dateTo: initialFilters.dateTo || '',
    });
    const [clients, setClients] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const [clientsData, techniciansData] = await Promise.all([
                getClientsForSelect(),
                getTechniciansForSelect(),
            ]);
            setClients(clientsData);
            setTechnicians(techniciansData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        loadData();
    };

    const handleChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        // onApply(filters); // Removed prop call
        // Internal navigation logic
        const params = new URLSearchParams(window.location.search);

        // Update query params based on filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // Force reset page to 1 on filter change
        if (params.has('page')) params.set('page', '1');

        window.location.href = `/service-orders?${params.toString()}`;
        setIsOpen(false);
    };

    const handleReset = () => {
        const emptyFilters = {
            status: '',
            clientId: '',
            technicianId: '',
            priority: '',
            type: '',
            maintenanceArea: '',
            dateFrom: '',
            dateTo: '',
        };
        setFilters(emptyFilters);
        setFilters(emptyFilters);
        // Reset navigation
        window.location.href = '/service-orders';
        setIsOpen(false);
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className={`btn btn-outline ${hasActiveFilters ? 'btn-primary' : ''}`}
            >
                <Filter size={16} />
                Filtros Avançados
                {hasActiveFilters && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {Object.values(filters).filter(v => v !== '').length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Filter size={20} />
                                Filtros Avançados
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost p-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status e Prioridade */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        Status
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.status}
                                        onChange={(e) => handleChange('status', e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {Object.entries(SERVICE_ORDER_STATUS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        Prioridade
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {Object.entries(PRIORITY_OPTIONS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cliente e Técnico */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <User size={14} />
                                        Cliente
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.clientId}
                                        onChange={(e) => handleChange('clientId', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">Todos</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label flex items-center gap-2">
                                        <User size={14} />
                                        Técnico
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.technicianId}
                                        onChange={(e) => handleChange('technicianId', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="">Todos</option>
                                        {technicians.map(tech => (
                                            <option key={tech.id} value={tech.id}>{tech.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tipo e Área */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <Wrench size={14} />
                                        Tipo de Serviço
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {Object.entries(SERVICE_TYPES).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label flex items-center gap-2">
                                        <Wrench size={14} />
                                        Área de Manutenção
                                    </label>
                                    <select
                                        className="input"
                                        value={filters.maintenanceArea}
                                        onChange={(e) => handleChange('maintenanceArea', e.target.value)}
                                    >
                                        <option value="">Todas</option>
                                        {Object.entries(MAINTENANCE_AREAS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Período */}
                            <div>
                                <label className="label flex items-center gap-2">
                                    <Calendar size={14} />
                                    Período
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-muted mb-1 block">De</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={filters.dateFrom}
                                            onChange={(e) => handleChange('dateFrom', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted mb-1 block">Até</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={filters.dateTo}
                                            onChange={(e) => handleChange('dateTo', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-2">
                            <button type="button" onClick={handleReset} className="btn btn-ghost">
                                Limpar Filtros
                            </button>
                            <button type="button" onClick={handleApply} className="btn btn-primary">
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

