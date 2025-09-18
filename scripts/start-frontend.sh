#!/bin/bash

# MindGarden 프론트엔드 자동 빌드 및 실행 스크립트
# 사용법: ./scripts/start-frontend.sh [mode]
# 예시: ./scripts/start-frontend.sh dev (개발 모드)
# 예시: ./scripts/start-frontend.sh build (프로덕션 빌드)

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
echo "   MindGarden Frontend Builder ⚛️"
echo "======================================"
echo -e "${NC}"

# 모드 설정 (기본값: dev)
MODE=${1:-dev}
echo -e "${YELLOW}📋 설정된 모드: ${MODE}${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"

# frontend 디렉토리로 이동
cd frontend
echo -e "${BLUE}📂 프론트엔드 디렉토리: $(pwd)${NC}"

# 기존 프론트엔드 프로세스 종료 (포트 3000)
echo -e "${YELLOW}🔄 기존 프론트엔드 프로세스 확인 및 종료...${NC}"
if lsof -t -i:3000 > /dev/null 2>&1; then
    echo -e "${RED}⚠️  포트 3000을 사용하는 프로세스를 종료합니다...${NC}"
    lsof -t -i:3000 | xargs kill -TERM 2>/dev/null || true
    sleep 3
    echo -e "${GREEN}✅ 기존 프로세스 종료 완료${NC}"
else
    echo -e "${GREEN}✅ 포트 3000이 사용 가능합니다${NC}"
fi

# Node.js 버전 확인
echo -e "${YELLOW}📋 Node.js 버전 확인...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js 버전: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다!${NC}"
    exit 1
fi

# npm 의존성 설치
echo -e "${YELLOW}📦 npm 의존성 설치 중...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ npm 의존성 설치 성공!${NC}"
else
    echo -e "${RED}❌ npm 의존성 설치 실패!${NC}"
    exit 1
fi

# 모드에 따른 실행
if [ "$MODE" = "build" ]; then
    # 프로덕션 빌드
    echo -e "${YELLOW}🏭 프로덕션 빌드 시작...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 프론트엔드 프로덕션 빌드 성공!${NC}"
        echo -e "${BLUE}📁 빌드 파일 위치: $(pwd)/build${NC}"
        
        # 빌드 파일 크기 확인
        if [ -d "build" ]; then
            BUILD_SIZE=$(du -sh build | cut -f1)
            echo -e "${BLUE}📊 빌드 크기: ${BUILD_SIZE}${NC}"
        fi
    else
        echo -e "${RED}❌ 프론트엔드 빌드 실패!${NC}"
        exit 1
    fi
else
    # 개발 모드
    echo -e "${YELLOW}🚀 개발 서버 시작...${NC}"
    echo -e "${BLUE}🔧 개발 모드로 실행 (Hot Reload 지원)${NC}"
    
    # 백그라운드에서 실행
    npm start &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✅ 프론트엔드 개발 서버 시작됨 (PID: $FRONTEND_PID)${NC}"
    
    # 헬스체크
    echo -e "${YELLOW}🔍 서버 시작 대기 중...${NC}"
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 프론트엔드 서버가 성공적으로 시작되었습니다!${NC}"
            echo -e "${BLUE}🌐 개발 서버: http://localhost:3000${NC}"
            
            # 종료 방법 안내
            echo -e "${YELLOW}"
            echo "🛑 서버 종료 방법:"
            echo "   - Ctrl+C (현재 터미널에서)"
            echo "   - 또는: ./scripts/stop-frontend.sh"
            echo -e "${NC}"
            
            exit 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}❌ 프론트엔드 서버 시작 실패 - 헬스체크 타임아웃${NC}"
    exit 1
fi
