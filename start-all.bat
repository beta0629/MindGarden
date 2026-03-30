@echo off
chcp 65001 >nul

@echo off
chcp 65001 >nul

REM 이 스크립트는 항상 프로젝트 루트에서 실행되도록 보정
cd /d "%~dp0"

echo ========================================
echo 코어(Core) 솔루션 로컬 서버 시작 (PowerShell)
echo ========================================
echo.

REM PowerShell로 통합 start-dev.ps1 실행
powershell -NoExit -ExecutionPolicy Bypass -File ".\scripts\start-dev.ps1"

