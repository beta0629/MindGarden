# MindGarden 개발 서버 자동 빌드 및 실행 스크립트 (Windows PowerShell)
# 데이터베이스 연결 설정 포함
# Usage: .\scripts\start-dev.ps1 [profile]
# 예시: .\scripts\start-dev.ps1 local

# 오류 처리 설정
$ErrorActionPreference = "Continue"  # 오류가 나도 계속 진행하되 처리
$global:ScriptError = $null
$global:CleanupRequired = $false
$global:BACKEND_PID = $null

# 색상 출력 함수
function Write-ColorOutput {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ForegroundColor,
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Message
    )
    try {
        $fc = $host.UI.RawUI.ForegroundColor
        $host.UI.RawUI.ForegroundColor = $ForegroundColor
        if ($Message) {
            Write-Output ($Message -join " ")
        }
        $host.UI.RawUI.ForegroundColor = $fc
    } catch {
        # 색상 출력 실패 시 일반 출력
        if ($Message) {
            Write-Output ($Message -join " ")
        }
    }
}

# 오류 로깅 함수
function Write-ErrorLog {
    param(
        [string]$Message,
        [Exception]$Exception = $null
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] ERROR: $Message"
    
    if ($Exception) {
        $logMessage += "`n  예외: $($Exception.GetType().FullName)"
        $logMessage += "`n  메시지: $($Exception.Message)"
        if ($Exception.InnerException) {
            $logMessage += "`n  내부 예외: $($Exception.InnerException.Message)"
        }
    }
    
    # 콘솔에 출력
    Write-ColorOutput Red $logMessage
    
    # 로그 파일에 기록 ($ProjectRoot가 정의되어 있는 경우에만)
    try {
        if ($ProjectRoot) {
            $logDir = Join-Path $ProjectRoot "logs"
            if (-not (Test-Path $logDir)) {
                New-Item -ItemType Directory -Path $logDir -Force -ErrorAction Stop | Out-Null
            }
            $logFile = Join-Path $logDir "start-dev-errors.log"
            Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
        } else {
            # $ProjectRoot가 없으면 현재 디렉토리 사용
            $logDir = "logs"
            if (-not (Test-Path $logDir)) {
                New-Item -ItemType Directory -Path $logDir -Force -ErrorAction Stop | Out-Null
            }
            $logFile = Join-Path $logDir "start-dev-errors.log"
            Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
        }
    } catch {
        # 로그 파일 기록 실패는 무시 (콘솔에는 이미 출력됨)
    }
}

# 정리(Cleanup) 함수
function Stop-DevServer {
    if ($global:CleanupRequired -and $global:BACKEND_PID) {
        Write-ColorOutput Yellow "`n🧹 정리 작업 중..."
        try {
            $proc = Get-Process -Id $global:BACKEND_PID -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $global:BACKEND_PID -Force -ErrorAction SilentlyContinue
                Write-ColorOutput Green "✅ 프로세스 정리 완료 (PID: $global:BACKEND_PID)"
            }
        } catch {
            # 정리 실패는 무시
        }
    }
}

# 종료 시 정리
Register-EngineEvent PowerShell.Exiting -Action { Stop-DevServer } | Out-Null
trap { Stop-DevServer; break }

