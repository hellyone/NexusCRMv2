'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { canTransition } from '@/utils/status-machine';
import { notifyTechnicianNewOS, notifyOSWaitingApproval } from '@/lib/notification-helpers';

// --- Helper: Recalculate Totals ---
export async function recalculateServiceOrderTotal(id) {
    const os = await prisma.serviceOrder.findUnique({
        where: { id },
        include: { services: true, parts: true }
    });

    if (!os) return;

    const totalServices = os.services.reduce((acc, item) => acc + item.subtotal, 0);
    const totalParts = os.parts.reduce((acc, item) => acc + item.subtotal, 0);

    // Labor and Displacement are manually set fields on header
    const laborCost = os.laborCost || 0;
    const displacement = os.displacement || 0;
    const discount = os.discount || 0;

    const grandTotal = (totalServices + totalParts + laborCost + displacement) - discount;

    await prisma.serviceOrder.update({
        where: { id },
        data: {
            totalServices,
            totalParts,
            total: grandTotal
        }
    });

    return grandTotal;
}

// --- Status Workflow ---
export async function updateServiceOrderStatus(id, newStatus, notes = null, executionDeadline = null) {
    const session = await auth();
    const userRole = session?.user?.role || 'GUEST';
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const os = await prisma.serviceOrder.findUnique({ where: { id: parseInt(id) } });
    if (!os) return { error: 'OS não encontrada.' };

    if (!canTransition(os.status, newStatus, userRole)) {
        return { error: `Você não tem permissão para esta transição (${os.status} -> ${newStatus}) ou ela é inválida.` };
    }

    // Validação de Laudo Técnico para finalizar análise
    if (newStatus === 'WAITING_APPROVAL' && userRole.startsWith('TECH')) {
        if (!os.diagnosis?.trim() || !os.solution?.trim()) {
            return { error: 'O diagnóstico e a solução devem estar preenchidos para finalizar a análise técnica.' };
        }
    }

    const data = { status: newStatus };
    const now = new Date();
    const fromStatus = os.status;

    if (newStatus === 'IN_PROGRESS' && !os.startedAt) {
        data.startedAt = now;
    }
    if (newStatus === 'FINISHED' && !os.finishedAt) {
        data.finishedAt = now;
    }
    if (newStatus === 'APPROVED' && executionDeadline) {
        data.executionDeadline = new Date(executionDeadline);
    }

    // Use transaction to ensure both update and history are saved
    await prisma.$transaction(async (tx) => {
        // Update service order
        await tx.serviceOrder.update({
            where: { id: parseInt(id) },
            data
        });

        // Create status history entry
        await tx.serviceOrderStatusHistory.create({
            data: {
                serviceOrderId: parseInt(id),
                fromStatus: fromStatus,
                toStatus: newStatus,
                notes: notes || null,
                changedById: userId,
            }
        });
    });

    // Send notifications for specific status changes
    if (newStatus === 'WAITING_APPROVAL') {
        await notifyOSWaitingApproval(parseInt(id));
    }

    revalidatePath(`/service-orders/${id}`);
    revalidatePath('/service-orders');
    revalidatePath('/commercial');
    return { success: true };
}

