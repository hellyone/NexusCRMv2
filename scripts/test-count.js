
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCount() {
    try {
        const statuses = ['PRICING', 'WAITING_APPROVAL', 'FINISHED'];
        console.log('Checking counts for statuses:', statuses);

        const count = await prisma.serviceOrder.count({
            where: {
                status: { in: statuses }
            }
        });
        console.log('Total Count:', count);

        const individual = await prisma.serviceOrder.groupBy({
            by: ['status'],
            where: {
                status: { in: statuses }
            },
            _count: {
                _all: true
            }
        });
        console.log('Individual Counts:', individual);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testCount();
