#!/bin/bash

# MindGarden 통합 자동화 스크립트
# 프론트엔드 + 백엔드 빌드 및 실행
# 사용법: ./scripts/start-all.sh [profile] [mode]
# 예시: ./scripts/start-all.sh local dev (로컬 개발)
# 예시: ./scripts/start-all.sh prod build (프로덕션 빌드)

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${PURPLE}"
echo "=================================================="
echo "    🚀 MindGarden 통합 자동화 시스템 🚀"
echo "=================================================="
echo -e "${NC}"

# 파라미터 설정
BACKEND_PROFILE=${1:-local}
FRONTEND_MODE=${2:-dev}

echo -e "${CYAN}📋 설정 정보:${NC}"
echo -e "${BLUE}   - 백엔드 프로파일: ${BACKEND_PROFILE}${NC}"
echo -e "${BLUE}   - 프론트엔드 모드: ${FRONTEND_MODE}${NC}"
echo

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$PROJECT_ROOT"
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 로그 디렉토리 생성
mkdir -p logs

# Git 정보 확인
echo -e "${CYAN}📋 Git 정보:${NC}"
CURRENT_BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --oneline)
echo -e "${BLUE}   - 현재 브랜치: ${CURRENT_BRANCH}${NC}"
echo -e "${BLUE}   - 마지막 커밋: ${LAST_COMMIT}${NC}"
echo

# ===============================================
# 1단계: 모든 기존 프로세스 종료
# ===============================================
echo -e "${YELLOW}🛑 1단계: 모든 기존 프로세스 종료${NC}"
echo -e "${YELLOW}   1-1. 백엔드 프로세스 종료...${NC}"
./scripts/development/utilities/stop-backend.sh

echo -e "${YELLOW}   1-2. 프론트엔드 프로세스 종료...${NC}"
./scripts/development/utilities/stop-frontend.sh
./scripts/development/utilities/stop-trinity.sh 2>/dev/null || true
# Ops Portal 종료 (포트 4300)
if lsof -i:4300 > /dev/null 2>&1; then
    lsof -t -i:4300 | xargs kill -TERM 2>/dev/null || true
    sleep 1
    lsof -t -i:4300 | xargs kill -KILL 2>/dev/null || true
fi

echo -e "${GREEN}✅ 1단계 완료: 모든 기존 프로세스 종료됨${NC}"
echo

# ===============================================
# 2단계: 환경 및 의존성 확인
# ===============================================
echo -e "${YELLOW}🔍 2단계: 환경 및 의존성 확인${NC}"

# Java 버전 확인
echo -e "${YELLOW}   2-1. Java 버전 확인...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo -e "${GREEN}   ✅ ${JAVA_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Java가 설치되지 않았습니다!${NC}"
    exit 1
fi

# Maven 버전 확인
echo -e "${YELLOW}   2-2. Maven 버전 확인...${NC}"
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -version | head -n 1)
    echo -e "${GREEN}   ✅ ${MVN_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Maven이 설치되지 않았습니다!${NC}"
    exit 1
fi

# Node.js 버전 확인
echo -e "${YELLOW}   2-3. Node.js 버전 확인...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}   ✅ Node.js ${NODE_VERSION}, npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}   ❌ Node.js가 설치되지 않았습니다!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 2단계 완료: 환경 확인됨${NC}"
echo

# ===============================================
# 2-4단계: 표준화 검증 (2025-11-20 표준화 작업)
# ===============================================
echo -e "${YELLOW}🔍 2-4단계: 표준화 검증${NC}"

VALIDATION_ERROR=0
VALIDATION_WARNING=0

# DTO 표준화 검증
echo -e "${YELLOW}   2-4-1. DTO 표준화 검증 중...${NC}"
if [ -f "scripts/development/code-quality/validate-dto-standardization.js" ]; then
  if command -v node >/dev/null 2>&1; then
    node scripts/development/code-quality/validate-dto-standardization.js
    if [ $? -ne 0 ]; then
      echo -e "${RED}   ❌ DTO 표준화 검증 실패${NC}"
      VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
    else
      echo -e "${GREEN}   ✅ DTO 표준화 검증 통과${NC}"
    fi
  else
    echo -e "${YELLOW}   ⚠️ node가 설치되지 않았습니다. DTO 검증을 건너뜁니다.${NC}"
  fi
else
  echo -e "${YELLOW}   ⚠️ DTO 검증 스크립트가 없습니다. 건너뜁니다.${NC}"
fi

