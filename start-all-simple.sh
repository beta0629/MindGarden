#!/bin/bash

# MindGarden 간단한 서버 시작 스크립트
# 사용법: ./start-all-simple.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "=================================================="
echo "    🚀 MindGarden 간단 시작 스크립트 🚀"
echo "=================================================="
echo -e "${NC}"

# 프로젝트 루트로 이동
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# 로그 디렉토리 생성
mkdir -p logs

# ===============================================
# 1단계: 기존 프로세스 및 포트 종료
# ===============================================
echo -e "${YELLOW}🛑 1단계: 기존 프로세스 및 포트 종료${NC}"

# 백엔드 프로세스 종료
echo -e "${YELLOW}   백엔드 프로세스 종료...${NC}"
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "consultation-management-system" 2>/dev/null || true
pkill -f "ConsultationManagementApplication" 2>/dev/null || true
pkill -f "OpsPortalApplication" 2>/dev/null || true
pkill -f "gradlew.*bootRun" 2>/dev/null || true

# 프론트엔드 프로세스 종료
echo -e "${YELLOW}   프론트엔드 프로세스 종료...${NC}"
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node.*start" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true

# 포트 종료 (백엔드)
echo -e "${YELLOW}   백엔드 포트 종료 (8080, 8081)...${NC}"
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# 포트 종료 (프론트엔드)
echo -e "${YELLOW}   프론트엔드 포트 종료 (3000, 3001, 4300)...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4300 | xargs kill -9 2>/dev/null || true

# 포트 정리 대기
echo -e "${YELLOW}   포트 정리 대기 중...${NC}"
sleep 3

# 포트 정리 확인
echo -e "${YELLOW}   포트 정리 확인...${NC}"
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${RED}   ⚠️  포트 8080이 아직 사용 중입니다. 강제 종료 시도...${NC}"
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:8081 > /dev/null 2>&1; then
    echo -e "${RED}   ⚠️  포트 8081이 아직 사용 중입니다. 강제 종료 시도...${NC}"
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${RED}   ⚠️  포트 3000이 아직 사용 중입니다. 강제 종료 시도...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✅ 1단계 완료: 기존 프로세스 및 포트 종료됨${NC}"
echo

# ===============================================
# 2단계: 환경 변수 설정
# ===============================================
echo -e "${YELLOW}🔧 2단계: 환경 변수 설정${NC}"

export DB_HOST=114.202.247.246
export DB_PORT=3306
export DB_NAME=core_solution
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD='MindGardenDev2025!@#'
export SERVER_PORT=8080

echo -e "${BLUE}   DB_HOST: ${DB_HOST}${NC}"
echo -e "${BLUE}   DB_USERNAME: ${DB_USERNAME}${NC}"
echo -e "${BLUE}   SERVER_PORT: ${SERVER_PORT}${NC}"
echo -e "${GREEN}✅ 2단계 완료: 환경 변수 설정됨${NC}"
echo

# ===============================================
# 3단계: 백엔드 시작
# ===============================================
echo -e "${YELLOW}🔨 3단계: 백엔드 시작${NC}"

echo -e "${YELLOW}   Maven 빌드 시작...${NC}"
mvn clean package -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ 백엔드 빌드 성공!${NC}"
else
    echo -e "${RED}   ❌ 백엔드 빌드 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   백엔드 서버 시작...${NC}"
nohup mvn spring-boot:run -Dspring.profiles.active=dev > logs/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}   ✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}✅ 3단계 완료: 백엔드 실행됨${NC}"
echo

# ===============================================
# 4단계: 프론트엔드 시작
# ===============================================
echo -e "${YELLOW}⚛️  4단계: 프론트엔드 시작${NC}"

cd frontend

echo -e "${YELLOW}   npm 의존성 설치...${NC}"
npm install > ../logs/frontend-install.log 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
else
    echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
    exit 1
fi

echo -e "${YELLOW}   프론트엔드 개발 서버 시작 (포트 3000)...${NC}"
PORT=3000 npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}   ✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)${NC}"

cd ..
echo -e "${GREEN}✅ 4단계 완료: 프론트엔드 실행됨${NC}"
echo

