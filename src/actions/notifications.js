'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logger, createErrorResponse, createSuccessResponse } from '@/lib/logger';
import { auth } from '@/auth';

/**
 * Cria uma notificação para um usuário
 */
export async function createNotification({ userId, type, title, message, link = null }) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: parseInt(userId),
                type: type || 'INFO',
                title,
                message,
                link,
            }
        });

        logger.info('Notificação criada', { notificationId: notification.id, userId });
        revalidatePath('/');
        
        return createSuccessResponse({ id: notification.id });
    } catch (e) {
        return createErrorResponse('Erro ao criar notificação', e, { action: 'createNotification' });
    }
}

/**
 * Cria notificações para múltiplos usuários (ex: todos os admins)
 */
export async function createNotificationForRole({ role, type, title, message, link = null }) {
    try {
        const users = await prisma.user.findMany({
            where: { 
                role,
                isActive: true 
            },
            select: { id: true }
        });

        const notifications = await Promise.all(
            users.map(user => 
                prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: type || 'INFO',
                        title,
                        message,
                        link,
                    }
                })
            )
        );

        logger.info('Notificações criadas para role', { role, count: notifications.length });
        revalidatePath('/');
        
        return createSuccessResponse({ count: notifications.length });
    } catch (e) {
        return createErrorResponse('Erro ao criar notificações', e, { action: 'createNotificationForRole' });
    }
}

/**
 * Busca notificações do usuário atual
 */
export async function getUserNotifications({ unreadOnly = false, limit = 20 } = {}) {
    const session = await auth();
    if (!session?.user) return [];

    const where = {
        userId: parseInt(session.user.id),
        ...(unreadOnly && { read: false })
    };

    return await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId) {
    const session = await auth();
    if (!session?.user) {
        return createErrorResponse('Não autorizado');
    }

    try {
        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(notificationId) }
        });

        if (!notification) {
            return createErrorResponse('Notificação não encontrada');
        }

        if (notification.userId !== parseInt(session.user.id)) {
            return createErrorResponse('Acesso negado');
        }

        await prisma.notification.update({
            where: { id: parseInt(notificationId) },
            data: {
                read: true,
                readAt: new Date()
            }
        });

        revalidatePath('/');
        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao marcar notificação como lida', e, { action: 'markNotificationAsRead' });
    }
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user) {
        return createErrorResponse('Não autorizado');
    }

    try {
        await prisma.notification.updateMany({
            where: {
                userId: parseInt(session.user.id),
                read: false
            },
            data: {
                read: true,
                readAt: new Date()
            }
        });

        revalidatePath('/');
        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao marcar notificações como lidas', e, { action: 'markAllNotificationsAsRead' });
    }
}

/**
 * Conta notificações não lidas do usuário
 */
export async function getUnreadNotificationCount() {
    const session = await auth();
    if (!session?.user) return 0;

    return await prisma.notification.count({
        where: {
            userId: parseInt(session.user.id),
            read: false
        }
    });
}

/**
 * Deleta notificação
 */
export async function deleteNotification(notificationId) {
    const session = await auth();
    if (!session?.user) {
        return createErrorResponse('Não autorizado');
    }

    try {
        const notification = await prisma.notification.findUnique({
            where: { id: parseInt(notificationId) }
        });

        if (!notification) {
            return createErrorResponse('Notificação não encontrada');
        }

        if (notification.userId !== parseInt(session.user.id)) {
            return createErrorResponse('Acesso negado');
        }

        await prisma.notification.delete({
            where: { id: parseInt(notificationId) }
        });

        revalidatePath('/');
        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao excluir notificação', e, { action: 'deleteNotification' });
    }
}

