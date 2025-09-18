#!/bin/bash

# MindGarden 시스템 헬스체크 스크립트
# 시스템 상태를 종합적으로 점검

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
echo "    🔍 MindGarden 시스템 헬스체크 🔍"
echo "=================================================="
echo -e "${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"
echo

# 헬스체크 결과 초기화
HEALTH_SCORE=0
MAX_SCORE=10

# ===============================================
# 1. 백엔드 서버 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 1. 백엔드 서버 상태 확인${NC}"

if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 백엔드 서버: 정상 작동${NC}"
    
    # 상세 헬스 정보
    HEALTH_INFO=$(curl -s http://localhost:8080/actuator/health)
    echo -e "${BLUE}   📊 상세 정보: $HEALTH_INFO${NC}"
    
    # 응답 시간 측정
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8080/actuator/health)
    echo -e "${BLUE}   ⏱️  응답 시간: ${RESPONSE_TIME}초${NC}"
    
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        echo -e "${GREEN}   ✅ 응답 시간: 양호${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 2))
    else
        echo -e "${YELLOW}   ⚠️  응답 시간: 느림${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 1))
    fi
    
else
    echo -e "${RED}   ❌ 백엔드 서버: 응답 없음${NC}"
    echo -e "${YELLOW}   💡 서버가 실행 중인지 확인하세요: ./scripts/start-all.sh${NC}"
fi
echo

# ===============================================
# 2. 프론트엔드 서버 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 2. 프론트엔드 서버 상태 확인${NC}"

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 프론트엔드 서버: 정상 작동${NC}"
    
    # 응답 시간 측정
    FRONTEND_RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:3000)
    echo -e "${BLUE}   ⏱️  응답 시간: ${FRONTEND_RESPONSE_TIME}초${NC}"
    
    if (( $(echo "$FRONTEND_RESPONSE_TIME < 3.0" | bc -l) )); then
        echo -e "${GREEN}   ✅ 응답 시간: 양호${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 2))
    else
        echo -e "${YELLOW}   ⚠️  응답 시간: 느림${NC}"
        HEALTH_SCORE=$((HEALTH_SCORE + 1))
    fi
    
else
    echo -e "${YELLOW}   ⚠️  프론트엔드 서버: 응답 없음 (개발 모드가 아닐 수 있음)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
fi
echo

# ===============================================
# 3. 프로세스 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 3. 프로세스 상태 확인${NC}"

# 백엔드 프로세스
BACKEND_PROCESSES=$(pgrep -f "spring-boot:run\|consultation-management-system.*\.jar" || true)
if [ ! -z "$BACKEND_PROCESSES" ]; then
    echo -e "${GREEN}   ✅ 백엔드 프로세스: 실행 중 (PID: $BACKEND_PROCESSES)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e "${RED}   ❌ 백엔드 프로세스: 실행되지 않음${NC}"
fi

# 프론트엔드 프로세스
FRONTEND_PROCESSES=$(pgrep -f "react-scripts.*start\|npm.*start" | grep -v grep || true)
if [ ! -z "$FRONTEND_PROCESSES" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드 프로세스: 실행 중 (PID: $FRONTEND_PROCESSES)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e "${YELLOW}   ⚠️  프론트엔드 프로세스: 실행되지 않음 (빌드 모드일 수 있음)${NC}"
fi
echo

# ===============================================
# 4. 포트 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 4. 포트 상태 확인${NC}"

# 포트 8080 확인
if lsof -i:8080 > /dev/null 2>&1; then
    PORT_8080_PROCESS=$(lsof -i:8080 | tail -1 | awk '{print $2, $1}')
    echo -e "${GREEN}   ✅ 포트 8080: 사용 중 ($PORT_8080_PROCESS)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e "${RED}   ❌ 포트 8080: 사용되지 않음${NC}"
fi

# 포트 3000 확인
if lsof -i:3000 > /dev/null 2>&1; then
    PORT_3000_PROCESS=$(lsof -i:3000 | tail -1 | awk '{print $2, $1}')
    echo -e "${GREEN}   ✅ 포트 3000: 사용 중 ($PORT_3000_PROCESS)${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
else
    echo -e "${YELLOW}   ⚠️  포트 3000: 사용되지 않음${NC}"
fi
echo

# ===============================================
# 5. 시스템 리소스 확인
# ===============================================
echo -e "${YELLOW}🔍 5. 시스템 리소스 확인${NC}"

# CPU 사용률 (Java 프로세스)
if [ ! -z "$BACKEND_PROCESSES" ]; then
    for pid in $BACKEND_PROCESSES; do
        if ps -p $pid > /dev/null 2>&1; then
            CPU_USAGE=$(ps -p $pid -o %cpu | tail -1 | tr -d ' ')
            MEMORY_USAGE=$(ps -p $pid -o %mem | tail -1 | tr -d ' ')
            echo -e "${BLUE}   📊 백엔드 프로세스 $pid: CPU ${CPU_USAGE}%, 메모리 ${MEMORY_USAGE}%${NC}"
            
            if (( $(echo "$CPU_USAGE < 80.0" | bc -l) )); then
                HEALTH_SCORE=$((HEALTH_SCORE + 1))
            fi
        fi
    done
fi

# 디스크 사용량
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
echo -e "${BLUE}   💾 디스크 사용량: ${DISK_USAGE}%${NC}"

if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}   ✅ 디스크 사용량: 양호${NC}"
    HEALTH_SCORE=$((HEALTH_SCORE + 1))