# ===============================================
# 4-2단계: Trinity 프론트엔드 시작
# ===============================================
echo -e "${YELLOW}🏠 4-2단계: Trinity 프론트엔드 시작${NC}"

cd frontend-trinity

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   npm 의존성 설치...${NC}"
    npm install > ../logs/trinity-install.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
    else
        echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/trinity-install.log${NC}"
        cd ..
        echo -e "${YELLOW}   ⚠️  Trinity 프론트엔드 시작을 건너뜁니다.${NC}"
        TRINITY_STARTED=false
    fi
else
    echo -e "${GREEN}   ✅ node_modules 확인됨${NC}"
    TRINITY_STARTED=true
fi

if [ "$TRINITY_STARTED" != "false" ]; then
    # .env.local 파일 확인
    if [ ! -f ".env.local" ]; then
        if [ -f "env.local.example" ]; then
            echo -e "${YELLOW}   .env.local 파일 생성 중...${NC}"
            cp env.local.example .env.local
            echo -e "${GREEN}   ✅ .env.local 파일 생성됨${NC}"
        fi
    fi

    echo -e "${YELLOW}   Trinity 개발 서버 시작 (포트 3001)...${NC}"
    npm run dev > ../logs/trinity.log 2>&1 &
    TRINITY_PID=$!
    
    echo -e "${GREEN}   ✅ Trinity 서버 시작됨 (PID: $TRINITY_PID, 포트: 3001)${NC}"
    echo "TRINITY_PID=$TRINITY_PID" >> ../.mindgarden_pids
else
    TRINITY_PID=""
fi

cd ..
echo -e "${GREEN}✅ 4-2단계 완료: Trinity 프론트엔드 실행${NC}"
echo

# ===============================================
# 4-3단계: Ops Portal 백엔드 시작
# ===============================================
echo -e "${YELLOW}🔧 4-3단계: Ops Portal 백엔드 시작${NC}"

if [ -d "backend-ops" ]; then
    cd backend-ops
    
    # Gradle Wrapper 확인
    if [ ! -f "./gradlew" ]; then
        echo -e "${YELLOW}   ⚠️  gradlew를 찾을 수 없습니다. Ops 백엔드를 건너뜁니다.${NC}"
        OPS_BACKEND_STARTED=false
    else
        chmod +x gradlew
        
        # .env.local 파일 확인
        if [ ! -f ".env.local" ]; then
            if [ -f "env.local.example" ]; then
                echo -e "${YELLOW}   .env.local 파일 생성 중...${NC}"
                cp env.local.example .env.local
                echo -e "${GREEN}   ✅ .env.local 파일 생성됨${NC}"
            fi
        fi
        
        echo -e "${YELLOW}   Ops Portal 백엔드 시작 (포트 8081)...${NC}"
        # 로컬 개발 환경: local 프로파일 사용 (포트 8081, CoreSolution 8080과 분리)
        SERVER_PORT=8081 ./gradlew bootRun --args="--spring.profiles.active=local" > ../logs/ops-backend.log 2>&1 &
        OPS_BACKEND_PID=$!
        
        echo -e "${GREEN}   ✅ Ops Portal 백엔드 시작됨 (PID: $OPS_BACKEND_PID, 포트: 8081)${NC}"
        echo "OPS_BACKEND_PID=$OPS_BACKEND_PID" >> ../.mindgarden_pids
        OPS_BACKEND_STARTED=true
    fi
    
    cd ..
else
    echo -e "${YELLOW}   ⚠️  backend-ops 디렉토리를 찾을 수 없습니다. Ops 백엔드를 건너뜁니다.${NC}"
    OPS_BACKEND_STARTED=false
    OPS_BACKEND_PID=""
fi

echo -e "${GREEN}✅ 4-3단계 완료: Ops Portal 백엔드 실행${NC}"
echo

# ===============================================
# 4-4단계: Ops Portal 프론트엔드 시작
# ===============================================
echo -e "${YELLOW}🔧 4-4단계: Ops Portal 프론트엔드 시작${NC}"

