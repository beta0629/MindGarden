# MindGarden 서버 시작 스크립트
# PowerShell 스크립트로 특수문자 포함 비밀번호 처리

$ErrorActionPreference = "Stop"

# 현재 디렉토리로 이동
Set-Location $PSScriptRoot

# .env.local 파일에서 환경 변수 로드
if (Test-Path ".env.local") {
    Write-Host "Loading environment variables from .env.local..." -ForegroundColor Green
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*#') { return }  # 주석 건너뛰기
        if ($_ -match '^\s*$') { return }  # 빈 줄 건너뛰기
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  Loaded: $key" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "WARNING: .env.local file not found!" -ForegroundColor Yellow
}

# 기본값 설정
if (-not $env:DB_HOST) { $env:DB_HOST = "beta0629.cafe24.com" }
if (-not $env:DB_PORT) { $env:DB_PORT = "3306" }
if (-not $env:DB_NAME) { $env:DB_NAME = "mind_garden" }
if (-not $env:DB_USERNAME) { $env:DB_USERNAME = "mindgarden_dev" }

# Spring 프로파일 설정
$env:SPRING_PROFILES_ACTIVE = "local"

Write-Host "`nStarting MindGarden Server..." -ForegroundColor Cyan
Write-Host "DB_HOST=$env:DB_HOST"
Write-Host "DB_NAME=$env:DB_NAME"
Write-Host "DB_USERNAME=$env:DB_USERNAME"
if ($env:DB_PASSWORD) {
    Write-Host "DB_PASSWORD is set (hidden for security)" -ForegroundColor Green
} else {
    Write-Host "WARNING: DB_PASSWORD is not set!" -ForegroundColor Red
}

# JAVA_HOME 설정 (필요한 경우)
if (-not $env:JAVA_HOME) {
    $javaHome = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
    if (Test-Path $javaHome) {
        $env:JAVA_HOME = $javaHome
        Write-Host "JAVA_HOME set to: $javaHome" -ForegroundColor Gray
    }
}

# JAR 파일 확인 및 실행
if (Test-Path "target\consultation-management-system-1.0.0.jar") {
    Write-Host "`nFound JAR file, starting server..." -ForegroundColor Green
    java -jar "target\consultation-management-system-1.0.0.jar"
} else {
    Write-Host "`nJAR file not found. Trying Maven Wrapper..." -ForegroundColor Yellow
    if (Test-Path ".\mvnw.cmd") {
        .\mvnw.cmd spring-boot:run -Dspring.profiles.active=local
    } else {
        Write-Host "ERROR: Maven Wrapper (mvnw.cmd) not found!" -ForegroundColor Red
        exit 1
    }
}

