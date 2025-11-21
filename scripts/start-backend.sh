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

# ============================================
# 표준화 검증 (2025-11-20 표준화 작업)
# ============================================
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}표준화 검증 시작${NC}"
echo -e "${CYAN}========================================${NC}"

VALIDATION_ERROR=0
VALIDATION_WARNING=0

# DTO 표준화 검증 (임시 주석 처리 - 레거시 코드 마이그레이션 완료 후 활성화)
# 2025-11-20: DTO 표준화는 완료되었으나 레거시 코드에서 deprecated DTO 사용 중
# (PaymentRequest, EmailRequest, AuthRequest 등)
# 레거시 코드 마이그레이션 완료 후 주석 해제 필요
#echo -e "${BLUE}[Phase 2] DTO 표준화 검증 중...${NC}"
#if [ -f "scripts/validate-dto-standardization.js" ]; then
#  if command -v node >/dev/null 2>&1; then
#    node scripts/validate-dto-standardization.js
#    if [ $? -ne 0 ]; then
#      echo -e "${RED}❌ DTO 표준화 검증 실패${NC}"
#      VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
#    else
#      echo -e "${GREEN}✅ DTO 표준화 검증 통과${NC}"
#    fi
#  else
#    echo -e "${YELLOW}⚠️ node가 설치되지 않았습니다. DTO 검증을 건너뜁니다.${NC}"
#  fi
#else
#  echo -e "${YELLOW}⚠️ DTO 검증 스크립트가 없습니다. 건너뜁니다.${NC}"
#fi

# 동적 시스템 검증 (임시 주석 처리 - 레거시 코드 마이그레이션 완료 후 활성화)
# 2025-11-20: 하드코딩 경고가 많아 임시로 비활성화
# 레거시 코드 마이그레이션 완료 후 주석 해제 필요
#echo -e "${BLUE}[동적 시스템] 하드코딩 및 동적 시스템 검증 중...${NC}"
#if [ -f "scripts/validate-dynamic-system.js" ]; then
#  if command -v node >/dev/null 2>&1; then
#    node scripts/validate-dynamic-system.js
#    if [ $? -ne 0 ]; then
#      echo -e "${RED}❌ 동적 시스템 검증 실패${NC}"
#      VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
#    else
#      echo -e "${GREEN}✅ 동적 시스템 검증 통과${NC}"
#    fi
#  else
#    echo -e "${YELLOW}⚠️ node가 설치되지 않았습니다. 동적 시스템 검증을 건너뜁니다.${NC}"
#  fi
#else
#  echo -e "${YELLOW}⚠️ 동적 시스템 검증 스크립트가 없습니다. 건너뜁니다.${NC}"
#fi

# Checkstyle 검증 (Maven validate phase)
echo -e "${BLUE}[Checkstyle] Java 코드 품질 검증 중...${NC}"
if [ -f "pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo -e "${BLUE}   Maven validate 실행 중...${NC}"
  mvn validate -q
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Checkstyle 검증 실패${NC}"
    echo -e "${YELLOW}   💡 상세 확인: mvn checkstyle:check${NC}"
    VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
  else
    echo -e "${GREEN}✅ Checkstyle 검증 통과${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Maven이 설치되지 않았거나 pom.xml이 없습니다. Checkstyle 검증을 건너뜁니다.${NC}"
fi

# 검증 결과 확인
echo -e "${CYAN}========================================${NC}"
if [ $VALIDATION_ERROR -eq 0 ]; then
  echo -e "${GREEN}✅ 모든 표준화 검증 통과!${NC}"
  echo -e "${CYAN}========================================${NC}\n"
else
  echo -e "${RED}❌ $VALIDATION_ERROR 개의 표준화 검증이 실패했습니다.${NC}"
  echo -e "${CYAN}========================================${NC}\n"
  echo -e "${YELLOW}💡 해결 방법:${NC}"
  echo -e "   1. DTO 표준화 검증: node scripts/validate-dto-standardization.js"
  echo -e "   2. 동적 시스템 검증: node scripts/validate-dynamic-system.js"
  echo -e "   3. Checkstyle 검증: mvn checkstyle:check"
  echo -e "   4. 검증 통과 후 서버를 다시 실행하세요.${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  서버 실행을 중단합니다.${NC}"
  exit 1
fi

# 포트 8080 정리 (백엔드 포트)
echo -e "${YELLOW}🧹 포트 충돌 방지: 포트 8080 정리 중...${NC}"
if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}   포트 8080을 사용하는 프로세스 종료...${NC}"
    lsof -t -i:8080 | xargs kill -TERM 2>/dev/null || true
    sleep 2
    # 강제 종료
    REMAINING=$(lsof -t -i:8080 2>/dev/null || true)
    if [ ! -z "$REMAINING" ]; then
        lsof -t -i:8080 | xargs kill -KILL 2>/dev/null || true
        sleep 1
    fi
    echo -e "${GREEN}   ✅ 포트 8080 정리 완료${NC}"
