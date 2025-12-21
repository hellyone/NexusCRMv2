/**
 * Helpers para criar notificações automáticas baseadas em eventos do sistema
 */

import { createNotification, createNotificationForRole } from '@/actions/notifications';

/**
 * Notifica sobre OS atrasadas
 */
export async function notifyDelayedServiceOrders() {
    // Esta função pode ser chamada por um cron job ou scheduler
    // Por enquanto, vamos criar uma função que pode ser chamada manualmente
    
    // Buscar OS atrasadas
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const now = new Date();
    const delayedOrders = await prisma.serviceOrder.findMany({
        where: {
            status: { notIn: ['FINISHED', 'CANCELED'] },
            scheduledAt: { lt: now },
        },
        include: {
            client: { select: { name: true } },
            technician: { select: { id: true, name: true } },
        },
        take: 10, // Limitar para não sobrecarregar
    });

    // Notificar admins e backoffice sobre OS atrasadas
    if (delayedOrders.length > 0) {
        await createNotificationForRole({
            role: 'ADMIN',
            type: 'WARNING',
            title: `${delayedOrders.length} OS Atrasada${delayedOrders.length > 1 ? 's' : ''}`,
            message: `Existem ${delayedOrders.length} ordem(ns) de serviço com data agendada vencida.`,
            link: '/service-orders?status=OPEN',
        });

        await createNotificationForRole({
            role: 'BACKOFFICE',
            type: 'WARNING',
            title: `${delayedOrders.length} OS Atrasada${delayedOrders.length > 1 ? 's' : ''}`,
            message: `Existem ${delayedOrders.length} ordem(ns) de serviço com data agendada vencida.`,
            link: '/service-orders?status=OPEN',
        });
    }

    await prisma.$disconnect();
}

/**
 * Notifica sobre estoque baixo
 */
export async function notifyLowStock() {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Buscar itens com estoque baixo
    const parts = await prisma.part.findMany({
        where: { isActive: true },
        take: 100,
    });

    const lowStockParts = parts.filter(part => part.stockQuantity <= part.minStock);

    if (lowStockParts.length > 0) {
        await createNotificationForRole({
            role: 'ADMIN',
            type: 'WARNING',
            title: `${lowStockParts.length} Item(ns) com Estoque Baixo`,
            message: `${lowStockParts.length} peça(s) estão com estoque abaixo do mínimo.`,
            link: '/parts',
        });

        await createNotificationForRole({
            role: 'BACKOFFICE',
            type: 'WARNING',
            title: `${lowStockParts.length} Item(ns) com Estoque Baixo`,
            message: `${lowStockParts.length} peça(s) estão com estoque abaixo do mínimo.`,
            link: '/parts',
        });
    }

    await prisma.$disconnect();
}

/**
 * Notifica técnico sobre nova OS atribuída
 */
export async function notifyTechnicianNewOS(serviceOrderId, technicianId) {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const os = await prisma.serviceOrder.findUnique({
        where: { id: serviceOrderId },
        include: {
            client: { select: { name: true } },
            equipment: { select: { name: true } },
        }
    });

    if (!os) return;

    const technician = await prisma.technician.findUnique({
        where: { id: technicianId },
        include: { user: { select: { id: true } } }
    });

    if (technician?.user?.id) {
        await createNotification({
            userId: technician.user.id,
            type: 'INFO',
            title: 'Nova OS Atribuída',
            message: `Ordem de serviço ${os.code} foi atribuída a você. Cliente: ${os.client.name}`,
            link: `/service-orders/${serviceOrderId}`,
        });
    }

    await prisma.$disconnect();
}

/**
 * Notifica sobre OS aguardando aprovação
 */
export async function notifyOSWaitingApproval(serviceOrderId) {
    await createNotificationForRole({
        role: 'ADMIN',
        type: 'INFO',
        title: 'OS Aguardando Aprovação',
        message: `Ordem de serviço aguardando aprovação do cliente.`,
        link: `/service-orders/${serviceOrderId}`,
    });
}

