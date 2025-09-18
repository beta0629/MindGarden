#!/bin/bash

# MindGarden 백엔드 자동 빌드 및 실행 스크립트
# 사용법: ./scripts/start-backend.sh [profile]
# 예시: ./scripts/start-backend.sh local

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
echo "   MindGarden Backend Builder 🚀"
echo "======================================"
echo -e "${NC}"

# 프로파일 설정 (기본값: local)
PROFILE=${1:-local}
echo -e "${YELLOW}📋 설정된 프로파일: ${PROFILE}${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 기존 백엔드 프로세스 종료
echo -e "${YELLOW}🔄 기존 백엔드 프로세스 확인 및 종료...${NC}"
if pgrep -f "spring-boot:run\|java.*consultation-management-system" > /dev/null; then
    echo -e "${RED}⚠️  기존 백엔드 프로세스를 종료합니다...${NC}"
    pkill -f "spring-boot:run\|java.*consultation-management-system" || true
    sleep 3
    echo -e "${GREEN}✅ 기존 프로세스 종료 완료${NC}"
else
    echo -e "${GREEN}✅ 실행 중인 백엔드 프로세스가 없습니다${NC}"
fi

# Maven 빌드
echo -e "${YELLOW}🔨 Maven 빌드 시작...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Maven 빌드 성공!${NC}"
else
    echo -e "${RED}❌ Maven 빌드 실패!${NC}"
    exit 1
fi

# JAR 파일 확인
JAR_FILE="target/consultation-management-system-1.0.0.jar"
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}❌ JAR 파일을 찾을 수 없습니다: $JAR_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JAR 파일 확인: $JAR_FILE${NC}"

# 로그 디렉토리 생성
mkdir -p logs

# 백엔드 실행
echo -e "${YELLOW}🚀 백엔드 서버 시작 (프로파일: ${PROFILE})...${NC}"

if [ "$PROFILE" = "local" ]; then
    # 로컬 개발 모드 - Maven으로 실행 (Hot Reload 지원)
    echo -e "${BLUE}🔧 개발 모드로 실행 (Hot Reload 지원)${NC}"
    mvn spring-boot:run -Dspring-boot.run.profiles=local &
    BACKEND_PID=$!
else
    # 프로덕션 모드 - JAR 파일로 실행
    echo -e "${BLUE}🏭 프로덕션 모드로 실행${NC}"
    nohup java -jar -Dspring.profiles.active=$PROFILE $JAR_FILE > logs/backend.log 2>&1 &
    BACKEND_PID=$!
fi

echo -e "${GREEN}✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"

# 헬스체크
echo -e "${YELLOW}🔍 서버 시작 대기 중...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 백엔드 서버가 성공적으로 시작되었습니다!${NC}"
        echo -e "${BLUE}🌐 API 서버: http://localhost:8080${NC}"
        echo -e "${BLUE}📊 Actuator: http://localhost:8080/actuator/health${NC}"
        
        # 로그 파일 위치 안내
        if [ "$PROFILE" != "local" ]; then
            echo -e "${BLUE}📋 로그 파일: logs/backend.log${NC}"
        fi
        
        # 종료 방법 안내
        echo -e "${YELLOW}"
        echo "🛑 서버 종료 방법:"
        echo "   - Ctrl+C (현재 터미널에서)"
        echo "   - 또는: pkill -f 'spring-boot:run'"
        echo "   - 또는: ./scripts/stop-backend.sh"
        echo -e "${NC}"
        
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo -e "${RED}❌ 백엔드 서버 시작 실패 - 헬스체크 타임아웃${NC}"
echo -e "${YELLOW}💡 로그를 확인해보세요:${NC}"
if [ "$PROFILE" = "local" ]; then
    echo "   - 터미널에서 직접 확인 가능"
else
    echo "   - tail -f logs/backend.log"
fi

exit 1