# 사전 검증 함수
function Test-Prerequisites {
    Write-ColorOutput Yellow '🔍 0단계: 사전 요구사항 검증'
    $errors = 0

    # Java 검증
    $javaPath = Get-Command java -ErrorAction SilentlyContinue
    if ($javaPath) {
        $javaVersion = (java -version 2>&1) | Select-String -Pattern "version" | ForEach-Object { $_.ToString().Split('"')[1] }
        Write-ColorOutput Green "  ✅ Java 설치됨 (버전: $javaVersion)"
    } else {
        Write-ColorOutput Red "  ❌ Java가 설치되지 않았습니다. JDK 17 이상을 설치해주세요."
        $errors++
    }

    # Maven 검증
    $mvnPath = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvnPath) {
        $mvnVersion = (mvn -version 2>&1) | Select-String -Pattern "Apache Maven"
        Write-ColorOutput Green "  ✅ Maven 설치됨 ($mvnVersion)"
    } else {
        Write-ColorOutput Red "  ❌ Maven이 설치되지 않았습니다. Maven을 설치하고 PATH에 추가해주세요."
        Write-ColorOutput Yellow "  💡 또는 Maven Wrapper 사용: .\\mvnw.cmd"
        $errors++
    }
    
    # .env.local 파일 및 필수 변수 검증
    if (-not (Test-Path ".env.local")) {
        Write-ColorOutput Red "  ❌ .env.local 파일이 없습니다."
        if (Test-Path "env.local.example") {
            Write-ColorOutput Yellow "  💡 env.local.example 파일을 복사하여 .env.local 파일을 생성하세요."
            Write-ColorOutput Yellow "     cp env.local.example .env.local"
        }
        $errors++
    } else {
        # 필수 환경 변수 검증
        $requiredVars = @("DB_HOST", "DB_NAME", "DB_USERNAME", "DB_PASSWORD")
        $envContent = Get-Content ".env.local"
        foreach ($var in $requiredVars) {
            $found = $envContent | Select-String -Pattern "^$var=" -Quiet
            if (-not $found) {
                Write-ColorOutput Red "  ❌ .env.local 파일에 필수 변수 '$var'가 없습니다."
                $errors++
            }
        }
    }

    if ($errors -gt 0) {
        Write-ColorOutput Red "`n❌ 총 $errors 개의 문제를 찾았습니다. 스크립트를 중단합니다."
        exit 1
    } else {
        Write-ColorOutput Green "  ✅ 모든 요구사항을 충족합니다."
    }
    Write-Host ""
}

# 1단계: 환경 변수 로드 함수
function Import-EnvironmentVariables {
    Write-ColorOutput Yellow "🔧 1단계: 환경 변수 로드"
    $EnvFile = ".env.local"
    try {
        # 환경 변수 로드
        $envLoadErrors = @()
        Get-Content $EnvFile -ErrorAction Stop | ForEach-Object {
            try {
                $line = $_.Trim()
                if ($line -match '^\s*#' -or $line -eq '') { return }
                if ($line -match '^([^=]+)=(.*)$') {
                    $key = $matches[1].Trim()
                    $value = $matches[2].Trim()
                    [Environment]::SetEnvironmentVariable($key, $value, "Process")
                }
            } catch {
                $envLoadErrors += "라인 처리 실패: $line - $($_.Message)"
            }
        }
        
        if ($envLoadErrors.Count -gt 0) {
            Write-ColorOutput Yellow "⚠️  일부 환경 변수 로드 중 오류 발생"
            foreach ($err in $envLoadErrors) { Write-ErrorLog "Environment variable load error: $err" }
        }
        
        Write-ColorOutput Green "✅ 환경 변수가 성공적으로 로드되었습니다."
        Write-ColorOutput Blue "📋 DB_HOST: $env:DB_HOST"
        Write-ColorOutput Blue "📋 DB_NAME: $env:DB_NAME"
        Write-ColorOutput Blue "📋 DB_USERNAME: $env:DB_USERNAME"
    } catch {
        Write-ErrorLog "환경 변수 로딩 중 심각한 오류 발생" $_
        exit 1
    }
    Write-Host ""
}


# 프로파일 설정 (기본값: local) - $PROFILE은 예약 변수이므로 $SPRING_PROFILE 사용
$SPRING_PROFILE = if ($args.Count -gt 0) { $args[0] } else { "local" }

