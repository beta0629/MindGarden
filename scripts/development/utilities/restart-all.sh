#!/bin/bash

# MindGarden 전체 시스템 재시작 스크립트
# 사용법: ./scripts/restart-all.sh [backend_profile] [frontend_mode]
# 예시: ./scripts/restart-all.sh local dev

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 파라미터 설정
BACKEND_PROFILE=${1:-local}
FRONTEND_MODE=${2:-dev}

echo -e "${PURPLE}"
echo "=================================================="
echo "    🔄 MindGarden 전체 시스템 재시작 🔄"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}📋 재시작 설정:${NC}"
echo -e "${BLUE}   - 백엔드 프로파일: ${BACKEND_PROFILE}${NC}"
echo -e "${BLUE}   - 프론트엔드 모드: ${FRONTEND_MODE}${NC}"
echo

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 1단계: 전체 시스템 종료
echo -e "${YELLOW}🛑 1단계: 전체 시스템 종료 및 정리${NC}"
./scripts/stop-all.sh

echo -e "${YELLOW}⏱️  시스템 안정화 대기 중... (5초)${NC}"
sleep 5

# 2단계: 전체 시스템 시작
echo -e "${YELLOW}🚀 2단계: 전체 시스템 시작${NC}"
./scripts/start-all.sh $BACKEND_PROFILE $FRONTEND_MODE
