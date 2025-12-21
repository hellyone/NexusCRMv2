
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start debug...');

    try {
        // 1. Get a client
        const client = await prisma.client.findFirst();
        if (!client) {
            console.log('No client found to test with.');
            return;
        }
        console.log('Using client:', client.id, client.name);

        // 2. Generate Code (mock)
        const code = `AST-TEST-${Date.now()}`;

        // 3. Try to create External OS
        const payload = {
            code: code,
            clientId: client.id,
            technicianId: null,
            equipmentId: null,
            type: 'CORRECTIVE',
            maintenanceArea: 'TECHNICAL_ASSISTANCE',
            serviceLocation: 'EXTERNAL',
            status: 'OPEN',
            priority: 'NORMAL',
            reportedDefect: 'Teste de debug',
            externalEquipmentDescription: 'MÁQUINA TESTE DEBUG',
            serviceZipCode: '00000-000',
            serviceStreet: 'Rua Teste',
            serviceNumber: '123',
            serviceNeighborhood: 'Bairro Teste',
            serviceCity: 'Cidade Teste',
            serviceState: 'SP',
        };

        console.log('Payload:', payload);

        const os = await prisma.serviceOrder.create({
            data: payload
        });

        console.log('OS Created successfully:', os.id, os.code);

    } catch (error) {
        console.error('ERROR CREATING OS:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
