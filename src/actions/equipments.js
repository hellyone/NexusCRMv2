'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getEquipments({ query = '', page = 1, clientId = null } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            clientId ? { clientId: parseInt(clientId) } : {},
            {
                OR: [
                    { name: { contains: query } },
                    { partNumber: { contains: query } },
                    { brand: { contains: query } },
                    { model: { contains: query } },
                    { serialNumber: { contains: query } },
                    { client: { name: { contains: query } } }, // Search by client name too
                ],
            },
        ],
    };

    const [equipments, total] = await Promise.all([
        prisma.equipment.findMany({
            where,
            skip,
            take: ITEMS_PER_PAGE,
            include: {
                client: {
                    select: { name: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.equipment.count({ where }),
    ]);

    return {
        equipments,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getEquipment(id) {
    return await prisma.equipment.findUnique({
        where: { id: parseInt(id) },
        include: {
            client: true,
            images: true,
            serviceOrders: {
                orderBy: { createdAt: 'desc' },
                include: {
                    technician: { select: { name: true } }
                }
            }
        },
    });
}

export async function createEquipment(formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name || !data.clientId) {
        return { error: 'Nome e Cliente são obrigatórios.' };
    }

    try {
        const payload = {
            name: data.name,
            partNumber: data.partNumber || '',
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            patrimony: data.patrimony,
            voltage: data.voltage,
            power: data.power,
            location: data.location,
            isWarranty: data.isWarranty === 'on',
            clientId: parseInt(data.clientId),
            // Dates
            manufactureDate: data.manufactureDate ? new Date(data.manufactureDate) : null,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
        };

        const equipment = await prisma.equipment.create({ data: payload });

        // Handle Images URL (simple implementation for now)
        if (data.imageUrl) {
            await prisma.equipmentImage.create({
                data: {
                    url: data.imageUrl,
                    equipmentId: equipment.id
                }
            });
        }

        revalidatePath('/equipments');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Erro ao criar equipamento: ' + e.message };
    }
}

export async function updateEquipment(id, formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name || !data.clientId) {
        return { error: 'Nome e Cliente são obrigatórios.' };
    }

    try {
        const payload = {
            name: data.name,
            partNumber: data.partNumber || '',
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            patrimony: data.patrimony,
            voltage: data.voltage,
            power: data.power,
            location: data.location,
            isWarranty: data.isWarranty === 'on',
            clientId: parseInt(data.clientId),
            // Dates
            manufactureDate: data.manufactureDate ? new Date(data.manufactureDate) : null,
            purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
            warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : null,
        };

        await prisma.equipment.update({
            where: { id: parseInt(id) },
            data: payload,
        });

        // Handle Images URL (Add new one if provided)
        if (data.imageUrl) {
            await prisma.equipmentImage.create({
                data: {
                    url: data.imageUrl,
                    equipmentId: parseInt(id)
                }
            });
        }

        revalidatePath('/equipments');
        revalidatePath(`/equipments/${id}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar: ' + e.message };
    }
}

export async function deleteEquipment(id) {
    try {
        await prisma.equipment.delete({ where: { id: parseInt(id) } });
        revalidatePath('/equipments');
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao excluir: ' + e.message };
    }
}
export async function getEquipmentHistory(serialNumber, clientId) {
    if (!serialNumber) return null;

    try {
        // Primeiro busca sem filtro de cliente para encontrar o equipamento
        const equipment = await prisma.equipment.findFirst({
            where: {
                serialNumber: serialNumber.toUpperCase()
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        document: true
                    }
                },
                serviceOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        technician: { select: { name: true } }
                    }
                }
            }
        });

        if (!equipment) return null;

        // Check for active OS (not FINISHED, INVOICED, CANCELED, DISPATCHED, SCRAPPED or ABANDONED)
        const activeOS = equipment.serviceOrders.find(os =>
            !['FINISHED', 'INVOICED', 'CANCELED', 'DISPATCHED', 'SCRAPPED', 'ABANDONED'].includes(os.status)
        );

        // Check for warranty from the last DISPATCHED OS
        const lastFinishedOS = equipment.serviceOrders.find(os =>
            ['DISPATCHED', 'INVOICED'].includes(os.status)
        );

        let warrantyStatus = {
            inWarranty: false,
            remainingDays: 0,
            lastOS: lastFinishedOS || null
        };

        if (lastFinishedOS && lastFinishedOS.warrantyUntil) {
            const now = new Date();
            const warrantyDate = new Date(lastFinishedOS.warrantyUntil);
            if (warrantyDate > now) {
                warrantyStatus.inWarranty = true;
                const diffTime = Math.abs(warrantyDate - now);
                warrantyStatus.remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        return {
            equipment,
            activeOS: activeOS || null,
            warrantyStatus
        };
    } catch (e) {
        console.error('Error fetching equipment history:', e);
        return null;
    }
}
