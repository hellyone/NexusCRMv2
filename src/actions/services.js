'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getServices({ query = '', page = 1, category = null, status = 'active' } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            category ? { category } : {},
            status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {},
            {
                OR: [
                    { name: { contains: query } },
                    { code: { contains: query } },
                    { description: { contains: query } },
                ],
            },
        ],
    };

    const [services, total] = await Promise.all([
        prisma.service.findMany({
            where,
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' },
        }),
        prisma.service.count({ where }),
    ]);

    return {
        services,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getServicesForSelect() {
    return await prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, name: true, price: true, priceType: true },
        orderBy: { name: 'asc' },
    });
}

export async function getService(id) {
    return await prisma.service.findUnique({
        where: { id: parseInt(id) },
    });
}

export async function createService(formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) {
        return { error: 'Nome do serviço é obrigatório.' };
    }

    try {
        const payload = {
            name: data.name,
            code: data.code || null,
            description: data.description,
            category: data.category,
            price: parseFloat(data.price) || 0,
            priceType: data.priceType || 'FIXED',
            serviceCode: data.serviceCode || null,
            estimatedMinutes: parseInt(data.estimatedMinutes) || null,
            requiresChecklist: data.requiresChecklist === 'on',
            isActive: true,
        };

        // Check Unique Code
        if (payload.code) {
            const existing = await prisma.service.findUnique({ where: { code: payload.code } });
            if (existing) return { error: `Código ${payload.code} já existe.` };
        }

        await prisma.service.create({ data: payload });
        revalidatePath('/services');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Erro ao criar serviço: ' + e.message };
    }
}

export async function updateService(id, formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) {
        return { error: 'Nome do serviço é obrigatório.' };
    }

    try {
        const payload = {
            name: data.name,
            code: data.code || null,
            description: data.description,
            category: data.category,
            price: parseFloat(data.price) || 0,
            priceType: data.priceType || 'FIXED',
            serviceCode: data.serviceCode || null,
            estimatedMinutes: parseInt(data.estimatedMinutes) || null,
            requiresChecklist: data.requiresChecklist === 'on',
        };

        // Check Unique Code (exclude self)
        if (payload.code) {
            const existing = await prisma.service.findFirst({
                where: {
                    code: payload.code,
                    NOT: { id: parseInt(id) }
                }
            });
            if (existing) return { error: `Código ${payload.code} já existe.` };
        }

        await prisma.service.update({
            where: { id: parseInt(id) },
            data: payload,
        });

        revalidatePath('/services');
        revalidatePath(`/services/${id}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar: ' + e.message };
    }
}

export async function toggleServiceStatus(id) {
    const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
    if (!service) return { error: 'Serviço não encontrado.' };

    await prisma.service.update({
        where: { id: parseInt(id) },
        data: { isActive: !service.isActive },
    });
    revalidatePath('/services');
    return { success: true };
}
