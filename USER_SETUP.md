# Configurazione Utenti - Telnet-printer

## ✅ Problema Risolto

Il database è ora configurato correttamente e gli utenti sono stati creati con successo!

## 👥 Utenti Creati

| Ruolo | Email | Password | Descrizione |
|-------|--------|----------|-------------|
| **Admin** | `admin@test.com` | `admin123` | Utente amministratore con tutti i privilegi |
| **User** | `user@test.com` | `user123` | Utente normale con accesso base |

## 🚀 Come Accedere

1. **Via Browser**: Vai su http://localhost:3001
   - Ti verrà reindirizzato automaticamente alla pagina di login
   - Inserisci le credenziali sopra indicate

2. **Via API** (per test):
   ```bash
   # PowerShell
   .\testLogin.ps1
   
   # O con credenziali specifiche
   .\testLogin.ps1 -Email user@test.com -Password user123
   ```

## 🔧 Scripts di Utilità

### `createUser.js`
Script Node.js per creare nuovi utenti nel database:
- Crea automaticamente la tabella `users` se non esiste
- Supporta creazione e aggiornamento utenti
- Hash delle password con bcrypt
- Verifica della connessione al database

### `testLogin.ps1`
Script PowerShell per testare il login:
- Testa la connessione API
- Mostra dettagli dell'utente autenticato
- Gestisce errori di autenticazione
- Supporta parametri personalizzabili

## 🏗️ Architettura Database

### Tabella `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## 🔐 Sistema di Autenticazione

- **JWT Tokens**: Access token (15min) + Refresh token (7 giorni)
- **Password Hashing**: bcrypt con salt rounds = 10
- **Role-based Access**: Admin vs User privileges
- **Account Status**: Active/Inactive support

## 🐛 Risoluzione Problemi

### Se il login non funziona:
1. Verifica che il server Docker sia in esecuzione: `docker ps`
2. Controlla i log del server: `docker logs telnet-printer-server-1`
3. Testa la connessione database: `node createUser.js`

### Se il database non risponde:
1. Riavvia i container: `docker compose down && docker compose up --build -d`
2. Verifica le variabili d'ambiente nel file `.env`
3. Controlla la porta 3306 per MySQL

## 🎯 Prossimi Passi

Ora puoi:
1. ✅ Accedere all'applicazione web
2. ✅ Testare le funzionalità di stampa Telnet
3. ✅ Gestire utenti tramite l'interfaccia admin
4. ✅ Sviluppare nuove funzionalità con autenticazione

## 📝 Note Tecniche

- **Endpoint Login**: `POST /login` (non `/api/login`)
- **Token Verification**: `GET /api/verify-token`
- **Protected Routes**: Tutte le route `/api/*` eccetto login/refresh
- **Database Connection**: Pool MySQL2 con gestione errori

La configurazione è stata testata e funziona correttamente! 🎉