# 동적 시스템 검증 (하드코딩 및 동적 시스템 사용 확인)
echo -e "${YELLOW}   2-4-2. 동적 시스템 검증 중 (하드코딩 및 동적 시스템 사용 확인)...${NC}"
if [ -f "scripts/development/code-quality/validate-dynamic-system.js" ]; then
  if command -v node >/dev/null 2>&1; then
    node scripts/development/code-quality/validate-dynamic-system.js
    if [ $? -ne 0 ]; then
      echo -e "${RED}   ❌ 동적 시스템 검증 실패${NC}"
      VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
    else
      echo -e "${GREEN}   ✅ 동적 시스템 검증 통과${NC}"
    fi
  else
    echo -e "${YELLOW}   ⚠️ node가 설치되지 않았습니다. 동적 시스템 검증을 건너뜁니다.${NC}"
  fi
else
  echo -e "${YELLOW}   ⚠️ 동적 시스템 검증 스크립트가 없습니다. 건너뜁니다.${NC}"
fi

# Checkstyle 검증 (Maven validate phase)
echo -e "${YELLOW}   2-4-3. Checkstyle 검증 중...${NC}"
if [ -f "pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  mvn validate -q
  if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Checkstyle 검증 실패${NC}"
    echo -e "${YELLOW}   💡 상세 확인: mvn checkstyle:check${NC}"
    VALIDATION_ERROR=$((VALIDATION_ERROR + 1))
  else
    echo -e "${GREEN}   ✅ Checkstyle 검증 통과${NC}"
  fi
else
  echo -e "${YELLOW}   ⚠️ Maven이 설치되지 않았거나 pom.xml이 없습니다. Checkstyle 검증을 건너뜁니다.${NC}"
fi

# 검증 결과 확인 (개발 모드에서는 경고만 출력)
if [ $VALIDATION_ERROR -eq 0 ]; then
  echo -e "${GREEN}✅ 2-4단계 완료: 표준화 검증 통과${NC}"
else
  echo -e "${YELLOW}⚠️  2-4단계: $VALIDATION_ERROR 개의 표준화 검증이 실패했지만 개발 모드에서는 계속 진행합니다.${NC}"
  echo -e "${YELLOW}💡 나중에 해결하세요:${NC}"
  echo -e "   1. DTO 표준화 검증: node scripts/development/code-quality/validate-dto-standardization.js"
  echo -e "   2. 동적 시스템 검증: node scripts/development/code-quality/validate-dynamic-system.js"
  echo -e "   3. Checkstyle 검증: mvn checkstyle:check"
  echo ""
fi
echo

# ===============================================
# 3단계: 백엔드 빌드 및 실행
# ===============================================
echo -e "${YELLOW}🔨 3단계: 백엔드 빌드 및 실행${NC}"

# 환경 변수 로드 (.env.local 파일이 있으면) - 먼저 로드
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}   📋 환경 변수 로드 중...${NC}"
    set -a
    source .env.local
    set +a
    
    echo -e "${GREEN}   ✅ 환경 변수 로드 완료${NC}"
    echo -e "${BLUE}      DB_HOST: ${DB_HOST:-미설정}${NC}"
    echo -e "${BLUE}      DB_USERNAME: ${DB_USERNAME:-미설정}${NC}"
    echo -e "${BLUE}      DB_PASSWORD: ${DB_PASSWORD:+설정됨}${NC}"
else
    echo -e "${YELLOW}   ⚠️  .env.local 파일이 없습니다. 환경 변수를 수동으로 설정하세요.${NC}"
fi

echo -e "${YELLOW}   3-1. Maven 빌드 시작...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ 백엔드 빌드 성공!${NC}"
else
    echo -e "${RED}   ❌ 백엔드 빌드 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   3-2. 백엔드 서버 시작...${NC}"
JAR_FILE="target/consultation-management-system-1.0.0.jar"

if [ "$BACKEND_PROFILE" = "local" ]; then
    # 로컬 개발 모드
    echo -e "${BLUE}   🔧 개발 모드로 백엔드 실행 (Hot Reload 지원)${NC}"
    
    # 환경 변수를 Maven 프로세스에 전달하여 실행 (환경 변수는 이미 로드됨)
    # 백그라운드 실행 시에도 환경 변수가 전달되도록 export 유지
    (
        # 서브셸에서 환경 변수 export 후 실행
        export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
        mvn spring-boot:run -Dspring-boot.run.profiles=$BACKEND_PROFILE > logs/backend.log 2>&1
    ) &
    BACKEND_PID=$!
else
    # 프로덕션 모드
    echo -e "${BLUE}   🏭 프로덕션 모드로 백엔드 실행${NC}"
    (
        export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
        nohup java -jar -Dspring.profiles.active=$BACKEND_PROFILE $JAR_FILE > logs/backend.log 2>&1
    ) &
    BACKEND_PID=$!
fi

echo -e "${GREEN}   ✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"

echo -e "${GREEN}✅ 3단계 완료: 백엔드 실행됨${NC}"
echo

