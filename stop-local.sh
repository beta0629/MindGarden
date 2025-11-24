#!/bin/bash

# MindGarden 로컬 개발 서버 종료 스크립트 (Bash)
# 사용법: ./stop-local.sh

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

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MindGarden 로컬 개발 서버 종료${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 백엔드 종료
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 백엔드 종료 중... (PID: $BACKEND_PID)${NC}"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # 강제 종료
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 백엔드 종료 완료${NC}"
    else
        echo -e "${BLUE}ℹ️  백엔드 프로세스가 이미 종료되었습니다.${NC}"
    fi
    rm -f logs/backend.pid
else
    echo -e "${BLUE}ℹ️  백엔드 PID 파일이 없습니다.${NC}"
fi

# 프론트엔드 종료
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 프론트엔드 종료 중... (PID: $FRONTEND_PID)${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 2
        # 강제 종료
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ 프론트엔드 종료 완료${NC}"
    else
        echo -e "${BLUE}ℹ️  프론트엔드 프로세스가 이미 종료되었습니다.${NC}"
    fi
    rm -f logs/frontend.pid
else
    echo -e "${BLUE}ℹ️  프론트엔드 PID 파일이 없습니다.${NC}"
fi

# 포트 사용 중인 프로세스 강제 종료
echo ""
echo -e "${YELLOW}🧹 포트 정리 중...${NC}"

if command -v lsof >/dev/null 2>&1; then
    # macOS/Linux
    PIDS_8080=$(lsof -ti:8080 2>/dev/null || true)
    PIDS_3000=$(lsof -ti:3000 2>/dev/null || true)
    
    if [ ! -z "$PIDS_8080" ]; then
        echo -e "${BLUE}   포트 8080 프로세스 종료${NC}"
        echo $PIDS_8080 | xargs kill -9 2>/dev/null || true
    fi
    
    if [ ! -z "$PIDS_3000" ]; then
        echo -e "${BLUE}   포트 3000 프로세스 종료${NC}"
        echo $PIDS_3000 | xargs kill -9 2>/dev/null || true
    fi
elif command -v netstat >/dev/null 2>&1; then
    # Windows (Git Bash)
    PIDS_8080=$(netstat -ano | grep ":8080" | awk '{print $5}' | sort -u | head -1)
    PIDS_3000=$(netstat -ano | grep ":3000" | awk '{print $5}' | sort -u | head -1)
    
    if [ ! -z "$PIDS_8080" ]; then
        echo -e "${BLUE}   포트 8080 프로세스 종료: PID $PIDS_8080${NC}"
        kill -9 $PIDS_8080 2>/dev/null || true
    fi
    
    if [ ! -z "$PIDS_3000" ]; then
        echo -e "${BLUE}   포트 3000 프로세스 종료: PID $PIDS_3000${NC}"
        kill -9 $PIDS_3000 2>/dev/null || true
    fi
fi

echo -e "${GREEN}✅ 모든 서버 종료 완료${NC}"
echo ""