# 전체 스크립트를 try-catch로 감싸기
try {
    Write-ColorOutput Cyan "======================================"
    Write-ColorOutput Cyan "   MindGarden Dev Server 🚀"
    Write-ColorOutput Cyan "   데이터베이스 연결 포함"
    Write-ColorOutput Cyan "======================================"
    Write-Host ""

    # 프로젝트 루트 디렉토리로 이동
    try {
        $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
        $ProjectRoot = Split-Path -Parent $ScriptDir
        Set-Location $ProjectRoot -ErrorAction Stop
        
        Write-ColorOutput Blue "📂 프로젝트 루트: $ProjectRoot"
        Write-Host ""
    } catch {
        Write-ErrorLog "Failed to change to project root directory" $_
        exit 1
    }

    # 0단계: 사전 요구사항 검증
    Test-Prerequisites

    # 1단계: 환경 변수 로드
    Import-EnvironmentVariables

    Write-ColorOutput Yellow "📋 설정된 프로파일: $SPRING_PROFILE"
    Write-Host ""

    # ================================================
    # 2단계: 데이터베이스 연결 확인
    # ================================================
    Write-ColorOutput Yellow "🔍 2단계: 데이터베이스 연결 설정 확인"

    $DB_HOST_VAL = if ($env:DB_HOST) { $env:DB_HOST } else { "beta0629.cafe24.com" }
    $DB_PORT_VAL = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
    $DB_NAME_VAL = if ($env:DB_NAME) { $env:DB_NAME } else { "mind_garden" }
    $DB_USERNAME_VAL = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "mindgarden_dev" }

    Write-ColorOutput Blue "   - 호스트: $DB_HOST_VAL"
    Write-ColorOutput Blue "   - 포트: $DB_PORT_VAL"
    Write-ColorOutput Blue "   - 데이터베이스: $DB_NAME_VAL"
    Write-ColorOutput Blue "   - 사용자명: $DB_USERNAME_VAL"

    # MySQL 클라이언트 연결 테스트는 제거 (오류 방지)

    Write-Host ""

    # ================================================
    # 3단계: 기존 프로세스 종료
    # ================================================
    Write-ColorOutput Yellow "🔄 3단계: 기존 백엔드 프로세스 확인 및 종료"

    try {
        # PowerShell 5.1에서는 CommandLine 속성이 기본적으로 없으므로 WMI 사용
        $backendProcesses = $null
        try {
            $backendProcesses = Get-WmiObject Win32_Process -Filter "name = 'java.exe'" -ErrorAction SilentlyContinue | Where-Object {
                ($_.CommandLine -like "*spring-boot:run*") -or ($_.CommandLine -like "*consultation-management-system*")
            }
        } catch {
            # WMI 실패 시 Get-Process로 시도
            try {
                $backendProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object {
                    $_.CommandLine -like "*spring-boot:run*" -or $_.CommandLine -like "*consultation-management-system*"
                }
            } catch {
                Write-ColorOutput Yellow "   ⚠️  프로세스 확인 중 오류 발생 (계속 진행합니다)"
            }
        }

        if ($backendProcesses) {
            Write-ColorOutput Yellow "⚠️  기존 백엔드 프로세스를 종료합니다..."
            $stopErrors = 0
            $backendProcesses | ForEach-Object {
                try {
                    $procId = if ($_.ProcessId) { $_.ProcessId } else { $_.Id }
                    Stop-Process -Id $procId -Force -ErrorAction Stop
                } catch {
                    $stopErrors++
                    Write-ErrorLog "Failed to terminate process (PID: $procId)" $_
                }
            }
            if ($stopErrors -eq 0) {
                Start-Sleep -Seconds 3
                Write-ColorOutput Green "✅ 기존 프로세스 종료 완료"
            } else {
                Write-ColorOutput Yellow "⚠️  일부 프로세스 종료 중 오류 발생 (계속 진행합니다)"
            }
        } else {
            Write-ColorOutput Green "✅ 실행 중인 백엔드 프로세스가 없습니다"
        }
    } catch {
        Write-ErrorLog "Error occurred during existing process termination" $_
        Write-ColorOutput Yellow "⚠️  프로세스 종료 중 오류가 발생했지만 계속 진행합니다..."
    }

    Write-Host ""

    # ================================================
    # 4단계: Maven 빌드
    # ================================================
    Write-ColorOutput Yellow '🔨 4단계: Maven 빌드'

    try {
        # 로그 디렉토리 생성
        try {
            if (-not (Test-Path "logs")) {
                New-Item -ItemType Directory -Path "logs" -Force -ErrorAction Stop | Out-Null
            }
        } catch {
            Write-ErrorLog "Failed to create log directory" $_
            throw
        }

        Write-ColorOutput Yellow '   Maven 빌드 시작...'

        $mvnPath = Get-Command mvn -ErrorAction SilentlyContinue
        if (-not $mvnPath) {
            Write-ColorOutput Red '❌ Maven이 설치되지 않았습니다!'
            Write-ColorOutput Yellow '💡 Maven을 설치하거나 Maven Wrapper를 사용하세요.'
            Write-ColorOutput Yellow '💡 Maven Wrapper 사용: .\mvnw.cmd clean package -DskipTests'
            throw 'Maven not found'
        }

        Write-ColorOutput Blue "   Maven 경로: $($mvnPath.Source)"
        
        try {
            $mvnOutput = & mvn clean package -DskipTests 2>&1
            if ($LASTEXITCODE -ne 0 -and -not $?) {
                Write-ColorOutput Red '❌ Maven 빌드 실패!'
                Write-ErrorLog "Maven 빌드 실패" (New-Object Exception "Maven build failed with exit code $LASTEXITCODE")
                Write-ColorOutput Yellow '💡 마지막 20줄의 빌드 출력:'
                $mvnOutput | Select-Object -Last 20 | ForEach-Object { Write-Host ("   {0}" -f $_) }
                throw 'Maven build failed'
            }
        } catch {
            Write-ErrorLog 'Exception occurred during Maven build' $_
            throw
        }

        Write-ColorOutput Green '✅ Maven 빌드 성공!'

        # JAR 파일 확인
        $JAR_FILE = 'target\consultation-management-system-1.0.0.jar'
        if (-not (Test-Path $JAR_FILE)) {
            Write-ColorOutput Red "❌ JAR 파일을 찾을 수 없습니다: $JAR_FILE"
            Write-ColorOutput Yellow '💡 target 디렉토리 내용:'
            if (Test-Path "target") {
                Get-ChildItem "target" -Filter "*.jar" | ForEach-Object { Write-Host ("   - {0}" -f $_.Name) }
            }
            throw 'JAR file not found'
        }

        Write-ColorOutput Green "✅ JAR 파일 확인: $JAR_FILE"
    } catch {
        Write-ErrorLog 'Fatal error occurred during Maven build step' $_
        Write-ColorOutput Red "`n❌ 빌드 단계에서 오류가 발생했습니다."
        Write-ColorOutput Yellow '💡 오류 로그: logs\start-dev-errors.log'
        Stop-DevServer
        exit 1
    }

    Write-Host ""

    # ================================================
    # 5단계: 백엔드 서버 시작
    # ================================================
    Write-ColorOutput Yellow "🚀 5단계: 백엔드 서버 시작"

    try {
        # 환경 변수 설정
        $env:DB_HOST = $DB_HOST_VAL
        $env:DB_PORT = $DB_PORT_VAL
        $env:DB_NAME = $DB_NAME_VAL
        $env:DB_USERNAME = $DB_USERNAME_VAL
        # DB_PASSWORD는 이미 환경 변수로 설정되어 있으면 그대로 사용

        $process = $null
        if ($SPRING_PROFILE -eq "local") {
            # 로컬 개발 모드 - Maven으로 실행 (Hot Reload 지원)
            Write-ColorOutput Blue "🔧 개발 모드로 실행 (Hot Reload 지원, 프로파일: local)"
            
            try {
                # Maven을 백그라운드로 실행
                $process = Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run", "-Dspring-boot.run.profiles=local" -PassThru -WindowStyle Hidden -WorkingDirectory $ProjectRoot -RedirectStandardOutput "logs\backend.log" -RedirectStandardError "logs\backend-error.log" -ErrorAction Stop
                $global:BACKEND_PID = $process.Id
                $global:CleanupRequired = $true
            } catch {
                Write-ErrorLog "Failed to start Maven process" $_
                throw
            }
        } else {
            # 프로덕션 모드 - JAR 파일로 실행
            Write-ColorOutput Blue "🏭 프로덕션 모드로 실행 (프로파일: $SPRING_PROFILE)"
            
            # Java 확인
            $javaPath = Get-Command java -ErrorAction SilentlyContinue
            if (-not $javaPath) {
                Write-ColorOutput Red "❌ Java가 설치되지 않았습니다!"
                throw "Java not found"
            }
            
            try {
                $process = Start-Process -FilePath "java" -ArgumentList "-jar", "-Dspring.profiles.active=$SPRING_PROFILE", $JAR_FILE -PassThru -WindowStyle Hidden -RedirectStandardOutput "logs\backend.log" -RedirectStandardError "logs\backend-error.log" -ErrorAction Stop
                $global:BACKEND_PID = $process.Id
                $global:CleanupRequired = $true
            } catch {
                Write-ErrorLog "Failed to start Java process" $_
                throw
            }
        }

        if (-not $process -or -not $global:BACKEND_PID) {
            throw "프로세스 시작 실패 - PID를 가져올 수 없습니다"
        }

        Write-ColorOutput Green "✅ 백엔드 서버 시작됨 (PID: $global:BACKEND_PID)"
    } catch {
        Write-ErrorLog "Fatal error occurred during backend server startup" $_
        Write-ColorOutput Red "`n❌ 서버 시작 중 오류가 발생했습니다."
        Write-ColorOutput Yellow "💡 오류 로그: logs\start-dev-errors.log"
        Write-ColorOutput Yellow "💡 백엔드 로그: logs\backend.log, logs\backend-error.log"
        Stop-DevServer
        exit 1
    }

    Write-Host ""

    # ================================================
    # 6단계: 헬스체크 및 데이터베이스 연결 확인
    # ================================================
    Write-ColorOutput Yellow "🔍 6단계: 서버 헬스체크 및 데이터베이스 연결 확인"

    Write-ColorOutput Yellow "   서버 시작 대기 중..."
    $maxAttempts = 60
    $attempt = 0
    $healthCheckPassed = $false
    $lastError = $null

    while ($attempt -lt $maxAttempts) {
        try {
            # 프로세스가 여전히 실행 중인지 확인
            if ($global:BACKEND_PID) {
                $proc = Get-Process -Id $global:BACKEND_PID -ErrorAction SilentlyContinue
                if (-not $proc) {
                    Write-ColorOutput Red "   ❌ 서버 프로세스가 종료되었습니다!"
                    Write-ErrorLog "Server process terminated unexpectedly (PID: $global:BACKEND_PID)"
                    throw "Server process terminated unexpectedly"
                }
            }

            $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput Green "   ✅ 백엔드 서버가 성공적으로 시작되었습니다!"
                $healthCheckPassed = $true
                break
            }
        } catch {
            $lastError = $_
            # 연결 실패는 정상 (아직 시작 중)
            if ($_.Exception.Response.StatusCode -eq 503) {
                # 서비스가 아직 준비되지 않음 - 계속 대기
            }
        }
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }

    Write-Host ""

    if (-not $healthCheckPassed) {
        Write-ColorOutput Red "   ❌ 백엔드 서버 헬스체크 타임아웃"
        Write-ErrorLog "Server health check timeout (last error: $($lastError.Message))"
        Write-ColorOutput Yellow "   💡 로그를 확인해보세요:"
        Write-ColorOutput Yellow "      - Get-Content logs\backend.log -Tail 50"
        Write-ColorOutput Yellow "      - Get-Content logs\backend-error.log -Tail 50"
        Write-ColorOutput Yellow "      - Get-Content logs\start-dev-errors.log"
        
        # 프로세스가 실행 중이면 로그 마지막 부분 표시
        if ($global:BACKEND_PID) {
            try {
                if (Test-Path "logs\backend-error.log") {
                    Write-ColorOutput Red "`n   최근 오류 로그:"
                    Get-Content "logs\backend-error.log" -Tail 10 | ForEach-Object { Write-Host "   $_" }
                }
            } catch {
                # 로그 읽기 실패는 무시
            }
        }
        
        Stop-DevServer
        exit 1
    }

    # 데이터베이스 연결 확인
    Write-ColorOutput Yellow "   데이터베이스 연결 확인 중..."
    Start-Sleep -Seconds 2

    try {
        $dbResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/health/database" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($dbResponse.StatusCode -eq 200) {
            Write-ColorOutput Green "   ✅ 데이터베이스 연결 정상!"
        } else {
            Write-ColorOutput Yellow "   ⚠️  데이터베이스 헬스체크 상태 코드: $($dbResponse.StatusCode)"
        }
    } catch {
        Write-ErrorLog "Database connection check failed" $_
        Write-ColorOutput Yellow "   ⚠️  데이터베이스 연결 확인 엔드포인트를 사용할 수 없습니다."
        Write-ColorOutput Blue '   ℹ️  수동으로 확인: Invoke-WebRequest http://localhost:8080/api/health/database'
        Write-ColorOutput Yellow "   ⚠️  이것은 경고일 뿐이며 서버는 실행 중입니다."
    }

    Write-Host ""

    # ================================================
    # 완료
    # ================================================
    Write-ColorOutput Green "======================================"
    Write-ColorOutput Green "   🎉 MindGarden Dev Server 실행 완료!"
    Write-ColorOutput Green "======================================"
    Write-Host ""

    Write-ColorOutput Cyan "🌐 접속 정보:"
    Write-ColorOutput Green "   ✅ 백엔드 API: http://localhost:8080"
    Write-ColorOutput Blue "   📊 Actuator Health: http://localhost:8080/actuator/health"
    Write-ColorOutput Blue "   🗄️  DB Health: http://localhost:8080/api/health/database"

    Write-Host ""
    Write-ColorOutput Cyan "📋 로그 파일:"
    Write-ColorOutput Blue "   - 백엔드: logs\backend.log"
    Write-ColorOutput Blue "   - 오류 로그: logs\backend-error.log"
    Write-ColorOutput Blue "   - 스크립트 오류: logs\start-dev-errors.log"
    Write-ColorOutput Blue "   - 실시간 확인: Get-Content logs\backend.log -Wait -Tail 50"

    Write-Host ""
    Write-ColorOutput Cyan "📊 데이터베이스 연결 정보:"
    Write-ColorOutput Blue "   - 호스트: $DB_HOST_VAL"
    Write-ColorOutput Blue "   - 데이터베이스: $DB_NAME_VAL"
    Write-ColorOutput Blue "   - 사용자: $DB_USERNAME_VAL"

    Write-Host ""
    Write-ColorOutput Cyan "🛑 종료 방법:"
    Write-ColorOutput Yellow "   - Ctrl+C (현재 터미널에서)"
    Write-ColorOutput Yellow "   - 또는: Stop-Process -Id $($global:BACKEND_PID)"
    Write-ColorOutput Yellow "   - 또는: .\scripts\stop-backend.ps1"

    Write-Host ""
    Write-ColorOutput Green "🚀 개발을 시작하세요! Happy Coding! 💻"

    # 프로세스 정보 저장
    try {
        "BACKEND_PID=$global:BACKEND_PID" | Out-File -FilePath '.mindgarden_pids' -Encoding UTF8 -ErrorAction Stop
    } catch {
        Write-ErrorLog 'Failed to save process information' $_
        # 이 오류는 치명적이지 않으므로 계속 진행
    }

} catch {
    # 예상치 못한 오류 처리
    Write-ErrorLog 'Unexpected error occurred during script execution' $_
    Write-ColorOutput Red ([Environment]::NewLine + 'Unexpected error occurred')
    if ($_.Exception.Message) {
        Write-ColorOutput Yellow 'Error details:'
        Write-ColorOutput Yellow $_.Exception.Message
    }
    Write-ColorOutput Yellow 'Detailed log: logs\start-dev-errors.log'
    Stop-DevServer
    exit 1
} finally {
    # 정리 작업은 Stop-DevServer에서 처리
}