cd frontend-ops

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   npm 의존성 설치...${NC}"
    npm install > ../logs/ops-install.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✅ npm 의존성 설치 성공!${NC}"
    else
        echo -e "${RED}   ❌ npm 의존성 설치 실패!${NC}"
        echo -e "${YELLOW}   💡 로그 확인: tail -f logs/ops-install.log${NC}"
        cd ..
        echo -e "${YELLOW}   ⚠️  Ops Portal 프론트엔드 시작을 건너뜁니다.${NC}"
        OPS_STARTED=false
    fi
else
    echo -e "${GREEN}   ✅ node_modules 확인됨${NC}"
    OPS_STARTED=true
fi

if [ "$OPS_STARTED" != "false" ]; then
    # .env.local 파일 확인
    if [ ! -f ".env.local" ]; then
        if [ -f "env.local.example" ]; then
            echo -e "${YELLOW}   .env.local 파일 생성 중...${NC}"
            cp env.local.example .env.local
            echo -e "${GREEN}   ✅ .env.local 파일 생성됨${NC}"
        fi
    fi

    echo -e "${YELLOW}   Ops Portal 개발 서버 시작 (포트 4300)...${NC}"
    npm run dev > ../logs/ops.log 2>&1 &
    OPS_PID=$!
    
    echo -e "${GREEN}   ✅ Ops Portal 서버 시작됨 (PID: $OPS_PID, 포트: 4300)${NC}"
    echo "OPS_PID=$OPS_PID" >> ../.mindgarden_pids
else
    OPS_PID=""
fi

cd ..
echo -e "${GREEN}✅ 4-3단계 완료: Ops Portal 프론트엔드 실행${NC}"
echo

# ===============================================
# 5단계: 헬스체크
# ===============================================
echo -e "${YELLOW}🔍 5단계: 서버 헬스체크${NC}"

echo -e "${YELLOW}   백엔드 서버 헬스체크 (최대 60초 대기)...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 백엔드 서버 정상 작동!${NC}"
        BACKEND_OK=true
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}   ⚠️  백엔드 서버 헬스체크 타임아웃 (계속 진행)${NC}"
        BACKEND_OK=false
    fi
    echo -n "."
    sleep 2
done

echo -e "${YELLOW}   프론트엔드 서버 헬스체크 (최대 60초 대기)...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 프론트엔드 서버 정상 작동!${NC}"
        FRONTEND_OK=true
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}   ⚠️  프론트엔드 서버 헬스체크 타임아웃 (계속 진행)${NC}"
        FRONTEND_OK=false
    fi
    echo -n "."
    sleep 2
done

if [ -n "$TRINITY_PID" ]; then
    echo -e "${YELLOW}   Trinity 서버 헬스체크 (최대 60초 대기)...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3001 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Trinity 서버 정상 작동!${NC}"
            TRINITY_OK=true
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}   ⚠️  Trinity 서버 헬스체크 타임아웃 (계속 진행)${NC}"
            TRINITY_OK=false
        fi
        echo -n "."
        sleep 2
    done
fi

if [ -n "$OPS_BACKEND_PID" ]; then
    echo -e "${YELLOW}   Ops Portal 백엔드 헬스체크 (최대 60초 대기)...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:8081/actuator/health > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Ops Portal 백엔드 정상 작동!${NC}"
            OPS_BACKEND_OK=true
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}   ⚠️  Ops Portal 백엔드 헬스체크 타임아웃 (계속 진행)${NC}"
            OPS_BACKEND_OK=false
        fi
        echo -n "."
        sleep 2
    done
fi

if [ -n "$OPS_PID" ]; then
    echo -e "${YELLOW}   Ops Portal 프론트엔드 서버 헬스체크 (최대 60초 대기)...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:4300 > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ Ops Portal 서버 정상 작동!${NC}"
            OPS_OK=true
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}   ⚠️  Ops Portal 서버 헬스체크 타임아웃 (계속 진행)${NC}"
            OPS_OK=false
        fi
        echo -n "."
        sleep 2
    done
fi

echo -e "${GREEN}✅ 5단계 완료: 헬스체크 완료${NC}"
echo

