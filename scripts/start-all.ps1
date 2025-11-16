# MindGarden 프론트엔드 + 백엔드 통합 실행 스크립트
# Usage: .\scripts\start-all.ps1

$ErrorActionPreference = "Stop"

# 색상 출력 함수
function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

# 프로젝트 루트로 이동
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Info "======================================"
Write-Info "   MindGarden 개발 서버 시작"
Write-Info "   프론트엔드 + 백엔드"
Write-Info "======================================"
Write-Host ""

# 기존 프로세스 종료
Write-Info "기존 프로세스 확인 중..."
try {
    $javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*spring-boot:run*" -or $_.CommandLine -like "*consultation-management-system*"
    }
    if ($javaProcesses) {
        Write-Warning "기존 Java 프로세스 종료 중..."
        $javaProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
    }
} catch {
    # 무시
}

try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Warning "기존 Node 프로세스가 실행 중입니다. 수동으로 종료해주세요."
    }
} catch {
    # 무시
}

Write-Host ""

# 환경 변수 로드 (선택사항)
$EnvFile = ".env.local"
if (Test-Path $EnvFile) {
    Write-Info "환경 변수 로드 중..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and $_ -notmatch '^\s*#') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Success "환경 변수 로드 완료"
    Write-Host ""
}

# 백엔드 시작
Write-Info "백엔드 서버 시작 중..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:ProjectRoot
    mvn spring-boot:run -Dspring-boot.run.profiles=local
}

Write-Success "백엔드 서버 시작됨 (백그라운드)"
Write-Host ""

# 프론트엔드 시작
Write-Info "프론트엔드 서버 시작 중..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location (Join-Path $using:ProjectRoot "frontend")
    npm start
}

Write-Success "프론트엔드 서버 시작됨 (백그라운드)"
Write-Host ""

# 서버 대기
Write-Info "서버 시작 대기 중..."
Start-Sleep -Seconds 5

Write-Host ""
Write-Success "======================================"
Write-Success "   서버 실행 완료!"
Write-Success "======================================"
Write-Host ""
Write-Info "백엔드 API: http://localhost:8080"
Write-Info "프론트엔드: http://localhost:3000"
Write-Host ""
Write-Warning "종료하려면 Ctrl+C를 누르세요"
Write-Host ""

# 로그 모니터링
try {
    while ($true) {
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        
        if ($backendOutput) {
            Write-Host "[백엔드] $backendOutput"
        }
        if ($frontendOutput) {
            Write-Host "[프론트엔드] $frontendOutput"
        }
        
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Warning "서버 종료 중..."
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Success "서버 종료 완료"
}

