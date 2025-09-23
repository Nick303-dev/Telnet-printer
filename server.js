import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import db from './db.js';

dotenv.config();
// --- Import organized routes ---
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
// --- Smart static file middleware ---

// --- Create app ---
const app = express();

// --- Middleware ---
app.use(express.json());

// --- Static files (public access) ---
// Login files accessible without authentication
app.use(express.static(path.join(__dirname, 'login/frontend')));

// --- Protected static files with smart middleware ---
// HTML/CSS/JS accessible (protected by client-side guard), other files require auth
app.use('/printer', smartStaticMiddleware(path.join(__dirname, 'printer')));
app.use('/admin', smartStaticMiddleware(path.join(__dirname, 'admin')));
app.use('/public', smartStaticMiddleware(path.join(__dirname, 'public')));

// --- API routes ---
app.use('/', routes);

// --- Serve protected static files ---
app.use('/protected', authMiddleware, express.static(path.join(__dirname, 'protected')));

// --- Root redirect ---
app.get('/', (req, res) => res.redirect('/login.html'));

// --- Avvio server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Connesso a MySQL!');
    console.log(`✅ Server avviato su http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Errore connessione MySQL:', err.message);
  }
});