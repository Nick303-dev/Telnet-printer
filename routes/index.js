const express = require('express');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

// Import organized route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const profileRoutes = require('./profile');
const telnetRoutes = require('./telnet');

const router = express.Router();

// === STATIC FILE ROUTES ===
router.get('/index.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// === ORGANIZED API ROUTES ===
// Main organized routes with clear prefixes
router.use('/auth', authRoutes);        // /auth/login, /auth/logout, etc.
router.use('/admin', adminRoutes);      // /admin/users, etc. (admin only)
router.use('/profile', profileRoutes);  // /profile, /profile/change-password
router.use('/printer', telnetRoutes);   // /printer/send-command, /printer/printer-data

// === LEGACY COMPATIBILITY ROUTES ===
// Alternative API paths for backward compatibility
router.use('/api/admin', adminRoutes);    // /api/admin/users, etc.
router.use('/api/profile', profileRoutes); // /api/profile, /api/profile/change-password
router.use('/api/printer', telnetRoutes);  // /api/printer/send-command, etc.

// Root-level auth routes for legacy compatibility
router.use('/', authRoutes);  // This handles /login, /logout, /refresh, /verify-token at root

// Specific legacy /api auth routes that don't conflict
router.use('/api', authRoutes);  // This handles /api/refresh, /api/verify-token, /api/logout

// === HEALTH CHECK ===
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;

module.exports = router;