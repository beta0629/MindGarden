#!/bin/bash

# MindGarden 전체 시스템 종료 및 메모리 정리 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "=================================================="
echo "    🛑 MindGarden 전체 시스템 종료 🛑"
echo "=================================================="
echo -e "${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# ===============================================
# 1단계: 실행 중인 프로세스 확인
# ===============================================
echo -e "${YELLOW}🔍 1단계: 실행 중인 프로세스 확인${NC}"

# PID 파일에서 프로세스 정보 읽기
if [ -f ".mindgarden_pids" ]; then
    source .mindgarden_pids
    echo -e "${BLUE}   📋 저장된 PID 정보:${NC}"
    [ ! -z "$BACKEND_PID" ] && echo -e "${BLUE}      - 백엔드 PID: $BACKEND_PID${NC}"
    [ ! -z "$FRONTEND_PID" ] && echo -e "${BLUE}      - 프론트엔드 PID: $FRONTEND_PID${NC}"
else
    echo -e "${YELLOW}   ⚠️  PID 파일을 찾을 수 없습니다. 프로세스 검색으로 진행합니다.${NC}"
fi

# 실행 중인 프로세스 검색
echo -e "${YELLOW}   🔍 실행 중인 프로세스 검색...${NC}"
RUNNING_BACKEND=$(pgrep -f "spring-boot:run\|consultation-management-system.*\.jar" || true)
RUNNING_FRONTEND=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
RUNNING_TRINITY=$(pgrep -f "next dev.*3001\|next dev.*trinity" || true)
RUNNING_OPS=$(pgrep -f "next dev.*4300\|next dev.*ops" || true)

if [ ! -z "$RUNNING_BACKEND" ]; then
    echo -e "${RED}   ⚠️  실행 중인 백엔드 프로세스 발견: $RUNNING_BACKEND${NC}"
fi

if [ ! -z "$RUNNING_FRONTEND" ]; then
    echo -e "${RED}   ⚠️  실행 중인 프론트엔드 1 (MindGarden) 프로세스 발견: $RUNNING_FRONTEND${NC}"
fi

if [ ! -z "$RUNNING_TRINITY" ]; then
    echo -e "${RED}   ⚠️  실행 중인 프론트엔드 2 (Trinity) 프로세스 발견: $RUNNING_TRINITY${NC}"
fi

if [ ! -z "$RUNNING_OPS" ]; then
    echo -e "${RED}   ⚠️  실행 중인 프론트엔드 3 (Ops Portal) 프로세스 발견: $RUNNING_OPS${NC}"
fi

echo -e "${GREEN}✅ 1단계 완료: 프로세스 확인됨${NC}"
echo

# ===============================================
# 2단계: 백엔드 종료
# ===============================================
echo -e "${YELLOW}🛑 2단계: 백엔드 시스템 종료${NC}"
./scripts/stop-backend.sh
echo -e "${GREEN}✅ 2단계 완료: 백엔드 종료됨${NC}"
echo

# ===============================================
# 3단계: 프론트엔드 종료
# ===============================================
echo -e "${YELLOW}🛑 3단계: 프론트엔드 시스템 종료${NC}"
echo -e "${YELLOW}   3-1. 프론트엔드 1 (MindGarden) 종료...${NC}"
./scripts/stop-frontend.sh
echo -e "${YELLOW}   3-2. 프론트엔드 2 (Trinity) 종료...${NC}"
./scripts/stop-trinity.sh 2>/dev/null || true
echo -e "${YELLOW}   3-3. 프론트엔드 3 (Ops Portal) 종료...${NC}"
# Ops Portal 종료 (포트 4300)
if lsof -i:4300 > /dev/null 2>&1; then
    lsof -t -i:4300 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    if lsof -i:4300 > /dev/null 2>&1; then
        lsof -t -i:4300 | xargs kill -KILL 2>/dev/null || true
    fi
fi
# Ops Portal 프로세스 종료
if [ ! -z "$RUNNING_OPS" ]; then
    echo "$RUNNING_OPS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    echo "$RUNNING_OPS" | xargs kill -KILL 2>/dev/null || true
fi
echo -e "${GREEN}✅ 3단계 완료: 프론트엔드 종료됨${NC}"
echo

# ===============================================
# 4단계: 포트 정리
# ===============================================
echo -e "${YELLOW}🧹 4단계: 포트 정리${NC}"

# 포트 8080 정리
if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}   🔄 포트 8080 정리 중...${NC}"
    lsof -t -i:8080 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    if lsof -i:8080 > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  포트 8080 강제 정리...${NC}"
        lsof -t -i:8080 | xargs kill -KILL 2>/dev/null || true
    fi
fi

