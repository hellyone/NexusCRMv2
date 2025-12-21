import Link from 'next/link';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { getUsers } from '@/actions/users';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

const ROLE_LABELS = {
    ADMIN: 'Administrador',
    BACKOFFICE: 'Backoffice',
    TECH_INTERNAL: 'Técnico Interno',
    TECH_FIELD: 'Técnico Campo',
};

const ROLE_COLORS = {
    ADMIN: 'bg-red-100 text-red-700',
    BACKOFFICE: 'bg-blue-100 text-blue-700',
    TECH_INTERNAL: 'bg-yellow-100 text-yellow-700',
    TECH_FIELD: 'bg-green-100 text-green-700',
};

export default async function UsersPage({ searchParams }) {
    const session = await auth();

    // Only ADMIN can access
    if (session?.user?.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    const { query = '', page = 1, role = '', active = '' } = await searchParams;
    const { users, totalPages } = await getUsers({
        query,
        page: Number(page),
        role: role || null,
        activeOnly: active === 'true',
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gerenciamento de Equipe</h1>
                    <p className="text-muted text-sm">Gerencie funcionários e permissões de acesso</p>
                </div>
                <Link href="/users/new" className="btn btn-primary">
                    <Plus size={18} />
                    Novo Membro
                </Link>
            </div>

            <div className="card flex flex-col gap-4">
                {/* Search and Filters */}
                <form className="flex gap-2 flex-wrap">
                    <div className="flex-1 relative min-w-[200px]">
                        <input
                            name="query"
                            defaultValue={query}
                            placeholder="Buscar por nome ou email..."
                            className="input pl-10"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <select
                        name="role"
                        defaultValue={role}
                        className="input w-auto"
                    >
                        <option value="">Todos os perfis</option>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select
                        name="active"
                        defaultValue={active}
                        className="input w-auto"
                    >
                        <option value="">Todos</option>
                        <option value="true">Apenas ativos</option>
                        <option value="false">Apenas inativos</option>
                    </select>
                    <button type="submit" className="btn btn-outline">
                        Filtrar
                    </button>
                </form>

                {/* Users Table */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome / Email</th>
                                <th>Perfil & Acesso</th>
                                <th>Dados Profissionais</th>
                                <th>Status</th>
                                <th>Último Login</th>
                                <th className="text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-2 text-gray-900">
                                                <Shield size={16} className="text-muted-foreground" />
                                                {user.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-sm ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                            {ROLE_LABELS[user.role] || user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {/* Display Technician Info if available (handled by backend now) */}
                                        {/* Note: In previous step I only fetched technician name. I should probably fetch more details if I want to show them here, 
                                            but getUsers selects technician: {id, name}. 
                                            Let's rely on name for now, or assume the user object might be enhanced later. 
                                            Wait, getUsers in `src/actions/users.js` selects `id` and `name` only for technician. 
                                            I should update that action to return more if I want to show specialty here.
                                            For now, I'll stick to displaying what we have (Name) or just "Vínculo Ativo".
                                            Actually, since we merged, user IS the technician ideally. 
                                        */}
                                        <div className="flex flex-col text-sm">
                                            {user.technician ? (
                                                <>
                                                    <span className="text-gray-700 font-medium">Técnico Vinculado</span>
                                                    {/* We could fetch specialty if we updated the backend query. Let's do that in a follow up if needed. */}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground italic">Apenas Acesso</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {user.isActive ? (
                                            <span className="badge badge-success badge-sm flex items-center gap-1 w-fit">
                                                <UserCheck size={12} />
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="badge badge-error badge-sm flex items-center gap-1 w-fit">
                                                <UserX size={12} />
                                                Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {user.lastLogin ? (
                                            <span className="text-sm text-gray-600">
                                                {new Date(user.lastLogin).toLocaleDateString('pt-BR')}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Nunca</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/users/${user.id}/edit`}
                                                className="btn btn-ghost p-2"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center p-6 text-muted-foreground">
                                        Nenhum membro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end items-center gap-2 pt-4">
                    {page > 1 && (
                        <Link
                            href={`/users?query=${query}&page=${page - 1}&role=${role}&active=${active}`}
                            className="btn btn-outline btn-sm"
                        >
                            Anterior
                        </Link>
                    )}
                    {(page > 1 || page < totalPages) && (
                        <span className="flex items-center text-sm font-medium text-gray-700 px-2">
                            Página {page} de {totalPages || 1}
                        </span>
                    )}
                    {page < totalPages && (
                        <Link
                            href={`/users?query=${query}&page=${Number(page) + 1}&role=${role}&active=${active}`}
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

