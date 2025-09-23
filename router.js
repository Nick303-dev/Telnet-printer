const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Telnet } = require('telnet-client');
const db = require('./db.js');
const authMiddleware = require('./middleware/auth.js');
 
const router = express.Router();

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
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\w\s\-\.]/g, '').trim();
}

// --- Validation functions ---
function isValidIP(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip) || ip === 'localhost';
}

function isValidPort(port) {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
}

function isLocalIP(ip) {
  return ip === 'localhost' 
    || ip.startsWith('192.168.') 
    || ip.startsWith('10.') 
    || ip.startsWith('172.16.');
}

// --- Middleware auth per route protette ---


// --- Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ result: 'Missing email or password' });
    }
    
    console.log(`🔐 Login attempt for: ${email}`);

    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (results.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ result: "Invalid credentials" });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`❌ Wrong password for: ${email}`);
      return res.status(401).json({ result: "Invalid credentials" });
    }
    
    // Verifica se l'account è attivo
    if (user.status && user.status !== 'active') {
      console.log(`❌ Account disabled: ${email}`);
      return res.status(401).json({ result: 'Account disabled' });
    }else{

    // Genera tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = rememberMe ? generateRefreshToken(user) : null;
    
    console.log(`✅ Login successful for: ${email}`);
    res.status(200).json({ 
  result: "Login successful",
  accessToken,
  refreshToken,
  user: {
    id: user.id,
    email: user.email,
    role: user.role
  }
});
  } 
}
catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ result: "Internal server error" });
  }
});

// --- Route per verificare validità token ---
router.get('/verify-token', authMiddleware, (req, res) => {
  res.json({ 
    result: 'Token is valid', 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// --- Logout ---
router.post('/logout', authMiddleware, (req, res) => {
  console.log(`User ${req.user.email} logged out`);
  res.clearCookie('authenticator');
  res.clearCookie('refreshToken');
  res.json({ result: 'Logout successful' });
});

// --- Middleware solo per admin ---
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ result: 'Admin access required' });
  }
  next();
}

// --- Funzione per generare password casuali ---
function generateRandomPassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// === ADMIN APIS ===

// --- Lista tutti gli utenti (solo admin) ---
router.get('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    
    console.log(`Admin ${req.user.email} accessed user list`);
    res.json({ result: 'Users retrieved successfully', users });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Crea nuovo utente (solo admin) ---
router.post('/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ result: 'Valid email is required' });
    }
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ result: 'Invalid role' });
    }
    
    // Verifica se l'utente esiste già
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ result: 'User already exists' });
    }
    
    // Genera password casuale
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Crea utente
    const [result] = await db.query(
      'INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, role, 'active']
    );
    
    console.log(`Admin ${req.user.email} created user: ${email}`);
    
    res.json({
      result: 'User created successfully',
      user: {
        id: result.insertId,
        email,
        role,
        status: 'active',
        tempPassword // Inviata una sola volta!
      }
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Aggiorna stato utente (solo admin) ---
router.put('/admin/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    
    if (!['active', 'inactive'].includes(status) && status !== undefined) {
      return res.status(400).json({ result: 'Invalid status' });
    }
    
    if (!['user', 'admin'].includes(role) && role !== undefined) {
      return res.status(400).json({ result: 'Invalid role' });
    }
    
    // Non permettere di disattivare se stesso
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ result: 'Cannot modify your own account' });
    }
    
    const updates = [];
    const values = [];
    
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ result: 'No valid updates provided' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const [result] = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 'User not found' });
    }
    
    // Recupera utente aggiornato
    const [user] = await db.query(
      'SELECT id, email, role, status, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    console.log(`Admin ${req.user.email} updated user ID ${id}`);
    
    res.json({
      result: 'User updated successfully',
      user: user[0]
    });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Reset password utente (solo admin) ---
router.post('/admin/users/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await db.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ result: 'User not found' });
    }
    
    console.log(`Admin ${req.user.email} reset password for user ID ${id}`);
    
    res.json({
      result: 'Password reset successfully',
      newPassword // Inviata una sola volta!
    });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// === USER PROFILE APIS ===

// --- Ottieni profilo utente corrente ---
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [user] = await db.query(
      'SELECT id, email, role, status, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ result: 'User not found' });
    }
    
    res.json({
      result: 'Profile retrieved successfully',
      user: user[0]
    });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

// --- Cambia password utente corrente ---
router.post('/profile/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ result: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ result: 'New password must be at least 6 characters' });
    }
    
    // Verifica password corrente
    const [user] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (user.length === 0) {
      return res.status(404).json({ result: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!validPassword) {
      return res.status(401).json({ result: 'Current password is incorrect' });
    }
    
    // Aggiorna password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );
    
    console.log(`User ${req.user.email} changed password`);
    
    res.json({ result: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error.message);
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

// --- Route Telnet protetta ---
router.post('/api/send-command', authMiddleware, async (req, res) => {
  const { codeType, options, text, ip, port } = req.body;

  // Validazione input
  if (!codeType || !options || text === undefined || !ip || !port) {
    return res.status(400).json({ result: 'Missing required fields' });
  }

  // Validazione IP
  const trimmedIP = ip.trim();
  if (!isValidIP(trimmedIP)) {
    return res.status(400).json({ result: 'Invalid IP address format' });
  }

  if (!isLocalIP(trimmedIP)) {
    return res.status(403).json({ result: 'Only local network IPs are allowed' });
  }

  // Validazione porta
  if (!isValidPort(port)) {
    return res.status(400).json({ result: 'Invalid port number' });
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

// Esporta il router e authMiddleware
module.exports = { router, authMiddleware };