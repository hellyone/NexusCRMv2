/**
 * Redefine a senha do usuário admin para "password".
 * Uso: node scripts/reset-admin-password.js
 * Requer: DATABASE_URL no .env (ou variável de ambiente)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const newPassword = 'password';
    const hash = await bcrypt.hash(newPassword, 10); // mesmo bcryptjs do app

    const admin = await prisma.user.update({
        where: { username: 'admin' },
        data: { password: hash, failedAttempts: 0, lockedUntil: null },
    });

    console.log('Senha do admin redefinida com sucesso.');
    console.log('Login:', admin.username);
    console.log('Nova senha:', newPassword);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
