document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validation
    if (!email || !password) {
        alert('Inserisci email e password');
        return;
    }
    
    // Disable form during submission
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 Accesso in corso...';
    
    try {
        const response = await fetch('/login', { 
            method: 'POST',
            credentials: "include", 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe })
        });
        
        const data = await response.json();
        const d = new Date();
        d.setTime(d.getTime() + (1*60*60*1000)); // 1 hour expiration
        let expires = "expires="+ d.toUTCString();
        // Set cookie

        console.log('Login response status:', response.status);
        console.log('Login response data:', data);
        
        if (response.ok && response.status === 200) {
            // Login riuscito SOLO se response.ok E status 200
            console.log('✅ Login successful:', data);
            
            // Verifica che abbiamo effettivamente i dati necessari
            if (!data.accessToken || !data.user) {
                console.error('❌ Invalid login response - missing required data');
                alert('❌ Errore: Risposta del server non valida');
                return;
            }
            
            // Salva i token SOLO se il login è davvero riuscito
            // Salva access token in localStorage per uso dell'applicazione
            localStorage.setItem('accessToken', data.accessToken);
            console.log('✅ Access token saved in localStorage:', data.accessToken.substring(0, 50) + '...');
            
            // Salva anche nel cookie per compatibilità con middleware legacy
            document.cookie = "authenticator=" + data.accessToken + "; max-age=3600; path=/";
            
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userEmail', data.user.email);
            
            // Verifica che sia stato salvato
            
            // Success message
            alert('✅ Login riuscito! Reindirizzamento...');
            
            // Redirect alla pagina principale
            window.location.href = '/printer/public/index.html';
            
        } else {
            // Login fallito - gestione esplicita degli errori
            console.error('❌ Login failed - Status:', response.status);
            console.error('❌ Login failed - Data:', data);
            
            // Pulisci qualsiasi dato di autenticazione esistente
            // Cancella cookie e localStorage
            document.cookie = "authenticator=; path=/; max-age=0";
            document.cookie = "refresh_token=; path=/; max-age=0";
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            
            // Mostra errore specifico
            let errorMessage = 'Login fallito';
            if (response.status === 401) {
                errorMessage = 'Credenziali non valide';
            } else if (response.status === 400) {
                errorMessage = 'Dati inseriti non validi';
            } else if (response.status >= 500) {
                errorMessage = 'Errore del server. Riprova più tardi';
            }
            
            if (data.result || data.message) {
                errorMessage = data.result || data.message;
            }
            
            alert('❌ Errore: ' + errorMessage);
            
            // Reset form
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
            
            // NON fare redirect in caso di errore!
            return;
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        
        // Pulisci token in caso di errore di rete
        document.cookie = "authenticator=; path=/; max-age=0";
        document.cookie = "refresh_token=; path=/; max-age=0";
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        
        alert('❌ Errore di connessione: ' + error.message);
    } finally {
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
