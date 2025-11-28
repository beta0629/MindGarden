#!/bin/bash

# MindGarden 프론트엔드 프로세스 종료 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================"
echo "   MindGarden Frontend Stopper 🛑"
echo "======================================"
echo -e "${NC}"

# 프론트엔드 프로세스 찾기 및 종료
echo -e "${YELLOW}🔍 실행 중인 프론트엔드 프로세스 검색...${NC}"

# React 개발 서버 프로세스 종료
REACT_PIDS=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
if [ ! -z "$REACT_PIDS" ]; then
    echo -e "${YELLOW}🔄 React 개발 서버 종료 중... (PIDs: $REACT_PIDS)${NC}"
    echo "$REACT_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 3
    
    # 강제 종료가 필요한지 확인
    REMAINING_PIDS=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${RED}⚠️  일부 프로세스가 아직 실행 중입니다. 강제 종료합니다...${NC}"
        echo "$REMAINING_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ React 개발 서버 종료 완료${NC}"
fi

# 포트 3000을 사용하는 프로세스 확인
PORT_3000_PIDS=$(lsof -t -i:3000 2>/dev/null || true)
if [ ! -z "$PORT_3000_PIDS" ]; then
    echo -e "${YELLOW}🔄 포트 3000을 사용하는 프로세스 종료 중... (PIDs: $PORT_3000_PIDS)${NC}"
    echo "$PORT_3000_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    
    # 강제 종료가 필요한지 확인
    REMAINING_PORT_PIDS=$(lsof -t -i:3000 2>/dev/null || true)
    if [ ! -z "$REMAINING_PORT_PIDS" ]; then
        echo -e "${RED}⚠️  포트 3000을 사용하는 일부 프로세스가 아직 실행 중입니다. 강제 종료합니다...${NC}"
        echo "$REMAINING_PORT_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ 포트 3000 정리 완료${NC}"
fi

# 최종 확인
FINAL_CHECK=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
if [ -z "$FINAL_CHECK" ]; then
    echo -e "${GREEN}✅ 모든 프론트엔드 프로세스가 성공적으로 종료되었습니다!${NC}"
else
    echo -e "${RED}❌ 일부 프로세스가 여전히 실행 중입니다: $FINAL_CHECK${NC}"
fi

# 포트 상태 확인
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  포트 3000이 여전히 사용 중입니다:${NC}"
    lsof -i:3000
else
    echo -e "${GREEN}✅ 포트 3000이 사용 가능합니다${NC}"
fi
