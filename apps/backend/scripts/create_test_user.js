const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://datalake_trw:Tedd@13332!wq23@116.202.114.156:3971/datalake",
    },
  },
});

async function createTestUser() {
  try {
    const password_hash = await bcrypt.hash('123456', 12);
    const employeeId = Date.now();
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO SalesApp_Login (employee_id, password_hash, full_name, email, role, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
      employeeId, password_hash, 'Test User', 'test@example.com', 'executive'
    );
    
    console.log(`✅ Test user created successfully!`);
    console.log(`📧 Email: test@example.com`);
    console.log(`🔑 Password: 123456`);
    console.log(`🆔 Employee ID: ${employeeId}`);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
