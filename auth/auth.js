// BRIDGE: Reindirizza al nuovo middleware centralizzato
// Questo file esiste solo per compatibilità con il vecchio codice

const { authMiddleware } = require('../middleware/auth');

// Log per debug
console.log('⚠️ Vecchio auth middleware richiamato - usa middleware/auth.js invece');

module.exports = authMiddleware;
