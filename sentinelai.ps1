param (
    [Parameter(Mandatory=$false, Position=0)]
    [string]$Command = "start"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-CommandExists {
    param ([string]$cmd)
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

function Show-Status {
    Write-Host "SentinelAI Status" -ForegroundColor Cyan
    Write-Host "-----------------" -ForegroundColor Cyan
    
    $dockerExists = Test-CommandExists "docker"
    $dockerRunning = $false
    if ($dockerExists) {
        $dockerRunning = (docker info 2>$null) -ne $null
        if ($dockerRunning) { Write-Host "[OK] Docker Daemon" -ForegroundColor Green } else { Write-Host "[X] Docker Daemon (Not running)" -ForegroundColor Yellow }
        
        $hindsightContainer = (docker ps -q -f name=sentinelai-hindsight 2>$null)
        if ($hindsightContainer) { Write-Host "[OK] Hindsight Container" -ForegroundColor Green } else { Write-Host "[X] Hindsight Container" -ForegroundColor Yellow }
    } else {
        Write-Host "[X] Docker CLI (Not installed / In-memory fallback active)" -ForegroundColor Yellow
    }
    
    try {
        $hsRes = Invoke-RestMethod -Uri "http://localhost:8888/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        Write-Host "[OK] Hindsight API" -ForegroundColor Green
    } catch {
        Write-Host "[-] Hindsight API (Using in-memory telemetry / storage)" -ForegroundColor DarkGray
    }

    $backendPort = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($backendPort) { Write-Host "[OK] Backend Service (Port 8000)" -ForegroundColor Green } else { Write-Host "[X] Backend Service (Port 8000)" -ForegroundColor Red }

    $frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($frontendPort) { Write-Host "[OK] Frontend Service (Port 5173)" -ForegroundColor Green } else { Write-Host "[X] Frontend Service (Port 5173)" -ForegroundColor Red }

    Write-Host ""
    Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Blue
    Write-Host "API:       http://localhost:8000" -ForegroundColor Blue
}

function Run-Doctor {
    Write-Host "SentinelAI Doctor" -ForegroundColor Cyan
    Write-Host "-----------------" -ForegroundColor Cyan
    
    if (-not (Test-CommandExists "docker")) { Write-Host "[!] Docker CLI is missing (Optional: Hindsight container)." -ForegroundColor Yellow } else { Write-Host "[OK] Docker CLI found." -ForegroundColor Green }
    if (-not (Test-CommandExists "python")) { Write-Host "[X] Python is missing. Install Python 3.9+." -ForegroundColor Red } else { Write-Host "[OK] Python found." -ForegroundColor Green }
    if (-not (Test-CommandExists "npm")) { Write-Host "[X] npm is missing. Install Node.js." -ForegroundColor Red } else { Write-Host "[OK] npm found." -ForegroundColor Green }
    
    if (-not (Test-Path "$ScriptDir\.env")) {
        if (Test-Path "$ScriptDir\.env.example") {
            Write-Host "[!] .env file missing. Created from .env.example." -ForegroundColor Yellow
            Copy-Item "$ScriptDir\.env.example" "$ScriptDir\.env"
        }
    } else {
        Write-Host "[OK] .env file found." -ForegroundColor Green
    }
    
    Show-Status
}

function Stop-Services {
    Write-Host "Stopping SentinelAI..." -ForegroundColor Cyan
    
    if (Test-CommandExists "docker") {
        docker compose down 2>$null
    }
    
    $backendProcs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -match "uvicorn" -or $_.CommandLine -match "8000" }
    foreach ($proc in $backendProcs) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    
    $frontendProcs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -match "vite" -and $_.ProcessName -match "node" }
    foreach ($proc in $frontendProcs) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "SentinelAI Stopped." -ForegroundColor Green
}

function Start-Services {
    Write-Host "Starting SentinelAI..." -ForegroundColor Cyan
    
    Run-Doctor
    
    if (Test-CommandExists "docker") {
        Write-Host "Starting Docker services..."
        docker compose up -d 2>$null
    } else {
        Write-Host "Skipping Docker services (Docker not found)..." -ForegroundColor Yellow
    }

    Write-Host "Starting Backend..."
    $pythonExe = "$ScriptDir\backend\venv\Scripts\python.exe"
    $uvicornExe = "$ScriptDir\backend\venv\Scripts\uvicorn.exe"
    
    if (-not (Test-Path $pythonExe)) {
        Write-Host "Creating Python virtual environment..."
        python -m venv "$ScriptDir\backend\venv"
        & "$pythonExe" -m pip install -r "$ScriptDir\backend\requirements.txt"
    }
    
    $StartBackend = "Set-Location -Path '$ScriptDir\backend'; & '$uvicornExe' main:app --host 0.0.0.0 --port 8000"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $StartBackend -WindowStyle Minimized

    Write-Host "Starting Frontend..."
    if (-not (Test-Path "$ScriptDir\sentinel-ai\node_modules")) {
        Write-Host "Installing Frontend dependencies..."
        Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$ScriptDir\sentinel-ai'; npm install" -Wait
    }
    
    $StartFrontend = "Set-Location -Path '$ScriptDir\sentinel-ai'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $StartFrontend -WindowStyle Minimized

    Write-Host "Waiting for services to become ready..."
    Start-Sleep -Seconds 5
    
    Show-Status
}

switch ($Command.ToLower()) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Stop-Services; Start-Sleep -Seconds 2; Start-Services }
    "status" { Show-Status }
    "doctor" { Run-Doctor }
    default { Write-Host "Usage: .\sentinelai.ps1 [start|stop|restart|status|doctor]" }
}
