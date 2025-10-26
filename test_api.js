const fetch = require('node-fetch');

async function testDashboard() {
  try {
    // First login to get token
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'l.gokul@ninjacart.com',
        password: 'password'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.error('No token received');
      return;
    }

    // Now call dashboard summary
    const summaryResponse = await fetch('http://localhost:3000/api/v1/dashboard/summary?employeeId=1761215080220', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const summaryData = await summaryResponse.json();
    console.log('Dashboard summary response:', JSON.stringify(summaryData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testDashboard();
