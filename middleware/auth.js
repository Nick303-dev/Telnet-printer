import { verifyAccessToken } from '../utils/index.js';
function authMiddleware(req, res, next) {
  // Cerca il token in diversi luoghi: header Authorization, body, query, cookies
  let token = null;
  
  // 1. Header Authorization (Bearer token)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  // 2. Body token
  if (!token && req.body?.token) {
    token = req.body.token;
  }
  
  // 3. Query token
  if (!token && req.query?.token) {
    token = req.query.token;
  }
  
  // 4. Cookies (per compatibilità con implementazione esistente)
if (!token && req.headers.cookie) {
  const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
    const index = cookie.indexOf('=');          // trova il primo '='
    const key = cookie.slice(0, index).trim();  // prende il nome del cookie
    const value = cookie.slice(index + 1).trim(); // prende tutto il resto come valore
    acc[key] = value;
    return acc;
  }, {});

  if (cookies.authenticator) {
    token = cookies.authenticator;
  }
}

  
  if (!token) {
    return res.status(401).json({ result: 'No valid token provided' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ result: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Middleware per richiedere ruolo admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ result: 'Admin access required' });
  }
  next();
}

export { authMiddleware, adminOnly };