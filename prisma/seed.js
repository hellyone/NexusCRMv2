const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Hash for password 'password' (bcrypt cost 10)
    // Generated offline to avoid 'bcryptjs' dependency in Alpine Docker container
    const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'Administrador',
            username: 'admin',
            email: 'admin@nexus.local',
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
