
import Link from 'next/link';
import { Plus, Search, User, Calendar, AlertCircle, Microscope, MapPin, LayoutGrid, Settings, Activity } from 'lucide-react';
import { getServiceOrders } from '@/actions/service-orders';
import { SERVICE_ORDER_STATUS, PRIORITY_OPTIONS, getPublicStatus } from '@/utils/status-machine';
import { auth } from '@/auth';
import AdvancedFilters from '@/components/service-orders/AdvancedFilters';
import { getServiceOrderSummary } from '@/utils/service-order-summary';

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

    // Fetch session for role-based status
    const session = await auth();
    const currentUser = session?.user;

    // Define status groups
    const ARCHIVED_STATUSES = ['DISPATCHED', 'SCRAPPED', 'ABANDONED', 'WARRANTY_RETURN', 'CANCELED'];
    const ACTIVE_STATUSES = Object.keys(SERVICE_ORDER_STATUS).filter(s => !ARCHIVED_STATUSES.includes(s));

    // Conditional Fetching
    let activeOrdersData = { serviceOrders: [], totalPages: 0 };
    let archivedOrdersData = { serviceOrders: [], totalPages: 0 };
    let isSplitView = !status;

    if (isSplitView) {
        // Fetch separate lists
        [activeOrdersData, archivedOrdersData] = await Promise.all([
            getServiceOrders({
                query, page: Number(page), status: ACTIVE_STATUSES,
                clientId: clientId || null, technicianId: technicianId || null,
                priority: priority || null, type: type || null,
                maintenanceArea: maintenanceArea || null, dateFrom: dateFrom || null,
                dateTo: dateTo || null, serviceLocation: location || null,
            }),
            getServiceOrders({
                query, page: Number(page), status: ARCHIVED_STATUSES,
                clientId: clientId || null, technicianId: technicianId || null,
                priority: priority || null, type: type || null,
                maintenanceArea: maintenanceArea || null, dateFrom: dateFrom || null,
                dateTo: dateTo || null, serviceLocation: location || null,
            })
        ]);
    } else {
        // Fetch single list based on filter
        activeOrdersData = await getServiceOrders({
            query, page: Number(page), status: status,
            clientId: clientId || null, technicianId: technicianId || null,
            priority: priority || null, type: type || null,
            maintenanceArea: maintenanceArea || null, dateFrom: dateFrom || null,
            dateTo: dateTo || null, serviceLocation: location || null,
        });
    }

    const tabClass = (active) => `flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${active ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
                    <p className="text-muted text-sm">Gerencie atendimentos e serviços técnicos</p>
                </div>
                {['ADMIN', 'BACKOFFICE'].includes(currentUser?.role) && (
                    <Link href="/service-orders/new" className="btn btn-primary">
                        <Plus size={18} />
                        Nova OS
                    </Link>
                )}
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

                <div className="space-y-8">
                    {/* Active Orders Section */}
                    <div className="space-y-4">
                        {isSplitView && <h3 className="font-bold text-gray-700 flex items-center gap-2"><Activity size={18} className="text-blue-600" /> Ordens Ativas (Em Andamento)</h3>}
                        <OrdersTable orders={activeOrdersData.serviceOrders} page={page} totalPages={activeOrdersData.totalPages} query={query} filters={{ status, clientId, technicianId, priority, type, maintenanceArea, dateFrom, dateTo, location }} isArchived={false} />
                    </div>

                    {/* Archived Orders Section (Only if split view and data exists) */}
                    {isSplitView && archivedOrdersData.serviceOrders.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase text-xs tracking-wider"><AlertCircle size={14} /> Histórico / Finalizadas</h3>
                            <OrdersTable orders={archivedOrdersData.serviceOrders} page={page} totalPages={archivedOrdersData.totalPages} query={query} filters={{ status, clientId, technicianId, priority, type, maintenanceArea, dateFrom, dateTo, location }} isArchived={true} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrdersTable({ orders, page, totalPages, query, filters, isArchived }) {
    if (orders.length === 0) {
        return (
            <div className="text-center p-12 text-muted-foreground border border-dashed rounded-lg bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <LayoutGrid size={32} className="opacity-20" />
                    <p>Nenhuma Ordem de Serviço encontrada.</p>
                </div>
            </div>
        );
    }

    // Helper to render status badge (Local to component scope or pass props? Easier to redefine slightly or keep logic simple)
    const StatusBadge = ({ os, role }) => {
        const { label, color } = getPublicStatus(os, role);
        return (
            <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-tight block w-fit ${color}`}>
                {label}
            </span>
        );
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'URGENT': return 'text-red-700 font-bold bg-red-50 border-red-100';
            case 'HIGH': return 'text-orange-700 font-old bg-orange-50 border-orange-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const formatPriority = (p) => {
        if (!p) return '-';
        if (p === 'URGENT') return 'Urgente';
        if (p === 'HIGH') return 'Alta';
        if (p === 'NORMAL') return 'Normal';
        if (p === 'LOW') return 'Baixa';
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    };

    return (
        <div>
            <div className={`w-full overflow-auto rounded-lg border ${isArchived ? 'border-gray-100 opacity-80' : 'border-gray-200'}`}>
                <table className="w-full caption-bottom text-sm border-collapse">
                    <thead className={isArchived ? 'bg-gray-50/50' : 'bg-gray-50'}>
                        <tr className="border-b transition-colors">
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[100px]">OS</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider min-w-[140px]">Status Técnico</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider min-w-[140px]">Status Comercial</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider w-[90px]">Prio</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider min-w-[150px]">Cliente</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider min-w-[150px]">Equipamento</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider hidden xl:table-cell">Série</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider hidden lg:table-cell">Local</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider whitespace-nowrap hidden 2xl:table-cell">Técnico</th>
                            <th className="h-10 px-4 text-left align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider hidden lg:table-cell">Data</th>
                            <th className="h-10 px-4 text-right align-middle font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0 font-medium bg-white">
                        {orders.map((os) => {
                            const summary = isArchived ? getServiceOrderSummary(os) : null;
                            return (
                                <tr key={os.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-3 align-middle">
                                        <span className="font-mono font-bold text-gray-900 whitespace-nowrap">{os.code}</span>
                                    </td>
                                    <td className="p-3 align-middle">
                                        <StatusBadge os={os} role="TECH" />
                                    </td>
                                    <td className="p-3 align-middle">
                                        <StatusBadge os={os} role="BACKOFFICE" />
                                    </td>
                                    {isArchived && (
                                        <td className="p-3 align-middle text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold uppercase tracking-tight inline-block ${summary?.bgColor || 'bg-gray-50 border-gray-200'} ${summary?.color || 'text-gray-500'}`}>
                                                {summary?.label || 'Indefinido'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-3 align-middle">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(os.priority)} `}>
                                            <AlertCircle size={10} />
                                            {formatPriority(os.priority)}
                                        </span>
                                    </td>
                                <td className="p-3 align-middle">
                                    <span className="text-gray-900 line-clamp-1 max-w-[150px]" title={os.client.name}>
                                        {os.client.name}
                                    </span>
                                </td>
                                <td className="p-3 align-middle">
                                    {os.equipment ? (
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 leading-none font-bold font-mono text-[11px] uppercase">{os.equipment.partNumber || '-'}</span>
                                            <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px] font-medium uppercase italic">{os.equipment.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">-</span>
                                    )}
                                </td>
                                <td className="p-3 align-middle hidden xl:table-cell font-mono text-[11px] text-gray-600">
                                    {os.equipment?.serialNumber || '-'}
                                </td>
                                <td className="p-3 align-middle hidden lg:table-cell">
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
                                <td className="p-3 align-middle hidden 2xl:table-cell">
                                    {os.technician ? (
                                        <div className="flex items-center gap-1 text-xs text-gray-700">
                                            <User size={12} className="text-muted-foreground" />
                                            <span className="whitespace-nowrap">{os.technician.name.split(' ')[0]}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">Pendente</span>
                                    )}
                                </td>
                                <td className="p-3 align-middle hidden lg:table-cell">
                                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                                        <Calendar size={12} />
                                        {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </td>
                                <td className="p-3 align-middle text-right">
                                    <Link href={`/service-orders/${os.id}`} className="btn btn-ghost hover:bg-slate-100 btn-sm btn-circle text-primary">
                                        <Settings size={18} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Wait, reusing pagination URL logic for split view implies managing two paginations? Complex. 
             Ideally split view page controls MAIN pagination (Active). Archived might just show latest 10 or have its own page param?
             For simplicity, reusing generic pagination for the table passed. But multiple tables with SAME page param will paginate both?
             That's acceptable for now or only paginate Active.
             Let's paginate both with same page param for now, assuming user looks at page 2 of both lists.
            */}
            <div className="flex justify-end items-center gap-2 pt-4">
                {page > 1 && (
                    <Link
                        href={`/service-orders?${new URLSearchParams({
                            ...filters,
                            ...(query && { query }),
                            page: String(Number(page) - 1),
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
                            ...filters,
                            ...(query && { query }),
                            page: String(Number(page) + 1),
                        }).toString()}`}
                        className="btn btn-outline btn-sm"
                    >
                        Próxima
                    </Link>
                )}
            </div>
        </div>
    );
}
