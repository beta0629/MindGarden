#!/bin/bash

# ============================================
# 자동화 API 테스트 스크립트
# 인증을 자동으로 처리하고 모든 API를 테스트
# 화면 입력 없이 자동으로 실행됩니다
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${API_BASE_URL:-http://localhost:8080}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT_DIR="test-reports/automated-api/${TIMESTAMP}"
mkdir -p "${TEST_REPORT_DIR}"

# 테스트 계정 정보 (환경 변수 또는 기본값)
TEST_USERNAME="${TEST_USERNAME:-superadmin@mindgarden.com}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

PASSED=0
FAILED=0
COOKIE_FILE="${TEST_REPORT_DIR}/cookies.txt"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🤖 자동화 API 테스트 시작${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}테스트 계정: ${TEST_USERNAME}${NC}"
echo ""

# 서버 상태 확인
echo -e "${YELLOW}🔍 서버 상태 확인 중...${NC}"
if ! curl -s -f "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ 서버가 실행 중이 아닙니다!${NC}"
    echo -e "${YELLOW}서버를 먼저 실행하세요: ./scripts/start-backend.sh local${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 서버 실행 중${NC}"
echo ""

# ============================================
# 1. 자동 로그인 및 세션 획득
# ============================================
echo -e "${YELLOW}🔐 자동 로그인 중...${NC}"

LOGIN_RESPONSE=$(curl -s -c "${COOKIE_FILE}" -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}" \
    "${BASE_URL}/api/auth/login")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "302" ]; then
    echo -e "${GREEN}✅ 로그인 성공 (HTTP ${HTTP_CODE})${NC}"
    
    # 세션 쿠키 확인
    if [ -f "${COOKIE_FILE}" ]; then
        JSESSIONID=$(grep -i "JSESSIONID" "${COOKIE_FILE}" | awk '{print $7}' || echo "")
        if [ -n "$JSESSIONID" ]; then
            echo -e "${GREEN}✅ 세션 쿠키 획득: ${JSESSIONID:0:20}...${NC}"
        fi
    fi
else
    echo -e "${RED}❌ 로그인 실패 (HTTP ${HTTP_CODE})${NC}"
    echo -e "${YELLOW}응답: ${BODY}${NC}"
    exit 1
fi
echo ""

# ============================================
# 2. API 테스트 함수 (쿠키 자동 포함)
# ============================================
test_api() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -e "${BLUE}  → ${description}${NC}"
    echo -e "     ${method} ${endpoint}"
    
    local curl_cmd="curl -s -w \"\n%{http_code}\" -b \"${COOKIE_FILE}\" -c \"${COOKIE_FILE}\""
    
    if [ "$method" == "GET" ]; then
        RESPONSE=$(eval "${curl_cmd} \"${BASE_URL}${endpoint}\"")
    elif [ "$method" == "POST" ]; then
        RESPONSE=$(eval "${curl_cmd} -X POST -H \"Content-Type: application/json\" -d '${data}' \"${BASE_URL}${endpoint}\"")
    elif [ "$method" == "PUT" ]; then
        RESPONSE=$(eval "${curl_cmd} -X PUT -H \"Content-Type: application/json\" -d '${data}' \"${BASE_URL}${endpoint}\"")
    elif [ "$method" == "DELETE" ]; then
        RESPONSE=$(eval "${curl_cmd} -X DELETE \"${BASE_URL}${endpoint}\"")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # 결과 저장 (파일명을 영문으로 변환)
    local safe_desc=$(echo "$description" | tr ' ' '_' | tr '/' '_' | sed 's/[^a-zA-Z0-9_-]/_/g' | tr '[:upper:]' '[:lower:]')
    # 한글 설명을 영문 키로 매핑
    case "$description" in
        "지점 생성")
            safe_desc="branch_create"
            ;;
        "지점 목록 조회")
            safe_desc="branch_list"
            ;;
        "지점 상세 조회")
            safe_desc="branch_detail"
            ;;
        "지점 수정")
            safe_desc="branch_update"
            ;;
        "현재 사용자 정보 조회")
            safe_desc="current_user"
            ;;
        "상담사 목록 조회")
            safe_desc="consultant_list"
            ;;
        "공통코드 그룹별 조회")
            safe_desc="common_codes"
            ;;
        "Health Check")
            safe_desc="health_check"
            ;;
    esac
    
    if command -v jq > /dev/null 2>&1; then
        echo "$BODY" | jq . > "${TEST_REPORT_DIR}/${safe_desc}.json" 2>/dev/null || echo "$BODY" > "${TEST_REPORT_DIR}/${safe_desc}.txt"
    else
        echo "$BODY" > "${TEST_REPORT_DIR}/${safe_desc}.txt"
    fi
    
    if [ "$HTTP_CODE" == "$expected_status" ]; then
        echo -e "     ${GREEN}✅ 통과 (HTTP ${HTTP_CODE})${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "     ${RED}❌ 실패 (예상: ${expected_status}, 실제: ${HTTP_CODE})${NC}"
        if [ -n "$BODY" ]; then
            echo -e "     ${YELLOW}응답: ${BODY:0:100}...${NC}"
        fi
        ((FAILED++))
        return 1
    fi
}

# ============================================
# 3. 사용자 정보 조회
# ============================================
echo -e "${YELLOW}📋 3. 사용자 정보 조회${NC}"
test_api "GET" "/api/auth/current-user" "200" "현재 사용자 정보 조회"
echo ""

