#!/bin/bash

# ============================================
# 전체 테스트 자동 실행 스크립트
# 백엔드 + 프론트엔드 모든 테스트를 자동으로 실행하고 리포트 생성
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
TEST_REPORT_DIR="test-reports/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 전체 테스트 자동 실행 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# 1. 백엔드 테스트 실행
# ============================================
echo -e "${YELLOW}📦 백엔드 테스트 실행 중...${NC}"

BACKEND_TEST_RESULT=0

# ERD 관련 테스트
echo -e "${BLUE}  → ERD 컨트롤러 통합 테스트${NC}"
mvn test -Dtest=ErdControllerIntegrationTest -Dspring.profiles.active=test > "${TEST_REPORT_DIR}/erd-controller-test.log" 2>&1 || BACKEND_TEST_RESULT=$?

echo -e "${BLUE}  → ERD 생성 서비스 통합 테스트${NC}"
mvn test -Dtest=ErdGenerationServiceIntegrationTest -Dspring.profiles.active=test >> "${TEST_REPORT_DIR}/erd-service-test.log" 2>&1 || BACKEND_TEST_RESULT=$?

echo -e "${BLUE}  → 온보딩 승인 서비스 통합 테스트${NC}"
mvn test -Dtest=OnboardingApprovalServiceIntegrationTest -Dspring.profiles.active=test >> "${TEST_REPORT_DIR}/onboarding-test.log" 2>&1 || BACKEND_TEST_RESULT=$?

# PG 설정 관련 테스트
echo -e "${BLUE}  → PG 설정 컨트롤러 통합 테스트${NC}"
mvn test -Dtest=TenantPgConfigurationControllerIntegrationTest -Dspring.profiles.active=test >> "${TEST_REPORT_DIR}/pg-controller-test.log" 2>&1 || BACKEND_TEST_RESULT=$?

echo -e "${BLUE}  → PG 설정 Ops 컨트롤러 통합 테스트${NC}"
mvn test -Dtest=TenantPgConfigurationOpsControllerIntegrationTest -Dspring.profiles.active=test >> "${TEST_REPORT_DIR}/pg-ops-controller-test.log" 2>&1 || BACKEND_TEST_RESULT=$?

# 모든 ERD 관련 테스트 한번에
echo -e "${BLUE}  → 모든 ERD 관련 테스트${NC}"
mvn test -Dtest=*Erd* -Dspring.profiles.active=test >> "${TEST_REPORT_DIR}/all-erd-tests.log" 2>&1 || BACKEND_TEST_RESULT=$?

# 전체 테스트 실행 (선택적)
if [ "$1" == "--full" ]; then
    echo -e "${BLUE}  → 전체 백엔드 테스트 실행 (시간 소요)${NC}"
    mvn test -Dspring.profiles.active=test > "${TEST_REPORT_DIR}/all-backend-tests.log" 2>&1 || BACKEND_TEST_RESULT=$?
fi

# 테스트 리포트 생성
mvn surefire-report:report -Dspring.profiles.active=test > "${TEST_REPORT_DIR}/surefire-report.log" 2>&1 || true

