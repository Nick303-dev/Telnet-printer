// --- UI Elements ---
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearLogBtn');
const logEl = document.getElementById('logArea');
const textInput = document.getElementById('text');
const ipInput = document.getElementById('host');
const portInput = document.getElementById('port');
const optionsContainer = document.getElementById('optionsContainer');
const codeTypeSelect = document.getElementById('codeType');
const adminBtn = document.getElementById('adminPanelBtn');

// ===== GESTIONE TOKEN E AUTENTICAZIONE =====

// Global variables
let currentUser = null;
let accessToken = null;
let refreshToken = null;

// --- Funzione per inizializzare i token ---
function initializeTokens() {
  accessToken = localStorage.getItem('accessToken');
  // refreshToken viene gestito solo tramite cookie httpOnly
  
  console.log('🔍 Initializing tokens:', {
    hasAccessToken: !!accessToken
  });
}

// --- Verifica autenticazione all'avvio della pagina ---
window.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Page loaded, checking authentication...');
  
  initializeTokens();
  
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
      },
      credentials: 'include'
    });

    console.log('Token verification response status:', response.status);
    
    if (!response.ok) {
      console.log('🔄 Token invalid, trying refresh...');
      const refreshSuccess = await refreshAccessToken();
      
      if (!refreshSuccess) {
        throw new Error('Could not refresh token');
      }
      
      return window.location.reload();
    }

    const data = await response.json();
    
    if (!data.user || !data.user.email) {
      throw new Error('Invalid token verification response');
    }
    
    console.log('✅ Authentication successful, user:', data.user.email);
    
    currentUser = data.user;
    localStorage.setItem('userRole', data.user.role);
    localStorage.setItem('userEmail', data.user.email);
    
    updateUserInterface();
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    redirectToLogin('Sessione scaduta. Effettua nuovamente il login.');
  }
});

// --- Funzione per refresh del token ---
async function refreshAccessToken() {
  console.log('🔄 Attempting to refresh access token using httpOnly cookie...');
  
  try {
    const res = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Invia automaticamente i cookie httpOnly
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) {
        accessToken = data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        console.log('✅ Access token refreshed successfully via httpOnly refresh cookie');
        return true;
      }
    } else {
      console.log('❌ Refresh failed - Status:', res.status);
      const errorData = await res.json().catch(() => ({ result: 'Unknown error' }));
      console.log('❌ Refresh error:', errorData.result);
    }
  } catch (error) {
    console.log('⚠️ Refresh request failed:', error.message);
  }
  
  // Se arriviamo qui, il refresh è fallito
  console.log('❌ Refresh token expired or invalid, clearing session');
  localStorage.clear();
  
  // Prova a cancellare i cookie tramite logout
  try {
    await fetch('/api/logout', { 
      method: 'POST', 
      credentials: 'include',
      headers: { 'Authorization': accessToken ? 'Bearer ' + accessToken : '' }
    });
  } catch (err) {
    console.log('⚠️ Could not logout properly:', err.message);
  }
  
  return false;
}

// --- Funzione per fetch autenticato ---
async function fetchWithAuth(url, options = {}) {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  
  if (!accessToken) {
    console.log('❌ No access token available for request');
    redirectToLogin('Sessione scaduta, effettua di nuovo il login');
    throw new Error('No access token');
  }

  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = 'Bearer ' + accessToken;
  options.credentials = 'include';

  console.log('📡 Making authenticated request to:', url);

  let response = await fetch(url, options);

  if (response.status === 401) {
    console.log('🔄 Token expired (401), attempting refresh...');
    
    const refreshed = await refreshAccessToken();
    
    if (!refreshed) {
      redirectToLogin('Sessione scaduta, effettua di nuovo il login');
      throw new Error('Could not refresh token');
    }

    options.headers['Authorization'] = 'Bearer ' + accessToken;
    response = await fetch(url, options);
    
    if (response.status === 401) {
      console.log('❌ Still 401 after refresh, redirecting to login');
      redirectToLogin('Sessione scaduta, effettua di nuovo il login');
      throw new Error('Authentication failed after refresh');
    }
  }

  return response;
}

