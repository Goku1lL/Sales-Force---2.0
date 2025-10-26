const fetch = require('node-fetch');

async function compareEarnings() {
  try {
    // Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'l.gokul@ninjacart.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      console.error('❌ No token received');
      return;
    }

    console.log('✅ Got auth token');

    // Get dashboard summary
    console.log('📊 Getting dashboard summary...');
    const dashboardResponse = await fetch('http://localhost:3000/api/v1/dashboard/summary?employeeId=1761215080220', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const dashboardData = await dashboardResponse.json();
    console.log('📈 Dashboard weekly earnings:', dashboardData.data?.weeklyEarnings);

    // Get leaderboard data
    console.log('🏆 Getting leaderboard data...');
    const leaderboardResponse = await fetch('http://localhost:3000/api/v1/leaderboard/cluster/BLR-Cluster1', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const leaderboardData = await leaderboardResponse.json();
    const userEntry = leaderboardData.data?.find(item => item.employee_id === '1761215080220');
    console.log('🏆 Leaderboard weekly earnings:', userEntry?.weekly_earnings);

    console.log('\n📊 Comparison:');
    console.log('Dashboard:', dashboardData.data?.weeklyEarnings);
    console.log('Leaderboard:', userEntry?.weekly_earnings);
    console.log('Match:', dashboardData.data?.weeklyEarnings === userEntry?.weekly_earnings);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

compareEarnings();
