'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';

// Helper to get date ranges
function getDateRange(period) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'today') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
    } else {
        // Default to all time or specific logic
        start = new Date('2020-01-01'); // Far past
    }

    return { start, end };
}

// Cached financial metrics
const getCachedFinancialMetrics = unstable_cache(
    async (period, customStart, customEnd) => {
        let start, end;

        if (customStart && customEnd) {
            start = new Date(customStart);
            end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
        } else {
            const range = getDateRange(period);
            start = range.start;
            end = range.end;
        }

        // 1. Receita Realizada (OS Finalizadas no período)
        const realizedOrders = await prisma.serviceOrder.findMany({
        where: {
            status: 'FINISHED',
            finishedAt: {
                gte: start,
                lte: end,
            },
        },
        select: {
            total: true,
            totalServices: true,
            totalParts: true,
        }
    });

    const totalRevenue = realizedOrders.reduce((acc, os) => acc + (os.total || 0), 0);
    const revenueServices = realizedOrders.reduce((acc, os) => acc + (os.totalServices || 0), 0);
    const revenueParts = realizedOrders.reduce((acc, os) => acc + (os.totalParts || 0), 0);
    const countRealized = realizedOrders.length;
    const avgTicket = countRealized > 0 ? totalRevenue / countRealized : 0;

    // 2. Previsão de Receita (OS em Aberto/Andamento)
    // Status NOT FINISHED and NOT CANCELED
    const openOrders = await prisma.serviceOrder.findMany({
        where: {
            status: { notIn: ['FINISHED', 'CANCELED'] },
            // For projection, we might consider all active OS regardless of date, or created in range?
            // Usually, projection is about what IS currently in pipeline.
            // Let's filter by createdAt within range IF logic dictates, 
            // but for "Pipeline" usually it's "Current Status".
            // However, to respect "Period", maybe we check expected closing?
            // Let's keep it simple: Active orders created in this period OR simply ALL active orders if period is "future"?
            // User prompt: "Projected Revenue: OS em Aberto".
            // Let's fetch ALL active OS for projection to be realistic about backlog value.
            // OR strictly stick to Date Range query?
            // Stick to Date Range on 'createdAt' or 'scheduledAt' for "Projected for this period"?
            // Let's assume Project Revenue = All Active OS (Pipeline Value).
        },
        select: { total: true }
    });

    const projectedRevenue = openOrders.reduce((acc, os) => acc + (os.total || 0), 0);
    const countOpen = openOrders.length;

    // 3. Top Clients (Revenue in period)
    const topClientsRaw = await prisma.serviceOrder.groupBy({
        by: ['clientId'],
        where: {
            status: 'FINISHED',
            finishedAt: { gte: start, lte: end },
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
    });

    // Need to fetch client names
    const topClients = await Promise.all(topClientsRaw.map(async (item) => {
        const client = await prisma.client.findUnique({ where: { id: item.clientId } });
        return {
            name: client?.name || 'Desconhecido',
            value: item._sum.total || 0
        };
    }));

        return {
            totalRevenue,
            projectedRevenue,
            avgTicket,
            revenueBreakdown: {
                services: revenueServices,
                parts: revenueParts,
            },
            counts: {
                closed: countRealized,
                open: countOpen,
            },
            topClients,
            period: { start, end }
        };
    },
    ['financial-metrics'],
    {
        revalidate: 120, // Revalidate every 2 minutes
        tags: ['financial']
    }
);

export async function getFinancialMetrics({ period = 'month', customStart, customEnd } = {}) {
    return await getCachedFinancialMetrics(period, customStart, customEnd);
}

// Cached monthly revenue
const getCachedMonthlyRevenue = unstable_cache(
    async (year) => {
        const start = new Date(`${year}-01-01`);
        const end = new Date(`${year}-12-31`);
        end.setHours(23, 59, 59);

        const orders = await prisma.serviceOrder.findMany({
        where: {
            status: 'FINISHED',
            finishedAt: { gte: start, lte: end },
        },
        select: {
            finishedAt: true,
            total: true,
        }
    });

    // Group by month
    const monthlyData = Array(12).fill(0).map((_, i) => ({
        name: new Date(year, i).toLocaleString('pt-BR', { month: 'short' }),
        revenue: 0,
        count: 0
    }));

    orders.forEach(os => {
        if (os.finishedAt) {
            const month = os.finishedAt.getMonth(); // 0-11
            monthlyData[month].revenue += (os.total || 0);
            monthlyData[month].count += 1;
        }
    });

        return monthlyData;
    },
    ['monthly-revenue'],
    {
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['financial']
    }
);

export async function getMonthlyRevenue(year = new Date().getFullYear()) {
    return await getCachedMonthlyRevenue(year);
}
