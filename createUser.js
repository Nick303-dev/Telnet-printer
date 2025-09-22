// Script per creare un utente e configurare il database
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connessione al database...');
    
    // Configurazione per connessione diretta (non usando il pool)
    const dbConfig = {
      host: process.env.DB_HOST === 'db' ? 'localhost' : process.env.DB_HOST,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Cbl_Scuola',
      database: process.env.DB_NAME || 'telnet_printer_db',
      port: process.env.DB_PORT || 3306
    };
    
    console.log(`📋 Configurazione DB: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connesso al database MySQL!');

    // Crea la tabella users se non esiste
    console.log('📝 Creazione tabella users...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Tabella users creata/verificata');

    return connection;
  } catch (error) {
    console.error('❌ Errore connessione database:', error.message);
    if (connection) await connection.end();
    throw error;
  }
}

async function createUser(connection, userData) {
  try {
    console.log('🔒 Generazione hash della password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    console.log('✅ Password hashata con successo');

    // Verifica se l'utente esiste già
    const [existing] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?', 
      [userData.email]
    );

    let result;
    if (existing.length > 0) {
      console.log('👤 Utente esistente trovato, aggiornamento...');
      // Aggiorna utente esistente
      const [updateResult] = await connection.execute(
        'UPDATE users SET password = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [hashedPassword, userData.role, userData.status, userData.email]
      );
      result = { insertId: existing[0].id, updated: true };
    } else {
      console.log('👤 Creazione nuovo utente...');
      // Inserisci nuovo utente
      const [insertResult] = await connection.execute(
        'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
        [userData.email, hashedPassword, userData.role, userData.status]
      );
      result = { insertId: insertResult.insertId, updated: false };
    }

    console.log('✅ Utente creato/aggiornato con successo!');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password:', userData.password);
    console.log('👤 Ruolo:', userData.role);
    console.log('📊 Status:', userData.status);
    console.log('🆔 ID utente:', result.insertId);
    console.log('🔄 Operazione:', result.updated ? 'Aggiornato' : 'Creato');

    // Verifica finale
    const [verification] = await connection.execute(
      'SELECT id, email, role, status, created_at FROM users WHERE email = ?', 
      [userData.email]
    );
    
    console.log('\n🔍 Verifica utente nel database:');
    console.log(verification[0]);
    
    return verification[0];

  } catch (error) {
    console.error('❌ Errore durante la creazione utente:', error.message);
    throw error;
  }
}

async function testDatabaseConnection(connection) {
  try {
    console.log('\n🧪 Test connessione database...');
    const [rows] = await connection.execute('SELECT COUNT(*) as user_count FROM users');
    console.log(`📊 Utenti totali nel database: ${rows[0].user_count}`);
    
    const [allUsers] = await connection.execute('SELECT id, email, role, status FROM users');
    console.log('\n👥 Tutti gli utenti:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Errore test database:', error.message);
  }
}

async function main() {
  let connection;
  
  try {
    console.log('🚀 Avvio script creazione utente...\n');
    
    // Setup database
    connection = await setupDatabase();
    
    // Dati dell'utente admin
    const adminUser = {
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    };
    
    // Crea utente admin
    console.log('\n👑 Creazione utente amministratore...');
    await createUser(connection, adminUser);
    
    // Dati dell'utente normale
    const normalUser = {
      email: 'user@test.com', 
      password: 'user123',
      role: 'user',
      status: 'active'
    };
    
    // Crea utente normale
    console.log('\n👤 Creazione utente normale...');
    await createUser(connection, normalUser);
    
    // Test finale
    await testDatabaseConnection(connection);
    
    console.log('\n🎯 Credenziali per il login:');
    console.log('┌─────────────────────────────────────┐');
    console.log('│ ADMIN:                              │');
    console.log('│ Email: admin@test.com               │');
    console.log('│ Password: admin123                  │');
    console.log('├─────────────────────────────────────┤');
    console.log('│ USER:                               │');
    console.log('│ Email: user@test.com                │');
    console.log('│ Password: user123                   │');
    console.log('└─────────────────────────────────────┘');
    console.log('\n🌐 Accedi a: http://localhost:3001');
    
  } catch (error) {
    console.error('💥 Errore generale:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connessione database chiusa');
    }
  }
}

// Esegui lo script
main();