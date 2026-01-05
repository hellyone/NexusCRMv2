'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validate, serviceOrderSchema, sanitizeObject } from '@/lib/validation';
import { logger, createErrorResponse, createSuccessResponse } from '@/lib/logger';

async function generateServiceOrderCode(maintenanceArea = 'GENERAL') {
    // 1. Prefix Map
    const prefixes = {
        'ELECTRONICS': 'ELE',
        'SERVOMOTOR': 'SRV',
        'HYDRAULICS': 'HID',
        'PNEUMATICS': 'PNE',
        'PLC': 'PLC',
        'GENERAL': 'GER',
        'ENGINEERING': 'ENG',
        'TECHNICAL_ASSISTANCE': 'AST'
    };
    const prefix = prefixes[maintenanceArea] || 'OS';
    const year = new Date().getFullYear();
    const searchPrefix = `${prefix} -${year} -`;

    // 2. Get last code for this Prefix + Year
    const lastOS = await prisma.serviceOrder.findFirst({
        where: {
            code: {
                startsWith: searchPrefix
            }
        },
        orderBy: { id: 'desc' },
        select: { code: true }
    });

    let nextNumber = 1;

    if (lastOS && lastOS.code) {
        // Format: ELE-2025-0001
        const parts = lastOS.code.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
            nextNumber = lastSeq + 1;
        }
    }

    // Pad with 4 zeros (limit 9999 as requested)
    const sequence = String(nextNumber).padStart(4, '0');
    return `${prefix} -${year} -${sequence} `;
}

import { auth } from '@/auth';

export async function getServiceOrders({
    query = '',
    page = 1,
    status = null,
    clientId = null,
    technicianId = null,
    priority = null,
    type = null,
    dateFrom = null,
    dateTo = null,
    maintenanceArea = null,
    serviceLocation = null
} = {}) {
    const session = await auth();
    const user = session?.user;

    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            status ? (Array.isArray(status) ? { status: { in: status } } : { status }) : {},
            clientId ? { clientId: parseInt(clientId) } : {},
            technicianId ? { technicianId: parseInt(technicianId) } : {},
            priority ? { priority } : {},
            type ? { type } : {},
            maintenanceArea ? { maintenanceArea } : {},
            serviceLocation ? { serviceLocation } : {},
            dateFrom || dateTo ? {
                createdAt: {
                    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                    ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59') } : {}),
                }
            } : {},
            query ? {
                OR: [
                    { code: { contains: query } },
                    { client: { name: { contains: query } } },
                    { equipment: { name: { contains: query } } },
                    { equipment: { brand: { contains: query } } },
                    { equipment: { model: { contains: query } } },
                    { reportedDefect: { contains: query } },
                ],
            } : {},
        ],
    };

    // Role-based filtering
    // Role-based filtering
    if (user) {
        // Shared Logic: Always allow seeing what is assigned to me.
        // Plus, if I am internal, I see my area.
        // Plus, if we want "Queue" visibility, we should allow seeing OPEN + Unassigned.

        // For simplicity in this "Field Dashboard" context:
        // We want Techs to see: (Assigned to Me) OR (Open AND Unassigned)
        // Previous strict logic was hiding potential work.

        if (['TECH_INTERNAL', 'TECH_FIELD'].includes(user.role)) {
            const orConditions = [
                { technicianId: parseInt(user.id) } // Assigned to me
            ];

            if (user.role === 'TECH_INTERNAL' && user.specialties) {
                const specialties = JSON.parse(user.specialties);
                orConditions.push({ maintenanceArea: { in: specialties } });
            }

            // ALLOW VIEWING QUEUE (Open & Unassigned)
            orConditions.push({
                AND: [
                    { status: 'OPEN' },
                    { technicianId: null }
                ]
            });

            where.AND.push({ OR: orConditions });
        }
        // ADMIN / BACKOFFICE see everything
    }

    const [serviceOrders, total] = await Promise.all([
        prisma.serviceOrder.findMany({
            where,
            include: {
                client: { select: { name: true, city: true, state: true } },
                equipment: { select: { partNumber: true, name: true, brand: true, model: true, serialNumber: true } },
                technician: { select: { name: true } },
                statusHistory: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { name: true } } } },
            },
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.serviceOrder.count({ where }),
    ]);

    return {
        serviceOrders,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getServiceOrder(id) {
    return await prisma.serviceOrder.findUnique({
        where: { id: parseInt(id) },
        include: {
            client: true,
            equipment: true,
            technician: true,
            services: { include: { service: true } },
            parts: { include: { part: true } },
            statusHistory: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { name: true } } } },
        }
    });
}

