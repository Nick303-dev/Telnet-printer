const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  isValidEmail 
} = require('../utils');

const router = express.Router();

// --- Login ---
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ result: 'Missing email or password' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ result: 'Invalid email format' });
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
    }

    // Genera tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = rememberMe ? generateRefreshToken(user) : null;
    
    console.log(`✅ Login successful for: ${email}`);
    
    res.json({ 
      result: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ result: "Internal server error" });
  }
});

// --- Refresh token ---
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ result: 'Missing refresh token' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ result: 'Invalid or expired refresh token' });
  }

  try {
    // Recupera i dati completi dell'utente
    const [rows] = await db.query('SELECT id, email, role, status FROM users WHERE id = ?', [decoded.id]);
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

// --- Verify token ---
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
  res.json({ result: 'Logout successful' });
});

module.exports = router;