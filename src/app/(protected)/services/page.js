import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Clock, CheckSquare } from 'lucide-react';
import { getServices } from '@/actions/services';
import { SERVICE_CATEGORIES } from '@/utils/constants';

export default async function ServicesPage({ searchParams }) {
    const { query = '', page = 1, category = '' } = await searchParams;
    const { services, totalPages } = await getServices({ query, page: Number(page), category });

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatTime = (minutes) => {
        if (!minutes) return '-';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}min`;
        return `${m}min`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo de Serviços</h1>
                    <p className="text-muted text-sm">Gerencie os serviços prestados e tabelas de preços</p>
                </div>
                <Link href="/services/new" className="btn btn-primary">
                    <Plus size={18} />
                    Novo Serviço
                </Link>
            </div>

            <div className="card flex flex-col gap-4">
                {/* Search Bar & Filters */}
                <form className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 relative">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar por nome ou código..."
                            className="input pl-10"
                        />
                        {/* Icon placeholder if needed */}
                    </div>

                    <select name="category" defaultValue={category} className="input w-full md:w-48">
                        <option value="">Todas Categorias</option>
                        {SERVICE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <button type="submit" className="btn btn-outline">
                        <Search size={16} />
                        Filtrar
                    </button>
                </form>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Código/Nome</th>
                                <th>Categoria</th>
                                <th>Preço Base</th>
                                <th>Tempo Est.</th>
                                <th>Checklist?</th>
                                <th>Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{service.name}</span>
                                            {service.code && <span className="text-xs font-mono text-muted">{service.code}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm border px-2 py-1 rounded-full bg-gray-50 text-gray-600">
                                            {service.category || 'Geral'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="font-medium text-emerald-600">
                                            {formatCurrency(service.price)}
                                            {service.priceType === 'HOURLY' && <span className="text-xs text-muted"> /hora</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1 text-sm text-muted">
                                            <Clock size={14} />
                                            {formatTime(service.estimatedMinutes)}
                                        </div>
                                    </td>
                                    <td>
                                        {service.requiresChecklist ? (
                                            <CheckSquare size={16} className="text-blue-500" />
                                        ) : (
                                            <span className="text-muted text-xs">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${service.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {service.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/services/${service.id}/edit`} className="btn btn-ghost p-2" title="Editar">
                                                <Edit size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center p-6 text-muted">
                                        Nenhum serviço encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end gap-2">
                    {/* Simplified Pagination Logic */}
                    {page > 1 && (
                        <Link href={`/services?query=${query}&category=${category}&page=${page - 1}`} className="btn btn-outline">
                            Anterior
                        </Link>
                    )}
                    {(page > 1 || page < totalPages) && (
                        <span className="flex items-center text-sm text-muted px-2">Página {page} de {totalPages || 1}</span>
                    )}
                    {page < totalPages && (
                        <Link href={`/services?query=${query}&category=${category}&page=${page + 1}`} className="btn btn-outline">
                            Próxima
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
