#!/bin/bash

# MindGarden 간단한 서버 시작 스크립트
# 사용법: ./start-all-simple.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "=================================================="
echo "    🚀 MindGarden 간단 시작 스크립트 🚀"
echo "=================================================="
echo -e "${NC}"

# 프로젝트 루트로 이동
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 로그 디렉토리 생성
mkdir -p logs

# ===============================================
# 1단계: 기존 프로세스 종료
# ===============================================
echo -e "${YELLOW}🛑 1단계: 기존 프로세스 종료${NC}"

# 백엔드 종료
echo -e "${YELLOW}   백엔드 프로세스 종료...${NC}"
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "consultation-management-system" 2>/dev/null || true

# 프론트엔드 종료
echo -e "${YELLOW}   프론트엔드 프로세스 종료...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4300 | xargs kill -9 2>/dev/null || true

sleep 2
echo -e "${GREEN}✅ 1단계 완료: 기존 프로세스 종료됨${NC}"
echo

# ===============================================
# 2단계: 환경 변수 설정
# ===============================================
echo -e "${YELLOW}🔧 2단계: 환경 변수 설정${NC}"

export DB_HOST=114.202.247.246
export DB_PORT=3306
export DB_NAME=core_solution
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD='MindGardenDev2025!@#'
export SERVER_PORT=8080

echo -e "${BLUE}   DB_HOST: ${DB_HOST}${NC}"
echo -e "${BLUE}   DB_USERNAME: ${DB_USERNAME}${NC}"
echo -e "${BLUE}   SERVER_PORT: ${SERVER_PORT}${NC}"
echo -e "${GREEN}✅ 2단계 완료: 환경 변수 설정됨${NC}"
echo

# ===============================================
# 3단계: 백엔드 시작
# ===============================================
echo -e "${YELLOW}🔨 3단계: 백엔드 시작${NC}"

echo -e "${YELLOW}   Maven 빌드 시작...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ 백엔드 빌드 성공!${NC}"
else
    echo -e "${RED}   ❌ 백엔드 빌드 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   백엔드 서버 시작...${NC}"
nohup mvn spring-boot:run -Dspring.profiles.active=dev > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}   ✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}✅ 3단계 완료: 백엔드 실행됨${NC}"
echo

# ===============================================
# 4단계: 프론트엔드 시작
# ===============================================
echo -e "${YELLOW}⚛️  4단계: 프론트엔드 시작${NC}"

cd frontend

echo -e "${YELLOW}   npm 의존성 설치...${NC}"
npm install > ../logs/frontend-install.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
else
    echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   프론트엔드 개발 서버 시작 (포트 3000)...${NC}"
PORT=3000 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}   ✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"

cd ..
echo -e "${GREEN}✅ 4단계 완료: 프론트엔드 실행됨${NC}"
echo

# ===============================================
# 5단계: 헬스체크
# ===============================================
echo -e "${YELLOW}🔍 5단계: 서버 헬스체크${NC}"

echo -e "${YELLOW}   백엔드 서버 헬스체크 (최대 60초 대기)...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 백엔드 서버 정상 작동!${NC}"
        BACKEND_OK=true
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}   ⚠️  백엔드 서버 헬스체크 타임아웃 (계속 진행)${NC}"
        BACKEND_OK=false
    fi
    echo -n "."
    sleep 2
done

echo -e "${YELLOW}   프론트엔드 서버 헬스체크 (최대 60초 대기)...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 프론트엔드 서버 정상 작동!${NC}"
        FRONTEND_OK=true
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}   ⚠️  프론트엔드 서버 헬스체크 타임아웃 (계속 진행)${NC}"
        FRONTEND_OK=false
    fi
    echo -n "."
    sleep 2
done

echo -e "${GREEN}✅ 5단계 완료: 헬스체크 완료${NC}"
echo

# ===============================================
# 6단계: 완료 정보
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    🎉 MindGarden 시스템 실행 완료! 🎉"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}🌐 접속 정보:${NC}"
if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}   ✅ 백엔드 API: http://localhost:8080${NC}"
    echo -e "${BLUE}   📊 Actuator: http://localhost:8080/actuator/health${NC}"
else
    echo -e "${YELLOW}   ⚠️  백엔드 API: http://localhost:8080 (시작 중...)${NC}"
fi

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}   ✅ 프론트엔드: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}   ⚠️  프론트엔드: http://localhost:3000 (시작 중...)${NC}"
fi

echo
echo -e "${CYAN}📋 로그 파일:${NC}"
echo -e "${BLUE}   - 백엔드: logs/backend.log${NC}"
echo -e "${BLUE}   - 프론트엔드: logs/frontend.log${NC}"

echo
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   - 백엔드: pkill -f 'spring-boot:run'${NC}"
echo -e "${YELLOW}   - 프론트엔드: lsof -ti:3000 | xargs kill${NC}"
echo -e "${YELLOW}   - 또는 Ctrl+C${NC}"

# 프로세스 정보 저장
echo "BACKEND_PID=$BACKEND_PID" > .mindgarden_pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .mindgarden_pids

echo
echo -e "${GREEN}🚀 MindGarden 시스템이 시작되었습니다!${NC}"
echo -e "${BLUE}💡 개발을 시작하세요! Happy Coding! 💻${NC}"