# ===============================================
# 4단계: 프론트엔드 1 (MindGarden) 빌드 및 실행
# ===============================================
echo -e "${YELLOW}⚛️  4단계: 프론트엔드 1 (MindGarden) 빌드 및 실행${NC}"

cd frontend

echo -e "${YELLOW}   4-1. npm 의존성 설치...${NC}"
npm install > ../logs/frontend-install.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
else
    echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
    echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend-install.log${NC}"
    exit 1
fi

if [ "$FRONTEND_MODE" = "build" ]; then
    # 프로덕션 빌드
    echo -e "${YELLOW}   4-2. 프론트엔드 프로덕션 빌드...${NC}"
    npm run build > ../logs/frontend-build.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ 프론트엔드 빌드 성공!${NC}"
        BUILD_SIZE=$(du -sh build | cut -f1)
        echo -e "${BLUE}   📊 빌드 크기: ${BUILD_SIZE}${NC}"
    else
        echo -e "${RED}   ❌ 프론트엔드 빌드 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend-build.log${NC}"
        exit 1
    fi
else
    # 개발 모드 - 포트 3000
    echo -e "${YELLOW}   4-2. 프론트엔드 1 (MindGarden) 개발 서버 시작 (포트 3000)...${NC}"
    PORT=3000 npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}   ✅ 프론트엔드 1 서버 시작됨 (PID: $FRONTEND_PID, 포트: 3000)${NC}"
fi

cd ..
echo -e "${GREEN}✅ 4단계 완료: 프론트엔드 1 실행됨${NC}"
echo

# ===============================================
# 4-2단계: 프론트엔드 2 (Trinity) 빌드 및 실행
# ===============================================
echo -e "${YELLOW}🏠 4-2단계: 프론트엔드 2 (Trinity) 빌드 및 실행${NC}"

cd frontend-trinity

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   4-2-1. npm 의존성 설치...${NC}"
    npm install > ../logs/trinity-install.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
    else
        echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/trinity-install.log${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}   ✅ node_modules 확인됨${NC}"
fi

if [ "$FRONTEND_MODE" = "build" ]; then
    # 프로덕션 빌드
    echo -e "${YELLOW}   4-2-2. Trinity 프로덕션 빌드...${NC}"
    npm run build > ../logs/trinity-build.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Trinity 빌드 성공!${NC}"
        BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${BLUE}   📊 빌드 크기: ${BUILD_SIZE}${NC}"
    else
        echo -e "${RED}   ❌ Trinity 빌드 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/trinity-build.log${NC}"
        exit 1
    fi
else
    # 개발 모드 - 포트 3001
    echo -e "${YELLOW}   4-2-2. 프론트엔드 2 (Trinity) 개발 서버 시작 (포트 3001)...${NC}"
    npm run dev:trinity > ../logs/trinity.log 2>&1 &
    TRINITY_PID=$!
    echo -e "${GREEN}   ✅ 프론트엔드 2 서버 시작됨 (PID: $TRINITY_PID, 포트: 3001)${NC}"
fi

cd ..
echo -e "${GREEN}✅ 4-2단계 완료: 프론트엔드 2 실행됨${NC}"
echo

# ===============================================
# 4-3단계: 프론트엔드 3 (Ops Portal) 빌드 및 실행
# ===============================================
echo -e "${YELLOW}🔧 4-3단계: 프론트엔드 3 (Ops Portal) 빌드 및 실행${NC}"

cd frontend-ops

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   4-3-1. npm 의존성 설치...${NC}"
    npm install > ../logs/ops-install.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
    else
        echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/ops-install.log${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}   ✅ node_modules 확인됨${NC}"
fi

if [ "$FRONTEND_MODE" = "build" ]; then
    # 프로덕션 빌드
    echo -e "${YELLOW}   4-3-2. Ops Portal 프로덕션 빌드...${NC}"
    npm run build > ../logs/ops-build.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ Ops Portal 빌드 성공!${NC}"
        BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${BLUE}   📊 빌드 크기: ${BUILD_SIZE}${NC}"
    else
        echo -e "${RED}   ❌ Ops Portal 빌드 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/ops-build.log${NC}"
        exit 1
    fi
else
    # 개발 모드 - 포트 4300
    echo -e "${YELLOW}   4-3-2. 프론트엔드 3 (Ops Portal) 개발 서버 시작 (포트 4300)...${NC}"
    npm run dev > ../logs/ops.log 2>&1 &
    OPS_PID=$!
    echo -e "${GREEN}   ✅ 프론트엔드 3 서버 시작됨 (PID: $OPS_PID, 포트: 4300)${NC}"
fi

cd ..
echo -e "${GREEN}✅ 4-3단계 완료: 프론트엔드 3 실행됨${NC}"
echo

