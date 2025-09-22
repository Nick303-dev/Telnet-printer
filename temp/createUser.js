const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createUser() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const email = 'admin@example.com';  // usa email invece di username
  const plainPassword = 'admin123';   // password di test
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const [result] = await connection.execute(
      'INSERT INTO USERS (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
    console.log('✅ Utente creato con ID:', result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('⚠️ Utente già esistente!');
    } else {
      console.error('Errore creazione utente:', err.message);
    }
  } finally {
    await connection.end();
  }
}

createUser();