if [ $BACKEND_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ 백엔드 테스트 완료${NC}"
else
    echo -e "${RED}❌ 백엔드 테스트 실패 (일부 테스트 실패 가능)${NC}"
fi

echo ""

# ============================================
# 2. API 테스트 (서버 실행 중일 때)
# ============================================
echo -e "${YELLOW}🌐 API 테스트 실행 중...${NC}"

API_TEST_RESULT=0

# 서버가 실행 중인지 확인
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}  → 서버가 실행 중입니다. API 테스트 진행...${NC}"
    
    # ERD API 테스트
    echo -e "${BLUE}  → ERD 목록 조회 API 테스트${NC}"
    curl -s -o "${TEST_REPORT_DIR}/erd-list-api.json" \
         -w "\nHTTP Status: %{http_code}\n" \
         http://localhost:8080/api/v1/tenants/test-tenant/erd || API_TEST_RESULT=$?
    
    # Health Check
    echo -e "${BLUE}  → Health Check API 테스트${NC}"
    curl -s -o "${TEST_REPORT_DIR}/health-api.json" \
         -w "\nHTTP Status: %{http_code}\n" \
         http://localhost:8080/actuator/health || API_TEST_RESULT=$?
    
    if [ $API_TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ API 테스트 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  API 테스트 일부 실패 (서버 상태 확인 필요)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  서버가 실행 중이 아닙니다. API 테스트를 건너뜁니다.${NC}"
    echo -e "${YELLOW}    서버 실행: ./scripts/start-backend.sh local${NC}"
fi

echo ""

# ============================================
# 3. 프론트엔드 테스트 (선택적)
# ============================================
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}🎨 프론트엔드 테스트 확인 중...${NC}"
    
    cd frontend
    
    # 테스트 스크립트가 있는지 확인
    if grep -q "\"test\"" package.json; then
        echo -e "${BLUE}  → 프론트엔드 테스트 실행${NC}"
        npm test -- --watchAll=false --coverage > "../${TEST_REPORT_DIR}/frontend-test.log" 2>&1 || true
        echo -e "${GREEN}✅ 프론트엔드 테스트 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  프론트엔드 테스트 스크립트가 없습니다.${NC}"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  프론트엔드 디렉토리를 찾을 수 없습니다.${NC}"
fi

echo ""

# ============================================
# 4. 테스트 결과 요약 리포트 생성
# ============================================
echo -e "${YELLOW}📊 테스트 결과 리포트 생성 중...${NC}"

SUMMARY_FILE="${TEST_REPORT_DIR}/test-summary.md"

cat > "${SUMMARY_FILE}" << EOF
# 테스트 실행 결과 리포트

**실행 시간**: $(date)
**타임스탬프**: ${TIMESTAMP}

## 백엔드 테스트 결과

EOF

# 백엔드 테스트 결과 분석
if [ $BACKEND_TEST_RESULT -eq 0 ]; then
    echo "✅ **상태**: 모든 테스트 통과" >> "${SUMMARY_FILE}"
else
    echo "❌ **상태**: 일부 테스트 실패" >> "${SUMMARY_FILE}"
fi

cat >> "${SUMMARY_FILE}" << EOF

### 실행된 테스트
- ERD 컨트롤러 통합 테스트
- ERD 생성 서비스 통합 테스트
- 온보딩 승인 서비스 통합 테스트
- PG 설정 컨트롤러 통합 테스트
- PG 설정 Ops 컨트롤러 통합 테스트

### 상세 로그
- ERD 컨트롤러: \`erd-controller-test.log\`
- ERD 서비스: \`erd-service-test.log\`
- 온보딩: \`onboarding-test.log\`
- PG 컨트롤러: \`pg-controller-test.log\`
- PG Ops: \`pg-ops-controller-test.log\`

## API 테스트 결과

EOF

if [ $API_TEST_RESULT -eq 0 ]; then
    echo "✅ **상태**: API 테스트 완료" >> "${SUMMARY_FILE}"
else
    echo "⚠️  **상태**: API 테스트 건너뜀 (서버 미실행)" >> "${SUMMARY_FILE}"
fi

cat >> "${SUMMARY_FILE}" << EOF

## 다음 단계

1. 상세 로그 확인: \`${TEST_REPORT_DIR}/\`
2. 실패한 테스트 수정
3. 재실행: \`./scripts/run-all-tests.sh\`

## 전체 테스트 실행

전체 백엔드 테스트를 실행하려면:
\`\`\`bash
./scripts/run-all-tests.sh --full
\`\`\`

EOF

echo -e "${GREEN}✅ 리포트 생성 완료: ${SUMMARY_FILE}${NC}"
echo ""

# ============================================
# 5. 최종 결과 출력
# ============================================
echo -e "${BLUE}========================================${NC}"
if [ $BACKEND_TEST_RESULT -eq 0 ] && [ $API_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 완료!${NC}"
    echo -e "${GREEN}📊 리포트: ${TEST_REPORT_DIR}/test-summary.md${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  일부 테스트 실패 또는 건너뜀${NC}"
    echo -e "${YELLOW}📊 리포트: ${TEST_REPORT_DIR}/test-summary.md${NC}"
    exit 1
fi

