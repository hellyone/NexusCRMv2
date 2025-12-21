'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts({ query = '', page = 1 } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            { isActive: true },
            {
                OR: [
                    { partNumber: { contains: query } },
                    { name: { contains: query } },
                    { brand: { contains: query } },
                    { model: { contains: query } }
                ]
            }
        ]
    };

    const [products, total] = await Promise.all([
        prisma.productCatalog.findMany({
            where,
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' }
        }),
        prisma.productCatalog.count({ where })
    ]);

    return {
        products,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page
    };
}

export async function createProduct(formData) {
    const data = Object.fromEntries(formData.entries());

    try {
        await prisma.productCatalog.create({
            data: {
                partNumber: data.partNumber.toUpperCase(),
                name: data.name,
                brand: data.brand || null,
                model: data.model || null,
                weight: data.weight ? parseFloat(data.weight.toString().replace(',', '.')) : 0,
                description: data.description || null,
            }
        });
        revalidatePath('/settings/products');
        return { success: true };
    } catch (e) {
        console.error("Create Product Error:", e);
        if (e.code === 'P2002') {
            return { error: 'Part Number já existe.' };
        }
        // Return actual error for debugging
        return { error: `Erro ao criar produto: ${e.message}` };
    }
}

export async function updateProduct(id, formData) {
    const data = Object.fromEntries(formData.entries());
    try {
        const product = await prisma.productCatalog.update({
            where: { id: parseInt(id) },
            data: {
                partNumber: data.partNumber.toUpperCase(),
                name: data.name,
                brand: data.brand,
                model: data.model,
                weight: data.weight ? parseFloat(data.weight.toString().replace(',', '.')) : 0,
                description: data.description,
            }
        });
        revalidatePath('/settings/products');
        return { success: true, product };
    } catch (e) {
        console.error("Update Product Error:", e);
        if (e.code === 'P2002') {
            return { success: false, error: 'Part Number já existe.' };
        }
        return { success: false, error: `Erro ao atualizar produto: ${e.message}` };
    }
}

export async function deleteProduct(id) {
    try {
        await prisma.productCatalog.update({
            where: { id: parseInt(id) },
            data: { isActive: false } // Soft delete
        });
        revalidatePath('/settings/products');
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao excluir produto.' };
    }
}
export async function getProductByPartNumber(partNumber) {
    if (!partNumber) return null;
    return await prisma.productCatalog.findUnique({
        where: { partNumber: partNumber.toUpperCase() },
        select: {
            name: true,
            brand: true,
            model: true
        }
    });
}

export async function getProductSuggestions(query) {
    if (!query || query.length < 1) return [];

    return await prisma.productCatalog.findMany({
        where: {
            AND: [
                { isActive: true },
                {
                    OR: [
                        { partNumber: { contains: query } },
                        { name: { contains: query } }
                    ]
                }
            ]
        },
        take: 6,
        select: {
            id: true,
            partNumber: true,
            name: true,
            brand: true,
            model: true
        }
    });
}