# ============================================
# 4. 지점 관리 API 테스트
# ============================================
echo -e "${YELLOW}📋 4. 지점 관리 API 테스트${NC}"

# 지점 목록 조회
test_api "GET" "/api/v1/branches" "200" "지점 목록 조회"

# 지점 생성
BRANCH_DATA='{"name":"자동화 테스트 지점","address":"서울시 강남구","phone":"02-1234-5678","status":"ACTIVE"}'
test_api "POST" "/api/v1/branches" "200" "지점 생성" "${BRANCH_DATA}"

# 생성된 지점 ID 추출 (응답에서)
# 파일명은 safe_desc로 변환된 영문 파일명 사용
BRANCH_CREATE_FILE="${TEST_REPORT_DIR}/branch_create.json"
if [ ! -f "$BRANCH_CREATE_FILE" ]; then
    BRANCH_CREATE_FILE="${TEST_REPORT_DIR}/branch_create.txt"
fi

if [ -f "$BRANCH_CREATE_FILE" ]; then
    if command -v jq > /dev/null 2>&1; then
        BRANCH_ID=$(jq -r '.data.id // .id // empty' "$BRANCH_CREATE_FILE" 2>/dev/null || echo "")
    else
        # jq가 없으면 grep으로 추출 시도
        BRANCH_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*[0-9]*' "$BRANCH_CREATE_FILE" | grep -o '[0-9]*' | head -1 || echo "")
    fi
    
    if [ -n "$BRANCH_ID" ] && [ "$BRANCH_ID" != "null" ] && [ "$BRANCH_ID" != "" ]; then
        echo -e "${GREEN}     생성된 지점 ID: ${BRANCH_ID}${NC}"
        
        # 지점 상세 조회
        test_api "GET" "/api/v1/branches/${BRANCH_ID}" "200" "지점 상세 조회"
        
        # 지점 수정
        UPDATE_DATA="{\"name\":\"수정된 지점명\",\"address\":\"서울시 서초구\",\"phone\":\"02-9876-5432\"}"
        test_api "PUT" "/api/v1/branches/${BRANCH_ID}" "200" "지점 수정" "${UPDATE_DATA}"
        
        # 지점 삭제 (선택적)
        # test_api "DELETE" "/api/v1/branches/${BRANCH_ID}" "200" "지점 삭제"
    fi
fi
echo ""

# ============================================
# 5. 상담사 관리 API 테스트
# ============================================
echo -e "${YELLOW}📋 5. 상담사 관리 API 테스트${NC}"
test_api "GET" "/api/v1/consultants" "200" "상담사 목록 조회"
echo ""

# ============================================
# 6. 공통코드 API 테스트
# ============================================
echo -e "${YELLOW}📋 6. 공통코드 API 테스트${NC}"
test_api "GET" "/api/common-codes/groups?groups=USER_ROLE,BRANCH_STATUS" "200" "공통코드 그룹별 조회"
echo ""

# ============================================
# 7. Health Check API
# ============================================
echo -e "${YELLOW}📋 7. Health Check API${NC}"
test_api "GET" "/actuator/health" "200" "Health Check"
echo ""

# ============================================
# 8. 결과 리포트 생성
# ============================================
echo -e "${YELLOW}📊 테스트 결과 리포트 생성 중...${NC}"

SUMMARY_FILE="${TEST_REPORT_DIR}/test-summary.md"

cat > "${SUMMARY_FILE}" << EOF
# 자동화 API 테스트 결과 리포트

**실행 시간**: $(date)
**Base URL**: ${BASE_URL}
**테스트 계정**: ${TEST_USERNAME}
**타임스탬프**: ${TIMESTAMP}

## 테스트 결과 요약

- ✅ 통과: ${PASSED}개
- ❌ 실패: ${FAILED}개
- 📊 총 테스트: $((PASSED + FAILED))개
- 📈 성공률: $(awk "BEGIN {printf \"%.1f\", ${PASSED}*100/(${PASSED}+${FAILED})}")%

## 실행된 테스트

1. 자동 로그인 및 세션 획득
2. 사용자 정보 조회
3. 지점 관리 API (목록, 생성, 조회, 수정)
4. 상담사 관리 API
5. 공통코드 API
6. Health Check API

## 상세 응답

각 API의 응답은 \`${TEST_REPORT_DIR}/\` 디렉토리에 저장되었습니다.

## 다음 단계

1. 실패한 API 확인 및 수정
2. 추가 API 테스트 케이스 추가
3. 재실행: \`./scripts/run-automated-api-tests.sh\`

## 사용법

\`\`\`bash
# 기본 실행
./scripts/run-automated-api-tests.sh

# 다른 계정으로 실행
TEST_USERNAME=admin@example.com TEST_PASSWORD=password ./scripts/run-automated-api-tests.sh

# 다른 서버로 실행
API_BASE_URL=http://localhost:8080 ./scripts/run-automated-api-tests.sh
\`\`\`

EOF

echo -e "${GREEN}✅ 리포트 생성 완료: ${SUMMARY_FILE}${NC}"
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 통과: ${PASSED}개${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ 실패: ${FAILED}개${NC}"
    echo -e "${YELLOW}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 모든 API 테스트 통과!${NC}"
    echo -e "${GREEN}📊 리포트: ${SUMMARY_FILE}${NC}"
    exit 0
fi

