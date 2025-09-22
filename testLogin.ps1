# Script PowerShell per testare il login degli utenti
param(
    [Parameter(Mandatory=$false)]
    [string]$Email = "admin@test.com",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "admin123"
)

Write-Host "🚀 Test Login per Telnet-printer" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$body = @{
    email = $Email
    password = $Password
    rememberMe = $true
} | ConvertTo-Json

Write-Host "🔐 Tentativo login con: $Email" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/login" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ LOGIN RIUSCITO!" -ForegroundColor Green
    Write-Host "📧 Email: $($response.user.email)" -ForegroundColor Cyan
    Write-Host "👤 Ruolo: $($response.user.role)" -ForegroundColor Cyan
    Write-Host "🆔 ID: $($response.user.id)" -ForegroundColor Cyan
    Write-Host "🔑 Access Token: $($response.accessToken.Substring(0,50))..." -ForegroundColor Gray
    
    if ($response.refreshToken) {
        Write-Host "🔄 Refresh Token: $($response.refreshToken.Substring(0,50))..." -ForegroundColor Gray
    }
    
    Write-Host "`n🌐 Puoi ora accedere all'applicazione su: http://localhost:3001" -ForegroundColor Green
    
} catch {
    Write-Host "❌ LOGIN FALLITO!" -ForegroundColor Red
    Write-Host "📊 Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    try {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "📄 Errore: $($errorResponse.result)" -ForegroundColor Red
    } catch {
        Write-Host "📄 Errore: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n💡 Credenziali disponibili:" -ForegroundColor Yellow
Write-Host "   Admin: admin@test.com / admin123" -ForegroundColor White
Write-Host "   User:  user@test.com / user123" -ForegroundColor White
Write-Host "`n💡 Esempi d'uso:" -ForegroundColor Yellow
Write-Host "   ./testLogin.ps1" -ForegroundColor White
Write-Host "   ./testLogin.ps1 -Email user@test.com -Password user123" -ForegroundColor White