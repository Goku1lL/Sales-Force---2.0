require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient();

async function checkFruitsRetention() {
  try {
    const employeeId = '1761215080220';
    const today = '2025-11-01';
    
    // Calculate current yearweek
    const date = new Date(today);
    const year = date.getFullYear();
    const start = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + start.getDay() + 1) / 7);
    const currentYearweek = year + String(week).padStart(2, '0');
    
    console.log(`\n=== Checking Fruits Retention Data for ${employeeId} ===`);
    console.log(`Today: ${today}`);
    console.log(`Current Yearweek: ${currentYearweek}\n`);
    
    // 1. Check DayTargets - Fruits Retention AB
    console.log('1. DAYTARGETS (Fruits Retention AB):');
    const dayTargets = await prisma.$queryRawUnsafe(
      `SELECT metric, target, slab_Segment, contribution, date
       FROM DayTargets
       WHERE employee_id = ? AND date = ? AND metric LIKE '%Retention%' AND deleted = 0`,
      employeeId, today
    );
    console.log(`   Found: ${dayTargets.length} records`);
    dayTargets.forEach(item => {
      console.log(`   - ${item.metric}: target=${item.target}, slab=${item.slab_Segment}, contribution=${item.contribution}`);
    });
    
    // 2. Check WeekTargets - Fruits Retention AB (for current week)
    console.log(`\n2. WEEKTARGETS (Fruits Retention AB - Week ${currentYearweek}):`);
    const weekTargets = await prisma.$queryRawUnsafe(
      `SELECT metric, target, slab_Segment, contribution, yearweek
       FROM WeekTargets
       WHERE employee_id = ? AND yearweek = ? AND metric LIKE '%Retention%' AND deleted = 0`,
      employeeId, currentYearweek
    );
    console.log(`   Found: ${weekTargets.length} records for week ${currentYearweek}`);
    if (weekTargets.length === 0) {
      console.log('   ❌ No data for current week!');
      
      // Check what weeks have data
      const allWeeks = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT yearweek FROM WeekTargets 
         WHERE employee_id = ? AND metric LIKE '%Retention%' AND deleted = 0 
         ORDER BY yearweek DESC`,
        employeeId
      );
      if (allWeeks.length > 0) {
        console.log('   📅 Available weeks with Fruits Retention data:');
        allWeeks.forEach(row => {
          console.log(`      - ${row.yearweek}`);
        });
      } else {
        console.log('   ❌ No Fruits Retention data in WeekTargets for any week');
      }
    } else {
      weekTargets.forEach(item => {
        console.log(`   ✅ ${item.metric}: target=${item.target}, slab=${item.slab_Segment}, contribution=${item.contribution}`);
      });
    }
    
    // 3. Check all metrics for this employee (current week)
    console.log(`\n3. ALL METRICS (Week ${currentYearweek}):`);
    const allMetrics = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT metric FROM WeekTargets 
       WHERE employee_id = ? AND yearweek = ? AND deleted = 0`,
      employeeId, currentYearweek
    );
    console.log(`   Found ${allMetrics.length} metrics:`);
    allMetrics.forEach(row => {
      console.log(`   - ${row.metric}`);
    });
    
    // 4. Check exact metric name variations
    console.log('\n4. METRIC NAME VARIATIONS:');
    const variations = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT metric FROM WeekTargets 
       WHERE employee_id = ? AND (metric LIKE '%Retention%' OR metric LIKE '%AB%') AND deleted = 0
       LIMIT 10`,
      employeeId
    );
    if (variations.length > 0) {
      console.log('   Found metric variations:');
      variations.forEach(row => {
        console.log(`   - "${row.metric}"`);
      });
    } else {
      console.log('   ❌ No Retention or AB metrics found');
    }
    
    // 5. Check what the API would return
    console.log('\n5. API BEHAVIOR:');
    console.log(`   Endpoint: /api/v1/leaderboard/employee-details/${employeeId}`);
    console.log(`   Week Query: WHERE employee_id = ? AND yearweek = ?`);
    console.log(`   Current Yearweek: ${currentYearweek}`);
    
    if (weekTargets.length === 0) {
      console.log('   ❌ API will return NO Fruits Retention data');
      console.log('   💡 Reason: No WeekTargets for current week (202544)');
      console.log('   📊 Performance Overview filters AB metrics from weekly data');
      console.log('   🔍 Since no weekly data exists, metric won\'t show');
    } else {
      console.log('   ✅ API should return Fruits Retention data');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFruitsRetention();

