#!/bin/bash

# MindGarden 개발 서버 자동 빌드 및 실행 스크립트
# 데이터베이스 연결 설정 포함
# 사용법: ./scripts/start-dev.sh [profile]
# 예시: ./scripts/start-dev.sh local

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${CYAN}"
echo "======================================"
echo "   MindGarden Dev Server 🚀"
echo "   데이터베이스 연결 포함"
echo "======================================"
echo -e "${NC}"

# 프로파일 설정 (기본값: local)
PROFILE=${1:-local}
echo -e "${YELLOW}📋 설정된 프로파일: ${PROFILE}${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# ================================================
# 1단계: 환경 변수 로드
# ================================================
echo -e "${YELLOW}🔧 1단계: 환경 변수 로드${NC}"

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다.${NC}"
    echo -e "${BLUE}💡 env.local.example을 복사하여 .env.local을 만드세요:${NC}"
    echo -e "${BLUE}   cp env.local.example .env.local${NC}"
    echo -e "${YELLOW}📋 기본값으로 계속 진행합니다...${NC}"
else
    # 환경 변수 로드 (주석 제외)
    while IFS= read -r line || [ -n "$line" ]; do
        # 주석과 빈 줄 건너뛰기
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # 환경 변수 export
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            export "${BASH_REMATCH[1]}"="${BASH_REMATCH[2]}"
        fi
    done < "$ENV_FILE"
    
    echo -e "${GREEN}✅ 환경 변수가 로드되었습니다.${NC}"
    echo -e "${BLUE}📋 DB_HOST: ${DB_HOST:-beta0629.cafe24.com}${NC}"
    echo -e "${BLUE}📋 DB_NAME: ${DB_NAME:-mind_garden}${NC}"
    echo -e "${BLUE}📋 DB_USERNAME: ${DB_USERNAME:-mindgarden_dev}${NC}"
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}⚠️  DB_PASSWORD가 설정되지 않았습니다!${NC}"
        echo -e "${YELLOW}💡 .env.local 파일에 DB_PASSWORD를 설정해주세요.${NC}"
    else
        echo -e "${GREEN}✅ DB_PASSWORD가 설정되었습니다.${NC}"
    fi
fi

echo ""

# ================================================
# 2단계: 데이터베이스 연결 확인
# ================================================
echo -e "${YELLOW}🔍 2단계: 데이터베이스 연결 설정 확인${NC}"

DB_HOST_VAL=${DB_HOST:-beta0629.cafe24.com}
DB_PORT_VAL=${DB_PORT:-3306}
DB_NAME_VAL=${DB_NAME:-mind_garden}
DB_USERNAME_VAL=${DB_USERNAME:-mindgarden_dev}

echo -e "${BLUE}   - 호스트: ${DB_HOST_VAL}${NC}"
echo -e "${BLUE}   - 포트: ${DB_PORT_VAL}${NC}"
echo -e "${BLUE}   - 데이터베이스: ${DB_NAME_VAL}${NC}"
echo -e "${BLUE}   - 사용자명: ${DB_USERNAME_VAL}${NC}"

# MySQL 클라이언트가 있는 경우 연결 테스트 (선택사항)
if command -v mysql &> /dev/null; then
    echo -e "${YELLOW}   🔍 MySQL 연결 테스트 중...${NC}"
    if [ ! -z "$DB_PASSWORD" ]; then
        if timeout 5 mysql -h"${DB_HOST_VAL}" -P"${DB_PORT_VAL}" -u"${DB_USERNAME_VAL}" -p"${DB_PASSWORD}" -e "SELECT 1;" "${DB_NAME_VAL}" &> /dev/null; then
            echo -e "${GREEN}   ✅ 데이터베이스 연결 성공!${NC}"
        else
            echo -e "${YELLOW}   ⚠️  MySQL 클라이언트로 연결 테스트 실패 (애플리케이션에서는 정상 작동할 수 있습니다)${NC}"
        fi
    else
        echo -e "${YELLOW}   ⚠️  DB_PASSWORD가 없어 연결 테스트를 건너뜁니다.${NC}"
    fi
else
    echo -e "${BLUE}   ℹ️  MySQL 클라이언트가 없습니다 (연결 테스트 건너뜀)${NC}"
fi

echo ""

# ================================================
# 3단계: 기존 프로세스 종료
# ================================================
echo -e "${YELLOW}🔄 3단계: 기존 백엔드 프로세스 확인 및 종료${NC}"

if pgrep -f "spring-boot:run\|java.*consultation-management-system" > /dev/null; then
    echo -e "${RED}⚠️  기존 백엔드 프로세스를 종료합니다...${NC}"
    pkill -f "spring-boot:run\|java.*consultation-management-system" || true
    sleep 3
    echo -e "${GREEN}✅ 기존 프로세스 종료 완료${NC}"