# ===============================================
# 5단계: 헬스체크 및 상태 확인
# ===============================================
echo -e "${YELLOW}🔍 5단계: 서버 헬스체크${NC}"

echo -e "${YELLOW}   5-1. 백엔드 서버 헬스체크...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 백엔드 서버 정상 작동!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}   ❌ 백엔드 서버 헬스체크 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/backend.log${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done

if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${YELLOW}   5-2. 프론트엔드 1 (MindGarden) 서버 헬스체크...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 프론트엔드 1 서버 정상 작동!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ 프론트엔드 1 서버 헬스체크 실패!${NC}"
            echo -e "${YELLOW}   💡 로그 확인: tail -f logs/frontend.log${NC}"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${YELLOW}   5-3. 프론트엔드 2 (Trinity) 서버 헬스체크...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3001 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 프론트엔드 2 서버 정상 작동!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ 프론트엔드 2 서버 헬스체크 실패!${NC}"
            echo -e "${YELLOW}   💡 로그 확인: tail -f logs/trinity.log${NC}"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${YELLOW}   5-4. 프론트엔드 3 (Ops Portal) 서버 헬스체크...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:4300 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 프론트엔드 3 서버 정상 작동!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}   ❌ 프론트엔드 3 서버 헬스체크 실패!${NC}"
            echo -e "${YELLOW}   💡 로그 확인: tail -f logs/ops.log${NC}"
            exit 1
        fi
        echo -n "."
        sleep 2
    done
fi

echo -e "${GREEN}✅ 5단계 완료: 모든 서버 정상 작동${NC}"
echo

# ===============================================
# 6단계: 완료 및 정보 표시
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    🎉 MindGarden 시스템 실행 완료! 🎉"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}🌐 접속 정보:${NC}"
echo -e "${GREEN}   ✅ 백엔드 API: http://localhost:8080${NC}"
echo -e "${BLUE}   📊 Actuator: http://localhost:8080/actuator/health${NC}"

if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${GREEN}   ✅ 프론트엔드 1 (MindGarden): http://localhost:3000${NC}"
    echo -e "${GREEN}   ✅ 프론트엔드 2 (Trinity): http://localhost:3001${NC}"
    echo -e "${GREEN}   ✅ 프론트엔드 3 (Ops Portal): http://localhost:4300${NC}"
elif [ "$FRONTEND_MODE" = "build" ]; then
    echo -e "${BLUE}   📁 프론트엔드 1 빌드: frontend/build/${NC}"
    echo -e "${BLUE}   📁 프론트엔드 2 빌드: frontend-trinity/.next/${NC}"
    echo -e "${BLUE}   📁 프론트엔드 3 빌드: frontend-ops/.next/${NC}"
fi

echo
echo -e "${CYAN}📋 로그 파일:${NC}"
echo -e "${BLUE}   - 백엔드: logs/backend.log${NC}"
if [ "$FRONTEND_MODE" = "dev" ]; then
    echo -e "${BLUE}   - 프론트엔드 1: logs/frontend.log${NC}"
    echo -e "${BLUE}   - 프론트엔드 2: logs/trinity.log${NC}"
    echo -e "${BLUE}   - 프론트엔드 3: logs/ops.log${NC}"
fi

echo
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   - 전체 종료: ./scripts/stop-all.sh${NC}"
echo -e "${YELLOW}   - 백엔드만: ./scripts/stop-backend.sh${NC}"
echo -e "${YELLOW}   - 프론트엔드만: ./scripts/stop-frontend.sh${NC}"
echo -e "${YELLOW}   - 또는 Ctrl+C${NC}"

echo
echo -e "${CYAN}🔄 재시작 방법:${NC}"
echo -e "${YELLOW}   - 전체 재시작: ./scripts/restart-all.sh${NC}"
echo -e "${YELLOW}   - 백엔드만: ./scripts/restart-backend.sh${NC}"

# 프로세스 정보 저장
echo "BACKEND_PID=$BACKEND_PID" > .mindgarden_pids
if [ "$FRONTEND_MODE" = "dev" ]; then
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "FRONTEND_PID=$FRONTEND_PID" >> .mindgarden_pids
    fi
    if [ ! -z "$TRINITY_PID" ]; then
        echo "TRINITY_PID=$TRINITY_PID" >> .mindgarden_pids
    fi
    if [ ! -z "$OPS_PID" ]; then
        echo "OPS_PID=$OPS_PID" >> .mindgarden_pids
    fi
fi

echo
echo -e "${GREEN}🚀 MindGarden 시스템이 성공적으로 실행되었습니다!${NC}"
echo -e "${BLUE}💡 개발을 시작하세요! Happy Coding! 💻${NC}"
