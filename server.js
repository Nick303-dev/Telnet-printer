const express = require('express');
require('dotenv').config();
const path = require('path');
const db = require('./db.js');

// --- Import organized routes ---
const routes = require('./routes');
const { authMiddleware } = require('./middleware/auth');

// --- Smart static file middleware ---
function smartStaticMiddleware(staticPath) {
  return (req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const allowedExtensions = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
    
    // Allow specific file types without authentication
    if (allowedExtensions.includes(ext)) {
      return express.static(staticPath)(req, res, next);
    }
    
    // For other files, require authentication
    return authMiddleware(req, res, (err) => {
      if (err) return next(err);
      express.static(staticPath)(req, res, next);
    });
  };
}

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