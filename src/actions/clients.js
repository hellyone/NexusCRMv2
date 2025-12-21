'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateCPF, validateCNPJ, formatDocument } from '@/utils/validators';
import { validate, clientSchema, sanitizeObject } from '@/lib/validation';
import { logger, createErrorResponse, createSuccessResponse } from '@/lib/logger';

export async function getClients({ query = '', page = 1, status = 'active' } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            {
                OR: [
                    { name: { contains: query } },
                    { document: { contains: query } },
                    { city: { contains: query } },
                ],
            },
            status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {},
        ],
    };

    const [clients, total] = await Promise.all([
        prisma.client.findMany({
            where,
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' },
        }),
        prisma.client.count({ where }),
    ]);

    return {
        clients,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getClient(id) {
    return await prisma.client.findUnique({
        where: { id: parseInt(id) },
    });
}

// Helper to separate certifications
function extractCertifications(data) {
    const { certifications, ...rest } = data;
    // Map certifications to clean data
    const cleanCerts = (certifications || []).map(c => ({
        name: c.name,
        code: c.code || null,
        issuedAt: c.issuedAt ? new Date(c.issuedAt) : null,
        expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
        alertDays: parseInt(c.alertDays) || 30,
        technicianId: c.technicianId ? parseInt(c.technicianId) : null,
    }));
    return { cleanCerts, clientData: rest };
}

export async function createClient(formData) {
    const rawData = Object.fromEntries(formData.entries());

    // Parse specific fields
    if (rawData.isActive === 'true') rawData.isActive = true;
    if (rawData.isActive === 'false') rawData.isActive = false;

    // Parse certifications from JSON if string
    if (typeof rawData.certifications === 'string') {
        try {
            rawData.certifications = JSON.parse(rawData.certifications);
        } catch (e) {
            rawData.certifications = [];
        }
    }

    // Sanitize input
    const sanitizedData = sanitizeObject(rawData);

    // Validate with Zod schema
    const validation = validate(clientSchema, sanitizedData);
    if (!validation.success) {
        return { error: validation.error, fieldErrors: validation.errors };
    }

    const { cleanCerts, clientData } = extractCertifications(validation.data);

    // Additional business logic validation: CPF/CNPJ
    const cleanDoc = clientData.document.replace(/\D/g, '');
    const isValidDoc = clientData.personType === 'PF' ? validateCPF(cleanDoc) : validateCNPJ(cleanDoc);

    if (!isValidDoc) {
        const errorMsg = `Documento ${clientData.personType} inválido.`;
        return {
            error: errorMsg,
            fieldErrors: [{ path: 'document', message: errorMsg }]
        };
    }

    try {
        const client = await prisma.client.create({
            data: {
                ...clientData,
                certifications: {
                    create: cleanCerts
                }
            },
        });

        revalidatePath('/clients');
        return { success: true, data: client };
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === 'P2002') {
            return { error: 'Já existe um cliente com este Documento (CPF/CNPJ).' };
        }
        return { error: 'Erro ao criar cliente. Tente novamente.' };
    }
}

export async function updateClient(id, formData) {
    const rawData = Object.fromEntries(formData.entries());

    // Parse boolean fields from FormData
    if (rawData.isActive === 'true') rawData.isActive = true;
    if (rawData.isActive === 'false') rawData.isActive = false;

    // Parse certifications from JSON if string
    if (typeof rawData.certifications === 'string') {
        try {
            rawData.certifications = JSON.parse(rawData.certifications);
        } catch (e) {
            rawData.certifications = [];
        }
    }

    // Sanitize input
    const sanitizedData = sanitizeObject(rawData);

    // Validate with Zod schema
    const validation = validate(clientSchema, sanitizedData);
    if (!validation.success) {
        return { error: validation.error, fieldErrors: validation.errors };
    }

    const { cleanCerts, clientData } = extractCertifications(validation.data);

    try {
        await prisma.client.update({
            where: { id: parseInt(id) },
            data: {
                ...clientData,
                certifications: {
                    deleteMany: {}, // Wipe existing and re-create (simplest strategy for now)
                    create: cleanCerts
                }
            },
        });

        revalidatePath('/clients');
        revalidatePath(`/clients/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        if (error.code === 'P2002') {
            return { error: 'Já existe um cliente com este Documento (CPF/CNPJ).' };
        }
        return { error: 'Erro ao atualizar cliente. Tente novamente.' };
    }
}

export async function toggleClientStatus(id) {
    const client = await prisma.client.findUnique({ where: { id: parseInt(id) } });
    if (!client) return { error: 'Cliente não encontrado.' };

    await prisma.client.update({
        where: { id: parseInt(id) },
        data: { isActive: !client.isActive },
    });
    revalidatePath('/clients');
    return { success: true };
}

export async function getClientsForSelect() {
    const clients = await prisma.client.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    });
    return clients;
}

export async function deleteClient(id) {
    // 1. Check Auth & Role
    const { auth } = await import('@/auth');
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
        return { error: 'Acesso negado. Apenas administradores podem excluir clientes.' };
    }

    try {
        // 2. Check for dependencies (Service Orders, Equipments)
        const client = await prisma.client.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { serviceOrders: true, equipments: true }
                }
            }
        });

        if (!client) return { error: 'Cliente não encontrado.' };

        if (client._count.serviceOrders > 0) {
            return { error: 'Não é possível excluir: Cliente possui Ordens de Serviço vinculadas.' };
        }

        if (client._count.equipments > 0) {
            return { error: 'Não é possível excluir: Cliente possui Equipamentos vinculados.' };
        }

        // 3. Delete
        await prisma.client.delete({
            where: { id: parseInt(id) },
        });

        revalidatePath('/clients');
        return { success: true };
    } catch (e) {
        return createErrorResponse('Erro ao excluir cliente', e, { action: 'deleteClient', clientId: id });
    }
}
