#!/bin/bash

# ============================================
# Week 4 ERD 기능 전용 테스트 스크립트
# ERD 관련 모든 테스트를 자동으로 실행
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT_DIR="test-reports/week4-erd/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 Week 4 ERD 기능 테스트 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 실행 함수
run_test() {
    local test_name=$1
    local test_class=$2
    local log_file="${TEST_REPORT_DIR}/${test_name}.log"
    
    echo -e "${BLUE}  → ${test_name}${NC}"
    ((TOTAL_TESTS++))
    
    if mvn test -Dtest="${test_class}" -Dspring.profiles.active=test > "${log_file}" 2>&1; then
        echo -e "     ${GREEN}✅ 통과${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "     ${RED}❌ 실패${NC}"
        ((FAILED_TESTS++))
        echo -e "     ${YELLOW}   로그: ${log_file}${NC}"
        return 1
    fi
}

# ============================================
# 1. ERD 컨트롤러 통합 테스트
# ============================================
echo -e "${YELLOW}📋 1. ERD 컨트롤러 통합 테스트${NC}"
run_test "erd-controller" "ErdControllerIntegrationTest"
echo ""

# ============================================
# 2. ERD 생성 서비스 통합 테스트
# ============================================
echo -e "${YELLOW}📋 2. ERD 생성 서비스 통합 테스트${NC}"
run_test "erd-generation-service" "ErdGenerationServiceIntegrationTest"
echo ""

# ============================================
# 3. 온보딩 승인 서비스 통합 테스트
# ============================================
echo -e "${YELLOW}📋 3. 온보딩 승인 서비스 통합 테스트${NC}"
run_test "onboarding-approval-service" "OnboardingApprovalServiceIntegrationTest"
echo ""

# ============================================
# 4. 모든 ERD 관련 테스트 통합 실행
# ============================================
echo -e "${YELLOW}📋 4. 모든 ERD 관련 테스트 통합 실행${NC}"
run_test "all-erd-tests" "*Erd*"
echo ""

# ============================================
# 6. 테스트 결과 리포트 생성
# ============================================
echo -e "${YELLOW}📊 테스트 결과 리포트 생성 중...${NC}"

SUMMARY_FILE="${TEST_REPORT_DIR}/week4-test-summary.md"

cat > "${SUMMARY_FILE}" << EOF
# Week 4 ERD 기능 테스트 결과 리포트

**실행 시간**: $(date)
**타임스탬프**: ${TIMESTAMP}

## 테스트 결과 요약

- ✅ 통과: ${PASSED_TESTS}개
- ❌ 실패: ${FAILED_TESTS}개
- 📊 총 테스트: ${TOTAL_TESTS}개
- 📈 성공률: $(awk "BEGIN {printf \"%.1f\", ${PASSED_TESTS}/${TOTAL_TESTS}*100}")%

## 실행된 테스트

1. **ERD 컨트롤러 통합 테스트**
   - 테넌트 ERD 목록 조회
   - ERD 상세 조회
   - ERD 변경 이력 조회
   - 권한 검증

2. **ERD 생성 서비스 통합 테스트**
   - 전체 시스템 ERD 생성
   - 테넌트별 ERD 생성
   - 모듈별 ERD 생성
   - 커스텀 ERD 생성

3. **온보딩 승인 서비스 통합 테스트**
   - 온보딩 승인 시 ERD 자동 생성
   - PL/SQL 프로시저 호출 검증

4. **모든 ERD 관련 테스트 통합 실행**
   - ERD 컨트롤러, 서비스, 온보딩 승인 통합 테스트

## 상세 로그

각 테스트의 상세 로그는 \`${TEST_REPORT_DIR}/\` 디렉토리에 저장되었습니다.

- \`erd-controller.log\` - ERD 컨트롤러 테스트 로그
- \`erd-generation-service.log\` - ERD 생성 서비스 테스트 로그
- \`onboarding-approval-service.log\` - 온보딩 승인 서비스 테스트 로그
- \`all-erd-tests.log\` - 전체 ERD 테스트 로그

## 다음 단계

EOF

if [ $FAILED_TESTS -gt 0 ]; then
    cat >> "${SUMMARY_FILE}" << EOF
1. ❌ **실패한 테스트 확인**
   - 실패한 테스트의 로그 파일 확인
   - 오류 원인 분석 및 수정

2. 🔄 **재실행**
   \`\`\`bash
   ./scripts/run-week4-tests.sh
   \`\`\`

3. 📝 **테스트 케이스 보완**
   - 실패한 케이스에 대한 추가 테스트 작성
EOF
else
    cat >> "${SUMMARY_FILE}" << EOF
1. ✅ **모든 테스트 통과!**
   - Week 4 ERD 기능이 정상적으로 작동합니다.

2. 🚀 **다음 단계**
   - 프론트엔드 E2E 테스트 실행
   - 수동 테스트 체크리스트 확인
   - 배포 준비
EOF
fi

cat >> "${SUMMARY_FILE}" << EOF

## 참고 문서

- 빠른 테스트 가이드: \`docs/mgsb/WEEK4_QUICK_TEST_GUIDE.md\`
- 상세 테스트 가이드: \`docs/mgsb/WEEK4_TESTING_GUIDE.md\`

EOF

echo -e "${GREEN}✅ 리포트 생성 완료: ${SUMMARY_FILE}${NC}"
echo ""

# ============================================
# 최종 결과 출력
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 통과: ${PASSED_TESTS}개${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ 실패: ${FAILED_TESTS}개${NC}"
    echo -e "${YELLOW}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 모든 Week 4 ERD 테스트 통과!${NC}"
    echo -e "${GREEN}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 0
fi

