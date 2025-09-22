// Script per creare un utente di test con password hashata
const bcrypt = require('bcrypt');
const db = require('../db');

async function createTestUser() {
  try {
    // Dati dell'utente di test
    const userData = {
      email: 'admin@test.com',
      password: 'password123', // Password in chiaro che verrà hashata
      role: 'admin',
      status: 'active'
    };

    // Hash della password
    console.log('🔒 Generazione hash della password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    console.log('✅ Password hashata con successo');

    // Query per inserire l'utente
    const query = `
      INSERT INTO users (email, password, role, status) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      password = VALUES(password),
      role = VALUES(role),
      status = VALUES(status)
    `;

    // Esegui la query
    console.log('📝 Inserimento utente nel database...');
    db.query(query, [userData.email, hashedPassword, userData.role, userData.status], (err, results) => {
      if (err) {
        console.error('❌ Errore durante l\'inserimento:', err);
        return;
      }

      console.log('✅ Utente creato con successo!');
      console.log('📧 Email:', userData.email);
      console.log('🔑 Password:', userData.password);
      console.log('👤 Ruolo:', userData.role);
      console.log('📊 Status:', userData.status);
      console.log('🆔 ID utente:', results.insertId || 'esistente (aggiornato)');
      
      // Verifica che l'utente sia stato inserito correttamente
      db.query('SELECT id, email, role, status FROM users WHERE email = ?', [userData.email], (err, results) => {
        if (err) {
          console.error('❌ Errore durante la verifica:', err);
          return;
        }
        
        console.log('\n🔍 Verifica utente inserito:');
        console.log(results[0]);
        
        console.log('\n🎯 Per testare il login usa:');
        console.log('Email: admin@test.com');
        console.log('Password: password123');
        
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui lo script
console.log('🚀 Avvio creazione utente di test...');
createTestUser();