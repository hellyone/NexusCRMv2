import Link from 'next/link';
import { Plus, Search, Edit, AlertTriangle, Package } from 'lucide-react';
import { getParts } from '@/actions/parts';
import { StockTabs } from '@/components/parts/StockTabs';
import { DeletePartButton } from '@/components/parts/DeletePartButton';

export default async function PartsPage({ searchParams }) {
    const { query = '', page = 1, tab = 'sales' } = await searchParams;
    const { parts, totalPages } = await getParts({ query, page: Number(page), stockType: tab });

    const formatCurrency = (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const stockLabel = 'Estoque Total';

    const { auth } = await import('@/auth');
    const session = await auth();
    const isAdmin = ['ADMIN', 'BACKOFFICE'].includes(session?.user?.role);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Estoque de Peças</h1>
                    <p className="text-muted text-sm">Gerencie inventário, custos e movimentações</p>
                </div>
                {isAdmin && (
                    <Link href="/parts/new" className="btn btn-primary">
                        <Plus size={18} />
                        Novo Item
                    </Link>
                )}
            </div>

            <div className="card flex flex-col gap-4">
                {isAdmin && <StockTabs />}

                {/* Search Bar */}
                <form className="flex gap-2">
                    <input type="hidden" name="tab" value={tab} />
                    <div className="flex-1 relative">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar por Nome ou Part Number..."
                            className="input pl-10"
                        />
                        {/* Icon placeholder */}
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
                                <th>Item / Marca</th>
                                <th>Part Number / Categoria</th>
                                <th>{stockLabel}</th>
                                <th>Localização</th>
                                <th className="text-center w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((item) => {
                                const currentStock = item.stockQuantity;
                                const isLowStock = currentStock <= item.minStock;

                                // Filter Logic
                                if (tab === 'sales' && item.usageType === 'SERVICE') return null;
                                if (tab === 'service' && item.usageType === 'SALE') return null;

                                return (
                                    <tr key={item.id} className={`align-middle ${isLowStock ? 'bg-red-50' : ''}`}>
                                        <td className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium flex items-center gap-2 text-gray-900">
                                                    <Package size={16} className="text-muted-foreground" />
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground pl-6">{item.brand} {item.model}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-col gap-0.5 items-start">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.partNumber || '-'}
                                                </span>
                                                {item.category && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className={`flex items-center gap-2 font-medium ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                                                {currentStock} {item.unit}
                                                {isLowStock && (
                                                    <span className="tooltip" title={`Estoque Baixo! Mínimo: ${item.minStock}`}>
                                                        <AlertTriangle size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="text-sm font-medium text-gray-600">
                                                {item.location || '-'}
                                            </div>
                                        </td>
                                        <td className="text-center py-3">
                                            <div className="flex justify-center gap-2 items-center h-full">
                                                <Link href={`/parts/${item.id}/edit`} className="btn btn-ghost p-2 hover:bg-gray-200 rounded-full" title="Editar">
                                                    <Edit size={16} className="text-gray-600" />
                                                </Link>
                                                <DeletePartButton id={item.id} name={item.name} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {parts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center p-6 text-muted-foreground">
                                        Nenhum item encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 pt-4">
                    {page > 1 && (
                        <Link href={`/parts?query=${query}&page=${page - 1}&tab=${tab}`} className="btn btn-outline btn-sm">
                            Anterior
                        </Link>
                    )}
                    {(page > 1 || page < totalPages) && (
                        <span className="flex items-center text-sm font-medium text-gray-700 px-2">
                            Página {page} de {totalPages || 1}
                        </span>
                    )}
                    {page < totalPages && (
                        <Link href={`/parts?query=${query}&page=${page + 1}&tab=${tab}`} className="btn btn-outline btn-sm">
                            Próxima
                        </Link>
                    )}
                </div>

            </div>
        </div>
    );
}
