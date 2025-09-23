import jwt from 'jsonwebtoken';

// === JWT HELPERS ===
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

// === VALIDATION HELPERS ===
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\w\s\-\.]/g, '').trim();
}

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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// === PASSWORD HELPERS ===
function generateRandomPassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// === TELNET HELPERS ===
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

export {
  // JWT
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  
  // Validation
  sanitizeInput,
  isValidIP,
  isValidPort,
  isLocalIP,
  isValidEmail,
  
  // Password
  generateRandomPassword,
  
  // Telnet
  buildCmdString
};