// --- Funzione helper per redirect sicuro al login ---
function redirectToLogin(message) {  
  if (message) {
    alert(message);
  }
  
  localStorage.clear();
  accessToken = null;
  refreshToken = null;
  currentUser = null;
  
  fetch('/api/logout', { 
    method: 'POST', 
    credentials: 'include',
    headers: { 'Authorization': accessToken ? 'Bearer ' + accessToken : '' }
  }).catch(err => console.log('Error during logout:', err.message));

  window.location.href = '/login.html';
}

// --- Update user interface based on current user ---
function updateUserInterface() {
  if (!currentUser) return;
  
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    const roleIcon = currentUser.role === 'admin' ? '👑' : '👤';
    userInfo.textContent = `${roleIcon} ${currentUser.email}`;
  }
  
  if (adminBtn) {
    adminBtn.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
  }
  
  console.log('✅ UI updated for user:', currentUser.email, 'Role:', currentUser.role);
}

// --- Funzione di logout ---
function logout() {
  if (confirm('Sei sicuro di voler effettuare il logout?')) {
    console.log('👋 User logging out...');
    
    fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': accessToken ? 'Bearer ' + accessToken : '',
        'Content-Type': 'application/json'
      }
    }).catch(err => console.log('Logout API call failed:', err.message));
    
    redirectToLogin();
  }
}

// ===== GESTIONE OPZIONI E UI =====

// --- Variabili ---
let opzioni = [];
let valueDisplay = null;

// --- Funzioni di utilità ---
function appendLog(...msgs) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString('it-IT', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const logMessage = `[${timestamp}] ${msgs.join(' ')}\n`;
  
  if (logEl) {
    logEl.append(document.createTextNode(logMessage));
    logEl.scrollTop = logEl.scrollHeight;
  }
  
  console.log(logMessage.trim());
}

function popolaCodeTypeSelect(data) {
  codeTypeSelect.innerHTML = '';
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

// Carica opzioni
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

  // Popola le opzioni principali
  param.options.forEach(p => {
    if (!p.type && p.custom_options) {
      console.log('Skipping container option (custom_options only):', p.name);
      return;
    }

    let el = null;
    const wrapper = document.createElement('div');
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
      
      if (p.type === 'range') {
        el.value = p.rangemin || 0;
        
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
        return;
      }
    }

    if (el) {
      const label = document.createElement('label');
      label.textContent = p.description || p.name;
      label.htmlFor = p.position;

      wrapper.appendChild(label);
      wrapper.appendChild(el);
      optionsContainer.appendChild(wrapper);
    } else if (p.type) {
      console.warn('Failed to create element for option with type:', p.type, p);
    }
  });

  // Gestione custom options per 2D
  if (selected === 'B2') {
    const main2DSelect = document.getElementById('p3');
    if (main2DSelect) {
      const newMain2DSelect = main2DSelect.cloneNode(true);
      main2DSelect.parentNode.replaceChild(newMain2DSelect, main2DSelect);

      newMain2DSelect.addEventListener('change', () => {
        popolaCustomOptions(newMain2DSelect.value, param.options);
      });

      if (newMain2DSelect.value) {
        popolaCustomOptions(newMain2DSelect.value, param.options);
      }
    }
  }
});

