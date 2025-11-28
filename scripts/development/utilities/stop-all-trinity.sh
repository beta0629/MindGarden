#!/bin/bash

# 백엔드 + Trinity 홈페이지 모두 종료 스크립트
# 사용법: ./scripts/stop-all-trinity.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 모든 서버 종료 중...${NC}"

# 백엔드 종료
echo -e "${BLUE}📋 백엔드 서버 종료...${NC}"
./scripts/stop-backend.sh 2>/dev/null || true

# Trinity 종료
echo -e "${BLUE}📋 Trinity 홈페이지 종료...${NC}"
./scripts/stop-trinity.sh 2>/dev/null || true

echo -e "${GREEN}✅ 모든 서버가 종료되었습니다${NC}"

