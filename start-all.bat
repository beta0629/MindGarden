@echo off
chcp 65001 >nul

REM 배치 파일이 있는 디렉토리를 기준으로 항상 동작하도록 설정
cd /d "%~dp0"
set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo ========================================
echo MindGarden 서버 시작
echo ========================================
echo.

REM 기존 포트 사용 프로세스 종료
echo 기존 서버 프로세스 종료 중...
powershell -ExecutionPolicy Bypass -Command "$ports = @(8080,3000); foreach ($port in $ports) { $connections = netstat -ano | Select-String \":$port\s+\" | Select-String 'LISTENING'; if ($connections) { $pids = $connections | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique; foreach ($pid in $pids) { try { $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue; if ($proc) { Write-Host \"포트 $port 사용 프로세스 종료: $pid ($($proc.ProcessName))\" -ForegroundColor Yellow; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; } } catch {} } } }; Start-Sleep -Seconds 2"

echo.

REM 백엔드 서버 시작 (새 창에서)
echo 백엔드 서버 시작 중...
start "MindGarden Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "cd '%ROOT_DIR%'; .\start-server.ps1"

REM 잠시 대기
timeout /t 3 /nobreak >nul

REM 프론트엔드 서버 시작 (새 창에서)
echo 프론트엔드 서버 시작 중...
start "MindGarden Frontend" powershell -NoExit -Command "cd '%FRONTEND_DIR%'; & 'C:\Program Files\nodejs\npm.cmd' start"

echo.
echo ========================================
echo 서버 시작 완료!
echo ========================================
echo.
echo 백엔드: http://localhost:8080
echo 프론트엔드: http://localhost:3000
echo.
echo 서버를 종료하려면 각 창을 닫으세요.
echo.
pause