elif [ $DISK_USAGE -lt 90 ]; then
    echo -e "${YELLOW}   ⚠️  디스크 사용량: 주의${NC}"
else
    echo -e "${RED}   ❌ 디스크 사용량: 위험${NC}"
fi

# 메모리 사용량
if command -v free &> /dev/null; then
    MEMORY_INFO=$(free -h | head -2)
    echo -e "${BLUE}   🧠 메모리 상태:${NC}"
    echo -e "${BLUE}      $MEMORY_INFO${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    MEMORY_INFO=$(vm_stat | grep "Pages free\|Pages active\|Pages inactive" | head -3)
    echo -e "${BLUE}   🧠 메모리 상태:${NC}"
    echo -e "${BLUE}      $MEMORY_INFO${NC}"
fi
echo

# ===============================================
# 6. 로그 파일 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 6. 로그 파일 상태 확인${NC}"

if [ -d "logs" ]; then
    LOG_COUNT=$(ls logs/*.log 2>/dev/null | wc -l || echo 0)
    echo -e "${BLUE}   📋 로그 파일 개수: $LOG_COUNT${NC}"
    
    if [ $LOG_COUNT -gt 0 ]; then
        # 최근 에러 검사
        RECENT_ERRORS=$(grep -c "ERROR\|Exception\|Failed" logs/*.log 2>/dev/null | grep -v ":0" || true)
        if [ -z "$RECENT_ERRORS" ]; then
            echo -e "${GREEN}   ✅ 로그: 최근 에러 없음${NC}"
            HEALTH_SCORE=$((HEALTH_SCORE + 1))
        else
            echo -e "${YELLOW}   ⚠️  로그: 최근 에러 발견${NC}"
            echo -e "${BLUE}      $RECENT_ERRORS${NC}"
        fi
    fi
else
    echo -e "${YELLOW}   ⚠️  로그 디렉토리가 존재하지 않습니다${NC}"
fi
echo

# ===============================================
# 7. Git 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 7. Git 상태 확인${NC}"

if git status > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current)
    UNCOMMITTED_CHANGES=$(git status --porcelain | wc -l)
    
    echo -e "${BLUE}   🌿 현재 브랜치: $CURRENT_BRANCH${NC}"
    echo -e "${BLUE}   📝 커밋되지 않은 변경사항: $UNCOMMITTED_CHANGES개${NC}"
    
    if [ $UNCOMMITTED_CHANGES -eq 0 ]; then
        echo -e "${GREEN}   ✅ Git 상태: 깔끔함${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Git 상태: 커밋되지 않은 변경사항 있음${NC}"
    fi
else
    echo -e "${RED}   ❌ Git 리포지토리가 아닙니다${NC}"
fi
echo

# ===============================================
# 헬스체크 결과 요약
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    📊 헬스체크 결과 요약 📊"
echo "=================================================="
echo -e "${NC}"

HEALTH_PERCENTAGE=$((HEALTH_SCORE * 100 / MAX_SCORE))

echo -e "${CYAN}🏥 전체 건강 점수: ${HEALTH_SCORE}/${MAX_SCORE} (${HEALTH_PERCENTAGE}%)${NC}"

if [ $HEALTH_PERCENTAGE -ge 80 ]; then
    echo -e "${GREEN}🎉 시스템 상태: 매우 좋음${NC}"
    echo -e "${GREEN}   ✅ 모든 시스템이 원활하게 작동하고 있습니다!${NC}"
elif [ $HEALTH_PERCENTAGE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  시스템 상태: 양호${NC}"
    echo -e "${YELLOW}   💡 일부 개선이 필요할 수 있습니다.${NC}"
else
    echo -e "${RED}🚨 시스템 상태: 주의 필요${NC}"
    echo -e "${RED}   ⚠️  시스템 점검이 필요합니다!${NC}"
    echo -e "${YELLOW}   🔧 해결 방법: ./scripts/restart-all.sh${NC}"
fi

echo
echo -e "${CYAN}🛠️  유용한 명령어:${NC}"
echo -e "${BLUE}   - 전체 재시작: ./scripts/restart-all.sh${NC}"
echo -e "${BLUE}   - 로그 확인: tail -f logs/backend.log${NC}"
echo -e "${BLUE}   - 프로세스 확인: ps aux | grep java${NC}"

echo
echo -e "${GREEN}🔍 헬스체크 완료!${NC}"
