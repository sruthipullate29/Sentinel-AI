param (
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$Command = "start"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-CommandExists {
    param ([string]$cmd)
    return [bool](Get-Command -Name $cmd -ErrorAction SilentlyContinue)
}

function Show-Status {
    Write-Host "`nSentinelAI Status" -ForegroundColor Cyan
    Write-Host "-----------------" -ForegroundColor Cyan
    
    $dockerExists = Test-CommandExists "docker"
    $dockerRunning = $false
    
    if ($dockerExists) {
        try {
            & docker info >$null 2>&1
            $dockerRunning = ($LASTEXITCODE -eq 0)
        }
        catch {
            $dockerRunning = $false
        }
        
        if ($dockerRunning) {
            Write-Host "[OK] Docker Daemon (Running)" -ForegroundColor Green
            $hindsightContainer = & docker ps -q -f "name=sentinelai-hindsight" 2>$null
            if ($hindsightContainer) {
                Write-Host "[OK] Hindsight Container" -ForegroundColor Green
            }
            else {
                Write-Host "[!] Hindsight Container (Not started)" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "[!] Docker Daemon (Installed but not running)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[-] Docker CLI (Not installed - using in-memory mode)" -ForegroundColor DarkGray
    }
    
    # Check Hindsight Port before making HTTP call to avoid timeouts
    $hindsightPort = [bool](Get-NetTCPConnection -LocalPort 8888 -State Listen -ErrorAction SilentlyContinue)
    if ($hindsightPort) {
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:8888/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
            Write-Host "[OK] Hindsight API (Port 8888)" -ForegroundColor Green
        }
        catch {
            Write-Host "[!] Hindsight API (Port 8888 open, health endpoint error)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "[-] Hindsight API (Not active - in-memory telemetry fallback)" -ForegroundColor DarkGray
    }

    $backendPort = [bool](Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
    if ($backendPort) { 
        Write-Host "[OK] Backend Service (Port 8000)" -ForegroundColor Green 
    }
    else { 
        Write-Host "[X] Backend Service (Port 8000)" -ForegroundColor Red 
    }

    $frontendPort = [bool](Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
    if ($frontendPort) { 
        Write-Host "[OK] Frontend Service (Port 5173)" -ForegroundColor Green 
    }
    else { 
        Write-Host "[X] Frontend Service (Port 5173)" -ForegroundColor Red 
    }

    Write-Host ""
    Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Blue
    Write-Host "API:       http://localhost:8000" -ForegroundColor Blue
    if ($hindsightPort) {
        Write-Host "Hindsight: http://localhost:8888" -ForegroundColor Blue
    }
    Write-Host ""
}

function Invoke-Doctor {
    param ([switch]$SkipStatus)
    
    Write-Host "`nSentinelAI Doctor" -ForegroundColor Cyan
    Write-Host "-----------------" -ForegroundColor Cyan
    
    $hasErrors = $false
    
    # 1. Check Docker
    if (Test-CommandExists "docker") {
        Write-Host "[OK] Docker CLI found." -ForegroundColor Green
    }
    else {
        Write-Host "[!] Docker CLI not found (Optional: Hindsight vector memory)." -ForegroundColor Yellow
    }
    
    # 2. Check Python
    if (Test-CommandExists "python") {
        $pyVersion = (& python --version 2>&1)
        Write-Host "[OK] Python found ($pyVersion)." -ForegroundColor Green
    }
    else {
        Write-Host "[X] Python is missing. Install Python 3.9+." -ForegroundColor Red
        $hasErrors = $true
    }
    
    # 3. Check Node/npm
    if (Test-CommandExists "npm") {
        $nodeVersion = (& node --version 2>&1)
        Write-Host "[OK] Node.js and npm found ($nodeVersion)." -ForegroundColor Green
    }
    else {
        Write-Host "[X] Node.js / npm is missing. Install Node.js (v18+ recommended)." -ForegroundColor Red
        $hasErrors = $true
    }
    
    # 4. Check Environment File
    if (-not (Test-Path "$ScriptDir\.env")) {
        if (Test-Path "$ScriptDir\.env.example") {
            Write-Host "[!] .env file missing. Created automatically from .env.example." -ForegroundColor Yellow
            Copy-Item "$ScriptDir\.env.example" "$ScriptDir\.env"
        }
    }
    else {
        Write-Host "[OK] .env configuration file present." -ForegroundColor Green
    }
    
    # 5. Check Python Virtual Environment
    $pythonVenv = "$ScriptDir\backend\venv"
    if (Test-Path $pythonVenv) {
        Write-Host "[OK] Backend virtual environment found." -ForegroundColor Green
    }
    else {
        Write-Host "[!] Backend virtual environment not initialized (will auto-create on start)." -ForegroundColor Yellow
    }
    
    # 6. Check Frontend node_modules
    $frontendModules = "$ScriptDir\sentinel-ai\node_modules"
    if (Test-Path $frontendModules) {
        Write-Host "[OK] Frontend node_modules present." -ForegroundColor Green
    }
    else {
        Write-Host "[!] Frontend dependencies not installed (will auto-install on start)." -ForegroundColor Yellow
    }

    if (-not $SkipStatus) {
        Show-Status
    }
    
    return -not $hasErrors
}

function Stop-Services {
    Write-Host "Stopping SentinelAI..." -ForegroundColor Cyan
    
    if (Test-CommandExists "docker") {
        docker compose down 2>$null
    }
    
    # Stop backend processes
    $backendProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -match "uvicorn" -or ($_.CommandLine -match "main:app" -and $_.ProcessName -match "python")
    }
    foreach ($proc in $backendProcs) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    
    # Stop frontend processes
    $frontendProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandLine -match "vite" -and $_.ProcessName -match "node" 
    }
    foreach ($proc in $frontendProcs) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "SentinelAI Stopped." -ForegroundColor Green
}

function Start-Services {
    Write-Host "Starting SentinelAI..." -ForegroundColor Cyan
    
    $doctorPassed = Invoke-Doctor -SkipStatus
    if (-not $doctorPassed) {
        Write-Host "`n[ERROR] Missing core prerequisites. Please install required software above." -ForegroundColor Red
        return
    }
    
    if (Test-CommandExists "docker") {
        try {
            & docker info >$null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Starting Docker services (Hindsight)..."
                docker compose up -d 2>$null
            }
            else {
                Write-Host "Docker daemon is not running. Proceeding with in-memory mode..." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Skipping Docker services..." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Docker not found. In-memory mode active..." -ForegroundColor Yellow
    }

    Write-Host "Starting Backend Service..."
    $pythonExe = "$ScriptDir\backend\venv\Scripts\python.exe"
    $uvicornExe = "$ScriptDir\backend\venv\Scripts\uvicorn.exe"
    
    if (-not (Test-Path $uvicornExe)) {
        Write-Host "Initializing Python virtual environment..."
        python -m venv "$ScriptDir\backend\venv"
        & "$pythonExe" -m pip install -r "$ScriptDir\backend\requirements.txt"
    }
    
    $backendPort = [bool](Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
    if (-not $backendPort) {
        $StartBackend = "Set-Location -Path '$ScriptDir\backend'; & '$uvicornExe' main:app --host 0.0.0.0 --port 8000"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $StartBackend -WindowStyle Minimized
    }
    else {
        Write-Host "Backend already running on port 8000." -ForegroundColor Green
    }

    Write-Host "Starting Frontend Service..."
    if (-not (Test-Path "$ScriptDir\sentinel-ai\node_modules")) {
        Write-Host "Installing Frontend dependencies..."
        Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$ScriptDir\sentinel-ai'; npm install" -Wait
    }
    
    $frontendPort = [bool](Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)
    if (-not $frontendPort) {
        $StartFrontend = "Set-Location -Path '$ScriptDir\sentinel-ai'; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $StartFrontend -WindowStyle Minimized
    }
    else {
        Write-Host "Frontend already running on port 5173." -ForegroundColor Green
    }

    Write-Host "Waiting for services to become ready..."
    Start-Sleep -Seconds 3
    
    Show-Status
}

switch ($Command.ToLower()) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Stop-Services; Start-Sleep -Seconds 2; Start-Services }
    "status" { Show-Status }
    "doctor" { Invoke-Doctor }
    default { Write-Host "Usage: .\sentinelai.ps1 [start|stop|restart|status|doctor]" }
}
