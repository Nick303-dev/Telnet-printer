// Script per testare il login degli utenti creati
const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testLogin(email, password) {
  try {
    console.log(`🔐 Test login per: ${email}`);
    
    const postData = JSON.stringify({
      email,
      password,
      rememberMe: false
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 200) {
      console.log('✅ Login riuscito!');
      console.log('📄 Risposta:', response.data);
      return true;
    } else {
      console.log('❌ Login fallito!');
      console.log('📊 Status Code:', response.statusCode);
      console.log('📄 Risposta:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Errore di connessione!');
    console.log('📄 Errore:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Test login utenti...\n');
  
  // Test admin login
  console.log('👑 Test Admin Login:');
  await testLogin('admin@test.com', 'admin123');
  
  console.log('\n👤 Test User Login:');
  await testLogin('user@test.com', 'user123');
  
  console.log('\n❌ Test Wrong Password:');
  await testLogin('admin@test.com', 'wrongpassword');
}

main();