# 포트 3000 정리 (프론트엔드 1 - MindGarden)
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   🔄 포트 3000 정리 중...${NC}"
    lsof -t -i:3000 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  포트 3000 강제 정리...${NC}"
        lsof -t -i:3000 | xargs kill -KILL 2>/dev/null || true
    fi
fi

# 포트 3001 정리 (프론트엔드 2 - Trinity)
if lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}   🔄 포트 3001 정리 중...${NC}"
    lsof -t -i:3001 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    if lsof -i:3001 > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  포트 3001 강제 정리...${NC}"
        lsof -t -i:3001 | xargs kill -KILL 2>/dev/null || true
    fi
fi

# 포트 4300 정리 (프론트엔드 3 - Ops Portal)
if lsof -i:4300 > /dev/null 2>&1; then
    echo -e "${YELLOW}   🔄 포트 4300 정리 중...${NC}"
    lsof -t -i:4300 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    if lsof -i:4300 > /dev/null 2>&1; then
        echo -e "${RED}   ⚠️  포트 4300 강제 정리...${NC}"
        lsof -t -i:4300 | xargs kill -KILL 2>/dev/null || true
    fi
fi

echo -e "${GREEN}✅ 4단계 완료: 포트 정리됨${NC}"
echo

# ===============================================
# 5단계: 메모리 정리
# ===============================================
echo -e "${YELLOW}🧹 5단계: 시스템 메모리 정리${NC}"

# 현재 메모리 사용량 확인
echo -e "${YELLOW}   📊 메모리 정리 전 상태:${NC}"
if command -v free &> /dev/null; then
    free -h | head -2
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}      $(vm_stat | grep "Pages free\|Pages active\|Pages inactive" | head -3)${NC}"
fi

# Java 프로세스 정리
echo -e "${YELLOW}   🔄 Java 프로세스 정리...${NC}"
JAVA_PIDS=$(pgrep java || true)
if [ ! -z "$JAVA_PIDS" ]; then
    echo -e "${BLUE}      발견된 Java 프로세스: $JAVA_PIDS${NC}"
    # MindGarden 관련 Java 프로세스만 종료
    for pid in $JAVA_PIDS; do
        if ps -p $pid -o command | grep -q "consultation-management-system\|spring-boot"; then
            echo -e "${YELLOW}      MindGarden Java 프로세스 종료: $pid${NC}"
            kill -TERM $pid 2>/dev/null || true
        fi
    done
fi

# Node.js 프로세스 정리
echo -e "${YELLOW}   🔄 Node.js 프로세스 정리...${NC}"
NODE_PIDS=$(pgrep node || true)
if [ ! -z "$NODE_PIDS" ]; then
    echo -e "${BLUE}      발견된 Node.js 프로세스: $NODE_PIDS${NC}"
    # MindGarden 관련 Node.js 프로세스만 종료
    for pid in $NODE_PIDS; do
        if ps -p $pid -o command | grep -q "react-scripts\|mindGarden"; then
            echo -e "${YELLOW}      MindGarden Node.js 프로세스 종료: $pid${NC}"
            kill -TERM $pid 2>/dev/null || true
        fi
    done
fi

# 가비지 컬렉션 강제 실행 (시스템에 따라)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}   🗑️  macOS 메모리 압축...${NC}"
    sudo purge 2>/dev/null || echo -e "${BLUE}      (sudo 권한 필요 - 건너뜀)${NC}"
elif command -v sync &> /dev/null; then
    echo -e "${YELLOW}   🗑️  시스템 캐시 동기화...${NC}"
    sync
fi

