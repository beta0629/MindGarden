@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM PowerShell 스크립트 실행 (특수문자 처리 개선)
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
