#!/bin/bash

# MindGarden 백엔드 재시작 스크립트 (종료 후 실행)
# 사용법: ./scripts/restart-backend.sh [profile]
# 예시: ./scripts/restart-backend.sh local

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로파일 설정 (기본값: local)
PROFILE=${1:-local}

echo -e "${BLUE}"
echo "======================================"
echo "   MindGarden Backend Restart 🔄"
echo "======================================"
echo -e "${NC}"

echo -e "${YELLOW}📋 설정된 프로파일: ${PROFILE}${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 1단계: 기존 프로세스 종료
echo -e "${YELLOW}🛑 1단계: 기존 백엔드 프로세스 종료${NC}"
./scripts/stop-backend.sh

echo -e "${YELLOW}⏱️  프로세스 완전 종료 대기 중... (3초)${NC}"
sleep 3

# 2단계: 새 프로세스 시작
echo -e "${YELLOW}🚀 2단계: 새 백엔드 프로세스 시작${NC}"
./scripts/start-backend.sh $PROFILE