# 임시 파일 정리
echo -e "${YELLOW}   🗑️  임시 파일 정리...${NC}"
rm -rf target/classes/static 2>/dev/null || true
rm -rf frontend/node_modules/.cache 2>/dev/null || true
rm -rf logs/*.log.* 2>/dev/null || true

# 메모리 정리 후 상태
echo -e "${YELLOW}   📊 메모리 정리 후 상태:${NC}"
if command -v free &> /dev/null; then
    free -h | head -2
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}      $(vm_stat | grep "Pages free\|Pages active\|Pages inactive" | head -3)${NC}"
fi

echo -e "${GREEN}✅ 5단계 완료: 메모리 정리됨${NC}"
echo

# ===============================================
# 6단계: 헬스체크 및 최종 확인
# ===============================================
echo -e "${YELLOW}🔍 6단계: 시스템 상태 헬스체크${NC}"

# 포트 상태 확인
echo -e "${YELLOW}   🔍 포트 상태 확인...${NC}"
if ! lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 포트 8080: 사용 가능${NC}"
else
    echo -e "${RED}   ❌ 포트 8080: 아직 사용 중${NC}"
    lsof -i:8080
fi

if ! lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 포트 3000: 사용 가능${NC}"
else
    echo -e "${RED}   ❌ 포트 3000: 아직 사용 중${NC}"
    lsof -i:3000
fi

if ! lsof -i:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 포트 3001: 사용 가능${NC}"
else
    echo -e "${RED}   ❌ 포트 3001: 아직 사용 중${NC}"
    lsof -i:3001
fi

if ! lsof -i:4300 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 포트 4300: 사용 가능${NC}"
else
    echo -e "${RED}   ❌ 포트 4300: 아직 사용 중${NC}"
    lsof -i:4300
fi

# 프로세스 상태 확인
echo -e "${YELLOW}   🔍 프로세스 상태 확인...${NC}"
FINAL_BACKEND_CHECK=$(pgrep -f "spring-boot:run\|consultation-management-system.*\.jar" || true)
FINAL_FRONTEND_CHECK=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
FINAL_TRINITY_CHECK=$(pgrep -f "next dev.*3001\|next dev.*trinity" || true)
FINAL_OPS_CHECK=$(pgrep -f "next dev.*4300\|next dev.*ops" || true)

if [ -z "$FINAL_BACKEND_CHECK" ]; then
    echo -e "${GREEN}   ✅ 백엔드 프로세스: 모두 종료됨${NC}"
else
    echo -e "${RED}   ❌ 백엔드 프로세스: 일부 실행 중 ($FINAL_BACKEND_CHECK)${NC}"
fi

if [ -z "$FINAL_FRONTEND_CHECK" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드 1 (MindGarden) 프로세스: 모두 종료됨${NC}"
else
    echo -e "${RED}   ❌ 프론트엔드 1 프로세스: 일부 실행 중 ($FINAL_FRONTEND_CHECK)${NC}"
fi

if [ -z "$FINAL_TRINITY_CHECK" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드 2 (Trinity) 프로세스: 모두 종료됨${NC}"
else
    echo -e "${RED}   ❌ 프론트엔드 2 프로세스: 일부 실행 중 ($FINAL_TRINITY_CHECK)${NC}"
fi

if [ -z "$FINAL_OPS_CHECK" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드 3 (Ops Portal) 프로세스: 모두 종료됨${NC}"
else
    echo -e "${RED}   ❌ 프론트엔드 3 프로세스: 일부 실행 중 ($FINAL_OPS_CHECK)${NC}"
fi

# 디스크 공간 확인
echo -e "${YELLOW}   💾 디스크 공간 확인...${NC}"
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 90 ]; then
    echo -e "${GREEN}   ✅ 디스크 사용량: ${DISK_USAGE}% (양호)${NC}"
else
    echo -e "${YELLOW}   ⚠️  디스크 사용량: ${DISK_USAGE}% (높음)${NC}"
fi

echo -e "${GREEN}✅ 6단계 완료: 헬스체크 완료${NC}"
echo

# ===============================================
# 7단계: 정리 완료
# ===============================================
echo -e "${YELLOW}🧹 7단계: 정리 완료${NC}"

# PID 파일 삭제
rm -f .mindgarden_pids

# 로그 압축 (선택적)
if [ -d "logs" ] && [ "$(ls -A logs)" ]; then
    echo -e "${YELLOW}   📦 로그 파일 압축...${NC}"
    tar -czf "logs/archive-$(date +%Y%m%d_%H%M%S).tar.gz" logs/*.log 2>/dev/null || true
    rm -f logs/*.log 2>/dev/null || true
    echo -e "${GREEN}   ✅ 로그 파일 압축 완료${NC}"
fi

echo -e "${GREEN}✅ 7단계 완료: 정리 완료${NC}"
echo

# ===============================================
# 완료 메시지
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    ✅ MindGarden 시스템 종료 완료! ✅"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}📋 종료 작업 요약:${NC}"
echo -e "${GREEN}   ✅ 모든 백엔드 프로세스 종료${NC}"
echo -e "${GREEN}   ✅ 모든 프론트엔드 1 (MindGarden) 프로세스 종료${NC}"
echo -e "${GREEN}   ✅ 모든 프론트엔드 2 (Trinity) 프로세스 종료${NC}"
echo -e "${GREEN}   ✅ 모든 프론트엔드 3 (Ops Portal) 프로세스 종료${NC}"
echo -e "${GREEN}   ✅ 포트 8080, 3000, 3001, 4300 정리${NC}"
echo -e "${GREEN}   ✅ 메모리 정리 및 최적화${NC}"
echo -e "${GREEN}   ✅ 임시 파일 정리${NC}"
echo -e "${GREEN}   ✅ 시스템 헬스체크 완료${NC}"

echo
echo -e "${CYAN}🚀 다시 시작하려면:${NC}"
echo -e "${YELLOW}   ./scripts/start-all.sh${NC}"

echo
echo -e "${GREEN}🧹 MindGarden 시스템이 깔끔하게 종료되었습니다!${NC}"