else
    echo -e "${GREEN}✅ 실행 중인 백엔드 프로세스가 없습니다${NC}"
fi

echo ""

# ================================================
# 4단계: Maven 빌드
# ================================================
echo -e "${YELLOW}🔨 4단계: Maven 빌드${NC}"

# 로그 디렉토리 생성
mkdir -p logs

echo -e "${YELLOW}   Maven 빌드 시작...${NC}"
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
echo ""

# ================================================
# 5단계: 백엔드 서버 시작
# ================================================
echo -e "${YELLOW}🚀 5단계: 백엔드 서버 시작${NC}"

if [ "$PROFILE" = "local" ]; then
    # 로컬 개발 모드 - Maven으로 실행 (Hot Reload 지원)
    echo -e "${BLUE}🔧 개발 모드로 실행 (Hot Reload 지원, 프로파일: local)${NC}"
    
    # 환경 변수와 함께 Spring Boot 실행
    DB_HOST=${DB_HOST_VAL} \
    DB_PORT=${DB_PORT_VAL} \
    DB_NAME=${DB_NAME_VAL} \
    DB_USERNAME=${DB_USERNAME_VAL} \
    DB_PASSWORD=${DB_PASSWORD} \
    mvn spring-boot:run -Dspring-boot.run.profiles=local > logs/backend.log 2>&1 &
    BACKEND_PID=$!
else
    # 프로덕션 모드 - JAR 파일로 실행
    echo -e "${BLUE}🏭 프로덕션 모드로 실행 (프로파일: ${PROFILE})${NC}"
    DB_HOST=${DB_HOST_VAL} \
    DB_PORT=${DB_PORT_VAL} \
    DB_NAME=${DB_NAME_VAL} \
    DB_USERNAME=${DB_USERNAME_VAL} \
    DB_PASSWORD=${DB_PASSWORD} \
    nohup java -jar -Dspring.profiles.active=${PROFILE} $JAR_FILE > logs/backend.log 2>&1 &
    BACKEND_PID=$!
fi

echo -e "${GREEN}✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
echo ""

# ================================================
# 6단계: 헬스체크 및 데이터베이스 연결 확인
# ================================================
echo -e "${YELLOW}🔍 6단계: 서버 헬스체크 및 데이터베이스 연결 확인${NC}"

echo -e "${YELLOW}   서버 시작 대기 중...${NC}"
for i in {1..60}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 백엔드 서버가 성공적으로 시작되었습니다!${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}   ❌ 백엔드 서버 헬스체크 타임아웃${NC}"
        echo -e "${YELLOW}   💡 로그를 확인해보세요: tail -f logs/backend.log${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done

echo ""

# 데이터베이스 연결 확인
echo -e "${YELLOW}   데이터베이스 연결 확인 중...${NC}"
sleep 2
if curl -f http://localhost:8080/api/health/database > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 데이터베이스 연결 정상!${NC}"
else
    echo -e "${YELLOW}   ⚠️  데이터베이스 연결 확인 엔드포인트를 사용할 수 없습니다.${NC}"
    echo -e "${BLUE}   ℹ️  수동으로 확인: curl http://localhost:8080/api/health/database${NC}"
fi

echo ""

# ================================================
# 완료
# ================================================
echo -e "${GREEN}"
echo "======================================"
echo "   🎉 MindGarden Dev Server 실행 완료!"
echo "======================================"
echo -e "${NC}"

echo -e "${CYAN}🌐 접속 정보:${NC}"
echo -e "${GREEN}   ✅ 백엔드 API: http://localhost:8080${NC}"
echo -e "${BLUE}   📊 Actuator Health: http://localhost:8080/actuator/health${NC}"
echo -e "${BLUE}   🗄️  DB Health: http://localhost:8080/api/health/database${NC}"

echo ""
echo -e "${CYAN}📋 로그 파일:${NC}"
echo -e "${BLUE}   - 백엔드: logs/backend.log${NC}"
echo -e "${BLUE}   - 실시간 확인: tail -f logs/backend.log${NC}"

echo ""
echo -e "${CYAN}📊 데이터베이스 연결 정보:${NC}"
echo -e "${BLUE}   - 호스트: ${DB_HOST_VAL}${NC}"
echo -e "${BLUE}   - 데이터베이스: ${DB_NAME_VAL}${NC}"
echo -e "${BLUE}   - 사용자: ${DB_USERNAME_VAL}${NC}"

echo ""
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   - Ctrl+C (현재 터미널에서)${NC}"
echo -e "${YELLOW}   - 또는: pkill -f 'spring-boot:run'${NC}"
echo -e "${YELLOW}   - 또는: ./scripts/stop-backend.sh${NC}"

echo ""
echo -e "${GREEN}🚀 개발을 시작하세요! Happy Coding! 💻${NC}"

# 프로세스 정보 저장
echo "BACKEND_PID=$BACKEND_PID" > .mindgarden_pids
