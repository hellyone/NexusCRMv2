import { getFinancialMetrics, getMonthlyRevenue } from '@/actions/finance';
import FinancialCard from '@/components/finance/FinancialCard';
import RevenueChart from '@/components/finance/RevenueChart';
import { DollarSign, TrendingUp, Wallet, Activity } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';

export default async function FinancePage({ searchParams }) {
    const { period } = await searchParams;
    const currentPeriod = period || 'month';

    const metrics = await getFinancialMetrics({ period: currentPeriod });
    const monthlyData = await getMonthlyRevenue();

    // Helper for currency display
    const fmt = (v) => `R$ ${maskCurrency((v || 0).toFixed(2))}`;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestão Financeira</h1>
                    <p className="text-muted text-sm">Métricas de faturamento, ticket médio e evolução</p>
                </div>

                {/* Period Selector */}
                <div className="join border rounded-md bg-white">
                    <a href="?period=today" className={`btn btn-sm join-item ${currentPeriod === 'today' ? 'btn-active btn-primary' : 'btn-ghost'}`}>Hoje</a>
                    <a href="?period=month" className={`btn btn-sm join-item ${currentPeriod === 'month' ? 'btn-active btn-primary' : 'btn-ghost'}`}>Mês</a>
                    <a href="?period=year" className={`btn btn-sm join-item ${currentPeriod === 'year' ? 'btn-active btn-primary' : 'btn-ghost'}`}>Ano</a>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinancialCard
                    title="Faturamento (Realizado)"
                    value={fmt(metrics.totalRevenue)}
                    icon={DollarSign}
                    subtext={`${metrics.counts.closed} OS finalizadas neste período`}
                    color="green"
                />
                <FinancialCard
                    title="Previsão (Pipeline)"
                    value={fmt(metrics.projectedRevenue)}
                    icon={TrendingUp}
                    subtext={`${metrics.counts.open} OS em aberto no total`}
                    color="blue"
                />
                <FinancialCard
                    title="Ticket Médio"
                    value={fmt(metrics.avgTicket)}
                    icon={Wallet}
                    subtext="Baseado em OS finalizadas no período"
                    color="purple"
                />
                <FinancialCard
                    title="Serviços vs Peças"
                    value={`${((metrics.revenueBreakdown.services / (metrics.totalRevenue || 1)) * 100).toFixed(0)}% / ${((metrics.revenueBreakdown.parts / (metrics.totalRevenue || 1)) * 100).toFixed(0)}%`}
                    icon={Activity}
                    subtext={`S: ${fmt(metrics.revenueBreakdown.services)} | P: ${fmt(metrics.revenueBreakdown.parts)}`}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 card bg-white border p-6">
                    <h3 className="text-lg font-bold mb-6">Evolução do Faturamento (Ano Atual)</h3>
                    <RevenueChart data={monthlyData} />
                </div>

                {/* Top Clients */}
                <div className="card bg-white border p-6">
                    <h3 className="text-lg font-bold mb-4">Top Clientes (Período)</h3>
                    <div className="space-y-4">
                        {metrics.topClients.map((client, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]" title={client.name}>
                                        {client.name}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{fmt(client.value)}</span>
                            </div>
                        ))}
                        {metrics.topClients.length === 0 && (
                            <p className="text-sm text-muted italic text-center py-4">Nenhum dado encontrado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
