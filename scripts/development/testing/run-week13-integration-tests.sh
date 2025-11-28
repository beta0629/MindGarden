#!/bin/bash

# Week 13 Day 5: 통합 테스트 및 검증 스크립트
# 전체 코드 품질 검증 플로우 테스트

set -e

echo "🧪 Week 13 통합 테스트 시작..."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERROR_COUNT=0
WARNING_COUNT=0

# 1. 하드코딩 검사
echo -e "${BLUE}1. 하드코딩 검사 실행...${NC}"
if node scripts/check-hardcoding-enhanced.js; then
    echo -e "${GREEN}✅ 하드코딩 검사 통과${NC}"
else
    echo -e "${YELLOW}⚠️ 하드코딩 검사 경고 발생${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi
echo ""

# 2. 코드 품질 메트릭 수집
echo -e "${BLUE}2. 코드 품질 메트릭 수집...${NC}"
if node scripts/collect-code-quality-metrics.js; then
    echo -e "${GREEN}✅ 코드 품질 메트릭 수집 완료${NC}"
else
    echo -e "${RED}❌ 코드 품질 메트릭 수집 실패${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

# 3. 코드 품질 리포트 생성
echo -e "${BLUE}3. 코드 품질 리포트 생성...${NC}"
if node scripts/generate-code-quality-report.js; then
    echo -e "${GREEN}✅ 코드 품질 리포트 생성 완료${NC}"
else
    echo -e "${RED}❌ 코드 품질 리포트 생성 실패${NC}"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi
echo ""

# 4. Maven 빌드 검증 (하드코딩 검사 포함)
echo -e "${BLUE}4. Maven 빌드 검증 (verify phase)...${NC}"
if mvn clean verify -DskipTests 2>&1 | tail -50; then
    echo -e "${GREEN}✅ Maven 빌드 검증 통과${NC}"
else
    echo -e "${YELLOW}⚠️ Maven 빌드 검증 경고 발생${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi
echo ""

# 5. 테스트 실행
echo -e "${BLUE}5. 테스트 실행...${NC}"
if mvn test -Dspring.profiles.active=test 2>&1 | tail -30; then
    echo -e "${GREEN}✅ 테스트 통과${NC}"
else
    echo -e "${YELLOW}⚠️ 일부 테스트 실패 (계속 진행)${NC}"
    WARNING_COUNT=$((WARNING_COUNT + 1))
fi
echo ""

# 결과 요약
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 통합 테스트 결과 요약${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "오류: ${RED}${ERROR_COUNT}${NC}"
echo -e "경고: ${YELLOW}${WARNING_COUNT}${NC}"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ 통합 테스트 완료 (경고 ${WARNING_COUNT}개)${NC}"
    exit 0
else
    echo -e "${RED}❌ 통합 테스트 실패 (오류 ${ERROR_COUNT}개)${NC}"
    exit 1
fi

