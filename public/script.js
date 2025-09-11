// --- UI Elements ---
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const logEl = document.getElementById('logArea');
const textInput = document.getElementById('text');
const ipInput = document.getElementById('ip');
const portInput = document.getElementById('port');
const optionsContainer = document.getElementById('optionsContainer');
const codeTypeSelect = document.getElementById('codeType');

// --- Variabili ---
let opzioni = [];

// --- Funzioni di utilità ---
function appendLog(...msgs) {
  const t = new Date().toLocaleTimeString();
  logEl.append(document.createTextNode(`[${t}] ${msgs.join(' ')}\n`));
  logEl.scrollTop = logEl.scrollHeight;
}

function popolaCodeTypeSelect(data) {
  codeTypeSelect.innerHTML = '';
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item.command; // es: B1 o B2
    option.text = item.type;     // es: 1D Codes o 2D Codes
    codeTypeSelect.appendChild(option);
  });
}

// --- Caricamento opzioni JSON ---
fetch('opzioni.json')
  .then(r => r.json())
  .then(data => {
    opzioni = data;
    popolaCodeTypeSelect(opzioni);
    appendLog("Opzioni caricate con successo.");
  })
  .catch(err => appendLog("Errore caricamento opzioni:", err.message));

// --- Evento change sul select ---
codeTypeSelect.addEventListener('change', () => {
  const selected = codeTypeSelect.value;
  const param = opzioni.find(o => o.command === selected);

  optionsContainer.innerHTML = ''; // Pulisce vecchie opzioni

  if (!param) {
    appendLog("Errore: tipo di codice non trovato.");
    optionsContainer.innerHTML = '<p>Nessuna opzione disponibile.</p>';
    return;
  }

  param.options.forEach(p => {
    let el;

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
      if (p.max) el.max = p.max;
      if (p.rangemin) el.min = p.rangemin;
      if (p.rangemax) el.max = p.rangemax;
    }

    const label = document.createElement('label');
    label.textContent = p.description;
    label.htmlFor = p.position;

    const wrapper = document.createElement('div');
    wrapper.appendChild(label);
    wrapper.appendChild(el);
    optionsContainer.appendChild(wrapper);
  });
});

// --- Funzione per leggere valori input dinamici ---
function leggiValoriInput() {
  const valori = {};
  optionsContainer.querySelectorAll('input, select').forEach(el => {
    valori[el.id] = el.value;
  });
  return valori;
}


// --- Event Listeners ---
clearBtn.addEventListener('click', () => logEl.innerHTML = '');

sendBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) {
    appendLog('Nessun testo da inviare.');
    return;
  }

  appendLog('> ', text);

  // Leggi i valori dai campi dinamici
  const options = leggiValoriInput();

  // Costruisci la stringa da inviare alla stampante
  const cmdArray = [
    codeTypeSelect.value,   // B1 o B2 all'inizio
    options.p1 || 0,
    options.p2 || 0,
    options.p3 || 0,
    options.p4 || 0,
    options.p5 || 0,
    options.p6 || 0,
    options.p7 || 0,
    options.p8 || 0,
    `‟${text}‟`             // testo da stampare tra virgolette speciali
  ];

  const cmdString = cmdArray.join(',');

  // Prepara payload per il backend
  const payload = {
    cmd: cmdString,
    ip: ipInput.value,
    port: portInput.value
  };

  try {
    const response = await fetch('/api/send-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    appendLog('< ', data.result);
    response = await fetch('/api/send-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'P', ip: ipInput.value, port: portInput.value })
    });
    data = await response.json();
    appendLog('< ', data.result);

  } catch (e) {
    appendLog('Errore durante invio comando:', e.message);
  }
});

