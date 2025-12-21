import Link from 'next/link';
import { Plus, Search, Edit } from 'lucide-react';
import { getClients } from '@/actions/clients';
import { maskCPF, maskCNPJ } from '@/utils/masks';
import { auth } from '@/auth';
import DeleteClientButton from '@/components/clients/DeleteClientButton';

export default async function ClientsPage({ searchParams }) {
    const session = await auth();
    const { query = '', page = 1 } = await searchParams;
    const { clients, totalPages } = await getClients({ query, page: Number(page) });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-muted text-sm">Gerencie sua base de clientes</p>
                </div>
                <Link href="/clients/new" className="btn btn-primary">
                    <Plus size={18} />
                    Novo Cliente
                </Link>
            </div>

            <div className="card flex flex-col gap-4">
                {/* Search Bar */}
                <form className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
                            className="input pl-10" // TODO: Add padding left for icon if using absolute
                        />
                        {/* <Search className="absolute left-3 top-3 text-muted-foreground" size={16} /> */}
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
                                <th>Nome / Razão Social</th>
                                <th>CPF / CNPJ</th>
                                <th>Cidade/UF</th>
                                <th>Telefone</th>
                                <th>Status</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            {/* Logic: Show Trade Name as primary if available, otherwise Legal Name */}
                                            {client.tradeName ? (
                                                <>
                                                    <span className="font-medium text-gray-900">{client.tradeName}</span>
                                                    <span className="text-sm text-muted-foreground">{client.name}</span>
                                                </>
                                            ) : (
                                                <span className="font-medium text-gray-900">{client.name}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {client.personType === 'PJ' ? maskCNPJ(client.document) : maskCPF(client.document)}
                                    </td>
                                    <td>{client.city} / {client.state}</td>
                                    <td>{client.phonePrimary || client.whatsapp}</td>
                                    <td>
                                        <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {client.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/clients/${client.id}/edit`} className="btn btn-ghost p-2" title="Editar">
                                                <Edit size={16} />
                                            </Link>
                                            {session?.user?.role === 'ADMIN' && (
                                                <DeleteClientButton clientId={client.id} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center p-6 text-muted">
                                        Nenhum cliente encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 pt-4">
                    {page > 1 && (
                        <Link href={`/clients?query=${query}&page=${page - 1}`} className="btn btn-outline btn-sm">
                            Anterior
                        </Link>
                    )}
                    <span className="flex items-center text-sm font-medium text-gray-700">
                        Página {page} de {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link href={`/clients?query=${query}&page=${page + 1}`} className="btn btn-outline btn-sm">
                            Próxima
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
