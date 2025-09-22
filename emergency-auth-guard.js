// EMERGENCY AUTH GUARD - DA INCLUDERE PRIMA DI OGNI ALTRO SCRIPT

(function() {
    'use strict';
    
    console.log('🛡️ EMERGENCY AUTH GUARD ACTIVATED');
    
    // Forza pulizia immediata al caricamento
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 All storage cleared');
    
    // Blocca completamente la pagina fino a verifica auth
    let authVerified = false;
    
    // Nascondi tutto il contenuto
    const style = document.createElement('style');
    style.innerHTML = `
        body { opacity: 0 !important; }
        body.auth-verified { opacity: 1 !important; }
        .auth-guard { 
            position: fixed; 
            top: 0; left: 0; right: 0; bottom: 0; 
            background: white; 
            z-index: 999999; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            font-family: Arial; 
        }
    `;
    document.head.appendChild(style);
    
    // Aggiungi schermo di verifica
    const guardDiv = document.createElement('div');
    guardDiv.className = 'auth-guard';
    guardDiv.innerHTML = '<h1>🔒 Verifica autenticazione in corso...</h1>';
    document.body.appendChild(guardDiv);
    
    // Verifica autenticazione immediata
    async function emergencyAuthCheck() {
        console.log('🔍 Emergency auth check starting...');
        
        try {
            // Test 1: Verifica se siamo su una pagina protetta
            if (window.location.pathname.includes('/printer/') || 
                window.location.pathname.includes('/admin/') ||
                window.location.pathname.includes('/profile')) {
                
                console.log('📍 Protected page detected, forcing login redirect');
                
                // Non importa cosa c'è nel localStorage - FORZA LOGIN
                alert('🔒 Accesso negato. Reindirizzamento al login obbligatorio.');
                window.location.href = '/login.html';
                return;
            }
            
        } catch (error) {
            console.error('❌ Emergency auth check failed:', error);
            alert('Errore di sicurezza. Reindirizzamento al login.');
            window.location.href = '/login.html';
        }
    }
    
    // Esegui controllo immediato
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', emergencyAuthCheck);
    } else {
        emergencyAuthCheck();
    }
    
})();