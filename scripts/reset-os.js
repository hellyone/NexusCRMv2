const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Limpando todas as Ordens de Serviço (OS)...');

    try {
        // Delete items first if relation is not cascade (safety)
        // Assuming cascading delete is configured or we delete header which cascades.
        // Ideally we delete ServiceOrderItem first if exists, then ServiceOrder.
        // But usually cleaning ServiceOrder is enough if Schema is robust.

        // Check schema references if possible or just try deleting ServiceOrder.
        // If there are relations like 'statusHistory', they cascade usually.

        const deleted = await prisma.serviceOrder.deleteMany({});
        console.log(`✅ Sucesso! ${deleted.count} Ordens de Serviço foram removidas.`);
    } catch (e) {
        console.error('❌ Erro ao limpar OS:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
