#!/bin/bash

# MindGarden 통합 자동화 스크립트
# 프론트엔드 + 백엔드 빌드 및 실행
# 사용법: ./scripts/start-all.sh [profile] [mode]
# 예시: ./scripts/start-all.sh local dev (로컬 개발)
# 예시: ./scripts/start-all.sh prod build (프로덕션 빌드)

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${PURPLE}"
echo "=================================================="
echo "    🚀 MindGarden 통합 자동화 시스템 🚀"
echo "=================================================="
echo -e "${NC}"

# 파라미터 설정
BACKEND_PROFILE=${1:-local}
FRONTEND_MODE=${2:-dev}

echo -e "${CYAN}📋 설정 정보:${NC}"
echo -e "${BLUE}   - 백엔드 프로파일: ${BACKEND_PROFILE}${NC}"
echo -e "${BLUE}   - 프론트엔드 모드: ${FRONTEND_MODE}${NC}"
echo

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 로그 디렉토리 생성
mkdir -p logs

# Git 정보 확인
echo -e "${CYAN}📋 Git 정보:${NC}"
CURRENT_BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --oneline)
echo -e "${BLUE}   - 현재 브랜치: ${CURRENT_BRANCH}${NC}"
echo -e "${BLUE}   - 마지막 커밋: ${LAST_COMMIT}${NC}"
echo

# ===============================================
# 1단계: 모든 기존 프로세스 종료
# ===============================================
echo -e "${YELLOW}🛑 1단계: 모든 기존 프로세스 종료${NC}"
echo -e "${YELLOW}   1-1. 백엔드 프로세스 종료...${NC}"
./scripts/stop-backend.sh

echo -e "${YELLOW}   1-2. 프론트엔드 프로세스 종료...${NC}"
./scripts/stop-frontend.sh

echo -e "${GREEN}✅ 1단계 완료: 모든 기존 프로세스 종료됨${NC}"
echo

# ===============================================
# 2단계: 환경 및 의존성 확인
# ===============================================
echo -e "${YELLOW}🔍 2단계: 환경 및 의존성 확인${NC}"

# Java 버전 확인
echo -e "${YELLOW}   2-1. Java 버전 확인...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}   ✅ ${JAVA_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Java가 설치되지 않았습니다!${NC}"
    exit 1
fi

# Maven 버전 확인
echo -e "${YELLOW}   2-2. Maven 버전 확인...${NC}"
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -version | head -n 1)
    echo -e "${GREEN}   ✅ ${MVN_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Maven이 설치되지 않았습니다!${NC}"
    exit 1
fi

# Node.js 버전 확인
echo -e "${YELLOW}   2-3. Node.js 버전 확인...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}   ✅ Node.js ${NODE_VERSION}, npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Node.js가 설치되지 않았습니다!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 2단계 완료: 환경 확인됨${NC}"
echo

# ===============================================
# 3단계: 백엔드 빌드 및 실행
# ===============================================
echo -e "${YELLOW}🔨 3단계: 백엔드 빌드 및 실행${NC}"

echo -e "${YELLOW}   3-1. Maven 빌드 시작...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ 백엔드 빌드 성공!${NC}"
else
    echo -e "${RED}   ❌ 백엔드 빌드 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   3-2. 백엔드 서버 시작...${NC}"
JAR_FILE="target/consultation-management-system-1.0.0.jar"

if [ "$BACKEND_PROFILE" = "local" ]; then
    # 로컬 개발 모드
    echo -e "${BLUE}   🔧 개발 모드로 백엔드 실행 (Hot Reload 지원)${NC}"
    mvn spring-boot:run -Dspring-boot.run.profiles=local > logs/backend.log 2>&1 &
else
    # 프로덕션 모드
    echo -e "${BLUE}   🏭 프로덕션 모드로 백엔드 실행${NC}"
    nohup java -jar -Dspring.profiles.active=$BACKEND_PROFILE $JAR_FILE > logs/backend.log 2>&1 &
fi

BACKEND_PID=$!
echo -e "${GREEN}   ✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"

