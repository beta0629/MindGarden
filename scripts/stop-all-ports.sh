#!/bin/bash

# 모든 관련 포트 정리 스크립트
# 사용법: ./scripts/stop-all-ports.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧹 모든 관련 포트 정리 중...${NC}"

# 포트 목록
PORTS=(8080 3000 3001 4300)

# 각 포트 정리
for PORT in "${PORTS[@]}"; do
    if lsof -i:$PORT > /dev/null 2>&1; then
        echo -e "${YELLOW}   🔄 포트 ${PORT} 정리 중...${NC}"
        PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
        
        if [ ! -z "$PIDS" ]; then
            for PID in $PIDS; do
                PROCESS_NAME=$(ps -p $PID -o command= 2>/dev/null | head -1 || echo "unknown")
                echo -e "${BLUE}      프로세스 종료: PID $PID ($PROCESS_NAME)${NC}"
                kill -TERM $PID 2>/dev/null || true
            done
            
            # 2초 대기
            sleep 2
            
            # 여전히 실행 중이면 강제 종료
            REMAINING_PIDS=$(lsof -t -i:$PORT 2>/dev/null || true)
            if [ ! -z "$REMAINING_PIDS" ]; then
                echo -e "${RED}      ⚠️  강제 종료 시도...${NC}"
                for PID in $REMAINING_PIDS; do
                    kill -KILL $PID 2>/dev/null || true
                done
                sleep 1
            fi
        fi
        
        # 최종 확인
        if ! lsof -i:$PORT > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 포트 ${PORT} 정리 완료${NC}"
        else
            echo -e "${RED}   ⚠️  포트 ${PORT} 정리 실패 (수동 확인 필요)${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ 포트 ${PORT} 사용 가능${NC}"
    fi
done

# 프로세스 기반 정리 (포트가 아닌 프로세스 이름으로)
echo -e "${YELLOW}🔄 프로세스 기반 정리...${NC}"

# Spring Boot 프로세스
SPRING_PIDS=$(pgrep -f "spring-boot:run\|consultation-management-system.*\.jar" 2>/dev/null || true)
if [ ! -z "$SPRING_PIDS" ]; then
    echo -e "${YELLOW}   Spring Boot 프로세스 종료...${NC}"
    for PID in $SPRING_PIDS; do
        echo -e "${BLUE}      PID $PID 종료${NC}"
        kill -TERM $PID 2>/dev/null || true
    done
    sleep 2
    # 강제 종료
    for PID in $SPRING_PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            kill -KILL $PID 2>/dev/null || true
        fi
    done
fi

# React/Next.js 프로세스
NEXT_PIDS=$(pgrep -f "next dev" 2>/dev/null || true)
if [ ! -z "$NEXT_PIDS" ]; then
    echo -e "${YELLOW}   Next.js 프로세스 종료...${NC}"
    for PID in $NEXT_PIDS; do
        echo -e "${BLUE}      PID $PID 종료${NC}"
        kill -TERM $PID 2>/dev/null || true
    done
    sleep 2
    # 강제 종료
    for PID in $NEXT_PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            kill -KILL $PID 2>/dev/null || true
        fi
    done
fi

# React Scripts 프로세스
REACT_PIDS=$(pgrep -f "react-scripts.*start" 2>/dev/null || true)
if [ ! -z "$REACT_PIDS" ]; then
    echo -e "${YELLOW}   React Scripts 프로세스 종료...${NC}"
    for PID in $REACT_PIDS; do
        echo -e "${BLUE}      PID $PID 종료${NC}"
        kill -TERM $PID 2>/dev/null || true
    done
    sleep 2
    # 강제 종료
    for PID in $REACT_PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            kill -KILL $PID 2>/dev/null || true
        fi
    done
fi

echo -e "${GREEN}✅ 모든 포트 및 프로세스 정리 완료${NC}"

