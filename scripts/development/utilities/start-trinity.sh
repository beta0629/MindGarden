#!/bin/bash

# Trinity 홈페이지 프론트엔드 실행 스크립트
# 사용법: ./scripts/start-trinity.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${BLUE}"
echo "======================================"
echo "   Trinity Homepage 🏠"
echo "======================================"
echo -e "${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# Trinity 프론트엔드 디렉토리 확인
TRINITY_DIR="${PROJECT_ROOT}/frontend-trinity"
if [ ! -d "$TRINITY_DIR" ]; then
    echo -e "${RED}❌ Trinity 프론트엔드 디렉토리를 찾을 수 없습니다: $TRINITY_DIR${NC}"
    exit 1
fi

# 모든 관련 포트 정리
echo -e "${YELLOW}🧹 포트 충돌 방지: 관련 포트 정리 중...${NC}"
./scripts/stop-all-ports.sh
sleep 2

# Trinity 디렉토리로 이동
cd "$TRINITY_DIR"
echo -e "${BLUE}📂 Trinity 디렉토리: $(pwd)${NC}"

# ============================================
# 환경 변수 파일 자동 생성 (기존 파일이 없을 때만)
# ============================================
echo -e "${YELLOW}📋 환경 변수 파일 확인 중...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f "env.local.example" ]; then
        echo -e "${YELLOW}   .env.local 파일이 없습니다. env.local.example에서 생성합니다...${NC}"
        cp env.local.example .env.local
        echo -e "${GREEN}   ✅ .env.local 파일이 생성되었습니다.${NC}"
        echo -e "${YELLOW}   💡 필요시 .env.local 파일을 수정하세요.${NC}"
        echo -e "${YELLOW}   💡 이 파일은 Git에 커밋되지 않으므로 로컬에서 계속 유지됩니다.${NC}"
    else
        echo -e "${RED}   ⚠️  env.local.example 파일을 찾을 수 없습니다.${NC}"
        echo -e "${YELLOW}   💡 수동으로 .env.local 파일을 생성하세요.${NC}"
    fi
else
    echo -e "${GREEN}   ✅ .env.local 파일이 이미 존재합니다. (기존 파일 유지)${NC}"
    echo -e "${BLUE}   💡 파일이 사라지지 않도록 .gitignore에 포함되어 있습니다.${NC}"
fi

# node_modules 확인 및 설치
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules가 없습니다. 의존성 설치 중...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 의존성 설치 완료!${NC}"
    else
        echo -e "${RED}❌ 의존성 설치 실패!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ node_modules 확인됨${NC}"
fi

# Trinity 개발 서버 시작
echo -e "${YELLOW}🚀 Trinity 개발 서버 시작...${NC}"
echo -e "${BLUE}   포트: 3001${NC}"
echo -e "${BLUE}   URL: http://localhost:3001${NC}"
echo ""

npm run dev:trinity &
TRINITY_PID=$!

echo -e "${GREEN}✅ Trinity 개발 서버 시작됨 (PID: $TRINITY_PID)${NC}"

# 헬스 체크
echo -e "${YELLOW}⏳ 서버 시작 대기 중...${NC}"
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0
HEALTH_CHECK_URL="http://localhost:3001"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Trinity 서버가 정상적으로 실행 중입니다!${NC}"
        echo -e "${BLUE}   🌐 브라우저에서 ${HEALTH_CHECK_URL} 을 열어보세요${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -n "."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Trinity 서버 시작 실패 (최대 재시도 횟수 초과)${NC}"
    echo -e "${YELLOW}   로그를 확인하세요: ${TRINITY_DIR}${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}======================================"
echo "   Trinity 홈페이지 실행 완료! 🎉"
echo "======================================"
echo -e "${NC}"
echo -e "${BLUE}📌 서버 정보:${NC}"
echo -e "   PID: $TRINITY_PID"
echo -e "   URL: ${HEALTH_CHECK_URL}"
echo -e "   디렉토리: ${TRINITY_DIR}"
echo ""
echo -e "${YELLOW}💡 종료하려면: ./scripts/stop-trinity.sh${NC}"
echo ""

# 프로세스가 종료될 때까지 대기
wait $TRINITY_PID

