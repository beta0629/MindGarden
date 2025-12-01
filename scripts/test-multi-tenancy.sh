#!/bin/bash

# 멀티 테넌시 시스템 로컬 테스트 스크립트
# 사용법: ./scripts/test-multi-tenancy.sh

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
echo "=========================================="
echo "  🧪 멀티 테넌시 시스템 로컬 테스트"
echo "=========================================="
echo -e "${NC}"

# 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
PROJECT_ROOT=$(pwd)

echo -e "${CYAN}📂 프로젝트 루트: ${PROJECT_ROOT}${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p logs/test-results

# 현재 시간
TEST_START_TIME=$(date "+%Y-%m-%d %H:%M:%S")
TEST_LOG="logs/test-results/test-$(date "+%Y%m%d-%H%M%S").log"

echo -e "${CYAN}📝 테스트 로그: ${TEST_LOG}${NC}"
echo ""

# 로그 파일 초기화
cat > "$TEST_LOG" << EOF
========================================
멀티 테넌시 시스템 테스트 로그
========================================
시작 시간: $TEST_START_TIME
프로젝트: CoreSolution
브랜치: $(git branch --show-current)
커밋: $(git log --oneline -1)
========================================

EOF

# ===============================================
# 1단계: 환경 확인
# ===============================================
echo -e "${YELLOW}📊 1단계: 환경 확인${NC}"
echo "1단계: 환경 확인" >> "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TEST_LOG"

# Git 상태 확인
echo -e "${BLUE}   1-1. Git 상태 확인...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "   브랜치: $CURRENT_BRANCH"
echo "Git 브랜치: $CURRENT_BRANCH" >> "$TEST_LOG"

if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${YELLOW}   ⚠️  경고: develop 브랜치가 아닙니다.${NC}"
    echo "경고: develop 브랜치가 아닙니다." >> "$TEST_LOG"
fi

# 변경된 파일 확인
CHANGED_FILES=$(git status --short | wc -l | tr -d ' ')
echo "   변경된 파일: $CHANGED_FILES"
echo "변경된 파일: $CHANGED_FILES" >> "$TEST_LOG"

# Java 버전 확인
echo -e "${BLUE}   1-2. Java 버전 확인...${NC}"
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "   ✅ $JAVA_VERSION"
    echo "Java: $JAVA_VERSION" >> "$TEST_LOG"
else
    echo -e "${RED}   ❌ Java가 설치되지 않았습니다!${NC}"
    echo "ERROR: Java가 설치되지 않았습니다." >> "$TEST_LOG"
    exit 1
fi

# Maven 버전 확인
echo -e "${BLUE}   1-3. Maven 버전 확인...${NC}"
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -version | head -n 1)
    echo "   ✅ $MVN_VERSION"
    echo "Maven: $MVN_VERSION" >> "$TEST_LOG"
else
    echo -e "${RED}   ❌ Maven이 설치되지 않았습니다!${NC}"
    echo "ERROR: Maven이 설치되지 않았습니다." >> "$TEST_LOG"
    exit 1
fi

echo -e "${GREEN}✅ 1단계 완료: 환경 확인${NC}"
echo ""
echo "1단계 완료" >> "$TEST_LOG"
echo "" >> "$TEST_LOG"

# ===============================================
# 2단계: 컴파일 확인
# ===============================================
echo -e "${YELLOW}🏗️ 2단계: 컴파일 확인${NC}"
echo "2단계: 컴파일 확인" >> "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TEST_LOG"

echo -e "${BLUE}   컴파일 중... (시간이 걸릴 수 있습니다)${NC}"
if mvn clean compile -DskipTests -q >> "$TEST_LOG" 2>&1; then
    echo -e "${GREEN}   ✅ 컴파일 성공!${NC}"
    echo "컴파일: 성공" >> "$TEST_LOG"
else
    echo -e "${RED}   ❌ 컴파일 실패!${NC}"
    echo "컴파일: 실패" >> "$TEST_LOG"
    echo -e "${YELLOW}   로그 확인: $TEST_LOG${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 2단계 완료: 컴파일 성공${NC}"
echo ""
echo "2단계 완료" >> "$TEST_LOG"
echo "" >> "$TEST_LOG"

# ===============================================
# 3단계: 테스트 파일 확인
# ===============================================
echo -e "${YELLOW}📂 3단계: 테스트 파일 확인${NC}"
echo "3단계: 테스트 파일 확인" >> "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TEST_LOG"

TEST_FILES=(
    "src/test/java/com/coresolution/core/context/AsyncContextPropagationTest.java"
    "src/test/java/com/coresolution/core/context/SuperAdminBypassTest.java"
)

for TEST_FILE in "${TEST_FILES[@]}"; do
    if [ -f "$TEST_FILE" ]; then
        echo -e "${GREEN}   ✅ $(basename $TEST_FILE)${NC}"
        echo "발견: $(basename $TEST_FILE)" >> "$TEST_LOG"
    else
        echo -e "${RED}   ❌ $(basename $TEST_FILE) - 파일 없음${NC}"
        echo "ERROR: $(basename $TEST_FILE) - 파일 없음" >> "$TEST_LOG"
    fi
