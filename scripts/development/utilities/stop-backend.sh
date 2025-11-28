#!/bin/bash

# MindGarden 백엔드 프로세스 종료 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================"
echo "   MindGarden Backend Stopper 🛑"
echo "======================================"
echo -e "${NC}"

# 백엔드 프로세스 찾기 및 종료
echo -e "${YELLOW}🔍 실행 중인 백엔드 프로세스 검색...${NC}"

# Spring Boot 개발 모드 프로세스 종료
SPRING_BOOT_PIDS=$(pgrep -f "spring-boot:run" || true)
if [ ! -z "$SPRING_BOOT_PIDS" ]; then
    echo -e "${YELLOW}🔄 Spring Boot 개발 서버 종료 중... (PIDs: $SPRING_BOOT_PIDS)${NC}"
    echo "$SPRING_BOOT_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 3
    
    # 강제 종료가 필요한지 확인
    REMAINING_PIDS=$(pgrep -f "spring-boot:run" || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${RED}⚠️  일부 프로세스가 아직 실행 중입니다. 강제 종료합니다...${NC}"
        echo "$REMAINING_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Spring Boot 개발 서버 종료 완료${NC}"
fi

# JAR 파일로 실행된 프로세스 종료
JAR_PIDS=$(pgrep -f "consultation-management-system.*\.jar" || true)
if [ ! -z "$JAR_PIDS" ]; then
    echo -e "${YELLOW}🔄 JAR 서버 종료 중... (PIDs: $JAR_PIDS)${NC}"
    echo "$JAR_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 3
    
    # 강제 종료가 필요한지 확인
    REMAINING_PIDS=$(pgrep -f "consultation-management-system.*\.jar" || true)
    if [ ! -z "$REMAINING_PIDS" ]; then
        echo -e "${RED}⚠️  일부 프로세스가 아직 실행 중입니다. 강제 종료합니다...${NC}"
        echo "$REMAINING_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ JAR 서버 종료 완료${NC}"
fi

# 포트 8080을 사용하는 다른 프로세스 확인
PORT_8080_PIDS=$(lsof -t -i:8080 2>/dev/null || true)
if [ ! -z "$PORT_8080_PIDS" ]; then
    echo -e "${YELLOW}🔄 포트 8080을 사용하는 프로세스 종료 중... (PIDs: $PORT_8080_PIDS)${NC}"
    echo "$PORT_8080_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    
    # 강제 종료가 필요한지 확인
    REMAINING_PORT_PIDS=$(lsof -t -i:8080 2>/dev/null || true)
    if [ ! -z "$REMAINING_PORT_PIDS" ]; then
        echo -e "${RED}⚠️  포트 8080을 사용하는 일부 프로세스가 아직 실행 중입니다. 강제 종료합니다...${NC}"
        echo "$REMAINING_PORT_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ 포트 8080 정리 완료${NC}"
fi

# 최종 확인
FINAL_CHECK=$(pgrep -f "spring-boot:run\|consultation-management-system.*\.jar" || true)
if [ -z "$FINAL_CHECK" ]; then
    echo -e "${GREEN}✅ 모든 백엔드 프로세스가 성공적으로 종료되었습니다!${NC}"
else
    echo -e "${RED}❌ 일부 프로세스가 여전히 실행 중입니다: $FINAL_CHECK${NC}"
fi

# 포트 상태 확인
if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  포트 8080이 여전히 사용 중입니다:${NC}"
    lsof -i:8080
else
    echo -e "${GREEN}✅ 포트 8080이 사용 가능합니다${NC}"
fi