echo -e "${GREEN}✅ 3단계 완료: 백엔드 실행됨${NC}"
echo

# ===============================================
# 4단계: 프론트엔드 빌드 및 실행
# ===============================================
echo -e "${YELLOW}⚛️  4단계: 프론트엔드 빌드 및 실행${NC}"

cd frontend

echo -e "${YELLOW}   4-1. npm 의존성 설치...${NC}"
npm install > ../logs/frontend-install.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
else
    echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
    echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend-install.log${NC}"
    exit 1
fi

if [ "$FRONTEND_MODE" = "build" ]; then
    # 프로덕션 빌드
    echo -e "${YELLOW}   4-2. 프론트엔드 프로덕션 빌드...${NC}"
    npm run build > ../logs/frontend-build.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ 프론트엔드 빌드 성공!${NC}"
        BUILD_SIZE=$(du -sh build | cut -f1)
        echo -e "${BLUE}   📊 빌드 크기: ${BUILD_SIZE}${NC}"
    else
        echo -e "${RED}   ❌ 프론트엔드 빌드 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend-build.log${NC}"
        exit 1
    fi
else
    # 개발 모드
    echo -e "${YELLOW}   4-2. 프론트엔드 개발 서버 시작...${NC}"
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}   ✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"
fi

cd ..
echo -e "${GREEN}✅ 4단계 완료: 프론트엔드 실행됨${NC}"
echo

# ===============================================
# 5단계: 헬스체크 및 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 5단계: 서버 헬스체크${NC}"

echo -e "${YELLOW}   5-1. 백엔드 서버 헬스체크...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 백엔드 서버 정상 작동!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ 백엔드 서버 헬스체크 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/backend.log${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done

if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${YELLOW}   5-2. 프론트엔드 서버 헬스체크...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 프론트엔드 서버 정상 작동!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ 프론트엔드 서버 헬스체크 실패!${NC}"
            echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend.log${NC}"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
fi

echo -e "${GREEN}✅ 5단계 완료: 모든 서버 정상 작동${NC}"
echo

# ===============================================
# 6단계: 완료 및 정보 표시
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    🎉 MindGarden 시스템 실행 완료! 🎉"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}🌐 접속 정보:${NC}"
echo -e "${GREEN}   ✅ 백엔드 API: http://localhost:8080${NC}"
echo -e "${BLUE}   📊 Actuator: http://localhost:8080/actuator/health${NC}"

if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드: http://localhost:3000${NC}"
elif [ "$FRONTEND_MODE" = "build" ]; then
    echo -e "${BLUE}   📁 프론트엔드 빌드: frontend/build/${NC}"
fi

echo
echo -e "${CYAN}📋 로그 파일:${NC}"
echo -e "${BLUE}   - 백엔드: logs/backend.log${NC}"
if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${BLUE}   - 프론트엔드: logs/frontend.log${NC}"
fi

echo
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   - 전체 종료: ./scripts/stop-all.sh${NC}"
echo -e "${YELLOW}   - 백엔드만: ./scripts/stop-backend.sh${NC}"
echo -e "${YELLOW}   - 프론트엔드만: ./scripts/stop-frontend.sh${NC}"
echo -e "${YELLOW}   - 또는 Ctrl+C${NC}"

echo
echo -e "${CYAN}🔄 재시작 방법:${NC}"
echo -e "${YELLOW}   - 전체 재시작: ./scripts/restart-all.sh${NC}"
echo -e "${YELLOW}   - 백엔드만: ./scripts/restart-backend.sh${NC}"

# 프로세스 정보 저장
echo "BACKEND_PID=$BACKEND_PID" > .mindgarden_pids
if [ "$FRONTEND_MODE" = "dev" ] && [ ! -z "$FRONTEND_PID" ]; then
    echo "FRONTEND_PID=$FRONTEND_PID" >> .mindgarden_pids
fi

echo
echo -e "${GREEN}🚀 MindGarden 시스템이 성공적으로 실행되었습니다!${NC}"
echo -e "${BLUE}💡 개발을 시작하세요! Happy Coding! 💻${NC}"
