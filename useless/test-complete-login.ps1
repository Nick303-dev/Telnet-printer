# Test completo del sistema di login
param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3001"
)

Write-Host "🚀 Test Completo Sistema Login - Telnet Printer" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🌐 Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Test 1: Login con credenziali corrette
Write-Host "🧪 TEST 1: Login con credenziali CORRETTE" -ForegroundColor Yellow
Write-Host "-" * 40

$validBody = @{
    email = "admin@test.com"
    password = "admin123"
    rememberMe = $true
} | ConvertTo-Json

try {
    $validResponse = Invoke-RestMethod -Uri "$BaseUrl/login" -Method Post -Body $validBody -ContentType "application/json"
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Risposta: $($validResponse.result)" -ForegroundColor Cyan
    Write-Host "   Utente: $($validResponse.user.email) ($($validResponse.user.role))" -ForegroundColor Cyan
    Write-Host "   Access Token: $($validResponse.accessToken ? 'Presente' : 'Mancante')" -ForegroundColor Cyan
    Write-Host "   Refresh Token: $($validResponse.refreshToken ? 'Presente' : 'Mancante')" -ForegroundColor Cyan
    
    $validToken = $validResponse.accessToken
    Write-Host "   ➡️  Il browser dovrebbe fare redirect a /printer/public/index.html" -ForegroundColor Gray
} catch {
    Write-Host "❌ UNEXPECTED FAILURE!" -ForegroundColor Red
    Write-Host "   Errore: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Login con password errata
Write-Host "🧪 TEST 2: Login con password ERRATA" -ForegroundColor Yellow  
Write-Host "-" * 40

$invalidBody = @{
    email = "admin@test.com"
    password = "passwordsbagliata123"
    rememberMe = $false
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$BaseUrl/login" -Method Post -Body $invalidBody -ContentType "application/json"
    Write-Host "❌ UNEXPECTED SUCCESS!" -ForegroundColor Red
    Write-Host "   Questo non dovrebbe succedere!" -ForegroundColor Red
    Write-Host "   Risposta: $($invalidResponse.result)" -ForegroundColor Red
} catch {
    Write-Host "✅ EXPECTED FAILURE!" -ForegroundColor Green
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
    
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Errore: $($errorDetails.result)" -ForegroundColor Cyan
    } catch {
        Write-Host "   Errore: $($_.Exception.Message)" -ForegroundColor Cyan
    }
    
    Write-Host "   ➡️  Il browser NON dovrebbe fare redirect" -ForegroundColor Gray
    Write-Host "   ➡️  Dovrebbe mostrare alert di errore" -ForegroundColor Gray
}

Write-Host ""

# Test 3: Email non esistente
Write-Host "🧪 TEST 3: Email NON ESISTENTE" -ForegroundColor Yellow
Write-Host "-" * 40

$nonExistentBody = @{
    email = "nonexistente@test.com"
    password = "qualsiasi123"
    rememberMe = $false
} | ConvertTo-Json

try {
    $nonExistentResponse = Invoke-RestMethod -Uri "$BaseUrl/login" -Method Post -Body $nonExistentBody -ContentType "application/json"
    Write-Host "❌ UNEXPECTED SUCCESS!" -ForegroundColor Red
} catch {
    Write-Host "✅ EXPECTED FAILURE!" -ForegroundColor Green
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
    
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Errore: $($errorDetails.result)" -ForegroundColor Cyan
    } catch {
        Write-Host "   Errore: $($_.Exception.Message)" -ForegroundColor Cyan
    }
}

Write-Host ""

# Test 4: Test API protette con token valido
if ($validToken) {
    Write-Host "🧪 TEST 4: API Protette con TOKEN VALIDO" -ForegroundColor Yellow
    Write-Host "-" * 40
    
    $headers = @{"Authorization" = "Bearer $validToken"}
    
    try {
        $profileResponse = Invoke-RestMethod -Uri "$BaseUrl/api/profile" -Headers $headers
        Write-Host "✅ Profile API SUCCESS!" -ForegroundColor Green
        Write-Host "   Utente: $($profileResponse.user.email)" -ForegroundColor Cyan
        
        # Test admin API
        $adminResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/users" -Headers $headers
        Write-Host "✅ Admin API SUCCESS!" -ForegroundColor Green
        Write-Host "   Utenti trovati: $($adminResponse.users.Count)" -ForegroundColor Cyan
        
    } catch {
        Write-Host "❌ API FAILURE!" -ForegroundColor Red
        Write-Host "   Errore: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Test 5: API protette senza token
Write-Host "🧪 TEST 5: API Protette SENZA TOKEN" -ForegroundColor Yellow
Write-Host "-" * 40

try {
    $noTokenResponse = Invoke-RestMethod -Uri "$BaseUrl/api/profile"
    Write-Host "❌ UNEXPECTED SUCCESS!" -ForegroundColor Red
} catch {
    Write-Host "✅ EXPECTED FAILURE!" -ForegroundColor Green
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
    Write-Host "   ➡️  Le API protette bloccano correttamente senza token" -ForegroundColor Gray
}

Write-Host ""

# Riepilogo
Write-Host "📋 RIEPILOGO COMPORTAMENTO ATTESO:" -ForegroundColor Yellow
Write-Host "-" * 40
Write-Host "1. ✅ Login VALIDO → Redirect alla printer page" -ForegroundColor Green
Write-Host "2. ❌ Login INVALIDO → Alert errore + NO redirect" -ForegroundColor Red  
Write-Host "3. 🔒 Token salvato in localStorage per API calls" -ForegroundColor Cyan
Write-Host "4. 🛡️  API protette richiedono autenticazione" -ForegroundColor Blue

Write-Host ""
Write-Host "🌐 Per test manuali:" -ForegroundColor Yellow
Write-Host "   - Pagina test: $BaseUrl/test-login.html" -ForegroundColor Cyan
Write-Host "   - Login page: $BaseUrl/login.html" -ForegroundColor Cyan
Write-Host "   - Main app: $BaseUrl" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Test completato!" -ForegroundColor Green