'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validate, userSchema, sanitizeObject } from '@/lib/validation';
import { logger, createErrorResponse, createSuccessResponse } from '@/lib/logger';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

/**
 * Verifica se o usuário atual tem permissão de ADMIN
 */
async function requireAdmin() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        throw new Error('Acesso negado. Apenas administradores podem gerenciar usuários.');
    }
    return session.user;
}

export async function getUsers({ query = '', page = 1, role = null, activeOnly = false } = {}) {
    await requireAdmin();

    const ITEMS_PER_PAGE = 10;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where = {
        AND: [
            activeOnly ? { isActive: true } : {},
            role ? { role } : {},
            {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                ],
            },
        ],
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                technician: {
                    select: { id: true, name: true }
                }
            },
            skip,
            take: ITEMS_PER_PAGE,
            orderBy: { name: 'asc' },
        }),
        prisma.user.count({ where }),
    ]);

    // Remove senha dos resultados
    const safeUsers = users.map(({ password, ...user }) => user);

    return {
        users: safeUsers,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
        currentPage: page,
    };
}

export async function getUser(id) {
    await requireAdmin();

    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
            technician: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    if (!user) return null;

    // Remove senha
    const { password, ...safeUser } = user;
    return safeUser;
}

export async function createUser(formData) {
    await requireAdmin();

    const rawData = Object.fromEntries(formData.entries());

    // Convert boolean fields
    if (rawData.isActive === 'true') rawData.isActive = true;
    if (rawData.isActive === 'false') rawData.isActive = false;

    const sanitizedData = sanitizeObject(rawData);

    // Validate User Portion
    const userValidation = validate(userSchema, sanitizedData);
    if (!userValidation.success) {
        return createErrorResponse(userValidation.error);
    }

    const userData = userValidation.data;

    // Check username duplication
    const existingUser = await prisma.user.findUnique({ where: { username: userData.username } });
    if (existingUser) return createErrorResponse('Nome de usuário já está em uso.');

    // Check email duplication only if provided
    if (userData.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: userData.email } });
        if (existingEmail) return createErrorResponse('Email já está em uso.');
    }

    // Hash password
    let hashedPassword = null;
    if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
    } else {
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        hashedPassword = await bcrypt.hash(tempPassword, 10);
        logger.warn('Usuário criado sem senha, senha temporária gerada', { username: userData.username });
    }

    try {
        // Transaction: Create Technician -> Create User linked to it
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Technician
            const newTech = await tx.technician.create({
                data: {
                    name: userData.name,
                    email: userData.email || null,
                    phone: sanitizedData.phone || null,
                    whatsapp: sanitizedData.whatsapp || null,
                    document: sanitizedData.document || null,
                    professionalId: sanitizedData.professionalId || null,
                    specialty: sanitizedData.specialty || null,
                    costPerHour: sanitizedData.costPerHour ? parseFloat(sanitizedData.costPerHour) : 0,
                    isActive: userData.isActive !== undefined ? userData.isActive : true,
                }
            });

            // 2. Create User linked to Technician
            const newUser = await tx.user.create({
                data: {
                    name: userData.name,
                    username: userData.username,
                    email: userData.email || null,
                    password: hashedPassword,
                    role: userData.role || 'TECH_FIELD',
                    technicianId: newTech.id, // Link to the new technician
                    specialties: userData.specialties || null,
                    isActive: userData.isActive !== undefined ? userData.isActive : true,
                }
            });

            return newUser;
        });

        logger.info('Usuário e Técnico criados com sucesso (Equipe)', { userId: result.id, username: result.username });
        revalidatePath('/users');

        return createSuccessResponse({ id: result.id });
    } catch (e) {
        return createErrorResponse('Erro ao criar membro da equipe', e, { action: 'createUser' });
    }
}

