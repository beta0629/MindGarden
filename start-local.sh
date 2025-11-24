#!/bin/bash

# MindGarden 로컬 개발 서버 시작 스크립트 (Bash)
# 백엔드와 프론트엔드를 백그라운드로 실행하고 로그를 파일로 저장
# 사용법: ./start-local.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
PROJECT_ROOT=$(pwd)

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MindGarden 로컬 개발 서버 시작${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p logs

# 환경 변수 로드 (있으면)
if [ -f "scripts/load-env.sh" ]; then
    echo -e "${YELLOW}🔑 환경 변수 로드 중...${NC}"
    source scripts/load-env.sh
    echo ""
fi

# 기존 프로세스 종료
echo -e "${YELLOW}🧹 기존 프로세스 정리 중...${NC}"

# 백엔드 프로세스 종료
if [ -f "logs/backend.pid" ]; then
    OLD_PID=$(cat logs/backend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   백엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/backend.pid
fi

# 프론트엔드 프로세스 종료
if [ -f "logs/frontend.pid" ]; then
    OLD_PID=$(cat logs/frontend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   프론트엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/frontend.pid
fi

# 포트 사용 중인 프로세스 종료
echo -e "${BLUE}   포트 8080, 3000 정리 중...${NC}"
if command -v lsof >/dev/null 2>&1; then
    # macOS/Linux
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
elif command -v netstat >/dev/null 2>&1; then
    # Windows (Git Bash)
    netstat -ano | grep ":8080" | awk '{print $5}' | xargs kill -9 2>/dev/null || true
    netstat -ano | grep ":3000" | awk '{print $5}' | xargs kill -9 2>/dev/null || true
fi
sleep 2

echo -e "${GREEN}✅ 프로세스 정리 완료${NC}"
echo ""

# 백엔드 시작
echo -e "${YELLOW}🚀 백엔드 서버 시작 중...${NC}"

# Maven 확인
if command -v mvn >/dev/null 2>&1; then
    echo -e "${BLUE}   Maven으로 실행${NC}"
    mvn spring-boot:run -Dspring.profiles.active=local > logs/backend.log 2>&1 &
    BACKEND_PID=$!
elif [ -f "./mvnw" ]; then
    echo -e "${BLUE}   Maven Wrapper로 실행${NC}"
    ./mvnw spring-boot:run -Dspring.profiles.active=local > logs/backend.log 2>&1 &
    BACKEND_PID=$!
elif [ -f "./mvnw.cmd" ]; then
    echo -e "${BLUE}   Maven Wrapper (Windows)로 실행${NC}"
    cmd.exe //c "cd /d $PROJECT_ROOT && mvnw.cmd spring-boot:run -Dspring.profiles.active=local" > logs/backend.log 2>&1 &
    BACKEND_PID=$!
else
    echo -e "${RED}❌ Maven을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}   Maven을 설치하거나 mvnw 파일이 있는지 확인하세요.${NC}"
    exit 1
fi

echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}   ✅ 백엔드 시작됨 (PID: $BACKEND_PID)${NC}"
echo ""

# 프론트엔드 시작
echo -e "${YELLOW}⚛️  프론트엔드 서버 시작 중...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ frontend 디렉토리를 찾을 수 없습니다.${NC}"
    exit 1
fi

cd frontend

# npm install (필요시)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}   npm 의존성 설치 중...${NC}"
    npm install > ../logs/frontend-install.log 2>&1
    echo -e "${GREEN}   ✅ 의존성 설치 완료${NC}"
fi

# npm start
echo -e "${BLUE}   React 개발 서버 시작${NC}"
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}   ✅ 프론트엔드 시작됨 (PID: $FRONTEND_PID)${NC}"
echo ""

# 완료 메시지
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ 서버 시작 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}🌐 접속 주소:${NC}"
echo -e "${GREEN}   백엔드:  http://localhost:8080${NC}"
echo -e "${GREEN}   프론트엔드: http://localhost:3000${NC}"
echo ""
echo -e "${CYAN}📋 로그 확인:${NC}"
echo -e "${BLUE}   백엔드:  tail -f logs/backend.log${NC}"
echo -e "${BLUE}   프론트엔드: tail -f logs/frontend.log${NC}"
echo ""
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   ./stop-local.sh${NC}"
echo -e "${YELLOW}   또는: kill \$(cat logs/backend.pid) \$(cat logs/frontend.pid)${NC}"
echo ""

# 서버 시작 대기 (선택적)
echo -e "${YELLOW}⏳ 서버 시작 대기 중... (5초)${NC}"
sleep 5

# 프로세스 확인
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 백엔드 프로세스 실행 중${NC}"
else
    echo -e "${RED}⚠️  백엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
    echo -e "${BLUE}   tail -20 logs/backend.log${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 프론트엔드 프로세스 실행 중${NC}"
else
    echo -e "${RED}⚠️  프론트엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
    echo -e "${BLUE}   tail -20 logs/frontend.log${NC}"
fi

echo ""