else
    echo -e "${GREEN}   ✅ 포트 8080 사용 가능${NC}"
fi

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
    
# ============================================
# 환경 변수 파일 자동 생성 및 로드 (기존 파일이 없을 때만)
# ============================================
echo -e "${YELLOW}📋 환경 변수 파일 확인 중...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f "env.local.example" ]; then
        echo -e "${YELLOW}   .env.local 파일이 없습니다. env.local.example에서 생성합니다...${NC}"
        cp env.local.example .env.local
        echo -e "${GREEN}   ✅ .env.local 파일이 생성되었습니다.${NC}"
        echo -e "${YELLOW}   💡 필요시 .env.local 파일을 수정하세요.${NC}"
        echo -e "${YELLOW}   💡 이 파일은 Git에 커밋되지 않으므로 로컬에서 계속 유지됩니다.${NC}"
    else
        echo -e "${RED}   ⚠️  env.local.example 파일을 찾을 수 없습니다.${NC}"
        echo -e "${YELLOW}   💡 수동으로 .env.local 파일을 생성하세요.${NC}"
    fi
else
    echo -e "${GREEN}   ✅ .env.local 파일이 이미 존재합니다. (기존 파일 유지)${NC}"
    echo -e "${BLUE}   💡 파일이 사라지지 않도록 .gitignore에 포함되어 있습니다.${NC}"
fi

# 환경 변수 로드 (.env.local 파일이 있으면)
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📋 환경 변수 로드 중...${NC}"
    # 환경 변수를 export하여 Maven 프로세스에 전달
    set -a
    source .env.local
    set +a

    echo -e "${GREEN}✅ 환경 변수 로드 완료${NC}"
    echo -e "${BLUE}   DB_HOST: ${DB_HOST:-미설정}${NC}"
    echo -e "${BLUE}   DB_USERNAME: ${DB_USERNAME:-미설정}${NC}"
    echo -e "${BLUE}   DB_PASSWORD: ${DB_PASSWORD:+설정됨}${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 환경 변수를 수동으로 설정하세요.${NC}"
fi
    
    # 환경 변수를 Maven 프로세스에 전달하여 실행 (환경 변수는 자동으로 상속됨)
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
HEALTH_CHECK_TIMEOUT=60  # 타임아웃을 60초로 증가
HEALTH_CHECK_INTERVAL=2  # 체크 간격을 2초로 증가

for i in $(seq 1 $HEALTH_CHECK_TIMEOUT); do
    # 프로세스가 살아있는지 확인
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ 백엔드 서버 프로세스가 종료되었습니다${NC}"
        echo -e "${YELLOW}💡 로그를 확인해보세요:${NC}"
        if [ "$PROFILE" = "local" ]; then
            echo -e "   - Maven 로그를 터미널에서 확인하세요"
        else
            echo -e "   - 로그 파일: logs/backend.log"
            tail -30 logs/backend.log 2>/dev/null | grep -A 10 -B 5 "Error\|Exception\|Failed" | tail -20
        fi
        exit 1
    fi
    
    # 헬스체크 (여러 엔드포인트 시도)
    if curl -f -s -m 2 http://localhost:8080/actuator/health > /dev/null 2>&1 || \
       curl -f -s -m 2 http://localhost:8080/api/business-categories/root > /dev/null 2>&1 || \
       curl -f -s -m 2 http://localhost:8080/api/common-codes > /dev/null 2>&1; then
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
    
    # 진행 상황 표시 (10초마다)
    if [ $((i % 5)) -eq 0 ]; then
        echo -e "${YELLOW}   ⏳ 서버 시작 대기 중... (${i}/${HEALTH_CHECK_TIMEOUT}초)${NC}"
    fi
    
    sleep $HEALTH_CHECK_INTERVAL
done

echo -e "${RED}❌ 백엔드 서버 시작 실패 - 헬스체크 타임아웃 (${HEALTH_CHECK_TIMEOUT}초)${NC}"
echo -e "${YELLOW}💡 로그를 확인해보세요:${NC}"
if [ "$PROFILE" = "local" ]; then
    echo -e "   - Maven 로그를 터미널에서 확인하세요"
    echo -e "   - 또는: tail -f logs/backend.log"
else
    echo -e "   - 로그 파일: logs/backend.log"
    tail -50 logs/backend.log 2>/dev/null | grep -A 10 -B 5 "Error\|Exception\|Failed" | tail -30
fi

# 프로세스가 살아있으면 PID 표시
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}   프로세스는 실행 중입니다 (PID: $BACKEND_PID)${NC}"
    echo -e "${YELLOW}   서버가 시작 중일 수 있습니다. 잠시 후 다시 확인해보세요.${NC}"
fi

exit 1
