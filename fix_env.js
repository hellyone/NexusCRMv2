const fs = require('fs');
const path = require('path');

const envContent = `DATABASE_URL="file:./dev.db"
AUTH_SECRET="simples_secret_dev_123"`;

fs.writeFileSync(path.join(process.cwd(), '.env'), envContent, 'utf8');
console.log('.env file recreated successfully');
