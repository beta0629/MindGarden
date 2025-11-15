# 환경 변수 자동 로드 스크립트 (Windows PowerShell)
# Usage: .\scripts\load-env.ps1

$ErrorActionPreference = "Stop"

# 프로젝트 루트 디렉토리로 이동
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

$EnvFile = ".env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ .env.local 파일이 없습니다." -ForegroundColor Red
    Write-Host "💡 env.local.example을 복사하여 .env.local을 만드세요:" -ForegroundColor Yellow
    Write-Host "   Copy-Item env.local.example .env.local" -ForegroundColor Yellow
    exit 1
}

# 환경 변수 로드
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    
    # 주석과 빈 줄 건너뛰기
    if ($line -match '^\s*#' -or $line -eq '') {
        return
    }
    
    # 환경 변수 설정
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

Write-Host "✅ 환경 변수가 로드되었습니다." -ForegroundColor Green
Write-Host "📋 DB_HOST: $env:DB_HOST" -ForegroundColor Cyan
Write-Host "📋 DB_NAME: $env:DB_NAME" -ForegroundColor Cyan
Write-Host "📋 DB_USERNAME: $env:DB_USERNAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 이 스크립트는 현재 PowerShell 세션에만 적용됩니다." -ForegroundColor Yellow

