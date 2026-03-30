#!/bin/bash

# 백엔드 + Trinity 홈페이지 모두 실행 스크립트
# 사용법: ./scripts/start-all-trinity.sh [backend-profile]
# 예시: ./scripts/start-all-trinity.sh local

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
echo "   MindGarden + Trinity 🚀"
echo "   백엔드 + Trinity 홈페이지"
echo "======================================"
echo -e "${NC}"

# 프로파일 설정 (기본값: local)
PROFILE=${1:-local}
echo -e "${YELLOW}📋 백엔드 프로파일: ${PROFILE}${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 모든 관련 포트 및 프로세스 정리
echo -e "${YELLOW}🧹 포트 충돌 방지: 모든 관련 포트 및 프로세스 정리 중...${NC}"
./scripts/stop-all-ports.sh
./scripts/stop-all.sh 2>/dev/null || true
./scripts/stop-trinity.sh 2>/dev/null || true
sleep 3

# 백엔드 시작
echo -e "${BLUE}======================================"
echo "   1. 백엔드 서버 시작"
echo "======================================"
echo -e "${NC}"

./scripts/start-backend.sh "$PROFILE" &
BACKEND_START_PID=$!

# 백엔드 시작 대기
echo -e "${YELLOW}⏳ 백엔드 서버 시작 대기 중...${NC}"
sleep 10

# 백엔드 헬스 체크
MAX_RETRIES=30
RETRY_COUNT=0
BACKEND_URL="http://localhost:8080/api/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "$BACKEND_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 백엔드 서버가 정상적으로 실행 중입니다!${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -n "."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠️  백엔드 서버 시작 확인 실패 (계속 진행)${NC}"
fi

# Trinity 홈페이지 시작
echo ""
echo -e "${BLUE}======================================"
echo "   2. Trinity 홈페이지 시작"
echo "======================================"
echo -e "${NC}"

./scripts/start-trinity.sh &
TRINITY_START_PID=$!

# Trinity 시작 대기
echo -e "${YELLOW}⏳ Trinity 홈페이지 시작 대기 중...${NC}"
sleep 5

# Trinity 헬스 체크
MAX_RETRIES=30
RETRY_COUNT=0
TRINITY_URL="http://localhost:3001"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f "$TRINITY_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Trinity 홈페이지가 정상적으로 실행 중입니다!${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -n "."
        sleep 2
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠️  Trinity 홈페이지 시작 확인 실패${NC}"
fi

# 최종 상태 출력
echo ""
echo -e "${GREEN}======================================"
echo "   모든 서버 실행 완료! 🎉"
echo "======================================"
echo -e "${NC}"
echo -e "${BLUE}📌 서버 정보:${NC}"
echo -e "   백엔드: http://localhost:8080"
echo -e "   Trinity 홈페이지: http://localhost:3001"
echo ""
echo -e "${YELLOW}💡 종료하려면: ./scripts/stop-all.sh && ./scripts/stop-trinity.sh${NC}"
echo ""

# 프로세스가 종료될 때까지 대기
wait

