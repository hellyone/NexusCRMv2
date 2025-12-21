'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { unstable_cache } from 'next/cache';

// Cached version of dashboard stats (revalidates every 60 seconds)
const getCachedDashboardStats = unstable_cache(
    async () => {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const endOfCurrentMonth = endOfMonth(now);

        const [
            openOsCount,
            inProgressOsCount,
            finishedOsMonthCount,
            delayedOsCount,
            revenueMonth,
            lowStockItems
        ] = await Promise.all([
        // 1. OS Abertas
        prisma.serviceOrder.count({ where: { status: 'OPEN' } }),

        // 2. OS Em Andamento
        prisma.serviceOrder.count({ where: { status: 'IN_PROGRESS' } }),

        // 3. OS Finalizadas (Este Mês)
        prisma.serviceOrder.count({
            where: {
                status: 'FINISHED',
                finishedAt: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            }
        }),

        // 4. OS Atrasadas (Agendada < Agora e Não Finalizada)
        prisma.serviceOrder.count({
            where: {
                status: { not: 'FINISHED' },
                scheduledAt: { lt: now }
            }
        }),

        // 5. Receita do Mês (Soma total de OS Finalizadas)
        prisma.serviceOrder.aggregate({
            _sum: { total: true },
            where: {
                status: 'FINISHED',
                finishedAt: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            }
        }),

        // 6. Alertas de Estoque (Estoque <= Mínimo)
        // Note: Prisma doesn't support field comparison in where clause easily
        // So we fetch parts and filter in memory
        prisma.part.findMany({
            where: { isActive: true },
            take: 100, // Get more to filter
            select: {
                id: true,
                name: true,
                stockQuantity: true,
                minStock: true,
                unit: true
            },
            orderBy: { stockQuantity: 'asc' }
        })
    ]);

        // Filter low stock items
        const filteredLowStock = lowStockItems.filter(part => part.stockQuantity <= part.minStock).slice(0, 5);

        return {
            os: {
                open: openOsCount,
                inProgress: inProgressOsCount,
                finishedMonth: finishedOsMonthCount,
                delayed: delayedOsCount
            },
            financial: {
                revenue: revenueMonth._sum.total || 0
            },
            stock: {
                lowStock: filteredLowStock
            }
        };
    },
    ['dashboard-stats'],
    {
        revalidate: 60, // Revalidate every 60 seconds
        tags: ['dashboard']
    }
);

export async function getDashboardStats() {
    const session = await auth();
    if (!session) return null;

    return await getCachedDashboardStats();
}