done

echo -e "${GREEN}✅ 3단계 완료: 테스트 파일 확인${NC}"
echo ""
echo "3단계 완료" >> "$TEST_LOG"
echo "" >> "$TEST_LOG"

# ===============================================
# 4단계: 자동화 테스트 실행
# ===============================================
echo -e "${YELLOW}🧪 4단계: 자동화 테스트 실행${NC}"
echo "4단계: 자동화 테스트 실행" >> "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TEST_LOG"

# 테스트 결과 변수
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 4-1. AsyncContextPropagationTest
echo -e "${BLUE}   4-1. AsyncContextPropagationTest 실행...${NC}"
echo "4-1. AsyncContextPropagationTest" >> "$TEST_LOG"

if mvn test -Dtest=AsyncContextPropagationTest >> "$TEST_LOG" 2>&1; then
    # 테스트 결과 파싱
    TEST_RESULT=$(grep -E "Tests run:" "$TEST_LOG" | tail -1)
    echo -e "${GREEN}   ✅ AsyncContextPropagationTest 성공${NC}"
    echo "   결과: $TEST_RESULT"
    echo "AsyncContextPropagationTest: 성공" >> "$TEST_LOG"
    echo "$TEST_RESULT" >> "$TEST_LOG"
    
    # 성공한 테스트 수 추가
    PASSED=$(echo "$TEST_RESULT" | grep -oP 'Tests run: \K\d+' || echo "0")
    TOTAL_TESTS=$((TOTAL_TESTS + PASSED))
    PASSED_TESTS=$((PASSED_TESTS + PASSED))
else
    echo -e "${RED}   ❌ AsyncContextPropagationTest 실패${NC}"
    echo "AsyncContextPropagationTest: 실패" >> "$TEST_LOG"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# 4-2. SuperAdminBypassTest
echo -e "${BLUE}   4-2. SuperAdminBypassTest 실행...${NC}"
echo "4-2. SuperAdminBypassTest" >> "$TEST_LOG"

if mvn test -Dtest=SuperAdminBypassTest >> "$TEST_LOG" 2>&1; then
    # 테스트 결과 파싱
    TEST_RESULT=$(grep -E "Tests run:" "$TEST_LOG" | tail -1)
    echo -e "${GREEN}   ✅ SuperAdminBypassTest 성공${NC}"
    echo "   결과: $TEST_RESULT"
    echo "SuperAdminBypassTest: 성공" >> "$TEST_LOG"
    echo "$TEST_RESULT" >> "$TEST_LOG"
    
    # 성공한 테스트 수 추가
    PASSED=$(echo "$TEST_RESULT" | grep -oP 'Tests run: \K\d+' || echo "0")
    TOTAL_TESTS=$((TOTAL_TESTS + PASSED))
    PASSED_TESTS=$((PASSED_TESTS + PASSED))
else
    echo -e "${RED}   ❌ SuperAdminBypassTest 실패${NC}"
    echo "SuperAdminBypassTest: 실패" >> "$TEST_LOG"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

echo -e "${GREEN}✅ 4단계 완료: 자동화 테스트 실행${NC}"
echo ""
echo "4단계 완료" >> "$TEST_LOG"
echo "" >> "$TEST_LOG"

# ===============================================
# 5단계: 테스트 결과 요약
# ===============================================
echo -e "${YELLOW}📊 5단계: 테스트 결과 요약${NC}"
echo "5단계: 테스트 결과 요약" >> "$TEST_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$TEST_LOG"

TEST_END_TIME=$(date "+%Y-%m-%d %H:%M:%S")

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  📊 테스트 결과 요약${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${BLUE}시작 시간:${NC} $TEST_START_TIME"
echo -e "${BLUE}종료 시간:${NC} $TEST_END_TIME"
echo ""
echo -e "${BLUE}총 테스트:${NC} $TOTAL_TESTS"
echo -e "${GREEN}성공:${NC} $PASSED_TESTS"
echo -e "${RED}실패:${NC} $FAILED_TESTS"
echo ""

# 로그에 기록
cat >> "$TEST_LOG" << EOF

========================================
테스트 결과 요약
========================================
시작 시간: $TEST_START_TIME
종료 시간: $TEST_END_TIME

총 테스트: $TOTAL_TESTS
성공: $PASSED_TESTS
실패: $FAILED_TESTS
========================================

EOF

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    echo "결과: 모든 테스트 통과" >> "$TEST_LOG"
    echo ""
    echo -e "${CYAN}다음 단계:${NC}"
    echo -e "${BLUE}   1. 브라우저 테스트 진행${NC}"
    echo -e "${BLUE}   2. 서버 시작: ./start-local.sh${NC}"
    echo -e "${BLUE}   3. http://localhost:3000 접속${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 일부 테스트 실패${NC}"
    echo "결과: 일부 테스트 실패" >> "$TEST_LOG"
    echo ""
    echo -e "${YELLOW}상세 로그 확인:${NC}"
    echo -e "${BLUE}   cat $TEST_LOG${NC}"
    echo ""
    exit 1
fi

