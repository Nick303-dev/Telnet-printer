const express = require('express');
const path = require('path');
const routes = require('../routes');
const { authMiddleware } = require('../middleware/auth');
const fetch = require('node-fetch');

const app = express();

// Simulate the fixed server configuration
app.use(express.json());

// Static files (public access) - only login
app.use(express.static(path.join(__dirname, 'login/frontend')));

// Protected static files (require authentication)
app.use('/printer', authMiddleware, express.static(path.join(__dirname, 'printer')));
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));
app.use('/public', authMiddleware, express.static(path.join(__dirname, 'public')));

// API routes
app.use('/', routes);

// Root redirect
app.get('/', (req, res) => res.redirect('/login.html'));

const server = app.listen(3005, () => {
  console.log('🔒 Testing complete security setup on http://localhost:3005');
  runSecurityTests();
});

async function runSecurityTests() {
  console.log('\n=== SECURITY TESTS ===\n');
  
  // Test 1: Dashboard access without authentication should be DENIED
  console.log('1️⃣ Testing dashboard access WITHOUT authentication...');
  try {
    const response = await fetch('http://localhost:3005/printer/public/index.html');
    if (response.status === 401) {
      console.log('✅ GOOD: Dashboard correctly protected (401)');
    } else if (response.status === 200) {
      console.log('❌ BAD: Dashboard accessible without auth - SECURITY BREACH!');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('Error testing dashboard access:', error.message);
  }
  
  // Test 2: Wrong login credentials should be REJECTED
  console.log('\n2️⃣ Testing login with WRONG credentials...');
  try {
    const response = await fetch('http://localhost:3005/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hacker@evil.com',
        password: 'wrongpassword'
      })
    });
    
    if (response.status === 401) {
      console.log('✅ GOOD: Wrong credentials rejected (401)');
    } else if (response.status === 200) {
      console.log('❌ BAD: Wrong credentials accepted - SECURITY BREACH!');
    } else if (response.status === 500) {
      console.log('⚠️  Server error (probably DB connection) - but NOT a login bypass');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('Error testing wrong login:', error.message);
  }
  
  // Test 3: API endpoints should require authentication
  console.log('\n3️⃣ Testing API access WITHOUT authentication...');
  try {
    const response = await fetch('http://localhost:3005/api/verify-token');
    if (response.status === 401) {
      console.log('✅ GOOD: API correctly protected (401)');
    } else if (response.status === 200) {
      console.log('❌ BAD: API accessible without auth - SECURITY BREACH!');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('Error testing API access:', error.message);
  }
  
  // Test 4: Login page should be accessible
  console.log('\n4️⃣ Testing login page access...');
  try {
    const response = await fetch('http://localhost:3005/login.html');
    if (response.status === 200) {
      console.log('✅ GOOD: Login page accessible');
    } else {
      console.log(`❌ BAD: Login page not accessible (${response.status})`);
    }
  } catch (error) {
    console.log('Error testing login page:', error.message);
  }
  
  console.log('\n🏁 Security tests completed');
  server.close();
  process.exit(0);
}

setTimeout(() => {
  console.log('Test timeout');
  server.close();
  process.exit(1);
}, 15000);