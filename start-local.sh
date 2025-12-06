#!/bin/bash

# MindGarden 로컬 개발 서버 시작 스크립트 (Bash)
# 백엔드와 프론트엔드를 백그라운드로 실행하고 로그를 파일로 저장
# 사용법: ./start-local.sh

set -e

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
PROJECT_ROOT=$(pwd)

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  MindGarden 로컬 개발 서버 시작${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p logs

# 환경 변수 로드 (있으면)
if [ -f "scripts/development/utilities/load-env.sh" ]; then
    echo -e "${YELLOW}🔑 환경 변수 로드 중...${NC}"
    source scripts/development/utilities/load-env.sh
    echo ""
fi

# 기존 프로세스 종료
echo -e "${YELLOW}🧹 기존 프로세스 정리 중...${NC}"

# 포트 8080 사용 중인 프로세스 먼저 종료 (가장 중요)
echo -e "${BLUE}   포트 8080 정리 중 (최우선)...${NC}"
if command -v lsof >/dev/null 2>&1; then
    # macOS/Linux
    PIDS_8080=$(lsof -ti:8080 2>/dev/null || true)
    if [ ! -z "$PIDS_8080" ]; then
        echo "$PIDS_8080" | while read pid; do
            echo -e "${BLUE}   포트 8080 사용 프로세스 종료: PID $pid${NC}"
            kill $pid 2>/dev/null || true
            sleep 1
            kill -9 $pid 2>/dev/null || true
        done
    fi
elif command -v netstat >/dev/null 2>&1; then
    # Windows (Git Bash)
    PIDS_8080=$(netstat -ano 2>/dev/null | findstr ":8080" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$PIDS_8080" ]; then
        echo -e "${BLUE}   8080 포트 사용 중인 프로세스: $PIDS_8080${NC}"
        for pid in $PIDS_8080; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                echo -e "${BLUE}   PID $pid 종료 중...${NC}"
                taskkill //F //PID $pid 2>/dev/null || true
                sleep 1
            fi
        done
    fi
fi

# Spring Boot 프로세스 강제 종료
echo -e "${BLUE}   Spring Boot 프로세스 정리 중...${NC}"
if command -v pkill >/dev/null 2>&1; then
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "ConsultationManagementApplication" 2>/dev/null || true
    pkill -f "mvn.*spring-boot" 2>/dev/null || true
elif command -v taskkill >/dev/null 2>&1; then
    # Windows
    tasklist 2>/dev/null | grep -i "java.exe" | awk '{print $2}' | while read pid; do
        if [ ! -z "$pid" ]; then
            taskkill //F //PID $pid 2>/dev/null || true
        fi
    done
fi

# 백엔드 프로세스 종료
if [ -f "logs/backend.pid" ]; then
    OLD_PID=$(cat logs/backend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   백엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/backend.pid
fi

# 프론트엔드 프로세스 종료
if [ -f "logs/frontend.pid" ]; then
    OLD_PID=$(cat logs/frontend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   프론트엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/frontend.pid
fi

# OPS Portal 프로세스 종료
if [ -f "logs/ops-backend.pid" ]; then
    OLD_PID=$(cat logs/ops-backend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   OPS 백엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/ops-backend.pid
fi

if [ -f "logs/ops-frontend.pid" ]; then
    OLD_PID=$(cat logs/ops-frontend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${BLUE}   OPS 프론트엔드 프로세스 종료: PID $OLD_PID${NC}"
        kill $OLD_PID 2>/dev/null || true
        sleep 1
    fi
    rm -f logs/ops-frontend.pid
fi

# 나머지 포트 정리 (8080은 이미 위에서 처리됨)
echo -e "${BLUE}   나머지 포트 정리 중 (8081, 3000, 3001)...${NC}"
if command -v lsof >/dev/null 2>&1; then
    # macOS/Linux
    PIDS_8081=$(lsof -ti:8081 2>/dev/null || true)
    PIDS_3000=$(lsof -ti:3000 2>/dev/null || true)
    PIDS_3001=$(lsof -ti:3001 2>/dev/null || true)
    
    if [ ! -z "$PIDS_8081" ]; then
        echo "$PIDS_8081" | while read pid; do
            kill $pid 2>/dev/null || true
            sleep 1
            kill -9 $pid 2>/dev/null || true
        done
    fi
    
    if [ ! -z "$PIDS_3000" ]; then
        echo "$PIDS_3000" | while read pid; do
            kill $pid 2>/dev/null || true
            sleep 1
            kill -9 $pid 2>/dev/null || true
        done
    fi
    
    if [ ! -z "$PIDS_3001" ]; then
        echo "$PIDS_3001" | while read pid; do
            kill $pid 2>/dev/null || true
            sleep 1
            kill -9 $pid 2>/dev/null || true
        done
    fi
elif command -v netstat >/dev/null 2>&1; then
    # Windows (Git Bash) - 8080은 이미 위에서 처리됨
    echo -e "${BLUE}   Windows 환경 감지 - 나머지 포트 정리 중...${NC}"
    
    # 8081 포트 정리
    PIDS_8081=$(netstat -ano 2>/dev/null | findstr ":8081" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$PIDS_8081" ]; then
        echo -e "${BLUE}   8081 포트 사용 중인 프로세스: $PIDS_8081${NC}"
        for pid in $PIDS_8081; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                echo -e "${BLUE}   PID $pid 종료 중...${NC}"
                taskkill //F //PID $pid 2>/dev/null || true
                sleep 1
            fi
        done
    fi
    
    # 3000 포트 정리
    PIDS_3000=$(netstat -ano 2>/dev/null | findstr ":3000" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$PIDS_3000" ]; then
        echo -e "${BLUE}   3000 포트 사용 중인 프로세스: $PIDS_3000${NC}"
        for pid in $PIDS_3000; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                echo -e "${BLUE}   PID $pid 종료 중...${NC}"
                taskkill //F //PID $pid 2>/dev/null || true
                sleep 1
            fi
        done
    fi
    
    # 3001 포트 정리
    PIDS_3001=$(netstat -ano 2>/dev/null | findstr ":3001" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$PIDS_3001" ]; then
        echo -e "${BLUE}   3001 포트 사용 중인 프로세스: $PIDS_3001${NC}"
        for pid in $PIDS_3001; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                echo -e "${BLUE}   PID $pid 종료 중...${NC}"
                taskkill //F //PID $pid 2>/dev/null || true
                sleep 1
            fi
        done
    fi
    
fi

# 포트 정리 대기
echo -e "${BLUE}   포트 정리 완료 대기 중...${NC}"
sleep 3

# 포트 8080 최종 확인
if command -v lsof >/dev/null 2>&1; then
    REMAINING_8080=$(lsof -ti:8080 2>/dev/null || true)
    if [ ! -z "$REMAINING_8080" ]; then
        echo -e "${RED}   ⚠️  포트 8080이 여전히 사용 중입니다. 강제 종료 시도...${NC}"
        echo "$REMAINING_8080" | while read pid; do
            kill -9 $pid 2>/dev/null || true
        done
        sleep 2
    fi
elif command -v netstat >/dev/null 2>&1; then
    REMAINING_8080=$(netstat -ano 2>/dev/null | findstr ":8080" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$REMAINING_8080" ]; then
        echo -e "${RED}   ⚠️  포트 8080이 여전히 사용 중입니다. 강제 종료 시도...${NC}"
        for pid in $REMAINING_8080; do
            if [ ! -z "$pid" ] && [ "$pid" != "0" ]; then
                taskkill //F //PID $pid 2>/dev/null || true
            fi
        done
        sleep 2
    fi
fi

echo -e "${GREEN}✅ 프로세스 정리 완료${NC}"
echo ""

# 포트 8080 최종 확인 (서버 시작 전)
echo -e "${YELLOW}🔍 포트 8080 최종 확인 중...${NC}"
if command -v lsof >/dev/null 2>&1; then
    FINAL_CHECK_8080=$(lsof -ti:8080 2>/dev/null || true)
    if [ ! -z "$FINAL_CHECK_8080" ]; then
        echo -e "${RED}❌ 포트 8080이 여전히 사용 중입니다. 수동으로 종료해주세요.${NC}"
        echo -e "${YELLOW}   사용 중인 PID: $FINAL_CHECK_8080${NC}"
        echo -e "${YELLOW}   종료 명령: kill -9 $FINAL_CHECK_8080${NC}"
        exit 1
    fi
elif command -v netstat >/dev/null 2>&1; then
    FINAL_CHECK_8080=$(netstat -ano 2>/dev/null | findstr ":8080" | findstr "LISTENING" | awk '{print $5}' | sort -u || true)
    if [ ! -z "$FINAL_CHECK_8080" ]; then
        echo -e "${RED}❌ 포트 8080이 여전히 사용 중입니다. 수동으로 종료해주세요.${NC}"
        echo -e "${YELLOW}   사용 중인 PID: $FINAL_CHECK_8080${NC}"
        echo -e "${YELLOW}   종료 명령: taskkill //F //PID $FINAL_CHECK_8080${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}   ✅ 포트 8080 사용 가능${NC}"
echo ""

# 백엔드 시작
echo -e "${YELLOW}🚀 백엔드 서버 시작 중...${NC}"

# 환경 변수 export (백그라운드 프로세스에 전달)
export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD

# Maven 확인
if command -v mvn >/dev/null 2>&1; then
    echo -e "${BLUE}   Maven으로 실행${NC}"
    (
        export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
        mvn spring-boot:run -Dspring.profiles.active=local > logs/backend.log 2>&1
    ) &
    BACKEND_PID=$!
elif [ -f "./mvnw" ]; then
    echo -e "${BLUE}   Maven Wrapper로 실행${NC}"
    (
        export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
        ./mvnw spring-boot:run -Dspring.profiles.active=local > logs/backend.log 2>&1
    ) &
    BACKEND_PID=$!
elif [ -f "./mvnw.cmd" ]; then
    echo -e "${BLUE}   Maven Wrapper (Windows)로 실행${NC}"
    (
        export DB_HOST DB_PORT DB_NAME DB_USERNAME DB_PASSWORD
        cmd.exe //c "cd /d $PROJECT_ROOT && mvnw.cmd spring-boot:run -Dspring.profiles.active=local" > logs/backend.log 2>&1
    ) &
    BACKEND_PID=$!
else
    echo -e "${RED}❌ Maven을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}   Maven을 설치하거나 mvnw 파일이 있는지 확인하세요.${NC}"
    exit 1
fi

echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}   ✅ 백엔드 시작됨 (PID: $BACKEND_PID)${NC}"
echo ""

# 프론트엔드 시작
echo -e "${YELLOW}⚛️  프론트엔드 서버 시작 중...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ frontend 디렉토리를 찾을 수 없습니다.${NC}"
    exit 1
fi

cd frontend

# npm install (필요시)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}   npm 의존성 설치 중...${NC}"
    npm install > ../logs/frontend-install.log 2>&1
    echo -e "${GREEN}   ✅ 의존성 설치 완료${NC}"
fi

# npm start
echo -e "${BLUE}   React 개발 서버 시작${NC}"
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

cd ..

echo $FRONTEND_PID > logs/frontend.pid
echo -e "${GREEN}   ✅ 프론트엔드 시작됨 (PID: $FRONTEND_PID)${NC}"
echo ""

# OPS Portal 백엔드 시작
echo -e "${YELLOW}🔧 OPS Portal 백엔드 시작 중...${NC}"

if [ -d "backend-ops" ]; then
    cd backend-ops
    
    # Gradle 확인
    if [ -f "./gradlew" ]; then
        echo -e "${BLUE}   Gradle Wrapper로 실행${NC}"
        chmod +x gradlew
        ./gradlew bootRun > ../logs/ops-backend.log 2>&1 &
        OPS_BACKEND_PID=$!
    elif [ -f "./gradlew.bat" ]; then
        echo -e "${BLUE}   Gradle Wrapper (Windows)로 실행${NC}"
        cmd.exe //c "cd /d $PROJECT_ROOT/backend-ops && gradlew.bat bootRun" > ../logs/ops-backend.log 2>&1 &
        OPS_BACKEND_PID=$!
    else
        echo -e "${YELLOW}⚠️  backend-ops/gradlew를 찾을 수 없습니다. OPS 백엔드를 건너뜁니다.${NC}"
        OPS_BACKEND_PID=""
    fi
    
    cd ..
    
    if [ ! -z "$OPS_BACKEND_PID" ]; then
        echo $OPS_BACKEND_PID > logs/ops-backend.pid
        echo -e "${GREEN}   ✅ OPS 백엔드 시작됨 (PID: $OPS_BACKEND_PID, 포트: 8081)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  backend-ops 디렉토리를 찾을 수 없습니다. OPS 백엔드를 건너뜁니다.${NC}"
fi
echo ""

# OPS Portal 프론트엔드 시작
echo -e "${YELLOW}🎨 OPS Portal 프론트엔드 시작 중...${NC}"

if [ -d "frontend-ops" ]; then
    cd frontend-ops
    
    # npm install (필요시)
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}   npm 의존성 설치 중...${NC}"
        npm install > ../logs/ops-frontend-install.log 2>&1
        echo -e "${GREEN}   ✅ 의존성 설치 완료${NC}"
    fi
    
    # Next.js 개발 서버 시작
    echo -e "${BLUE}   Next.js 개발 서버 시작${NC}"
    npm run dev > ../logs/ops-frontend.log 2>&1 &
    OPS_FRONTEND_PID=$!
    
    cd ..
    
    echo $OPS_FRONTEND_PID > logs/ops-frontend.pid
    echo -e "${GREEN}   ✅ OPS 프론트엔드 시작됨 (PID: $OPS_FRONTEND_PID, 포트: 3001)${NC}"
else
    echo -e "${YELLOW}⚠️  frontend-ops 디렉토리를 찾을 수 없습니다. OPS 프론트엔드를 건너뜁니다.${NC}"
fi
echo ""

# 완료 메시지
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ 서버 시작 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}🌐 접속 주소:${NC}"
echo -e "${GREEN}   메인 백엔드:     http://localhost:8080${NC}"
echo -e "${GREEN}   메인 프론트엔드:   http://localhost:3000${NC}"
if [ -f "logs/ops-backend.pid" ]; then
    echo -e "${GREEN}   OPS 백엔드:      http://localhost:8081${NC}"
fi
if [ -f "logs/ops-frontend.pid" ]; then
    echo -e "${GREEN}   OPS 프론트엔드:   http://localhost:3001${NC}"
fi
echo ""
echo -e "${CYAN}📋 로그 확인:${NC}"
echo -e "${BLUE}   메인 백엔드:     tail -f logs/backend.log${NC}"
echo -e "${BLUE}   메인 프론트엔드:   tail -f logs/frontend.log${NC}"
if [ -f "logs/ops-backend.pid" ]; then
    echo -e "${BLUE}   OPS 백엔드:      tail -f logs/ops-backend.log${NC}"
fi
if [ -f "logs/ops-frontend.pid" ]; then
    echo -e "${BLUE}   OPS 프론트엔드:   tail -f logs/ops-frontend.log${NC}"
fi
echo ""
echo -e "${CYAN}🛑 종료 방법:${NC}"
echo -e "${YELLOW}   ./stop-local.sh${NC}"
echo ""

# 서버 시작 대기 (선택적)
echo -e "${YELLOW}⏳ 서버 시작 대기 중... (5초)${NC}"
sleep 5

# 프로세스 확인
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 메인 백엔드 프로세스 실행 중${NC}"
else
    echo -e "${RED}⚠️  메인 백엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
    echo -e "${BLUE}   tail -20 logs/backend.log${NC}"
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 메인 프론트엔드 프로세스 실행 중${NC}"
else
    echo -e "${RED}⚠️  메인 프론트엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
    echo -e "${BLUE}   tail -20 logs/frontend.log${NC}"
fi

if [ -f "logs/ops-backend.pid" ]; then
    OPS_BACKEND_PID=$(cat logs/ops-backend.pid)
    if ps -p $OPS_BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OPS 백엔드 프로세스 실행 중${NC}"
    else
        echo -e "${RED}⚠️  OPS 백엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
        echo -e "${BLUE}   tail -20 logs/ops-backend.log${NC}"
    fi
fi

if [ -f "logs/ops-frontend.pid" ]; then
    OPS_FRONTEND_PID=$(cat logs/ops-frontend.pid)
    if ps -p $OPS_FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OPS 프론트엔드 프로세스 실행 중${NC}"
    else
        echo -e "${RED}⚠️  OPS 프론트엔드 프로세스가 종료되었습니다. 로그를 확인하세요:${NC}"
        echo -e "${BLUE}   tail -20 logs/ops-frontend.log${NC}"
    fi
fi

echo ""

