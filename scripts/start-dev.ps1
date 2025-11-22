param(
    [switch]$NoEnv    # -NoEnv 주면 .env.local 로드 생략
)

$ErrorActionPreference = "Stop"

# 스크립트 기준으로 프로젝트 루트 계산
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "========================================="
Write-Host " 코어(Core) 솔루션 로컬 개발 서버 시작" -ForegroundColor Cyan
Write-Host " 루트 경로: $ProjectRoot" -ForegroundColor DarkGray
Write-Host "========================================="
Write-Host ""

Set-Location $ProjectRoot

if (-not $NoEnv) {
    # .env.local 로드 (있을 때만)
    $envScript = Join-Path $ScriptDir "load-env.ps1"
    if (Test-Path $envScript) {
        Write-Host "🔑 .env.local 환경 변수 로드 시도..." -ForegroundColor Yellow
        try {
            & $envScript
        } catch {
            Write-Host "⚠️ .env.local 로드 중 오류 (계속 진행): $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    } else {
        Write-Host "⚠️ scripts/load-env.ps1 을 찾을 수 없습니다. (환경 변수는 수동 설정)" -ForegroundColor Yellow
    }
}

# 백엔드 서버 시작
$backendCmd = "cd `"$ProjectRoot`"; " +
    "if (Test-Path .\mvnw.cmd) { " +
    "  Write-Host 'mvnw.cmd 로 Spring Boot 서버 시작...' -ForegroundColor Cyan; " +
    "  .\mvnw.cmd spring-boot:run -Dspring.profiles.active=local " +
    "} else { " +
    "  Write-Host 'mvnw.cmd 없음, mvn 으로 시도... (PATH 에 mvn 있어야 함)' -ForegroundColor Yellow; " +
    "  mvn spring-boot:run -Dspring.profiles.active=local " +
    "}"

Write-Host "[백엔드] 새 PowerShell 창에서 서버 시작..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command",$backendCmd -WindowStyle Normal -WorkingDirectory $ProjectRoot -ErrorAction SilentlyContinue

# 프론트엔드 서버 시작
$frontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path $frontendDir) {
    $frontendCmd = "cd `"$frontendDir`"; " +
        "Write-Host 'npm start 로 React 개발 서버 시작...' -ForegroundColor Cyan; " +
        "npm start"

    Write-Host "[프론트엔드] 새 PowerShell 창에서 서버 시작..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy","Bypass","-Command",$frontendCmd -WindowStyle Normal -WorkingDirectory $frontendDir -ErrorAction SilentlyContinue
} else {
    Write-Host "⚠️ frontend 디렉터리를 찾을 수 없습니다: $frontendDir" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ 로컬 서버 시작 명령을 모두 보냈습니다." -ForegroundColor Green
Write-Host "   백엔드: http://localhost:8080"
Write-Host "   프론트엔드: http://localhost:3000"
Write-Host ""

