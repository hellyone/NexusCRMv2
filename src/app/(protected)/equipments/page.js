import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Box } from 'lucide-react';
import { getEquipments } from '@/actions/equipments';

export default async function EquipmentsPage({ searchParams }) {
    const { query = '', page = 1 } = await searchParams;
    const { equipments, totalPages } = await getEquipments({ query, page: Number(page) });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span className="badge badge-success">Ativo</span>;
            case 'maintenance': return <span className="badge badge-warning">Em Manutenção</span>;
            case 'inactive': return <span className="badge badge-danger">Inativo</span>;
            default: return <span className="badge badge-outline">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Equipamentos</h1>
                    <p className="text-muted text-sm">Gerencie o parque de máquinas dos clientes</p>
                </div>
                <Link href="/equipments/new" className="btn btn-primary">
                    <Plus size={18} />
                    Novo Equipamento
                </Link>
            </div>

            <div className="card flex flex-col gap-4">
                {/* Search Bar */}
                <form className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar por nome, modelo, série ou cliente..."
                            className="input pl-10"
                        />
                        {/* Icon placeholder if needed */}
                    </div>
                    <button type="submit" className="btn btn-outline">
                        <Search size={16} />
                        Buscar
                    </button>
                </form>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Equipamento (Tipo)</th>
                                <th>Cliente</th>
                                <th>Part Number</th>
                                <th>Marca / Modelo</th>
                                <th>Nº Série / Patrimônio</th>
                                <th>Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipments.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <Box size={16} />
                                            </div>
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <Link href={`/clients/${item.clientId}/edit`} className="hover:underline text-primary">
                                            {item.client.name}
                                        </Link>
                                    </td>
                                    <td className="font-mono text-xs font-bold uppercase">{item.partNumber || '-'}</td>
                                    <td>
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{item.brand}</div>
                                            <div className="text-muted-foreground">{item.model}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            {item.serialNumber && <div className="text-gray-900">S/N: {item.serialNumber}</div>}
                                            {item.patrimony && <div className="text-muted-foreground">Pat: {item.patrimony}</div>}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(item.status)}</td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/equipments/${item.id}`} className="btn btn-ghost p-2" title="Visualizar">
                                                <Box size={16} />
                                            </Link>
                                            <Link href={`/equipments/${item.id}/edit`} className="btn btn-ghost p-2" title="Editar">
                                                <Edit size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {equipments.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center p-6 text-muted-foreground">
                                        Nenhum equipamento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 pt-4">
                    {page > 1 && (
                        <Link href={`/equipments?query=${query}&page=${page - 1}`} className="btn btn-outline btn-sm">
                            Anterior
                        </Link>
                    )}
                    {(page > 1 || page < totalPages) && (
                        <span className="flex items-center text-sm font-medium text-gray-700 px-2">
                            Página {page} de {totalPages || 1}
                        </span>
                    )}
                    {page < totalPages && (
                        <Link href={`/equipments?query=${query}&page=${page + 1}`} className="btn btn-outline btn-sm">
                            Próxima
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
