/*
  Usage:
    node scripts/activate_user.js 1761215080220 123456
*/
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const employeeId = Number(process.argv[2] || '1761215080220');
  const plainPassword = String(process.argv[3] || '123456');

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: ['warn']
  });
  try {
    const passwordHash = bcrypt.hashSync(plainPassword, 12);
    const affected = await prisma.$executeRawUnsafe(
      `UPDATE SalesApp_Login SET status = 'active', password_hash = ? WHERE employee_id = ?`,
      passwordHash,
      employeeId
    );
    const rows = await prisma.$queryRawUnsafe(
      `SELECT Id, employee_id, status FROM SalesApp_Login WHERE employee_id = ? LIMIT 1`,
      employeeId
    );
    console.log('Rows affected:', affected);
    console.log('User:', rows);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


