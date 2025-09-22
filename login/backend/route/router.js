const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Telnet } = require('telnet-client');
const db = require('../../../db.js'); // importa il pool condiviso
const { json } = require('stream/consumers');
const trimmedIP = process.env.ip;


const router = express.Router();
const path = require('path');

router.get('/index.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '../../../public/index.html'));
});

// Rate limiting per login (più permissivo per rete locale)

// --- Login ---
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validazione input
    if (!email || !password || typeof rememberMe !== 'boolean') {
      return res.status(400).json({ result: 'Missing or invalid required fields' });
    }

    if (email.length < 3 || email.length > 50) {
      return res.status(400).json({ result: 'Invalid email length' });
    }

    if (password.length < 6) {
      return res.status(400).json({ result: 'Invalid password length' });
    }

    const [rows] = await db.query('SELECT * FROM USERS WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ result: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Verifica se l'account è attivo (se hai un campo status)
    if (user.status && user.status == 'disabled') {
      return res.status(401).json({ result: 'Account disabled' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ result: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = rememberMe ? generateRefreshToken(user) : null;

    // Log successful login
    console.log(`✅ User ${email} logged in successfully`);

    res.json({ 
      result: 'Login successful', 
      accessToken, 
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
      
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});
router.get('/api/printer-data', authMiddleware, async (req, res) => {
  try {
    // Qui puoi mettere i dati reali della stampante o simulare
    const printerData = {
      status: 'ready',
    };

    console.log(`User ${req.user.email} accessed printer data`);

    res.json({ result: 'Printer data retrieved successfully', data: printerData });
  } catch (err) {
    console.error('Error fetching printer data:', err.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Route per salvare token (es. lato server o per log) ---
router.post('/api/set-token', authMiddleware, async (req, res) => {
  const token = req.body?.token;

  if (!token) {
    return res.status(400).json({ result: 'Missing token in request body' });
  }

  try {
    // Qui puoi fare qualsiasi operazione con il token,
    // ad esempio salvarlo per log o per sessione lato server
    console.log(`Token received from user ${req.user.email}: ${token}`);

    res.json({ result: 'Token saved successfully' });
  } catch (err) {
    console.error('Error saving token:', err.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Refresh token ---
router.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ result: 'Missing refresh token' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ result: 'Invalid or expired refresh token' });
  }

  try {
    // Recupera i dati completi dell'utente per generare un access token completo
    const [rows] = await db.query('SELECT id, email, role FROM USERS WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ result: 'User not found' });
    }

    const user = rows[0];
    
    // Verifica se l'account è ancora attivo
    if (user.status && user.status !== 'active') {
      return res.status(401).json({ result: 'Account disabled' });
    }

    const newAccessToken = generateAccessToken(user);

    res.json({ 
      result: 'Token refreshed successfully', 
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Helper Telnet ---
function buildCmdString(codeType, options, text) {
  // Sanitizza gli input
  const sanitizedCodeType = sanitizeInput(codeType);
  const sanitizedText = text.replace(/"/g, '\\"'); // Escape quotes
  
  const cmdArray = [
    sanitizedCodeType,
    parseInt(options.p1 || 0, 10),
    parseInt(options.p2 || 0, 10),
    parseInt(options.p3 || 0, 10),
    parseInt(options.p4 || 0, 10),
    parseInt(options.p5 || 0, 10),
    parseInt(options.p6 || 0, 10),
    parseInt(options.p7 || 0, 10),
    parseInt(options.p8 || 0, 10),
    parseInt(options.p9 || 0, 10),
    parseInt(options.p10 || 0, 10),
    parseInt(options.p11 || 0, 10),
    parseInt(options.p12 || 0, 10),
    `"${sanitizedText}"`
  ];
  return cmdArray.join(',');
}
// --- Helpers JWT ---
function generateAccessToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(user) {
  const payload = { id: user.id };
  return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: '7d' });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

// --- Validation helpers ---
function isValidIP(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip) || ip === 'localhost';
}

function isValidPort(port) {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\w\s\-\.]/g, '').trim();
}

// --- Middleware auth per route protette ---
function authMiddleware(req, res, next) {
  // Legge token da header, body o query
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenFromBody = req.body?.token || null;
  const tokenFromQuery = req.query?.token || null;

  const token = tokenFromHeader || tokenFromBody || tokenFromQuery;

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




// --- Route Telnet protetta ---
router.post('/api/send-command', authMiddleware, async (req, res) => {
  const { codeType, options, text, ip, port } = req.body;

  // Validazione input
  if (!codeType || !options || text === undefined || !ip || !port) {
    return res.status(400).json({ result: 'Missing required fields' });
  }

  // Validazione lunghezza testo
  if (text.length > 1000) {
    return res.status(400).json({ result: 'Text too long (max 1000 characters)' });
  }

  const cmd = buildCmdString(codeType, options, text);
  
  // Log dell'operazione
  console.log(`User ${req.user.email} sending command to ${trimmedIP}:${port}`);

  const connection = new Telnet();
  const params = {
    host: trimmedIP,
    port: typeof port === 'string' ? parseInt(port.trim(), 10) : port,
    timeout: 10000, // Timeout aumentato a 10 secondi
    negotiationMandatory: false,
    irs: '\r\n',
    ors: '\r\n'
  };

  try {
    await connection.connect(params);
    const result = await connection.send(cmd);
    
    res.json({ 
      result: 'Command sent successfully', 
      response: result || 'No response from device'
    });
  } catch (err) {
    console.error(`Telnet error for user ${req.user.email}:`, err.message);
    
    // Messaggi di errore più specifici
    let errorMessage = 'Connection failed';
    if (err.message.includes('timeout')) {
      errorMessage = 'Connection timeout - device may be unreachable';
    } else if (err.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused - check if device is online and port is correct';
    } else if (err.message.includes('EHOSTUNREACH')) {
      errorMessage = 'Host unreachable - check IP address and network connectivity';
    }
    
    res.status(500).json({ result: errorMessage });
  } finally {
    try { 
      await connection.end(); 
    } catch (endErr) {
      console.error('Error closing telnet connection:', endErr.message);
    }
  }
});

// --- Logout (opzionale - per invalidare token lato client) ---
router.post('/api/logout', authMiddleware, (req, res) => {
  // In un'implementazione più avanzata, potresti voler mantenere una blacklist dei token
  console.log(`User ${req.user.email} logged out`);
  res.json({ result: 'Logout successful' });
});

// --- Route per verificare validità token ---
router.get('/api/verify-token', authMiddleware, (req, res) => {
  res.json({ 
    result: 'Token is valid', 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// login/backend/route/router.js

module.exports = router;
