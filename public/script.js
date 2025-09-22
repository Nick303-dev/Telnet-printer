// --- UI Elements ---
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearLogBtn'); // Corretto ID
const logEl = document.getElementById('logArea');
const textInput = document.getElementById('text');
const ipInput = document.getElementById('host'); // Corretto ID 
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

// --- Caricamento opzioni da API invece di file JSON ---
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
      if (p.min !== undefined) el.min = p.min;
      if (p.max !== undefined) el.max = p.max;
      if (p.rangemin !== undefined) el.min = p.rangemin;
      if (p.rangemax !== undefined) el.max = p.rangemax;
      
      // Valore di default
      if (p.type === 'range') {
        el.value = p.rangemin || 0;
      }
    }

    const label = document.createElement('label');
    label.textContent = p.description;
    label.htmlFor = p.position;

    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '10px';
    wrapper.appendChild(label);
    wrapper.appendChild(el);
    optionsContainer.appendChild(wrapper);
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
      let el;
      const elId = `${p.position}_${c.for}`; // ID unico per DOM

      if (c.type === 'select') {
        el = document.createElement('select');
        el.id = elId;
        c.values.forEach(v => {
          const option = document.createElement('option');
          option.value = v.value;
          option.textContent = v.name || v.value;
          el.appendChild(option);
        });
      } else if (c.type === 'range') {
        el = document.createElement('input');
        el.type = 'range';
        el.id = elId;
        if (c.rangemin !== undefined) el.min = c.rangemin;
        if (c.rangemax !== undefined) el.max = c.rangemax;
        el.value = c.rangemin || 0;

        // Mostra il valore corrente
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = el.value;
        valueDisplay.style.marginLeft = '10px';
        el.addEventListener('input', () => {
          valueDisplay.textContent = el.value;
        });
      }

      const wrapper = document.createElement('div');
      wrapper.classList.add('custom_option');
      wrapper.style.marginBottom = '10px';

      const label = document.createElement('label');
      label.textContent = c.name;
      label.htmlFor = elId;

      wrapper.appendChild(label);
      wrapper.appendChild(el);
      if (c.type === 'range') wrapper.appendChild(valueDisplay);

      optionsContainer.appendChild(wrapper);
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
  return valori;
}

// --- Event Listeners ---
clearBtn.addEventListener('click', () => logEl.innerHTML = '');

sendBtn.addEventListener('click', async () => {
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
    const response = await fetch('/api/send-command', {
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