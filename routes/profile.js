const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Applica middleware di autenticazione a tutte le route profile
router.use(authMiddleware);
//ciao

// --- Ottieni profilo utente corrente ---
router.get('/', async (req, res) => {
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
router.post('/change-password', async (req, res) => {
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

module.exports = router;