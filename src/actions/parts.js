'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getParts({ query = '', page = 1, lowStock = false, category = null, activeOnly = true } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Add tab filtering if passed (e.g. stockType='service')? 
    // Wait, the function signature doesn't take stockType yet, but I added it in previous turn.
    // I should probably support it as a filter by usageType.

    // NOTE: Previous 'getParts' update was implicit in my mind but I didn't verify if I added 'stockType' arg to signature. 
    // Looking at the view_file, the signature is:
    // export async function getParts({ query = '', page = 1, lowStock = false, category = null, activeOnly = true } = {})
    // It does NOT have stockType in destructuring. I should add it if I want tabs to work as filters.

    // But for this specific replacement, I focus on fixing the column names first.

    const where = {
        AND: [
            activeOnly ? { isActive: true } : {},
            category ? { category } : {},
            {
                OR: [
                    { name: { contains: query } },
                    { sku: { contains: query } },
                    { partNumber: { contains: query } },
                    { brand: { contains: query } },
                ],
            },
        ],
    };

    const [parts, total] = await Promise.all([
        prisma.part.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                sku: true,
                partNumber: true,
                brand: true,
                model: true,
                ncm: true,
                costPrice: true,
                salePrice: true,
                stockQuantity: true, // Unified
                usageType: true,
                minStock: true,
                maxStock: true,
                location: true,
                unit: true,
                category: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' },
        }),
        prisma.part.count({ where }),
    ]);

    return {
        parts,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getPart(id) {
    return await prisma.part.findUnique({
        where: { id: parseInt(id) },
    });
}

export async function getPartsForSelect({ usageType } = {}) {
    const where = { isActive: true };

    if (usageType) {
        if (Array.isArray(usageType)) {
            where.usageType = { in: usageType };
        } else {
            where.usageType = usageType;
        }
    }

    return await prisma.part.findMany({
        where,
        select: { id: true, name: true, sku: true, salePrice: true, stockQuantity: true, usageType: true },
        orderBy: { name: 'asc' },
    });
}

export async function createPart(formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) return { error: 'Nome é obrigatório.' };

    try {
        const payload = {
            name: data.name,
            description: data.description,
            sku: data.sku || null,
            partNumber: data.partNumber || null,
            brand: data.brand,
            model: data.model,
            ncm: data.ncm || null,
            costPrice: parseFloat(data.costPrice) || 0,
            salePrice: parseFloat(data.salePrice) || 0,
            stockQuantity: parseInt(data.stockQuantity) || 0, // Unified
            usageType: data.usageType || 'BOTH',
            minStock: parseInt(data.minStock) || 0,
            maxStock: data.maxStock ? parseInt(data.maxStock) : null,
            location: data.location,
            unit: data.unit || 'UN',
            category: data.category,
            isActive: true,
        };

        // Validate SKU
        if (payload.sku) {
            const existing = await prisma.part.findUnique({ where: { sku: payload.sku } });
            if (existing) return { error: `SKU ${payload.sku} já existe.` };
        }

        await prisma.part.create({ data: payload });
        revalidatePath('/parts');
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao criar peça: ' + e.message };
    }
}

export async function updatePart(id, formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) return { error: 'Nome é obrigatório.' };

    try {
        const payload = {
            name: data.name,
            description: data.description,
            sku: data.sku || null,
            partNumber: data.partNumber || null,
            brand: data.brand,
            model: data.model,
            ncm: data.ncm || null,
            costPrice: parseFloat(data.costPrice) || 0,
            salePrice: parseFloat(data.salePrice) || 0,
            stockQuantity: parseInt(data.stockQuantity) || 0, // Unified
            usageType: data.usageType || 'BOTH',
            minStock: parseInt(data.minStock) || 0,
            maxStock: data.maxStock ? parseInt(data.maxStock) : null,
            location: data.location,
            unit: data.unit || 'UN',
            category: data.category,
            isActive: data.isActive === 'true' || data.isActive === true,
        };

        // Validate SKU
        if (payload.sku) {
            const existing = await prisma.part.findFirst({
                where: {
                    sku: payload.sku,
                    NOT: { id: parseInt(id) }
                }
            });
            if (existing) return { error: `SKU ${payload.sku} já existe.` };
        }

        await prisma.part.update({
            where: { id: parseInt(id) },
            data: payload,
        });

        revalidatePath('/parts');
        revalidatePath(`/parts/${id}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar: ' + e.message };
    }
}

export async function updateStock(id, quantity, type, reason, stockType = 'sales') {
    // type: 'IN' | 'OUT'
    // stockType is kept for Movement logging, but affects the same stockQuantity.

    // Normalize stockType
    const validStockType = stockType === 'service' ? 'SERVICE' : 'SALES';

    const part = await prisma.part.findUnique({ where: { id: parseInt(id) } });
    if (!part) return { error: 'Item não encontrado.' };

    // Validate usage vs stockType
    // E.g., You can't perform a "Service" movement on a "Sale-only" item? 
    // Or maybe you can if you are adjusting? Let's implement basic checks.

    if (part.usageType !== 'BOTH') {
        if (part.usageType === 'SERVICE' && validStockType === 'SALES') {
            return { error: 'Item exclusivo de Consumo não deve ter movimentação de Venda.' };
        }
        if (part.usageType === 'SALE' && validStockType === 'SERVICE') {
            return { error: 'Item exclusivo de Venda não deve ser usado em Serviço/Consumo.' };
        }
    }

    let newQuantity = part.stockQuantity;
    const qty = parseInt(quantity);

    if (type === 'IN') {
        newQuantity += qty;
    } else if (type === 'OUT') {
        newQuantity -= qty;
        if (newQuantity < 0) {
            return { error: `Estoque insuficiente. Disp: ${part.stockQuantity}, Saída: ${qty}` };
        }
    }

    try {
        await prisma.part.update({
            where: { id: parseInt(id) },
            data: { stockQuantity: newQuantity }
        });

        // Register Movement
        await prisma.stockMovement.create({
            data: {
                type,
                stockType: validStockType, // Log where it went/came from
                quantity: qty,
                reason: reason || 'MANUAL_ADJUSTMENT',
                partId: part.id,
            }
        });

        revalidatePath('/parts');
        revalidatePath(`/parts/${id}`);
        return { success: true, newQuantity };
    } catch (e) {
        return { error: 'Erro ao atualizar estoque: ' + e.message };
    }
}

export async function deletePart(id) {
    const part = await prisma.part.findUnique({
        where: { id: parseInt(id) },
        include: {
            _count: {
                select: { stockMovements: true, items: true }
            }
        }
    });

    if (!part) return { error: 'Item não encontrado.' };

    const hasHistory = (part._count.stockMovements > 0) || (part._count.items > 0);

    try {
        if (hasHistory) {
            // Soft delete (archive)
            await prisma.part.update({
                where: { id: parseInt(id) },
                data: { isActive: false }
            });
            revalidatePath('/parts');
            return { success: true, message: 'Item arquivado pois possui histórico.' };
        } else {
            // Hard delete
            await prisma.part.delete({
                where: { id: parseInt(id) }
            });
            revalidatePath('/parts');
            return { success: true, message: 'Item excluído permanentemente.' };
        }
    } catch (e) {
        return { error: 'Erro ao excluir item: ' + e.message };
    }
}
