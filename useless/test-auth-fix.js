const express = require('express');
const routes = require('../routes');

const app = express();
app.use(express.json());
app.use('/', routes);

const server = app.listen(3003, () => {
  console.log('🧪 Testing authentication behavior on http://localhost:3003');
  
  // Test with wrong credentials
  testLogin();
});

async function testLogin() {
  const fetch = require('node-fetch');
  
  console.log('\n1️⃣ Testing with WRONG credentials...');
  try {
    const response = await fetch('http://localhost:3003/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpassword',
        rememberMe: false
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.status === 401) {
      console.log('✅ GOOD: Wrong credentials correctly rejected with 401');
    } else if (response.status === 200) {
      console.log('❌ BAD: Wrong credentials accepted with 200 - SECURITY ISSUE!');
    } else {
      console.log(`⚠️  UNEXPECTED: Status ${response.status}`);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  // Test token verification with invalid token
  console.log('\n2️⃣ Testing token verification with INVALID token...');
  try {
    const response = await fetch('http://localhost:3003/api/verify-token', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-here',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Token verification status:', response.status);
    console.log('Token verification data:', data);
    
    if (response.status === 401) {
      console.log('✅ GOOD: Invalid token correctly rejected with 401');
    } else if (response.status === 200) {
      console.log('❌ BAD: Invalid token accepted with 200 - SECURITY ISSUE!');
    } else {
      console.log(`⚠️  UNEXPECTED: Status ${response.status}`);
    }
    
  } catch (error) {
    console.error('Token test error:', error.message);
  }
  
  console.log('\n🏁 Test completed');
  server.close();
  process.exit(0);
}

setTimeout(() => {
  console.log('Test timeout');
  server.close();
  process.exit(1);
}, 10000);