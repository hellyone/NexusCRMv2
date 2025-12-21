
const { createServiceOrder } = require('./src/actions/service-orders');

// Mock FormData
class MockFormData {
    constructor(data) {
        this.data = data;
    }
    entries() {
        return Object.entries(this.data);
    }
}

async function main() {
    console.log('Testing createServiceOrder action...');

    const payloadData = {
        clientId: '1', // String as from generic form data
        technicianId: '',
        equipmentId: '',
        type: 'CORRECTIVE',
        maintenanceArea: 'TECHNICAL_ASSISTANCE',
        serviceLocation: 'EXTERNAL',
        status: 'OPEN',
        priority: 'NORMAL',
        reportedDefect: 'Teste de debug ACTION',
        externalEquipmentDescription: 'MÁQUINA TESTE DEBUG ACTION',
        serviceZipCode: '00000-000',
        serviceStreet: 'Rua Teste',
        serviceNumber: '123',
        serviceNeighborhood: 'Bairro Teste',
        serviceCity: 'Cidade Teste',
        serviceState: 'SP',
    };

    const formData = new MockFormData(payloadData);

    try {
        const result = await createServiceOrder(formData);
        console.log('Result:', result);
    } catch (error) {
        console.error('Action Error:', error);
    }
}

main();
