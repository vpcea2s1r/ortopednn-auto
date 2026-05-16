param(
    [string]$Proxy = ""
)

$openserp = "C:\Users\user\AppData\Local\Temp\opencode\openserp\openserp.exe"
$log = "C:\opencode\ortopednn-auto\openserp\server.log"

if (-not (Test-Path $openserp)) {
    Write-Error "openserp.exe not found at $openserp"
    exit 1
}

# Проверить не запущен ли уже
$existing = Get-Process -Name "openserp" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "OpenSERP already running (PID: $($existing.Id))" -ForegroundColor Yellow
    exit 0
}

# Логи
if (-not (Test-Path "reports")) { New-Item -ItemType Directory -Path "reports" -Force > $null }

# Запуск
if ($Proxy) {
    Start-Process -WindowStyle Hidden -FilePath $openserp -ArgumentList "serve", "-a", "127.0.0.1", "-p", "7000", "--proxy", $Proxy -RedirectStandardOutput $log -RedirectStandardError "${log}.err"
} else {
    Start-Process -WindowStyle Hidden -FilePath $openserp -ArgumentList "serve", "-a", "127.0.0.1", "-p", "7000" -RedirectStandardOutput $log -RedirectStandardError "${log}.err"
}

Start-Sleep -Seconds 2

# Проверка
try {
    $health = Invoke-RestMethod "http://127.0.0.1:7000/health" -TimeoutSec 5
    Write-Host "OpenSERP started OK" -ForegroundColor Green
    Write-Host "Engines: $($health.engines | ForEach-Object { $_.name })"
    Write-Host "API: http://127.0.0.1:7000"
    Write-Host ""
    Write-Host "Usage: .\check.ps1"
} catch {
    Write-Error "Failed to start OpenSERP: $_"
}