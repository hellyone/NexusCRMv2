'use server';

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Checks for expiring client documents/certifications and generates notifications.
 * Should be called periodically or on admin dashboard load.
 */
export async function checkDocumentExpirations() {
    try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 45); // Check up to 45 days ahead (covers most 30 day alerts)

        // Find documents expiring soon that haven't been alerted recently (simplification: just find all for now)
        // We need to check if a notification already exists for this specific document and user to avoid spam.
        // For MVP: We will fetch all expiring and then filter in memory/check DB if notification exists.

        const expiringDocs = await prisma.clientCertification.findMany({
            where: {
                expiresAt: {
                    gte: today,
                    lte: futureDate
                }
            },
            include: {
                client: { select: { name: true } },
                technician: {
                    select: {
                        name: true,
                        user: { select: { id: true } }
                    }
                }
            }
        });

        let createdCount = 0;

        for (const doc of expiringDocs) {
            const daysUntil = Math.ceil((doc.expiresAt - today) / (1000 * 60 * 60 * 24));

            // Should we alert?
            if (daysUntil > doc.alertDays) continue;

            const title = `Documento Vencendo: ${doc.name}`;
            const message = `O documento ${doc.name} do cliente ${doc.client.name} vence em ${daysUntil} dias (${doc.expiresAt.toLocaleDateString('pt-BR')}).`;
            const type = daysUntil <= 5 ? 'ERROR' : 'WARNING';
            const link = `/clients`; // Could be deep link to client edit

            // 1. Alert Admins/Backoffice
            const admins = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'BACKOFFICE'] },
                    isActive: true
                }
            });

            for (const admin of admins) {
                // Idempotency check: Look for unread notification with same title/message for this user created recently
                // Or better, maybe we hash the doc ID in the message or have a ref (Notification model doesn't have ref yet)
                // Let's use a unique key in content to avoid duplicates for today
                const duplicate = await prisma.notification.findFirst({
                    where: {
                        userId: admin.id,
                        message: message,
                        read: false
                    }
                });

                if (!duplicate) {
                    await prisma.notification.create({
                        data: {
                            userId: admin.id,
                            type,
                            title,
                            message,
                            link
                        }
                    });
                    createdCount++;
                }
            }

            // 2. Alert Technician (if linked)
            if (doc.technician && doc.technician.user && doc.technician.user.id) {
                // Check if tech is not an admin (already alerted) to avoid double? 
                // Usually distinct, but good safe guard.

                const techUserId = doc.technician.user.id;

                const duplicateTech = await prisma.notification.findFirst({
                    where: {
                        userId: techUserId,
                        message: message,
                        read: false
                    }
                });

                if (!duplicateTech) {
                    await prisma.notification.create({
                        data: {
                            userId: techUserId,
                            type,
                            title,
                            message,
                            link
                        }
                    });
                    createdCount++;
                }
            }
        }

        if (createdCount > 0) {
            console.log(`[Job] Generated ${createdCount} expiration notifications.`);
        }

        return { success: true, count: createdCount };

    } catch (error) {
        console.error('Error checking document expirations:', error);
        logger.error('Error checking document expirations', error);
        return { error: error.message };
    }
}
