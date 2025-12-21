'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateCPF } from '@/utils/validators';

export async function getTechnicians({ query = '', page = 1, activeOnly = true } = {}) {
    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            activeOnly ? { isActive: true } : {},
            {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                    { professionalId: { contains: query } },
                ],
            },
        ],
    };

    const [technicians, total] = await Promise.all([
        prisma.technician.findMany({
            where,
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' },
        }),
        prisma.technician.count({ where }),
    ]);

    return {
        technicians,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getTechnician(id) {
    return await prisma.technician.findUnique({
        where: { id: parseInt(id) },
    });
}

export async function createTechnician(formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) return { error: 'Nome é obrigatório.' };

    if (data.document) {
        const cleanDoc = data.document.replace(/\D/g, '');
        if (!validateCPF(cleanDoc)) {
            return { error: 'CPF inválido.' };
        }
        // Store cleaned or original? Let's clean it here like Clients
        // Actually let's just validate.
    }

    try {
        const payload = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            document: data.document || null,
            professionalId: data.professionalId || null,
            specialty: data.specialty || null,
            certifications: data.certifications || null,
            costPerHour: parseFloat(data.costPerHour) || 0,
            hireDate: data.hireDate ? new Date(data.hireDate) : null,
            isActive: true,
        };

        // Check Email Duplicate
        if (payload.email) {
            const existing = await prisma.technician.findUnique({ where: { email: payload.email } });
            if (existing) return { error: `E-mail ${payload.email} já cadastrado.` };
        }

        await prisma.technician.create({ data: payload });
        revalidatePath('/technicians');
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao criar técnico: ' + e.message };
    }
}

export async function updateTechnician(id, formData) {
    const data = Object.fromEntries(formData.entries());

    if (!data.name) return { error: 'Nome é obrigatório.' };

    if (data.document) {
        const cleanDoc = data.document.replace(/\D/g, '');
        if (!validateCPF(cleanDoc)) {
            return { error: 'CPF inválido.' };
        }
    }

    try {
        const payload = {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            document: data.document || null,
            professionalId: data.professionalId || null,
            specialty: data.specialty || null,
            certifications: data.certifications || null,
            costPerHour: parseFloat(data.costPerHour) || 0,
            hireDate: data.hireDate ? new Date(data.hireDate) : null,
            isActive: data.isActive === 'true',
        };

        // Check Email Duplicate
        if (payload.email) {
            const existing = await prisma.technician.findFirst({
                where: {
                    email: payload.email,
                    NOT: { id: parseInt(id) }
                }
            });
            if (existing) return { error: `E-mail ${payload.email} já cadastrado.` };
        }

        await prisma.technician.update({
            where: { id: parseInt(id) },
            data: payload,
        });

        revalidatePath('/technicians');
        revalidatePath(`/technicians/${id}`);
        return { success: true };
    } catch (e) {
        return { error: 'Erro ao atualizar: ' + e.message };
    }
}

export async function getTechniciansForSelect() {
    return await prisma.technician.findMany({
        where: { isActive: true },
        select: { id: true, name: true, specialty: true },
        orderBy: { name: 'asc' },
    });
}
