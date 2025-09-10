const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const logEl = document.getElementById('log');
const Telnet = require('telnet-client');
const connection = new Telnet();

document.getElementById('clearBtn').addEventListener('click', () => {
    logEl.innerHTML = '';
});
document.getElementById('sendBtn').addEventListener('click', async () => {
    const text = document.getElementById('text').value();
    let a;
    switch (document.getElementById('codeType')) {
        case 'text':
            
                let opzioni = [
  { value: 0, text: "6" },
  { value: 1, text: "8" },
  { value: 2, text: "10" },
  { value: 3, text: "12" },
  { value: 4, text: "15" },
  { value: 5, text: "20" },
  { value: 6, text: "30" },
  { value: 7, text: "14" },
  { value: 8, text: "18" },
  { value: 9, text: "24" },
  { value: "a", text: "KOREAN 1" },
  { value: "b", text: "KOREAN 2" },
  { value: "c", text: "KOREAN 3" },
  { value: "d", text: "KOREAN 4" },
  { value: "e", text: "KOREAN 5" },
  { value: "f", text: "KOREAN6" },
  { value: "m", text: "GB2312" },
  { value: "n", text: "BIG5" },
  { value: "j", text: "Shift-JIS" }
];

    // Seleziona la select
    popolaSelect("options3", opzioni);
const opzioni45 = {
    1: "1",
    2: "2",
    3: "3",
    4: "4",
}
popolaSelect("options4", opzioni45);
popolaSelect("options5", opzioni45);
mostra('options4');
mostra('options5');
            break;
        
    if(typeof text === 'string'){
    
        try {
            let response = await connection.send(",,Q");
        } catch (error) {
            
        }
    }
    if (!text) return;
    appendLog('> ', text);  
    try {
        const res = await connection.send(text);
        appendLog('< ', res);
    } catch (err) {
        appendLog('! ', 'Error:', err.message);
    }
 
await connection.connect({
    host: document.getElementById('ip').value.trim(),
    port: document.getElementById('port').value.trim()
});

async function qrcode(opzioni) {
document.getElementById("box").classList.remove("nascosto");    
}
let res ;
if (document.getElementById('codeType').value === 'barcode') {
console.log(res);
connection.end();
};

function appendLog(...msgs) {
const t = new Date().toLocaleTimeString();
logEl.innerText += `[${t}] ${msgs.join(' ')}\n`;
logEl.scrollTop = logEl.scrollHeight;
}
function mostra(id){
    document.getElementById(id).classList.remove("nascosto");
}
function mostraTutto(){
    document.getElementById('tutto').classList.remove("nascosto");
}
function nascondi(id){
    document.getElementById(id).classList.add("nascosto");
}
function nascondiTutto(){
    document.getElementById('tutto').classList.add("nascosto");
}
 
function popolaSelect(selectId, opzioni) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";  
  opzioni.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = item.value !== undefined ? item.value : index;  
    option.text = item.text;
    select.appendChild(option);
  });
}


















