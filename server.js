const express = require('express');
require('dotenv').config();
const path = require('path');
const mysql = require('mysql2');
const db = require('./db.js'); // importa il pool condiviso

// --- Importa router ---
const { router, authMiddleware } = require('./router.js');
const loginRouter = require('./login/backend/route/router.js');

// --- Middleware ---
const app = express();
app.use(express.json());

// --- API routes ---
app.use('/', loginRouter);
app.use('/api', router);
app.use(express.static(path.join(__dirname, '../../public')));

// --- Serve login files without authentication ---
app.use(express.static(path.join(__dirname, 'login/frontend')));

// --- Serve printer.html and other static files WITHOUT server-side auth ---
// L'autenticazione sarà gestita lato client con JavaScript
app.use(express.static(path.join(__dirname)));

// --- Serve protected static files (se necessario) ---
app.use('/public', authMiddleware, express.static(path.join(__dirname, 'public')));

// --- Redirect root to login ---
app.get('/', (req, res) => res.redirect('/login.html'));

// --- Avvio server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Connesso a MySQL!');
    console.log(`✅ Server avviato su http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Errore connessione MySQL:', err.message);
  }
});