# ===============================================
# 6단계: 완료 정보
# ===============================================
echo -e "${PURPLE}"
echo "=================================================="
echo "    🎉 MindGarden 시스템 실행 완료! 🎉"
echo "=================================================="
echo -e "${NC}"

echo -e "${CYAN}🌐 접속 정보:${NC}"
if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}   ✅ 백엔드 API: http://localhost:8080${NC}"
    echo -e "${BLUE}   📊 Actuator: http://localhost:8080/actuator/health${NC}"
else
    echo -e "${YELLOW}   ⚠️  백엔드 API: http://localhost:8080 (시작 중...)${NC}"
fi

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}   ✅ 프론트엔드: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}   ⚠️  프론트엔드: http://localhost:3000 (시작 중...)${NC}"
fi

if [ -n "$TRINITY_PID" ]; then
    if [ "$TRINITY_OK" = true ]; then
        echo -e "${GREEN}   ✅ Trinity (온보딩): http://localhost:3001${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Trinity (온보딩): http://localhost:3001 (시작 중...)${NC}"
    fi
fi

if [ -n "$OPS_BACKEND_PID" ]; then
    if [ "$OPS_BACKEND_OK" = true ]; then
        echo -e "${GREEN}   ✅ Ops Portal 백엔드 API: http://localhost:8081${NC}"
        echo -e "${BLUE}   📊 Ops Actuator: http://localhost:8081/actuator/health${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Ops Portal 백엔드 API: http://localhost:8081 (시작 중...)${NC}"
    fi
fi

if [ -n "$OPS_PID" ]; then
    if [ "$OPS_OK" = true ]; then
        echo -e "${GREEN}   ✅ Ops Portal (관리): http://localhost:4300${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Ops Portal (관리): http://localhost:4300 (시작 중...)${NC}"
    fi
fi

echo
echo -e "${CYAN}📋 로그 파일:${NC}"
echo -e "${BLUE}   - 백엔드: logs/backend.log${NC}"
echo -e "${BLUE}   - 프론트엔드: logs/frontend.log${NC}"
if [ -n "$TRINITY_PID" ]; then
    echo -e "${BLUE}   - Trinity: logs/trinity.log${NC}"
fi
if [ -n "$OPS_BACKEND_PID" ]; then
    echo -e "${BLUE}   - Ops Portal 백엔드: logs/ops-backend.log${NC}"
fi
if [ -n "$OPS_PID" ]; then
    echo -e "${BLUE}   - Ops Portal 프론트엔드: logs/ops.log${NC}"
fi

echo
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   - 백엔드: pkill -f 'spring-boot:run'${NC}"
echo -e "${YELLOW}   - 프론트엔드: lsof -ti:3000 | xargs kill${NC}"
if [ -n "$TRINITY_PID" ]; then
    echo -e "${YELLOW}   - Trinity: lsof -ti:3001 | xargs kill${NC}"
fi
if [ -n "$OPS_BACKEND_PID" ]; then
    echo -e "${YELLOW}   - Ops Portal 백엔드: lsof -ti:8081 | xargs kill${NC}"
fi
if [ -n "$OPS_PID" ]; then
    echo -e "${YELLOW}   - Ops Portal 프론트엔드: lsof -ti:4300 | xargs kill${NC}"
fi
echo -e "${YELLOW}   - 또는 Ctrl+C${NC}"

# 프로세스 정보 저장
echo "BACKEND_PID=$BACKEND_PID" > .mindgarden_pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .mindgarden_pids
if [ -n "$TRINITY_PID" ]; then
    echo "TRINITY_PID=$TRINITY_PID" >> .mindgarden_pids
fi
if [ -n "$OPS_BACKEND_PID" ]; then
    echo "OPS_BACKEND_PID=$OPS_BACKEND_PID" >> .mindgarden_pids
fi
if [ -n "$OPS_PID" ]; then
    echo "OPS_PID=$OPS_PID" >> .mindgarden_pids
fi

echo
echo -e "${GREEN}🚀 MindGarden 시스템이 시작되었습니다!${NC}"
echo -e "${BLUE}💡 개발을 시작하세요! Happy Coding! 💻${NC}"