export async function updateUser(id, formData) {
    await requireAdmin();

    const rawData = Object.fromEntries(formData.entries());

    // Convert boolean fields
    if (rawData.isActive === 'true') rawData.isActive = true;
    if (rawData.isActive === 'false') rawData.isActive = false;

    const sanitizedData = sanitizeObject(rawData);

    // Validate with Zod (password is optional on update)
    const validation = validate(userSchema.partial(), sanitizedData);
    if (!validation.success) {
        return createErrorResponse(validation.error);
    }

    let data = validation.data;

    // Convert specialties array to JSON string if needed
    if (Array.isArray(data.specialties)) {
        data.specialties = JSON.stringify(data.specialties);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: { technician: true } // Need to know linked tech
    });

    if (!existing) {
        return createErrorResponse('Usuário não encontrado.');
    }

    // Check username uniqueness if changed
    if (data.username && data.username !== existing.username) {
        const usernameInUse = await prisma.user.findUnique({
            where: { username: data.username }
        });
        if (usernameInUse) return createErrorResponse('Nome de usuário já está em uso.');
    }

    // Check email uniqueness if provided and changed
    if (data.email && data.email !== existing.email) {
        const emailInUse = await prisma.user.findFirst({
            where: {
                email: data.email,
                NOT: { id: parseInt(id) }
            }
        });

        if (emailInUse) {
            return createErrorResponse('Email já está em uso por outro usuário.');
        }
    }

    try {
        const payload = {
            name: data.name,
            username: data.username,
            email: data.email || null,
            role: data.role,
            specialties: data.specialties || null,
            isActive: data.isActive,
        };

        // Only update password if provided
        if (data.password && data.password.trim() !== '') {
            payload.password = await bcrypt.hash(data.password, 10);
        }

        // Transaction: Update User -> Update Technician
        await prisma.$transaction(async (tx) => {
            // 1. Update User
            await tx.user.update({
                where: { id: parseInt(id) },
                data: payload
            });

            // 2. Update Linked Technician (if exists)
            if (existing.technicianId) {
                await tx.technician.update({
                    where: { id: existing.technicianId },
                    data: {
                        name: data.name, // Sync Name
                        email: data.email || null, // Sync Email
                        phone: sanitizedData.phone ?? undefined,
                        whatsapp: sanitizedData.whatsapp ?? undefined,
                        document: sanitizedData.document ?? undefined,
                        professionalId: sanitizedData.professionalId ?? undefined,
                        specialty: sanitizedData.specialty ?? undefined,
                        costPerHour: sanitizedData.costPerHour ? parseFloat(sanitizedData.costPerHour) : undefined,
                        isActive: data.isActive
                    }
                });
            }
        });

        logger.info('Usuário e Técnico atualizados com sucesso', { userId: id });
        revalidatePath('/users');
        revalidatePath(`/users/${id}`);

        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao atualizar membro da equipe', e, { action: 'updateUser', userId: id });
    }
}

export async function toggleUserStatus(id) {
    await requireAdmin();

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
        return createErrorResponse('Usuário não encontrado.');
    }

    // Prevent deactivating yourself
    const session = await auth();
    if (session?.user?.id === parseInt(id)) {
        return createErrorResponse('Você não pode desativar sua própria conta.');
    }

    try {
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { isActive: !user.isActive }
        });

        logger.info('Status do usuário alterado', { userId: id, newStatus: !user.isActive });
        revalidatePath('/users');

        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao alterar status do usuário', e, { action: 'toggleUserStatus', userId: id });
    }
}

export async function deleteUser(id) {
    await requireAdmin();

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
        return createErrorResponse('Usuário não encontrado.');
    }

    // Prevent deleting yourself
    const session = await auth();
    if (session?.user?.id === parseInt(id)) {
        return createErrorResponse('Você não pode excluir sua própria conta.');
    }

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        logger.info('Usuário excluído', { userId: id, email: user.email });
        revalidatePath('/users');

        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao excluir usuário', e, { action: 'deleteUser', userId: id });
    }
}

export async function getUsersForSelect() {
    const session = await auth();
    if (!session) return [];

    return await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
    });
}

export async function getTechniciansForUserSelect() {
    return await prisma.technician.findMany({
        where: {
            isActive: true,
            user: null // Only technicians without user account
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
    });
}

