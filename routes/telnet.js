const express = require('express');
const { Telnet } = require('telnet-client');
const { authMiddleware } = require('../middleware/auth');
const { isValidIP, isValidPort, isLocalIP, buildCmdString } = require('../utils');

const router = express.Router();

// Applica middleware di autenticazione a tutte le route telnet
router.use(authMiddleware);

// --- Route per inviare comandi alla stampante ---
router.post('/send-command', async (req, res) => {
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
    timeout: 10000, // Timeout di 10 secondi
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

// --- Route per ottenere dati della stampante ---
router.get('/printer-data', async (req, res) => {
  try {
    // Qui puoi implementare la logica per ottenere dati reali dalla stampante
    const printerData = {
      status: 'ready',
      // Altri dati della stampante...
    };

    console.log(`User ${req.user.email} accessed printer data`);
    res.json({ result: 'Printer data retrieved successfully', data: printerData });
  } catch (err) {
    console.error('Error fetching printer data:', err.message);
    res.status(500).json({ result: 'Internal server error' });
  }
});

module.exports = router;