// --- UI Elements ---
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearLogBtn'); // Corretto ID
const logEl = document.getElementById('logArea');
const textInput = document.getElementById('text');
const ipInput = document.getElementById('host'); // Corretto ID 
const portInput = document.getElementById('port');
const optionsContainer = document.getElementById('optionsContainer');
const codeTypeSelect = document.getElementById('codeType');
// Esempio in script.js del pannello principale
const adminBtn = document.getElementById('adminPanelBtn');
const userRole = localStorage.getItem('userRole');
// ===== AGGIUNGERE ALL'INIZIO DI script.js =====

// Global user variable
let currentUser = null;

// --- Verifica autenticazione all'avvio della pagina ---
window.addEventListener('DOMContentLoaded', async function() {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    console.log('❌ No access token found, redirecting to login');
    redirectToLogin('Devi effettuare il login per accedere a questa pagina');
    return;
  }

  // Verifica validità del token
  try {
    console.log('🔍 Verifying token...');
    const response = await fetch('/api/verify-token', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    });

    console.log('Token verification response status:', response.status);
    
    if (!response.ok) {
      // Token non valido o scaduto
      throw new Error(`Token verification failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.user || !data.user.email) {
      throw new Error('Invalid token verification response');
    }
    
    console.log('✅ Authentication successful, user:', data.user.email);
    
    // Salva utente corrente
    currentUser = data.user;
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('userEmail', data.user.email);
    
    // Aggiorna UI
    updateUserInterface();
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.log('Clearing invalid authentication data...');
    redirectToLogin('Sessione scaduta. Effettua nuovamente il login.');
  }
});

// --- Funzione helper per redirect sicuro al login ---
function redirectToLogin(message) {
  // Pulisci completamente i dati di autenticazione
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  
  if (message) {
    alert(message);
  }
  
  window.location.href = '/login.html';
}

// Update user interface based on current user
function updateUserInterface() {
  if (!currentUser) return;
  
  // Update user info
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    const roleIcon = currentUser.role === 'admin' ? '👑' : '👤';
    userInfo.textContent = `${roleIcon} ${currentUser.email}`;
  }
  
  // Show/hide admin button
  const adminBtn = document.getElementById('adminPanelBtn');
  if (adminBtn) {
    adminBtn.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
  }
}

// --- Funzione di logout ---
function logout() {
  if (confirm('Sei sicuro di voler effettuare il logout?')) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// --- Event listeners per menu buttons ---
document.addEventListener('DOMContentLoaded', function() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  // Profile button
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      window.location.href = '/profile.html';
    });
  }
  
  // Admin panel button
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    adminPanelBtn.addEventListener('click', () => {
      window.location.href = '/admin/admin.html';
    });
  }
});

// ===== IL TUO CODICE ESISTENTE DI script.js CONTINUA QUI =====
if (userRole === 'admin') {
  adminBtn.style.display = 'block';
} else {
  adminBtn.style.display = 'none';
}
// --- Variabili ---
let opzioni = [];
let valueDisplay = null;

// --- Funzioni di utilità ---
function appendLog(...msgs) {
  const t = new Date().toLocaleTimeString();
  logEl.append(document.createTextNode(`[${t}] ${msgs.join(' ')}\n`));
  logEl.scrollTop = logEl.scrollHeight;
}

function popolaCodeTypeSelect(data) {
  codeTypeSelect.innerHTML = ''; // Pulisce opzioni esistenti
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.text = 'Seleziona tipo di codice';
  codeTypeSelect.appendChild(defaultOption);
  
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item.command;
    option.text = item.type;
    codeTypeSelect.appendChild(option);
  });
}

fetch('opzioni.json')
  .then(r => r.json())
  .then(data => {
    opzioni = data;
    popolaCodeTypeSelect(opzioni);
  })
  .catch(err => appendLog("Errore caricamento opzioni:", err.message));

// --- Evento change sul select principale ---
codeTypeSelect.addEventListener('change', () => {
  const selected = codeTypeSelect.value;
  const param = opzioni.find(o => o.command === selected);
  optionsContainer.innerHTML = '';

  if (!param || !selected) {
    optionsContainer.innerHTML = '<p>Seleziona un tipo di codice per vedere le opzioni.</p>';
    return;
  }

  // --- Popola le opzioni principali ---
  param.options.forEach(p => {
    // Skip options that only contain custom_options (they're containers, not UI elements)
    if (!p.type && p.custom_options) {
      console.log('Skipping container option (custom_options only):', p.name);
      return;
    }

    let el = null; // Initialize to null
    const wrapper = document.createElement('div'); // Create wrapper first
    wrapper.style.marginBottom = '10px';

    if (p.type === 'select') {
      el = document.createElement('select');
      el.id = p.position;

      if (Array.isArray(p.values)) {
        p.values.forEach(v => {
          const option = document.createElement('option');
          option.value = v.value;
          option.textContent = v.name;
          el.appendChild(option);
        });
      } else {
        for (const key in p.values) {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = p.values[key];
          el.appendChild(option);
        }
      }
    } else if (p.type === 'value' || p.type === 'range') {
      el = document.createElement('input');
      el.type = p.type === 'range' ? 'range' : 'number';
      el.id = p.position;
      if (p.min !== undefined) el.min = p.min;
      if (p.max !== undefined) el.max = p.max;
      if (p.rangemin !== undefined) el.min = p.rangemin;
      if (p.rangemax !== undefined) el.max = p.rangemax;
      
      
      // Valore di default
      if (p.type === 'range') {
        el.value = p.rangemin || 0;
        
        // Add value display for range inputs
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = el.value;
        valueDisplay.style.marginLeft = '10px';
        el.addEventListener('input', () => {
          valueDisplay.textContent = el.value;
        });
        
        const label = document.createElement('label');
        label.textContent = p.description || p.name;
        label.htmlFor = p.position;

        wrapper.appendChild(label);
        wrapper.appendChild(el);
        wrapper.appendChild(valueDisplay);
        optionsContainer.appendChild(wrapper);
        return; // Early return to avoid duplicate appending
      }
    }

    // Only create and append if el was successfully created
    if (el) {
      const label = document.createElement('label');
      label.textContent = p.description || p.name;
      label.htmlFor = p.position;

      wrapper.appendChild(label);
      wrapper.appendChild(el);
      optionsContainer.appendChild(wrapper);
    } else if (p.type) {
      // Only warn if there's a type but we couldn't handle it
      console.warn('Failed to create element for option with type:', p.type, p);
    }
  });

  // --- Gestione custom options per 2D ---
  if (selected === 'B2') {
    const main2DSelect = document.getElementById('p3');
    if (main2DSelect) {
      // Rimuovi listener precedenti clonando l'elemento
      const newMain2DSelect = main2DSelect.cloneNode(true);
      main2DSelect.parentNode.replaceChild(newMain2DSelect, main2DSelect);

      newMain2DSelect.addEventListener('change', () => {
        popolaCustomOptions(newMain2DSelect.value, param.options);
      });

      // Popola subito le custom options se c'è un valore selezionato
      if (newMain2DSelect.value) {
        popolaCustomOptions(newMain2DSelect.value, param.options);
      }
    }
  }
});

// --- Funzione per popolare i custom options ---
function popolaCustomOptions(selected2DValue, optionsList) {
  // Rimuove vecchie custom options
  const oldCustoms = optionsContainer.querySelectorAll('.custom_option');
  oldCustoms.forEach(el => el.remove());

  optionsList.forEach(p => {
    if (!p.custom_options) return;

    // Filtra custom options per il tipo selezionato
    const filtered = p.custom_options.filter(c => c.for === selected2DValue);

    filtered.forEach(c => {
      let el = null;
      const wrapper = document.createElement('div');
      wrapper.classList.add('custom_option');
      wrapper.style.marginBottom = '10px';

      // Crea l'elemento principale in base al tipo
      if (c.type === 'select') {
        el = document.createElement('select');
        el.id = `${p.position}_${c.for}`;
        
        if (c.values && Array.isArray(c.values)) {
          c.values.forEach(v => {
            const option = document.createElement('option');
            option.value = v.value;
            option.textContent = v.name || v.value;
            el.appendChild(option);
          });
        }

        const label = document.createElement('label');
        label.textContent = c.name;
        label.htmlFor = el.id;

        wrapper.appendChild(label);
        wrapper.appendChild(el);
        optionsContainer.appendChild(wrapper);

      } else if (c.type === 'range') {
        el = document.createElement('input');
        el.type = 'range';
        el.id = `${p.position}_${c.for}`;
        if (c.rangemin !== undefined) el.min = c.rangemin;
        if (c.rangemax !== undefined) el.max = c.rangemax;
        el.value = c.rangemin || 0;

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = el.value;
        valueDisplay.style.marginLeft = '10px';
        el.addEventListener('input', () => {
          valueDisplay.textContent = el.value;
        });

        const label = document.createElement('label');
        label.textContent = c.name;
        label.htmlFor = el.id;

        wrapper.appendChild(label);
        wrapper.appendChild(el);
        wrapper.appendChild(valueDisplay);
        optionsContainer.appendChild(wrapper);
      }
    });
  });
}

// --- Funzione per leggere valori input dinamici ---
function leggiValoriInput() {
  const valori = {};
  optionsContainer.querySelectorAll('input, select').forEach(el => {
    if (el.id) {
      valori[el.id] = el.value;
    }
  });
  // Imposta p1 e p2 a 30 se sono vuoti, null o non numerici
  if (!valori.p1 || isNaN(Number(valori.p1))) {
    valori.p1 = 30;
  }
  if (!valori.p2 || isNaN(Number(valori.p2))) {
    valori.p2 = 30;
  }
  return valori;
}

// --- Event Listeners ---
clearBtn.addEventListener('click', () => logEl.innerHTML = '');

sendBtn.addEventListener('click', async () => {
  console.log('Send button clicked');
  const codeType = codeTypeSelect.value;
  const options = leggiValoriInput();
  const text = textInput.value.trim();
  const ip = ipInput.value.trim();
  const port = portInput.value;

  if (!codeType) {
    return appendLog('Seleziona un tipo di codice.');
  }
  
  if (!text) {
    return appendLog('Inserisci il testo da stampare.');
  }
  
  if (!ip) {
    return appendLog('Inserisci l\'IP della stampante.');
  }

  appendLog('Invio comando:', codeType, 'con testo:', text);

  try {
    // ✅ Qui creiamo log
    const log = { codeType, options, text, ip, port };
const values = flattenValues(log); 

// Rimuoviamo IP e porta (ultimi due elementi)
const filteredValues = values.slice(0, -2);

let logStr = '';

if (filteredValues.length > 1) {
  // codeType + primo parametro (p1)
  logStr = `${filteredValues[0]}${filteredValues[1]}`;

  // eventuali parametri intermedi (dal terzo fino a prima di text)
  if (filteredValues.length > 3) {
    logStr += ', ' + filteredValues.slice(2, -1).join(', ');
  }

  // aggiungi solo text tra apici
  logStr += (filteredValues.length > 2 ? ', ' : ',') + `'${filteredValues[filteredValues.length - 1]}'`;

} else if (filteredValues.length === 1) {
  logStr = `${filteredValues[0]}`;
}


    console.log(logStr); // stampa solo i valori finali

const response = await fetchWithAuth('/api/send-command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ codeType, options, text, ip, port })
});

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    appendLog('Risposta:', data.result);
  } catch (err) {
    appendLog('Errore durante invio comando:', err.message);
  }
});

function flattenValues(obj) {
  let result = [];
  Object.values(obj).forEach(v => {
    if (v && typeof v === 'object') {
      result.push(...flattenValues(v)); // ricorsione per oggetti annidati
    } else {
      
      result.push(v);
    }
  });
  return result;
}
// --- Funzioni per auth ---
// ===== SOSTITUIRE LE FUNZIONI AUTH ESISTENTI IN script.js =====

// --- Funzioni per auth aggiornate ---
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    console.log('❌ No refresh token available');
    localStorage.clear();
    window.location.href = '/login.html';
    return false;
  }

  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      throw new Error('Refresh token expired');
    }

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    console.log('✅ Access token refreshed successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to refresh token:', error.message);
    localStorage.clear();
    alert('Sessione scaduta. Reindirizzamento al login...');
    window.location.href = '/login.html';
    return false;
  }
}

async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('accessToken');

  if (!token) {
    console.log('❌ No access token found');
    localStorage.clear();
    window.location.href = '/login.html';
    throw new Error('No access token');
  }

  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = 'Bearer ' + token;

  let response = await fetch(url, options);

  if (response.status === 401) {
    console.log('🔄 Token expired, attempting refresh...');
    const refreshed = await refreshAccessToken();
    
    if (!refreshed) {
      throw new Error('Sessione scaduta, effettua di nuovo il login');
    }

    // Retry with new token
    token = localStorage.getItem('accessToken');
    options.headers['Authorization'] = 'Bearer ' + token;
    response = await fetch(url, options);
  }

  return response;
}