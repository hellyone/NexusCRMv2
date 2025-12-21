'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Ajusta o estoque de uma peça manualmente.
 * @param {number} partId
 * @param {number} quantity - Valor positivo. O tipo (IN/OUT) define se soma ou subtrai.
 * @param {string} type - 'IN' ou 'OUT'
 * @param {string} reason
 * @param {number} unitCost - Apenas para entradas (opcional)
 */
export async function adjustStock({ partId, quantity, type, reason, unitCost }) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantidade inválida.');

    // Transaction para garantir integridade
    return await prisma.$transaction(async (tx) => {
        const part = await tx.part.findUnique({ where: { id: partId } });
        if (!part) throw new Error('Peça não encontrada.');

        // Calcular novo saldo
        let newStock = part.stockQuantity;
        if (type === 'IN') {
            newStock += qty;
        } else if (type === 'OUT') {
            newStock -= qty;
        } else {
            throw new Error('Tipo de movimento inválido.');
        }

        // Criar movimento
        await tx.stockMovement.create({
            data: {
                type,
                quantity: qty,
                unitCost: unitCost || null,
                reason: reason || 'MANUAL_ADJUSTMENT',
                partId,
                userId: Number(session.user.id),
            }
        });

        // Atualizar peça
        const updatedPart = await tx.part.update({
            where: { id: partId },
            data: { stockQuantity: newStock }
        });

        return updatedPart;
    });
}

export async function getStockHistory(partId) {
    const session = await auth();
    if (!session) return [];

    return await prisma.stockMovement.findMany({
        where: { partId: Number(partId) },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true }
            },
            serviceOrder: {
                select: { code: true }
            }
        },
        take: 50
    });
}
