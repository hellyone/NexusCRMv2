'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logger, createErrorResponse, createSuccessResponse } from '@/lib/logger';
import { auth } from '@/auth';

export async function addEquipmentImage(equipmentId, imageUrl) {
    const session = await auth();
    if (!session) {
        return createErrorResponse('Não autorizado');
    }

    try {
        const image = await prisma.equipmentImage.create({
            data: {
                equipmentId: parseInt(equipmentId),
                url: imageUrl,
            }
        });

        logger.info('Imagem adicionada ao equipamento', { equipmentId, imageId: image.id });
        revalidatePath(`/equipments/${equipmentId}`);
        
        return createSuccessResponse({ id: image.id });
    } catch (e) {
        return createErrorResponse('Erro ao adicionar imagem', e, { action: 'addEquipmentImage', equipmentId });
    }
}

export async function deleteEquipmentImage(imageId) {
    const session = await auth();
    if (!session) {
        return createErrorResponse('Não autorizado');
    }

    try {
        const image = await prisma.equipmentImage.findUnique({
            where: { id: parseInt(imageId) },
            include: { equipment: true }
        });

        if (!image) {
            return createErrorResponse('Imagem não encontrada');
        }

        // Delete file from filesystem
        const { unlink } = await import('fs/promises');
        const { join } = await import('path');
        const filepath = join(process.cwd(), 'public', image.url);
        
        try {
            await unlink(filepath);
        } catch (fileError) {
            // File might not exist, continue with DB deletion
            logger.warn('Arquivo não encontrado para exclusão', { filepath });
        }

        await prisma.equipmentImage.delete({
            where: { id: parseInt(imageId) }
        });

        logger.info('Imagem removida do equipamento', { imageId, equipmentId: image.equipmentId });
        revalidatePath(`/equipments/${image.equipmentId}`);
        
        return createSuccessResponse();
    } catch (e) {
        return createErrorResponse('Erro ao remover imagem', e, { action: 'deleteEquipmentImage', imageId });
    }
}

export async function getEquipmentImages(equipmentId) {
    return await prisma.equipmentImage.findMany({
        where: { equipmentId: parseInt(equipmentId) },
        orderBy: { id: 'desc' },
    });
}