export async function createServiceOrder(formData) {
    const session = await auth();
    if (!session || !['ADMIN', 'BACKOFFICE'].includes(session.user.role)) {
        return createErrorResponse("Você não tem permissão para abrir novas Ordens de Serviço.");
    }

    const rawData = Object.fromEntries(formData.entries());

    // Sanitize input
    const sanitizedData = sanitizeObject(rawData);

    // Validate with Zod schema
    const validation = validate(serviceOrderSchema, sanitizedData);
    if (!validation.success) {
        return { error: validation.error };
    }

    const data = validation.data;

    try {
        const code = await generateServiceOrderCode(data.maintenanceArea);

        // Equipment Logic
        // If equipmentId is passed, use it.
        // If not, check if we have Serial Number and Part Number / Name.
        let targetEquipmentId = data.equipmentId;

        // Note: data comes from Zod schema, which might strip unknown fields if strict.
        // We check sanitizedData for the extra equipment fields not yet in strict schema.
        const eqSerial = sanitizedData.equipmentSerialNumber;

        if (!targetEquipmentId && data.clientId && eqSerial) {
            // 1. Try to find existing equipment for this client with this serial
            const existing = await prisma.equipment.findFirst({
                where: {
                    clientId: parseInt(data.clientId),
                    serialNumber: eqSerial
                }
            });

            if (existing) {
                targetEquipmentId = existing.id;
                // Update partNumber if it was missing or is different
                if (sanitizedData.partNumber && (!existing.partNumber || existing.partNumber !== sanitizedData.partNumber)) {
                    await prisma.equipment.update({
                        where: { id: existing.id },
                        data: { partNumber: sanitizedData.partNumber }
                    });
                }
            } else {
                // 2. Create new Equipment
                const newEquip = await prisma.equipment.create({
                    data: {
                        clientId: parseInt(data.clientId),
                        partNumber: sanitizedData.partNumber || '',
                        name: sanitizedData.equipmentName || 'Equipamento Sem Nome',
                        brand: sanitizedData.equipmentBrand || '',
                        model: sanitizedData.equipmentModel || '',
                        serialNumber: eqSerial,
                    }
                });
                targetEquipmentId = newEquip.id;
            }
        }

        const payload = {
            code,
            clientId: data.clientId,
            equipmentId: targetEquipmentId || null,
            technicianId: data.technicianId || null,
            type: data.type || "CORRECTIVE",
            origin: data.origin || null,
            requesterName: data.requesterName || null,
            requesterPhone: data.requesterPhone || null,
            serviceLocation: data.serviceLocation || "INTERNAL",
            maintenanceArea: data.maintenanceArea || null,
            serviceAddress: data.serviceAddress || null,
            serviceZipCode: data.serviceZipCode || null,
            serviceStreet: data.serviceStreet || null,
            serviceNumber: data.serviceNumber || null,
            serviceComplement: data.serviceComplement || null,
            serviceNeighborhood: data.serviceNeighborhood || null,
            serviceCity: data.serviceCity || null,
            serviceState: data.serviceState || null,
            serviceReference: data.serviceReference || null,
            externalEquipmentDescription: data.externalEquipmentDescription || null,
            entryInvoiceNumber: data.entryInvoiceNumber || null,
            accessories: data.accessories || null,
            status: "OPEN",
            priority: data.priority || "NORMAL",
            reportedDefect: data.reportedDefect,
            internalNotes: data.internalNotes || null,
            scheduledAt: data.scheduledAt || null,
            startedAt: null, // Set when moving to IN_PROGRESS
        };

        const newOs = await prisma.serviceOrder.create({ data: payload });

        // Notify technician if assigned
        if (payload.technicianId) {
            await notifyTechnicianNewOS(newOs.id, payload.technicianId);
        }

        revalidatePath('/service-orders');
        logger.info('Ordem de serviço criada com sucesso', { osId: newOs.id, code: newOs.code });
        return createSuccessResponse({ id: newOs.id });
    } catch (e) {
        logger.error('Erro ao criar OS:', e);
        return createErrorResponse(`Erro ao criar ordem de serviço: ${e.message} `, e, { action: 'createServiceOrder' });
    }
}

