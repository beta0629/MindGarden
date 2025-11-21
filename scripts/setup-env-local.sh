#!/bin/bash

# 환경 변수 파일 자동 생성 스크립트
# 사용법: ./scripts/setup-env-local.sh
# 
# 이 스크립트는 프로젝트 루트와 frontend-trinity 디렉토리의
# .env.local 파일이 없을 때만 env.local.example에서 생성합니다.
# 기존 파일은 절대 덮어쓰지 않습니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================"
echo "   환경 변수 파일 설정 🔧"
echo "======================================"
echo -e "${NC}"

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo -e "${BLUE}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"
echo ""

# ============================================
# 1. 프로젝트 루트 .env.local 파일 생성
# ============================================
echo -e "${YELLOW}[1/2] 프로젝트 루트 환경 변수 파일 확인...${NC}"
if [ ! -f ".env.local" ]; then
    if [ -f "env.local.example" ]; then
        echo -e "${YELLOW}   .env.local 파일이 없습니다. env.local.example에서 생성합니다...${NC}"
        cp env.local.example .env.local
        echo -e "${GREEN}   ✅ .env.local 파일이 생성되었습니다.${NC}"
        echo -e "${YELLOW}   💡 필요시 .env.local 파일을 수정하세요.${NC}"
    else
        echo -e "${RED}   ⚠️  env.local.example 파일을 찾을 수 없습니다.${NC}"
    fi
else
    echo -e "${GREEN}   ✅ .env.local 파일이 이미 존재합니다. (기존 파일 유지)${NC}"
fi
echo ""

# ============================================
# 2. Trinity 프론트엔드 .env.local 파일 생성
# ============================================
TRINITY_DIR="${PROJECT_ROOT}/frontend-trinity"
if [ -d "$TRINITY_DIR" ]; then
    echo -e "${YELLOW}[2/2] Trinity 프론트엔드 환경 변수 파일 확인...${NC}"
    cd "$TRINITY_DIR"
    
    if [ ! -f ".env.local" ]; then
        if [ -f "env.local.example" ]; then
            echo -e "${YELLOW}   .env.local 파일이 없습니다. env.local.example에서 생성합니다...${NC}"
            cp env.local.example .env.local
            echo -e "${GREEN}   ✅ .env.local 파일이 생성되었습니다.${NC}"
            echo -e "${YELLOW}   💡 필요시 .env.local 파일을 수정하세요.${NC}"
        else
            echo -e "${RED}   ⚠️  env.local.example 파일을 찾을 수 없습니다.${NC}"
        fi
    else
        echo -e "${GREEN}   ✅ .env.local 파일이 이미 존재합니다. (기존 파일 유지)${NC}"
    fi
else
    echo -e "${YELLOW}[2/2] Trinity 프론트엔드 디렉토리를 찾을 수 없습니다. 건너뜁니다.${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "   환경 변수 파일 설정 완료! ✅"
echo "======================================"
echo -e "${NC}"
echo -e "${BLUE}📌 중요 사항:${NC}"
echo -e "   • .env.local 파일은 .gitignore에 포함되어 Git에 커밋되지 않습니다"
echo -e "   • 로컬 개발 환경에서는 이 파일이 계속 유지됩니다"
echo -e "   • 프로젝트를 새로 클론한 경우 이 스크립트를 다시 실행하세요"
echo -e "   • 기존 .env.local 파일은 절대 덮어쓰지 않습니다"
echo ""

