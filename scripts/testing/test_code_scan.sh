#!/bin/bash

# 코드 스캔을 통한 표준화 검증 스크립트
# 로컬에서 실행 가능한 정적 검증

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

log_section "표준화 작업 코드 스캔 검증"

# 테스트 결과
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# ============================================
# 테스트 1: Service 계층에서 branchCode 사용 확인
# ============================================
log_section "테스트 1: Service 계층 branchCode 사용 확인"

BRANCH_CODE_FILES=$(grep -r "branchCode\|branch_code" src/main/java/com/coresolution/consultation/service/impl --include="*.java" 2>/dev/null | wc -l || echo "0")

if [ "$BRANCH_CODE_FILES" -eq 0 ]; then
    log_info "✅ Service 계층에서 branchCode 사용 없음"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    log_warn "⚠️  Service 계층에서 branchCode 사용 발견: $BRANCH_CODE_FILES개 파일"
    WARN_COUNT=$((WARN_COUNT + 1))
    grep -r "branchCode\|branch_code" src/main/java/com/coresolution/consultation/service/impl --include="*.java" 2>/dev/null | head -10
fi

# ============================================
# 테스트 2: Repository에서 branchCode 사용 확인
# ============================================
log_section "테스트 2: Repository 계층 branchCode 사용 확인"

REPO_BRANCH_CODE=$(grep -r "findByBranchCode\|findBy.*BranchCode" src/main/java/com/coresolution/consultation/repository --include="*.java" 2>/dev/null | wc -l || echo "0")

if [ "$REPO_BRANCH_CODE" -eq 0 ]; then
    log_info "✅ Repository 계층에서 branchCode 사용 없음"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    log_warn "⚠️  Repository 계층에서 branchCode 사용 발견: $REPO_BRANCH_CODE개"
    WARN_COUNT=$((WARN_COUNT + 1))
    grep -r "findByBranchCode\|findBy.*BranchCode" src/main/java/com/coresolution/consultation/repository --include="*.java" 2>/dev/null | head -10
fi

# ============================================
# 테스트 3: API 경로 표준화 확인
# ============================================
log_section "테스트 3: API 경로 표준화 확인"

# /api/v1/로 시작하지 않는 경로 찾기
NON_STANDARD_API=$(grep -r "@RequestMapping\|@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping" src/main/java/com/coresolution/consultation/controller --include="*.java" 2>/dev/null | grep -v "/api/v1/" | grep -v "value.*=.*\"/api/v1/" | wc -l || echo "0")

if [ "$NON_STANDARD_API" -eq 0 ]; then
    log_info "✅ 모든 API 경로가 /api/v1/로 시작"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    log_error "❌ 비표준 API 경로 발견: $NON_STANDARD_API개"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    grep -r "@RequestMapping\|@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping" src/main/java/com/coresolution/consultation/controller --include="*.java" 2>/dev/null | grep -v "/api/v1/" | grep -v "value.*=.*\"/api/v1/" | head -10
fi

# ============================================
# 테스트 4: 역할 하드코딩 확인
# ============================================
log_section "테스트 4: 역할 하드코딩 확인"

# UserRole enum 사용 확인
ROLE_HARDCODED=$(grep -r "\"ADMIN\"\|\"CONSULTANT\"\|\"CLIENT\"" src/main/java/com/coresolution/consultation/service --include="*.java" 2>/dev/null | grep -v "UserRole\|//\|import\|@Deprecated" | wc -l || echo "0")

if [ "$ROLE_HARDCODED" -eq 0 ]; then
    log_info "✅ Service 계층에서 역할 하드코딩 없음"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    log_warn "⚠️  Service 계층에서 역할 하드코딩 발견: $ROLE_HARDCODED개"
    WARN_COUNT=$((WARN_COUNT + 1))
    grep -r "\"ADMIN\"\|\"CONSULTANT\"\|\"CLIENT\"" src/main/java/com/coresolution/consultation/service --include="*.java" 2>/dev/null | grep -v "UserRole\|//\|import\|@Deprecated" | head -10
fi

# ============================================
# 테스트 결과 요약
# ============================================
log_section "테스트 결과 요약"

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
PASS_RATE=0
if [ "$TOTAL" -gt 0 ]; then
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL))
fi

echo "통과: $PASS_COUNT"
echo "실패: $FAIL_COUNT"
echo "경고: $WARN_COUNT"
echo "전체: $TOTAL"
echo "통과률: ${PASS_RATE}%"

if [ "$FAIL_COUNT" -gt 0 ]; then
    log_error "Critical 오류 발견! 표준화 작업을 다시 확인하세요."
    exit 1
elif [ "$WARN_COUNT" -gt 0 ]; then
    log_warn "경고가 있습니다. 점진적으로 수정하세요."
    exit 0
else
    log_info "모든 검증 통과!"
    exit 0
fi

