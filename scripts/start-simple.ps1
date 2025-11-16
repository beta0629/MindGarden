# MindGarden Simple Start Script
# Usage: .\scripts\start-simple.ps1

# UTF-8 encoding for console output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   MindGarden Dev Server Start" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Move to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

# Load environment variables
if (Test-Path ".env.local") {
    Write-Host "Loading environment variables..." -ForegroundColor Yellow
    Get-Content ".env.local" -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

Write-Host ""
Write-Host "Starting backend and frontend..." -ForegroundColor Green
Write-Host ""

# Check for npm
$npmCmd = $null
try {
    $npmCmd = Get-Command npm -ErrorAction Stop
} catch {
    # Try common npm locations
    $commonPaths = @(
        "$env:ProgramFiles\nodejs\npm.cmd",
        "$env:ProgramFiles(x86)\nodejs\npm.cmd",
        "$env:APPDATA\npm\npm.cmd"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $npmCmd = Get-Command $path
            break
        }
    }
}

if ($npmCmd -and (Test-Path "package.json")) {
    Write-Host "Running npm start..." -ForegroundColor Cyan
    & $npmCmd.Name start
} else {
    Write-Host "npm not found or package.json missing." -ForegroundColor Red
    Write-Host "Please run manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backend: mvn spring-boot:run -Dspring-boot.run.profiles=local" -ForegroundColor Yellow
    Write-Host "Frontend: cd frontend; npm start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use two separate terminals:" -ForegroundColor Yellow
    Write-Host "Terminal 1: mvn spring-boot:run -Dspring-boot.run.profiles=local" -ForegroundColor Cyan
    Write-Host "Terminal 2: cd frontend; npm start" -ForegroundColor Cyan
}

