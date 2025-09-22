// login.js
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  if (!email || !password) {
    alert('Inserisci email e password!');
    return;
  }

  try {
    // 1️⃣ Login
    const loginRes = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });

    if (!loginRes.ok) {
      const errorData = await loginRes.json().catch(() => null);
      throw new Error(errorData?.result || 'Errore di login');
    }

    const loginData = await loginRes.json();

    // Salva token e ruolo
    localStorage.setItem('accessToken', loginData.accessToken);
    if (loginData.refreshToken) localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('userRole', loginData.user.role);

    const token = loginData.accessToken;

    // 2️⃣ Chiamata protetta alla stampante
    const printerRes = await fetch('/api/printer-data', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const printerData = await printerRes.json();
    console.log('Dati stampante:', printerData);

    // 3️⃣ Invio token all'API set-token
    const setTokenRes = await fetch('/api/set-token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token 
      },
      body: JSON.stringify({ token: token })
    });

    const setTokenData = await setTokenRes.json();
    console.log('Set token response:', setTokenData);

    // Redirect alla pagina principale
    window.location.href = 'index.html';

  } catch (err) {
    alert('Login fallito: ' + err.message);
  }
});
