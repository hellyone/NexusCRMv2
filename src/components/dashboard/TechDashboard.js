
import { getTechnicianStats } from '@/actions/dashboard';
import { getServiceOrders } from '@/actions/service-orders';
import Link from 'next/link';
import {
    Card,
    Metric,
    Text,
    Flex,
    Grid,
    Title,
    Badge
} from "@tremor/react";
import {
    Wrench,
    Clock,
    CheckCircle,
    List,
    Play,
    PlusCircle,
    ArrowRight
} from 'lucide-react';

export default async function TechDashboard({ user }) {
    const stats = await getTechnicianStats(user.id);

    // Fetch user's active orders for the list
    const { serviceOrders: myOrders } = await getServiceOrders({
        technicianId: user.id,
        status: ['IN_PROGRESS', 'OPEN', 'PENDING', 'WAITING_PARTS'], // Active stuff
        page: 1
    });

    if (!stats) return <div className="p-10 text-center text-gray-500">Carregando dados...</div>;

    return (
        <div className="space-y-6 p-2">
            <div className="flex justify-between items-end">
                <div>
                    <Title className="text-2xl text-slate-800">Painel do Técnico</Title>
                    <Text className="text-slate-500">Bem-vindo, {user.name}</Text>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* KPIs */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">

                {/* Em Execução (Priority 1) */}
                <Card decoration="top" decorationColor="blue">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Play size={24} />
                        </div>
                        <div>
                            <Text>Em Execução</Text>
                            <Metric>{stats.myInProgress}</Metric>
                        </div>
                    </Flex>
                </Card>

                {/* Pendentes Comigo */}
                <Card decoration="top" decorationColor="yellow">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <Text>Minhas Pendências</Text>
                            <Metric>{stats.myOpen}</Metric>
                        </div>
                    </Flex>
                </Card>

                {/* Fila Geral (Oportunidade) */}
                <Card decoration="top" decorationColor="gray">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                            <List size={24} />
                        </div>
                        <div>
                            <Text>Fila Disponível</Text>
                            <Metric>{stats.queueCount}</Metric>
                        </div>
                    </Flex>
                </Card>

                {/* Feitas Hoje */}
                <Card decoration="top" decorationColor="green">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <Text>Concluídas Hoje</Text>
                            <Metric>{stats.myDoneToday}</Metric>
                        </div>
                    </Flex>
                </Card>
            </Grid>

            {/* Main Content Area */}
            <Grid numItems={1} numItemsLg={3} className="gap-6">

                {/* List of My Active Orders */}
                <div className="lg:col-span-2">
                    <Card>
                        <Flex>
                            <Title>Meus Chamados Ativos</Title>
                            <Link href="/field" className="text-sm text-indigo-600 hover:underline flex items-center">
                                Ver Modo Focado <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </Flex>

                        <div className="mt-4 overflow-hidden">
                            {myOrders.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50">
                                    <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                                    <p>Tudo em dia! Nenhuma OS pendente.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                            <tr>
                                                <th className="px-4 py-3">OS / Cliente</th>
                                                <th className="px-4 py-3">Equipamento</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {myOrders.map(os => (
                                                <tr key={os.id} className="hover:bg-gray-50 group">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">{os.code}</div>
                                                        <div className="text-xs text-gray-500">{os.client.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-gray-700">{os.equipment?.name || 'Genérico'}</div>
                                                        <div className="text-xs text-gray-500">{os.equipment?.brand}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge size="xs" color={
                                                            os.status === 'IN_PROGRESS' ? 'blue' :
                                                                os.status === 'OPEN' ? 'yellow' : 'gray'
                                                        }>
                                                            {os.status === 'IN_PROGRESS' ? 'Em Andamento' :
                                                                os.status === 'OPEN' ? 'Aberto' : os.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link href={`/service-orders/${os.id}`} className="btn btn-sm btn-ghost text-primary">
                                                            Abrir
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card>
                        <Title>Ações Rápidas</Title>
                        <div className="mt-4 grid grid-cols-1 gap-3">
                            {/* 'Nova OS' removed for technicians */}

                            <Link href="/parts" className="group flex items-center gap-3 p-3 rounded-lg border hover:border-orange-500 hover:bg-orange-50 transition-all">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600 group-hover:bg-orange-200">
                                    <Wrench size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 group-hover:text-orange-700">Consultar Peça</div>
                                    <div className="text-xs text-gray-500">Ver estoque de consumo</div>
                                </div>
                            </Link>

                        </div>
                    </Card>
                </div>

            </Grid>
        </div>
    );
}
