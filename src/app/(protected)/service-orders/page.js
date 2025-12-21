import Link from 'next/link';
import { Plus, Search, User, Calendar, AlertCircle, Microscope, MapPin, LayoutGrid } from 'lucide-react';
import { getServiceOrders } from '@/actions/service-orders';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS } from '@/utils/status-machine';
import AdvancedFilters from '@/components/service-orders/AdvancedFilters';

export default async function ServiceOrdersPage({ searchParams }) {
    const params = await searchParams;
    const {
        query = '',
        page = 1,
        status = '',
        clientId = '',
        technicianId = '',
        priority = '',
        type = '',
        maintenanceArea = '',
        dateFrom = '',
        dateTo = '',
        location = '' // INTERNAL or EXTERNAL
    } = params;

    const { serviceOrders, totalPages } = await getServiceOrders({
        query,
        page: Number(page),
        status: status || null,
        clientId: clientId || null,
        technicianId: technicianId || null,
        priority: priority || null,
        type: type || null,
        maintenanceArea: maintenanceArea || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        serviceLocation: location || null,
    });

    const getStatusColor = (st) => {
        switch (st) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'FINISHED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CANCELED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'URGENT': return 'text-red-600 font-bold';
            case 'HIGH': return 'text-orange-600 font-medium';
            default: return 'text-gray-600';
        }
    };

    const tabClass = (active) => `flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${active ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
                    <p className="text-muted text-sm">Gerencie atendimentos e serviços técnicos</p>
                </div>
                <Link href="/service-orders/new" className="btn btn-primary">
                    <Plus size={18} />
                    Nova OS
                </Link>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <Link href="/service-orders" className={tabClass(!location)}>
                    <LayoutGrid size={18} /> Todas as OS
                </Link>
                <Link href="/service-orders?location=INTERNAL" className={tabClass(location === 'INTERNAL')}>
                    <Microscope size={18} /> Laboratório (Interno)
                </Link>
                <Link href="/service-orders?location=EXTERNAL" className={tabClass(location === 'EXTERNAL')}>
                    <MapPin size={18} /> Assistência (Externo)
                </Link>
            </div>

            <div className="bg-white rounded-xl rounded-t-none shadow-sm border border-border p-4 flex flex-col gap-4">
                {/* Search & Filter */}
                <form className="flex flex-col md:flex-row gap-2" action="/service-orders" method="get">
                    <div className="flex-1 relative">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar OS, Cliente, Equipamento ou Série..."
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Hidden fields to preserve state */}
                    {location && <input type="hidden" name="location" value={location} />}
                    {clientId && <input type="hidden" name="clientId" value={clientId} />}
                    {technicianId && <input type="hidden" name="technicianId" value={technicianId} />}
                    {priority && <input type="hidden" name="priority" value={priority} />}
                    {type && <input type="hidden" name="type" value={type} />}
                    {maintenanceArea && <input type="hidden" name="maintenanceArea" value={maintenanceArea} />}
                    {dateFrom && <input type="hidden" name="dateFrom" value={dateFrom} />}
                    {dateTo && <input type="hidden" name="dateTo" value={dateTo} />}

                    <select name="status" defaultValue={status} className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Todos Status</option>
                        {Object.entries(SERVICE_ORDER_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>

                    <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
                        <Search size={16} />
                        Buscar
                    </button>

                    <div className="flex items-center">
                        <AdvancedFilters
                            initialFilters={{
                                status,
                                clientId,
                                technicianId,
                                priority,
                                type,
                                maintenanceArea,
                                dateFrom,
                                dateTo,
                            }}
                        />
                    </div>
                </form>

                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm border-collapse">
                        <thead>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">OS</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Prio</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Cliente</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Equipamento</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Série</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Local</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider whitespace-nowrap">Técnico Resp.</th>
                                <th className="h-12 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Data</th>
                                <th className="h-12 px-4 text-right align-middle font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0 font-medium">
                            {serviceOrders.map((os) => (
                                <tr key={os.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-4 align-middle">
                                        <span className="font-mono font-bold text-gray-900">{os.code}</span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className={`text-[11px] px-2 py-0.5 rounded border whitespace-nowrap font-bold ${getStatusColor(os.status)}`}>
                                            {SERVICE_ORDER_STATUS[os.status] || os.status}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold ${getPriorityColor(os.priority)}`}>
                                            <AlertCircle size={10} />
                                            {PRIORITY_OPTIONS[os.priority] || os.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="text-gray-900 line-clamp-1 max-w-[150px]" title={os.client.name}>
                                            {os.client.name}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {os.equipment ? (
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 leading-none font-bold font-mono text-[11px] uppercase">{os.equipment.partNumber || '-'}</span>
                                                <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px] font-medium uppercase italic">{os.equipment.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle font-mono text-[11px] text-gray-600">
                                        {os.equipment?.serialNumber || '-'}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1.5">
                                            {os.serviceLocation === 'EXTERNAL' ? (
                                                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-[10px] font-bold uppercase">
                                                    <MapPin size={12} /> Campo
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px] font-bold uppercase">
                                                    <Microscope size={12} /> Lab
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {os.technician ? (
                                            <div className="flex items-center gap-1 text-xs text-gray-700">
                                                <User size={12} className="text-muted-foreground" />
                                                <span className="whitespace-nowrap">{os.technician.name.split(' ')[0]}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic">Pendente</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                                            <Calendar size={12} />
                                            {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <Link href={`/service-orders/${os.id}`} className="btn btn-ghost hover:bg-slate-100 p-2 h-auto text-primary text-xs font-bold uppercase tracking-tight">
                                            Gerenciar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {serviceOrders.length === 0 && (
                                <tr>
                                    <td colSpan="10" className="text-center p-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <LayoutGrid size={32} className="opacity-20" />
                                            <p>Nenhuma Ordem de Serviço encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 pt-4 border-t border-gray-100">
                    {page > 1 && (
                        <Link
                            href={`/service-orders?${new URLSearchParams({
                                ...(query && { query }),
                                ...(status && { status }),
                                ...(clientId && { clientId }),
                                ...(technicianId && { technicianId }),
                                ...(priority && { priority }),
                                ...(type && { type }),
                                ...(maintenanceArea && { maintenanceArea }),
                                ...(dateFrom && { dateFrom }),
                                ...(dateTo && { dateTo }),
                                ...(location && { location }),
                                page: String(page - 1),
                            }).toString()}`}
                            className="btn btn-outline btn-sm"
                        >
                            Anterior
                        </Link>
                    )}
                    {(page > 1 || page < totalPages) && (
                        <span className="text-xs font-bold text-gray-500 px-4">
                            PÁGINA {page} DE {totalPages || 1}
                        </span>
                    )}
                    {page < totalPages && (
                        <Link
                            href={`/service-orders?${new URLSearchParams({
                                ...(query && { query }),
                                ...(status && { status }),
                                ...(clientId && { clientId }),
                                ...(technicianId && { technicianId }),
                                ...(priority && { priority }),
                                ...(type && { type }),
                                ...(maintenanceArea && { maintenanceArea }),
                                ...(dateFrom && { dateFrom }),
                                ...(dateTo && { dateTo }),
                                ...(location && { location }),
                                page: String(Number(page) + 1),
                            }).toString()}`}
                            className="btn btn-outline btn-sm"
                        >
                            Próxima
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