// --- Status History ---
export async function getServiceOrderStatusHistory(serviceOrderId) {
    return await prisma.serviceOrderStatusHistory.findMany({
        where: { serviceOrderId: parseInt(serviceOrderId) },
        include: {
            changedBy: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
}

// --- Parts Management ---
import { auth } from '@/auth';

export async function addPartToServiceOrder(serviceOrderId, partId, quantity) {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const qty = parseFloat(quantity);
    if (qty <= 0) return { error: 'Quantidade inválida.' };

    const part = await prisma.part.findUnique({ where: { id: parseInt(partId) } });
    if (!part) return { error: 'Peça não encontrada.' };

    if (part.stockQuantity < qty) {
        return { error: `Estoque insuficiente. Disp: ${part.stockQuantity}` };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Decrement Stock
            await tx.part.update({
                where: { id: part.id },
                data: { stockQuantity: { decrement: qty } }
            });

            // 2. Create Stock Movement (History)
            await tx.stockMovement.create({
                data: {
                    type: 'OUT',
                    stockType: 'SERVICE', // Context is Service Order, so destination is Service usage
                    quantity: qty,
                    reason: 'SERVICE_ORDER',
                    partId: part.id,
                    serviceOrderId: parseInt(serviceOrderId),
                    userId: userId
                }
            });

            // 3. Add Item to OS
            const subtotal = part.salePrice * qty;
            await tx.serviceOrderPart.create({
                data: {
                    serviceOrderId: parseInt(serviceOrderId),
                    partId: part.id,
                    quantity: qty,
                    unitPrice: part.salePrice,
                    subtotal: subtotal
                }
            });
        });

        await recalculateServiceOrderTotal(parseInt(serviceOrderId));
        revalidatePath(`/service-orders/${serviceOrderId}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Erro ao adicionar peça: ' + e.message };
    }
}

export async function removePartFromServiceOrder(itemId) {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const item = await prisma.serviceOrderPart.findUnique({ where: { id: parseInt(itemId) } });
    if (!item) return { error: 'Item não encontrado.' };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Return Stock
            await tx.part.update({
                where: { id: item.partId },
                data: { stockQuantity: { increment: item.quantity } }
            });

            // 2. Create Stock Movement (Return)
            await tx.stockMovement.create({
                data: {
                    type: 'IN',
                    stockType: 'SERVICE',
                    quantity: item.quantity,
                    reason: 'RETURN', // Devolução ao estoque pois foi removido da OS
                    partId: item.partId,
                    serviceOrderId: item.serviceOrderId,
                    userId: userId
                }
            });

            // 3. Remove Item
            await tx.serviceOrderPart.delete({ where: { id: item.id } });
        });

        await recalculateServiceOrderTotal(item.serviceOrderId);
        revalidatePath(`/service-orders/${item.serviceOrderId}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Erro ao remover peça: ' + e.message };
    }
}

// --- Services Management ---
export async function addServiceToServiceOrder(serviceOrderId, serviceId, technicianId = null) {
    const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } });
    if (!service) return { error: 'Serviço não encontrado.' };

    // Price logic: Fixed or Hourly? 
    // For simplicity MVP: Use base price. Future: Ask user for quantity/hours.
    // Let's assume quantity 1 for Fixed and 1 hour for Hourly initially, user can edit later?
    // Or simpler: Just add with base price.
    const qty = 1;
    const subtotal = service.price * qty;

    try {
        await prisma.serviceOrderItem.create({
            data: {
                serviceOrderId: parseInt(serviceOrderId),
                serviceId: service.id,
                quantity: qty,
                unitPrice: service.price,
                subtotal: subtotal,
                technicianId: technicianId ? parseInt(technicianId) : null
            }
        });

        await recalculateServiceOrderTotal(parseInt(serviceOrderId));
        revalidatePath(`/service-orders/${serviceOrderId}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao adicionar serviço: ' + e.message };
    }
}

export async function removeServiceFromServiceOrder(itemId) {
    const item = await prisma.serviceOrderItem.findUnique({ where: { id: parseInt(itemId) } });
    if (!item) return { error: 'Item não encontrado.' };

    try {
        await prisma.serviceOrderItem.delete({ where: { id: item.id } });
        await recalculateServiceOrderTotal(item.serviceOrderId);
        revalidatePath(`/service-orders/${item.serviceOrderId}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao remover serviço: ' + e.message };
    }
}

export async function updateServiceOrderItem(itemId, quantity, unitPrice, technicianId = null) {
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);

    if (qty <= 0) return { error: 'Quantidade deve ser maior que zero.' };
    if (price < 0) return { error: 'Preço não pode ser negativo.' };

    const item = await prisma.serviceOrderItem.findUnique({ where: { id: parseInt(itemId) } });
    if (!item) return { error: 'Item não encontrado.' };

    const subtotal = qty * price;

    try {
        await prisma.serviceOrderItem.update({
            where: { id: parseInt(itemId) },
            data: {
                quantity: qty,
                unitPrice: price,
                subtotal: subtotal,
                technicianId: technicianId ? parseInt(technicianId) : item.technicianId,
            }
        });

        await recalculateServiceOrderTotal(item.serviceOrderId);
        revalidatePath(`/service-orders/${item.serviceOrderId}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar serviço: ' + e.message };
    }
}

export async function updateServiceOrderPart(itemId, quantity, unitPrice) {
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);

    if (qty <= 0) return { error: 'Quantidade deve ser maior que zero.' };
    if (price < 0) return { error: 'Preço não pode ser negativo.' };

    const item = await prisma.serviceOrderPart.findUnique({
        where: { id: parseInt(itemId) },
        include: { part: true }
    });
    if (!item) return { error: 'Item não encontrado.' };

    // Check if new quantity exceeds available stock (considering what was already taken)
    // We are checking Service Stock
    const currentStock = item.part.stockQuantity;
    const originalQty = item.quantity;
    const stockDifference = qty - originalQty;

    if (stockDifference > 0 && currentStock < stockDifference) {
        return { error: `Estoque insuficiente. Disponível: ${currentStock}, Necessário adicional: ${stockDifference}` };
    }

    const subtotal = qty * price;

    try {
        await prisma.$transaction(async (tx) => {
            // Update the item
            await tx.serviceOrderPart.update({
                where: { id: parseInt(itemId) },
                data: {
                    quantity: qty,
                    unitPrice: price,
                    subtotal: subtotal,
                }
            });

            // Adjust stock if quantity changed
            if (stockDifference !== 0) {
                const updateOp = stockDifference > 0 ? { decrement: stockDifference } : { increment: Math.abs(stockDifference) };

                await tx.part.update({
                    where: { id: item.partId },
                    data: { stockQuantity: updateOp }
                });

                // Create stock movement
                await tx.stockMovement.create({
                    data: {
                        type: stockDifference > 0 ? 'OUT' : 'IN',
                        stockType: 'SERVICE',
                        quantity: Math.abs(stockDifference),
                        reason: 'SERVICE_ORDER',
                        partId: item.partId,
                        serviceOrderId: item.serviceOrderId,
                    }
                });
            }
        });

        await recalculateServiceOrderTotal(item.serviceOrderId);
        revalidatePath(`/service-orders/${item.serviceOrderId}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar peça: ' + e.message };
    }
}
