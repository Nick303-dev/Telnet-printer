import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '../utils/index.js';
import db from '../db.js';

function parseCookies(header) {
  if (!header || typeof header !== 'string') return {};
  return header.split(';').reduce((acc, cookie) => {
    const index = cookie.indexOf('=');
    if (index === -1) return acc;
    const key = cookie.slice(0, index).trim();
    const value = cookie.slice(index + 1).trim();
    acc[key] = value;
    return acc;
  }, {});
}

async function issueAccessTokenFromRefresh(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies['refresh_token'];
  if (!refreshToken) return null;

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) return null;

  // Recupera utente per avere email/role nello JWT di accesso
  const [rows] = await db.query('SELECT id, email, role, status FROM users WHERE id = ?', [decoded.id]);
  if (!rows || rows.length === 0) return null;
  const user = rows[0];
  if (user.status && user.status !== 'active') return null;

  const newAccessToken = generateAccessToken(user);
  // Comunica al client il nuovo token tramite header
  res.set('x-access-token', newAccessToken);
  return { user, accessToken: newAccessToken };
}

async function authMiddleware(req, res, next) {
  try {
    // Cerca il token in: header Authorization, body, query, cookie legacy
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.body?.token) {
      token = req.body.token;
    }

    if (!token && req.query?.token) {
      token = req.query.token;
    }

    // Compatibilità con vecchio cookie (sconsigliato per sicurezza)
    if (!token && req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.authenticator) token = cookies.authenticator;
      if (!token && cookies.access_token) token = cookies.access_token;
    }

    if (token) {
      const check = verifyAccessToken(token);
      if (check.ok) {
        req.user = check.payload;
        return next();
      }
      // Se il token è scaduto, prova con il refresh token dal cookie
      if (check.expired) {
        const refreshed = await issueAccessTokenFromRefresh(req, res);
        if (refreshed) {
          req.user = { id: refreshed.user.id, email: refreshed.user.email, role: refreshed.user.role };
          return next();
        }
        return res.status(401).json({ result: 'Invalid or expired token' });
      }
      // token presente ma non valido
      return res.status(401).json({ result: 'Invalid token' });
    }

    // Nessun access token: prova comunque col refresh token (SSO silenzioso)
    const refreshed = await issueAccessTokenFromRefresh(req, res);
    if (refreshed) {
      req.user = { id: refreshed.user.id, email: refreshed.user.email, role: refreshed.user.role };
      return next();
    }

    return res.status(401).json({ result: 'No valid token provided' });
  } catch (err) {
    console.error('authMiddleware error:', err.message);
    return res.status(500).json({ result: 'Internal server error' });
  }
}

// Middleware per richiedere ruolo admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ result: 'Admin access required' });
  }
  next();
}

export { authMiddleware, adminOnly };
