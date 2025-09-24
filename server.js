import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
// --- Import organized routes ---
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';

// --- Protected static file middleware ---
// All protected static files require authentication

// --- Create app ---
const app = express();

// --- Middleware ---
app.use(express.json());

// --- Static files (public access) ---
// Login files accessible without authentication
app.use(express.static(path.join(__dirname, 'login/frontend')));

// --- API routes (must come before static files to avoid conflicts) ---
app.use('/', routes);


// --- Protected static files (require authentication for ALL files) ---
app.use('/printer', authMiddleware, express.static(path.join(__dirname, 'printer')));
app.use('/admin', authMiddleware, express.static(path.join(__dirname, 'admin')));
app.use('/public', authMiddleware, express.static(path.join(__dirname, 'public')));
app.use('/protected', authMiddleware, express.static(path.join(__dirname, 'protected')));
app.use('/profile', authMiddleware, express.static(path.join(__dirname, 'profile')));
// --- Root redirect ---
app.get('/', (req, res) => res.redirect('/login.html'));
app.get(/.*/, (req, res) => {
  res.redirect('http://localhost:3001/login.html');
});

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
