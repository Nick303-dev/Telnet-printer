const express = require('express');
const Telnet = require('telnet-client');
const app = express();

app.use(express.json());
app.use(express.static('public')); // 👈 Moved up for clarity

// --- API Routes ---

app.post('/api/send-command', async (req, res) => {
  const { cmd, ip, port } = req.body;
  if (!cmd || !ip || !port) {
    return res.status(400).json({ result: 'Missing required fields: cmd, ip, or port.' });
  }

  try {
    const result = await sendCommand(cmd, ip, port);
    res.json({ result });
  } catch (err) {
    console.error("Telnet error:", err);
    res.status(500).json({ result: err.message || 'Internal server error' });
  }
});

app.get('/api/opzioni', (req, res) => {
  // Replace with real data as needed
  const opzioni = [
    { value: 'CMD_TYPE_A', label: 'Comando Tipo A' },
    { value: 'CMD_TYPE_B', label: 'Comando Tipo B' },
    { value: 'CMD_TYPE_C', label: 'Comando Tipo C' }
  ];
  res.json(opzioni);
});

// --- Telnet Helper (Standalone per-request connection) ---

function buildCmdString(codeType, options, text) {
  // Esempio base: costruisce la stringa separando i parametri con virgola
  // Opzioni devono essere un oggetto tipo { p1: 0, p2: 1, ... }
  const cmdArray = [
    codeType,
    options.p1 || 0,
    options.p2 || 0,
    options.p3 || 0,
    options.p4 || 0,
    options.p5 || 0,
    options.p6 || 0,
    options.p7 || 0,
    options.p8 || 0,
    options.p9 || 0,
    options.p10 || 0,
    options.p11 || 0,
    options.p12 || 0,
    `‟${text}‟` // testo tra virgolette speciali
  ];
  return cmdArray.join(',');
}

// --- API per invio comando ---
app.post('/api/send-command', async (req, res) => {
  const { codeType, options, text, ip, port } = req.body;

  if (!codeType || !options || !text || !ip || !port) {
    return res.status(400).json({ result: 'Missing required fields.' });
  }

  const cmd = buildCmdString(codeType, options, text);

  const connection = new Telnet();
  const params = {
    host: ip.trim(),
    port: typeof port === 'string' ? parseInt(port.trim(), 10) : port,
    timeout: 1500
  };

  try {
    await connection.connect(params);
    const result = await connection.send(cmd);
    await connection.end();
    res.json({ result });
  } catch (err) {
    try { await connection.end(); } catch (e) {}
    res.status(500).json({ result: err.message || 'Telnet error' });
  }
});

app.listen(3000, () => console.log('✅ Server avviato su http://localhost:3000'));