// --- Funzione per popolare i custom options ---
function popolaCustomOptions(selected2DValue, optionsList) {
  const oldCustoms = optionsContainer.querySelectorAll('.custom_option');
  oldCustoms.forEach(el => el.remove());

  optionsList.forEach(p => {
    if (!p.custom_options) return;

    const filtered = p.custom_options.filter(c => c.for === selected2DValue);

    filtered.forEach(c => {
      let el = null;
      const wrapper = document.createElement('div');
      wrapper.classList.add('custom_option');
      wrapper.style.marginBottom = '10px';

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

// --- Funzione helper per appiattire i valori ---
function flattenValues(obj) {
  let result = [];
  Object.values(obj).forEach(v => {
    if (v && typeof v === 'object') {
      result.push(...flattenValues(v));
    } else {
      result.push(v);
    }
  });
  return result;
}

// ===== EVENT LISTENERS =====

// Clear button
clearBtn.addEventListener('click', () => logEl.innerHTML = '');

// Send button
sendBtn.addEventListener('click', async () => {
  console.log('🚀 Send button clicked');
  
  const codeType = codeTypeSelect.value;
  const options = leggiValoriInput();
  const text = textInput.value.trim();
  const ip = ipInput.value.trim();
  const port = portInput.value;

  if (!codeType) {
    return appendLog('❌ Seleziona un tipo di codice.');
  }
  
  if (!text) {
    return appendLog('❌ Inserisci il testo da stampare.');
  }
  
  if (!ip) {
    return appendLog('❌ Inserisci l\'IP della stampante.');
  }
  
  if (!port || isNaN(port) || port < 1 || port > 65535) {
    return appendLog('❌ Inserisci una porta valida (1-65535).');
  }

  appendLog('📤 Invio comando:', codeType, 'con testo:', text, 'a', `${ip}:${port}`);

  try {
    if (!currentUser) {
      throw new Error('Utente non autenticato');
    }

    const commandData = { codeType, options, text, ip, port };
    
    const values = flattenValues(commandData); 
    const filteredValues = values.slice(0, -2);
    
    let logStr = '';
    if (filteredValues.length > 1) {
      logStr = `${filteredValues[0]}${filteredValues[1]}`;
      if (filteredValues.length > 3) {
        logStr += ', ' + filteredValues.slice(2, -1).join(', ');
      }
      logStr += (filteredValues.length > 2 ? ', ' : ',') + `'${filteredValues[filteredValues.length - 1]}'`;
    } else if (filteredValues.length === 1) {
      logStr = `${filteredValues[0]}`;
    }

    console.log('📝 Command string:', logStr);
    
    const response = await fetchWithAuth('/api/send-command', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commandData)
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.result) {
          errorMessage = errorData.result;
        }
      } catch (parseError) {
        console.log('Could not parse error response');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (data.result) {
      appendLog('✅ Risposta:', data.result);
      
      if (data.response && data.response !== 'No response from device') {
        appendLog('📋 Risposta dispositivo:', data.response);
      }
      
      if (data.duration) {
        appendLog('⏱️ Tempo di esecuzione:', data.duration);
      }
    } else {
      appendLog('⚠️ Comando inviato ma nessuna conferma ricevuta');
    }
    
  } catch (err) {
    console.error('❌ Send command error:', err.message);
    
    let userMessage = err.message;
    
    if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
      userMessage = 'Errore di rete. Controlla la connessione internet.';
    } else if (err.message.includes('timeout')) {
      userMessage = 'Timeout della richiesta. Il server potrebbe essere occupato.';
    } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      userMessage = 'Sessione scaduta. Effettua nuovamente il login.';
    } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
      userMessage = 'Non hai i permessi per eseguire questa operazione.';
    } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
      userMessage = 'Dati della richiesta non validi. Controlla i parametri inseriti.';
    } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
      userMessage = 'Errore interno del server. Riprova più tardi.';
    }
    
    appendLog('❌ Errore durante invio comando:', userMessage);
  }
});

// --- Event listeners per menu buttons ---
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      window.location.href = "../../profile.html";
    });
  }
  
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    adminPanelBtn.addEventListener('click', () => {
      window.location.href = '/admin/admin.html';
    });
  }
});

// Esporta funzioni per uso globale
window.fetchWithAuth = fetchWithAuth;
window.logout = logout;
window.refreshAccessToken = refreshAccessToken;