import { getDashboardStats } from '@/actions/dashboard';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  Card,
  Metric,
  Text,
  Flex,
  Grid,
  Title,
  BarList,
  Bold,
  Badge,
} from "@tremor/react";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  PlusCircle,
  Users,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { maskCurrency } from '@/utils/masks';

export default async function DashboardPage() {
  const session = await auth();
  if (session?.user?.role === 'TECH_FIELD') {
    redirect('/field');
  }

  const stats = await getDashboardStats();

  if (!stats) return <div className="p-10 text-center text-gray-500">Carregando dados...</div>;

  // Preparing data for stock list
  const lowStockData = stats.stock.lowStock.map(item => ({
    name: item.name,
    value: item.stockQuantity,
    icon: () => <Package size={16} className="text-orange-500 mr-2" />
  }));

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-end">
        <div>
          <Title className="text-2xl text-slate-800">Visão Geral</Title>
          <Text>Bem-vindo ao Nexus OS</Text>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        {/* KPI: Atrasadas */}
        <Card decoration="top" decorationColor={stats.os.delayed > 0 ? "red" : "green"}>
          <Flex justifyContent="start" className="space-x-4">
            <div className={`p-2 rounded-lg ${stats.os.delayed > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <Text>OS Atrasadas</Text>
              <Metric className={stats.os.delayed > 0 ? 'text-red-600' : ''}>{stats.os.delayed}</Metric>
            </div>
          </Flex>
        </Card>

        {/* KPI: Abertas */}
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="start" className="space-x-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Wrench size={24} />
            </div>
            <div>
              <Text>OS Abertas</Text>
              <Metric>{stats.os.open}</Metric>
            </div>
          </Flex>
        </Card>

        {/* KPI: Em Andamento */}
        <Card decoration="top" decorationColor="yellow">
          <Flex justifyContent="start" className="space-x-4">
            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
              <Users size={24} />
            </div>
            <div>
              <Text>Em Execução</Text>
              <Metric>{stats.os.inProgress}</Metric>
            </div>
          </Flex>
        </Card>

        {/* KPI: Receita */}
        <Card decoration="top" decorationColor="emerald">
          <Flex justifyContent="start" className="space-x-4">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <Text>Receita (Mês)</Text>
              <Metric className="truncate" title={maskCurrency(stats.financial.revenue)}>
                {maskCurrency(stats.financial.revenue)}
              </Metric>
            </div>
          </Flex>
        </Card>
      </Grid>

      <Grid numItems={1} numItemsLg={3} className="gap-6">

        {/* Coluna Principal: Alerta de Estoque */}
        <div className="lg:col-span-2">
          <Card>
            <Flex>
              <Title>Alertas de Estoque</Title>
              <Link href="/parts" className="text-sm text-indigo-600 hover:underline flex items-center">
                Ver tudo <ArrowRight size={14} className="ml-1" />
              </Link>
            </Flex>
            <div className="mt-4">
              {stats.stock.lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                  <CheckCircle size={32} className="mb-2 text-green-500" />
                  <p>Estoque regular.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium text-right">Mínimo</th>
                        <th className="px-4 py-3 font-medium text-right">Atual</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.stock.lowStock.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <Link href={`/parts/${item.id}`} className="hover:text-primary transition-colors">
                              {item.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{item.minStock} {item.unit}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{item.stockQuantity} {item.unit}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge color="red" size="xs">Crítico</Badge>
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

        {/* Coluna Lateral: Ações */}
        <div className="space-y-6">
          <Card>
            <Title>Acesso Rápido</Title>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <Link href="/service-orders/new" className="group flex items-center gap-3 p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600 group-hover:bg-blue-200">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 group-hover:text-blue-700">Nova OS</div>
                  <div className="text-xs text-gray-500">Abrir chamado técnico</div>
                </div>
              </Link>

              <Link href="/clients/new" className="group flex items-center gap-3 p-3 rounded-lg border hover:border-purple-500 hover:bg-purple-50 transition-all">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600 group-hover:bg-purple-200">
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-bold text-gray-800 group-hover:text-purple-700">Novo Cliente</div>
                  <div className="text-xs text-gray-500">Cadastrar empresa/pessoa</div>
                </div>
              </Link>
            </div>
          </Card>
        </div>

      </Grid>
    </div>
  );
}
