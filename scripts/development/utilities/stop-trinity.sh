#!/bin/bash

# Trinity 홈페이지 프론트엔드 종료 스크립트
# 사용법: ./scripts/stop-trinity.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Trinity 서버 종료 중...${NC}"

# Trinity 프로세스 찾기 및 종료
if pgrep -f "next dev.*3001\|next dev.*trinity" > /dev/null; then
    echo -e "${BLUE}📋 실행 중인 Trinity 프로세스:${NC}"
    pgrep -f "next dev.*3001\|next dev.*trinity" | xargs ps -p
    
    echo -e "${YELLOW}⚠️  Trinity 프로세스를 종료합니다...${NC}"
    pkill -f "next dev.*3001\|next dev.*trinity" || true
    sleep 2
    
    # 프로세스가 정상적으로 종료되었는지 확인
    if pgrep -f "next dev.*3001\|next dev.*trinity" > /dev/null; then
        echo -e "${RED}❌ 프로세스 종료 실패. 강제 종료 시도...${NC}"
        pkill -9 -f "next dev.*3001\|next dev.*trinity" || true
        sleep 1
    fi
    
    echo -e "${GREEN}✅ Trinity 서버가 종료되었습니다${NC}"
else
    echo -e "${GREEN}✅ 실행 중인 Trinity 프로세스가 없습니다${NC}"
fi