export async function updateServiceOrderHeader(id, formData) {
    const data = Object.fromEntries(formData.entries());

    try {
        const payload = {
            requesterName: data.requesterName,
            requesterPhone: data.requesterPhone,
            reportedDefect: data.reportedDefect,
            diagnosis: data.diagnosis,
            solution: data.solution,
            internalNotes: data.internalNotes,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
            warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
            technicianId: data.technicianId ? parseInt(data.technicianId) : null,
            maintenanceArea: data.maintenanceArea || undefined,
            // Financial fields
            laborHours: data.laborHours ? parseFloat(data.laborHours) : null,
            laborCost: data.laborCost ? parseFloat(data.laborCost) : null,
            displacement: data.displacement ? parseFloat(data.displacement) : null,
            discount: data.discount ? parseFloat(data.discount) : null,
            // Logistics/Entrance info
            accessories: data.accessories,
            entryInvoiceNumber: data.entryInvoiceNumber,
            serviceAddress: data.serviceAddress,
            serviceZipCode: data.serviceZipCode,
            serviceStreet: data.serviceStreet,
            serviceNumber: data.serviceNumber,
            serviceComplement: data.serviceComplement,
            serviceNeighborhood: data.serviceNeighborhood,
            serviceCity: data.serviceCity,
            serviceState: data.serviceState,
            serviceReference: data.serviceReference,
            externalEquipmentDescription: data.externalEquipmentDescription,
        };

        // Remove undefined/null values to avoid overwriting with null
        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === null) {
                delete payload[key];
            }
        });

        await prisma.serviceOrder.update({
            where: { id: parseInt(id) },
            data: payload
        });

        // Recalculate total if financial fields were updated
        if (data.laborHours || data.laborCost || data.displacement || data.discount) {
            const { recalculateServiceOrderTotal } = await import('@/actions/service-order-items');
            await recalculateServiceOrderTotal(parseInt(id));
        }

        revalidatePath(`/ service - orders / ${id} `);
        logger.info('Cabeçalho de OS atualizado', { osId: id });
        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao atualizar ordem de serviço', e, { action: 'updateServiceOrderHeader', osId: id });
    }
}

export async function updateCommercialDetails(id, data) {
    const session = await auth();
    if (!session || !['ADMIN', 'BACKOFFICE', 'COMERCIAL'].includes(session.user.role)) {
        return { error: "Unauthorized" };
    }

    try {
        await prisma.serviceOrder.update({
            where: { id: parseInt(id) },
            data: {
                entryInvoiceNumber: data.entryInvoiceNumber,
                serviceInvoiceNumber: data.serviceInvoiceNumber,
                exitInvoiceNumber: data.exitInvoiceNumber,
            }
        });

        revalidatePath('/commercial');
        revalidatePath('/service-orders');
        return { success: true };
    } catch (error) {
        console.error("Error updating commercial details:", error);
        return { error: "Failed to update details" };
    }
}

export async function markDeliveredToExpedition(id) {
    const session = await auth();
    if (!session) {
        return { error: "Não autorizado" };
    }
    
    const userRole = session.user?.role || 'GUEST';
    const isTech = userRole.startsWith('TECH');
    const isAdmin = userRole === 'ADMIN';
    
    if (!isTech && !isAdmin) {
        return { error: "Apenas técnicos podem marcar entrega na expedição" };
    }

    try {
        const os = await prisma.serviceOrder.findUnique({ where: { id: parseInt(id) } });
        if (!os) {
            return { error: 'OS não encontrada.' };
        }

        if (os.status !== 'FINISHED') {
            return { error: 'Apenas OS com status "Concluída" podem ser entregues na expedição.' };
        }

        if (os.deliveredToExpeditionAt) {
            return { error: 'Equipamento já foi marcado como entregue na expedição.' };
        }

        await prisma.serviceOrder.update({
            where: { id: parseInt(id) },
            data: {
                deliveredToExpeditionAt: new Date()
            }
        });

        revalidatePath('/service-orders');
        revalidatePath(`/service-orders/${id}`);
        revalidatePath('/commercial');
        
        return { success: true };
    } catch (error) {
        console.error("Error marking delivered to expedition:", error);
        return { error: 'Erro ao marcar entrega na expedição' };
    }
}

export async function countServiceOrdersByStatus(status) {
    try {
        const where = Array.isArray(status) ? { status: { in: status } } : { status };

        const count = await prisma.serviceOrder.count({
            where
        });
        return count;
    } catch (error) {
        console.error("Error counting service orders:", error);
        return 0;
    }
}
