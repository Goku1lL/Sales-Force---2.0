import { PrismaClient } from '@prisma/client';

// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function queryCustomerTables() {
  try {
    console.log('\n=== Querying Customer Tables ===\n');

    // 1. SA_HomePageTargetCustomers
    console.log('📊 SA_HomePageTargetCustomers:');
    const targetCustomers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT employee_id) as unique_employees,
        COUNT(DISTINCT customer_id) as unique_customers,
        MIN(created_at) as oldest_record,
        MAX(created_at) as newest_record
      FROM SA_HomePageTargetCustomers
      WHERE deleted = 0`
    );
    console.log('Summary:', JSON.stringify(targetCustomers[0], (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    const sampleTargetCustomers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        LastOrder,
        description,
        Priority,
        created_at,
        updated_at
      FROM SA_HomePageTargetCustomers
      WHERE deleted = 0
      ORDER BY created_at DESC
      LIMIT 5`
    );
    console.log('\nSample records (latest 5):');
    sampleTargetCustomers.forEach((row, i) => {
      console.log(`\n${i + 1}.`, JSON.stringify(row, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    });

    // 2. SA_HomePageAppFunnelCustomers
    console.log('\n\n📊 SA_HomePageAppFunnelCustomers:');
    const funnelCustomers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        COUNT(*) as total_count,
        COUNT(DISTINCT employee_id) as unique_employees,
        COUNT(DISTINCT customer_id) as unique_customers,
        MIN(LastOpened) as oldest_last_opened,
        MAX(LastOpened) as newest_last_opened
      FROM SA_HomePageAppFunnelCustomers`
    );
    console.log('Summary:', JSON.stringify(funnelCustomers[0], (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    const sampleFunnelCustomers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 
        Id,
        employee_id,
        customer_id,
        customername,
        contactnumber,
        LastOpened,
        description,
        Priority
      FROM SA_HomePageAppFunnelCustomers
      ORDER BY LastOpened DESC
      LIMIT 5`
    );
    console.log('\nSample records (latest 5):');
    sampleFunnelCustomers.forEach((row, i) => {
      console.log(`\n${i + 1}.`, JSON.stringify(row, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    });

    // 3. SA_CustomerPageCustomers (check if exists)
    console.log('\n\n📊 SA_CustomerPageCustomers:');
    try {
      const customerPageCustomers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          COUNT(*) as total_count,
          COUNT(DISTINCT employee_id) as unique_employees,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM SA_CustomerPageCustomers`
      );
      console.log('Summary:', JSON.stringify(customerPageCustomers[0], (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));

      const sampleCustomerPage = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM SA_CustomerPageCustomers LIMIT 5`
      );
      console.log('\nSample records (first 5):');
      sampleCustomerPage.forEach((row, i) => {
        console.log(`\n${i + 1}.`, JSON.stringify(row, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
      });
    } catch (err: any) {
      console.log('❌ Table does not exist or error:', err.message);
    }

    // Check table structure
    console.log('\n\n=== Table Structures ===\n');
    
    const targetStructure = await prisma.$queryRawUnsafe<any[]>(
      `DESCRIBE SA_HomePageTargetCustomers`
    );
    console.log('SA_HomePageTargetCustomers structure:');
    console.table(targetStructure);

    const funnelStructure = await prisma.$queryRawUnsafe<any[]>(
      `DESCRIBE SA_HomePageAppFunnelCustomers`
    );
    console.log('\nSA_HomePageAppFunnelCustomers structure:');
    console.table(funnelStructure);

    try {
      const customerPageStructure = await prisma.$queryRawUnsafe<any[]>(
        `DESCRIBE SA_CustomerPageCustomers`
      );
      console.log('\nSA_CustomerPageCustomers structure:');
      console.table(customerPageStructure);
    } catch (err: any) {
      console.log('\n❌ SA_CustomerPageCustomers structure: Table does not exist');
    }

  } catch (error) {
    console.error('Error querying tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryCustomerTables();

