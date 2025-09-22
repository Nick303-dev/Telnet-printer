const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { generateRandomPassword, isValidEmail } = require('../utils');

const router = express.Router();

// Applica middleware di autenticazione e autorizzazione a tutte le route admin
router.use(authMiddleware, adminOnly);

// --- Lista tutti gli utenti ---
router.get('/users', async (req, res) => {
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

// --- Crea nuovo utente ---
router.post('/users', async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    
    if (!email || !isValidEmail(email)) {
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

// --- Aggiorna stato utente ---
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    
    if (!['active', 'inactive'].includes(status) && status !== undefined) {
      return res.status(400).json({ result: 'Invalid status' });
    }
    
    if (!['user', 'admin'].includes(role) && role !== undefined) {
      return res.status(400).json({ result: 'Invalid role' });
    }
    
    // Non permettere di modificare se stesso
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

// --- Reset password utente ---
router.post('/users/:id/reset-password', async (req, res) => {
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

module.exports = router;