#!/bin/bash

# ============================================
# Week 6 연결 테스트 자동 실행 스크립트
# 연결 테스트 관련 모든 테스트를 자동으로 실행하고 리포트 생성
# ============================================

set -e  # 오류 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 변수 로드 (.env.local)
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}🔧 환경 변수 로드 중...${NC}"
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            continue
        fi
        if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
            export "${BASH_REMATCH[1]}"="${BASH_REMATCH[2]}"
        fi
    done < "$ENV_FILE"
    echo -e "${GREEN}✅ 환경 변수 로드 완료${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 기본값을 사용합니다.${NC}"
fi

# 타임스탬프
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT_DIR="test-reports/week6-connection-test/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 Week 6 연결 테스트 자동 실행 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# 0. Flyway Repair (실패한 마이그레이션 복구)
# ============================================
echo -e "${YELLOW}🔧 Flyway 마이그레이션 복구 중...${NC}"
if mvn flyway:repair -Dspring.profiles.active=test -Dcheckstyle.skip=true -Dspotbugs.skip=true > /dev/null 2>&1; then
    echo -e "${GREEN}    ✅ Flyway 복구 완료${NC}"
else
    echo -e "${YELLOW}    ⚠️  Flyway 복구 실패 (계속 진행)${NC}"
fi
echo ""

# 테스트 결과 추적
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# 테스트 실행 함수
run_test() {
    local test_name=$1
    local test_class=$2
    local log_file="${TEST_REPORT_DIR}/${test_name}.log"
    
    echo -e "${BLUE}  → ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if mvn test -Dtest="${test_class}" -Dspring.profiles.active=test -Dcheckstyle.skip=true -Dspotbugs.skip=true > "${log_file}" 2>&1; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ ${test_name}")
        echo -e "${GREEN}    ✅ 통과${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ ${test_name}")
        echo -e "${RED}    ❌ 실패 (로그: ${log_file})${NC}"
    fi
}

# ============================================
# 1. 연결 테스트 컨트롤러 통합 테스트
# ============================================
echo -e "${YELLOW}📦 연결 테스트 컨트롤러 통합 테스트 실행 중...${NC}"

run_test "tenant-pg-config-controller" "TenantPgConfigurationControllerIntegrationTest"
run_test "ops-pg-config-controller" "TenantPgConfigurationOpsControllerIntegrationTest"

# ============================================
# 2. 연결 테스트 서비스 통합 테스트
# ============================================
echo -e "${YELLOW}📦 연결 테스트 서비스 통합 테스트 실행 중...${NC}"

run_test "connection-test-service" "ConnectionTestServiceIntegrationTest"

# ============================================
# 3. PG 설정 서비스 통합 테스트 (연결 테스트 포함)
# ============================================
echo -e "${YELLOW}📦 PG 설정 서비스 통합 테스트 실행 중...${NC}"

run_test "tenant-pg-config-service" "TenantPgConfigurationServiceIntegrationTest" || echo -e "${YELLOW}    ⚠️  테스트 클래스가 없습니다.${NC}"

# ============================================
# 4. 에러 처리 테스트
# ============================================
echo -e "${YELLOW}📦 에러 처리 테스트 실행 중...${NC}"

# GlobalExceptionHandler 테스트가 있다면 실행
if grep -r "GlobalExceptionHandler" src/test --include="*Test.java" > /dev/null 2>&1; then
    run_test "global-exception-handler" "*GlobalExceptionHandler*Test"
else
    echo -e "${YELLOW}    ⚠️  GlobalExceptionHandler 테스트가 없습니다.${NC}"
fi

# ============================================
# 5. 리포트 생성
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 테스트 결과 요약${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

REPORT_FILE="${TEST_REPORT_DIR}/week6-test-summary.md"

cat > "${REPORT_FILE}" << EOF
# Week 6 연결 테스트 결과 리포트

**생성 시각:** $(date '+%Y-%m-%d %H:%M:%S')
**테스트 실행 시간:** ${TIMESTAMP}

## 📊 테스트 결과 요약

- **전체 테스트:** ${TOTAL_TESTS}개
- **통과:** ${PASSED_TESTS}개 ✅
- **실패:** ${FAILED_TESTS}개 ❌
- **성공률:** $(awk "BEGIN {printf \"%.1f\", ${PASSED_TESTS}/${TOTAL_TESTS}*100}")%

## 📋 테스트 상세 결과

EOF

for result in "${TEST_RESULTS[@]}"; do
    echo "- ${result}" >> "${REPORT_FILE}"
done

cat >> "${REPORT_FILE}" << EOF

## 📁 상세 로그

각 테스트의 상세 로그는 다음 위치에서 확인할 수 있습니다:

\`\`\`
${TEST_REPORT_DIR}/
├── tenant-pg-config-controller.log
├── ops-pg-config-controller.log
├── connection-test-service.log
└── ...
\`\`\`

## 🔍 테스트 범위

### 1. 연결 테스트 컨트롤러 통합 테스트
- 테넌트 포털 연결 테스트 API
- 운영 포털 연결 테스트 API
- 권한 검증
- 에러 처리

### 2. 연결 테스트 서비스 통합 테스트
- PG Provider별 supports 확인
- API Key/Secret Key 검증
- 연결 테스트 실행

### 3. 에러 처리 테스트
- 전역 예외 처리기
- 커스텀 예외 처리
- 에러 응답 형식

## 📝 다음 단계

- [ ] 실패한 테스트 수정
- [ ] 추가 통합 테스트 작성
- [ ] 성능 테스트 수행
- [ ] 문서화 업데이트

EOF

# 콘솔 출력
cat "${REPORT_FILE}"

echo ""
echo -e "${GREEN}✅ 테스트 리포트 생성 완료: ${REPORT_FILE}${NC}"
echo ""

# 최종 결과
if [ ${FAILED_TESTS} -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ${FAILED_TESTS}개의 테스트가 실패했습니다.${NC}"
    exit 1
fi

