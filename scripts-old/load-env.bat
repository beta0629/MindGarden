@echo off
REM 환경 변수 자동 로드 스크립트 (Windows)
REM Usage: scripts\load-env.bat

setlocal EnableDelayedExpansion

REM 프로젝트 루트 디렉토리로 이동
cd /d "%~dp0\.."

if not exist ".env.local" (
    echo .env.local 파일이 없습니다.
    echo env.local.example을 복사하여 .env.local을 만드세요:
    echo    copy env.local.example .env.local
    exit /b 1
)

REM 환경 변수 로드
for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    REM 주석 건너뛰기
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        if not "!line!"=="" (
            set "%%a=%%b"
        )
    )
)

echo 환경 변수가 로드되었습니다.
echo DB_HOST: %DB_HOST%
echo DB_NAME: %DB_NAME%
echo DB_USERNAME: %DB_USERNAME%
echo.
echo 이 스크립트는 call 명령으로 실행해야 합니다:
echo    call scripts\load-env.bat

endlocal

