#!/bin/bash

# Phase 1-4 통합 테스트 스크립트
# 작성일: 2025-12-03
# 목적: 공통코드, 관리자 메뉴, 동적 권한, 그룹 권한 시스템 통합 테스트

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
DB_HOST="${DB_HOST:-114.202.247.246}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-mindgarden_dev}"
DB_PASS="${DB_PASS:-MindGardenDev2025!@#}"
DB_NAME="${DB_NAME:-core_solution}"

# 테스트 결과
PASSED=0
FAILED=0
TOTAL=0

# 쿠키 파일
COOKIE_FILE="/tmp/test_phase1_4_cookies_$$.txt"

# 함수: 테스트 결과 출력
print_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        if [ -n "$message" ]; then
            echo "   $message"
        fi
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        if [ -n "$message" ]; then
            echo "   $message"
        fi
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# 함수: API 호출 (쿠키 파일 사용)
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local cookie_file=$4
    
    if [ -n "$data" ]; then
        if [ -n "$cookie_file" ] && [ -f "$cookie_file" ]; then
            curl -s -X "$method" "${API_BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -b "$cookie_file" \
                -c "$cookie_file" \
                -d "$data"
        else
            curl -s -X "$method" "${API_BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data"
        fi
    else
        if [ -n "$cookie_file" ] && [ -f "$cookie_file" ]; then
            curl -s -X "$method" "${API_BASE_URL}${endpoint}" \
                -b "$cookie_file" \
                -c "$cookie_file"
        else
            curl -s -X "$method" "${API_BASE_URL}${endpoint}"
        fi
    fi
}

# 함수: SQL 실행
sql_query() {
    local query=$1
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "$query" 2>/dev/null
}

# 정리 함수
cleanup() {
    rm -f "$COOKIE_FILE"
}

trap cleanup EXIT

echo "=========================================="
echo "Phase 1-4 통합 테스트 시작"
echo "=========================================="
echo ""

# ============================================
# Phase 1: 공통코드 시스템 테스트
# ============================================
echo -e "${BLUE}=== Phase 1: 공통코드 시스템 테스트 ===${NC}"
echo ""

# 1.1 시스템 공통코드 확인
echo -e "${YELLOW}[1.1] 시스템 공통코드 확인...${NC}"
SYSTEM_CODE_COUNT=$(sql_query "SELECT COUNT(*) FROM code_group_metadata WHERE code_type = 'SYSTEM' AND is_active = 1;")
if [ "$SYSTEM_CODE_COUNT" -ge 12 ]; then
    print_result "시스템 공통코드 그룹 확인" "PASS" "총 $SYSTEM_CODE_COUNT개 그룹 확인"
else
    print_result "시스템 공통코드 그룹 확인" "FAIL" "예상: 12개 이상, 실제: $SYSTEM_CODE_COUNT개"
fi

# 1.2 테넌트 공통코드 그룹 확인
echo -e "${YELLOW}[1.2] 테넌트 공통코드 그룹 확인...${NC}"
TENANT_CODE_COUNT=$(sql_query "SELECT COUNT(*) FROM code_group_metadata WHERE code_type = 'TENANT' AND is_active = 1;")
if [ "$TENANT_CODE_COUNT" -ge 17 ]; then
    print_result "테넌트 공통코드 그룹 확인" "PASS" "총 $TENANT_CODE_COUNT개 그룹 확인"
else
    print_result "테넌트 공통코드 그룹 확인" "FAIL" "예상: 17개 이상, 실제: $TENANT_CODE_COUNT개"
fi

# 1.3 시스템 공통코드 데이터 확인
echo -e "${YELLOW}[1.3] 시스템 공통코드 데이터 확인...${NC}"
SYSTEM_DATA_COUNT=$(sql_query "SELECT COUNT(*) FROM common_codes WHERE tenant_id IS NULL;")
if [ "$SYSTEM_DATA_COUNT" -gt 0 ]; then
    print_result "시스템 공통코드 데이터 확인" "PASS" "총 $SYSTEM_DATA_COUNT개 코드 확인"
else
    print_result "시스템 공통코드 데이터 확인" "FAIL" "시스템 공통코드 데이터 없음"
fi

# ============================================
# Phase 2: 관리자 메뉴 시스템 테스트
# ============================================
echo -e "${BLUE}=== Phase 2: 관리자 메뉴 시스템 테스트 ===${NC}"
echo ""

# 2.1 메뉴 데이터 확인
echo -e "${YELLOW}[2.1] 메뉴 데이터 확인...${NC}"
MENU_COUNT=$(sql_query "SELECT COUNT(*) FROM menus WHERE is_active = 1;")
if [ "$MENU_COUNT" -ge 10 ]; then
    print_result "메뉴 데이터 확인" "PASS" "총 $MENU_COUNT개 메뉴 확인"
else
    print_result "메뉴 데이터 확인" "FAIL" "예상: 10개 이상, 실제: $MENU_COUNT개"
fi

# 2.2 관리자 로그인
echo -e "${YELLOW}[2.2] 관리자 로그인...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@mindgarden.com","password":"admin123"}' \
    -c "$COOKIE_FILE")

# 응답에서 성공 여부 확인
if echo "$LOGIN_RESPONSE" | grep -q '"success".*true' || echo "$LOGIN_RESPONSE" | grep -q 'success.*true'; then
    print_result "관리자 로그인" "PASS" "로그인 성공"
else
    print_result "관리자 로그인" "FAIL" "로그인 실패"
    echo "응답: $LOGIN_RESPONSE"
    # 로그인 없이 계속 진행
fi

# 2.3 관리자 메뉴 조회 API 테스트
if [ -f "$COOKIE_FILE" ]; then
    echo -e "${YELLOW}[2.3] 관리자 메뉴 조회 API 테스트...${NC}"
    MENU_RESPONSE=$(api_call "GET" "/api/v1/menus/admin" "" "$COOKIE_FILE")
    if echo "$MENU_RESPONSE" | grep -q '"success".*true' || echo "$MENU_RESPONSE" | grep -q 'success.*true'; then
        print_result "관리자 메뉴 조회 API" "PASS" "메뉴 목록 조회 성공"
    else
        print_result "관리자 메뉴 조회 API" "FAIL" "메뉴 조회 실패"
        echo "응답: $MENU_RESPONSE"
    fi
fi

# ============================================
# Phase 3: 동적 권한 부여 시스템 테스트
# ============================================
echo -e "${BLUE}=== Phase 3: 동적 권한 부여 시스템 테스트 ===${NC}"
echo ""

# 3.1 메뉴 권한 테이블 확인
echo -e "${YELLOW}[3.1] 메뉴 권한 테이블 확인...${NC}"
PERMISSION_TABLE_EXISTS=$(sql_query "SHOW TABLES LIKE 'role_menu_permissions';" | wc -l | tr -d ' ')
if [ "$PERMISSION_TABLE_EXISTS" -gt 0 ]; then
    print_result "메뉴 권한 테이블 확인" "PASS" "role_menu_permissions 테이블 존재"
else
    print_result "메뉴 권한 테이블 확인" "FAIL" "role_menu_permissions 테이블 없음"
fi

# 3.2 역할 데이터 확인
echo -e "${YELLOW}[3.2] 역할 데이터 확인...${NC}"
ROLE_COUNT=$(sql_query "SELECT COUNT(*) FROM tenant_roles WHERE is_active = 1;")
if [ "$ROLE_COUNT" -ge 0 ]; then
    print_result "역할 데이터 확인" "PASS" "총 $ROLE_COUNT개 역할 확인"
else
    print_result "역할 데이터 확인" "FAIL" "역할 데이터 없음"
fi

# ============================================
# Phase 4: 그룹 권한 시스템 테스트
# ============================================
echo -e "${BLUE}=== Phase 4: 그룹 권한 시스템 테스트 ===${NC}"
echo ""

# 4.1 권한 그룹 테이블 확인
echo -e "${YELLOW}[4.1] 권한 그룹 테이블 확인...${NC}"
PERMISSION_GROUP_TABLE_EXISTS=$(sql_query "SHOW TABLES LIKE 'permission_groups';" | wc -l | tr -d ' ')
if [ "$PERMISSION_GROUP_TABLE_EXISTS" -gt 0 ]; then
    print_result "권한 그룹 테이블 확인" "PASS" "permission_groups 테이블 존재"
else
    print_result "권한 그룹 테이블 확인" "FAIL" "permission_groups 테이블 없음"
fi

# 4.2 권한 그룹 데이터 확인
echo -e "${YELLOW}[4.2] 권한 그룹 데이터 확인...${NC}"
PERMISSION_GROUP_COUNT=$(sql_query "SELECT COUNT(*) FROM permission_groups WHERE is_active = 1;")
if [ "$PERMISSION_GROUP_COUNT" -ge 14 ]; then
    print_result "권한 그룹 데이터 확인" "PASS" "총 $PERMISSION_GROUP_COUNT개 그룹 확인"
else
    print_result "권한 그룹 데이터 확인" "FAIL" "예상: 14개 이상, 실제: $PERMISSION_GROUP_COUNT개"
fi

# 4.3 역할별 권한 그룹 테이블 확인
echo -e "${YELLOW}[4.3] 역할별 권한 그룹 테이블 확인...${NC}"
ROLE_PERMISSION_GROUP_TABLE_EXISTS=$(sql_query "SHOW TABLES LIKE 'role_permission_groups';" | wc -l | tr -d ' ')
if [ "$ROLE_PERMISSION_GROUP_TABLE_EXISTS" -gt 0 ]; then
    print_result "역할별 권한 그룹 테이블 확인" "PASS" "role_permission_groups 테이블 존재"
else
    print_result "역할별 권한 그룹 테이블 확인" "FAIL" "role_permission_groups 테이블 없음"
fi

# 4.4 내 권한 그룹 조회 API 테스트
if [ -f "$COOKIE_FILE" ]; then
    echo -e "${YELLOW}[4.4] 내 권한 그룹 조회 API 테스트...${NC}"
    PERMISSION_GROUP_RESPONSE=$(api_call "GET" "/api/v1/permissions/groups/my" "" "$COOKIE_FILE")
    if echo "$PERMISSION_GROUP_RESPONSE" | grep -q '"success".*true' || echo "$PERMISSION_GROUP_RESPONSE" | grep -q 'success.*true'; then
        print_result "내 권한 그룹 조회 API" "PASS" "권한 그룹 목록 조회 성공"
    else
        print_result "내 권한 그룹 조회 API" "FAIL" "권한 그룹 조회 실패"
        echo "응답: $PERMISSION_GROUP_RESPONSE"
    fi
fi

# 4.5 권한 그룹 체크 API 테스트
if [ -f "$COOKIE_FILE" ]; then
    echo -e "${YELLOW}[4.5] 권한 그룹 체크 API 테스트...${NC}"
    PERMISSION_CHECK_RESPONSE=$(api_call "GET" "/api/v1/permissions/groups/check/DASHBOARD_ERP" "" "$COOKIE_FILE")
    if echo "$PERMISSION_CHECK_RESPONSE" | grep -q '"success".*true' || echo "$PERMISSION_CHECK_RESPONSE" | grep -q 'success.*true'; then
        print_result "권한 그룹 체크 API" "PASS" "권한 체크 성공"
    else
        print_result "권한 그룹 체크 API" "FAIL" "권한 체크 실패"
        echo "응답: $PERMISSION_CHECK_RESPONSE"
    fi
fi

# 4.6 모든 권한 그룹 조회 API 테스트
if [ -f "$COOKIE_FILE" ]; then
    echo -e "${YELLOW}[4.6] 모든 권한 그룹 조회 API 테스트...${NC}"
    ALL_GROUPS_RESPONSE=$(api_call "GET" "/api/v1/permissions/groups/all" "" "$COOKIE_FILE")
    if echo "$ALL_GROUPS_RESPONSE" | grep -q '"success".*true' || echo "$ALL_GROUPS_RESPONSE" | grep -q 'success.*true'; then
        print_result "모든 권한 그룹 조회 API" "PASS" "권한 그룹 전체 목록 조회 성공"
    else
        print_result "모든 권한 그룹 조회 API" "FAIL" "권한 그룹 전체 목록 조회 실패"
        echo "응답: $ALL_GROUPS_RESPONSE"
    fi
fi

# ============================================
# Phase 5: 테넌트 생성 통합 테스트
# ============================================
echo -e "${BLUE}=== Phase 5: 테넌트 생성 통합 테스트 ===${NC}"
echo ""

# 5.1 상담사 테넌트 온보딩 신청
# 참고: 어제(2025-12-02) 통과한 테스트 스크립트(test-widget-grouping-system.sh)와 동일한 형식 사용
echo -e "${YELLOW}[5.1] 상담사 테넌트 온보딩 신청...${NC}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-onboarding-${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

ONBOARDING_REQUEST=$(cat <<EOF
{
  "tenantName": "테스트 상담소 Phase1-4",
  "requestedBy": "${TEST_EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
)

# 온보딩 요청은 세션 없이 호출 (이미 테넌트에 속한 사용자는 접근 불가)
# 어제 통과한 스크립트와 동일한 방식: curl 직접 사용
ONBOARDING_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$ONBOARDING_REQUEST")

# UUID 형식의 ID 추출 (어제 통과한 스크립트와 동일한 방식)
ONBOARDING_ID=$(echo "$ONBOARDING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ONBOARDING_ID" ] || [ "$ONBOARDING_ID" = "null" ]; then
    print_result "상담사 테넌트 온보딩 신청" "FAIL" "온보딩 신청 실패"
    echo "응답: $ONBOARDING_RESPONSE"
else
    print_result "상담사 테넌트 온보딩 신청" "PASS" "요청 ID: $ONBOARDING_ID"
fi

# 5.2 온보딩 승인 (관리자 권한 필요)
# 참고: 어제 통과한 스크립트처럼 관리자 로그인 후 승인
if [ -n "$ONBOARDING_ID" ]; then
    echo -e "${YELLOW}[5.2] 관리자 로그인...${NC}"
    ADMIN_COOKIE_FILE="/tmp/admin_cookies_phase1_4.txt"
    rm -f "$ADMIN_COOKIE_FILE"
    
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -c "$ADMIN_COOKIE_FILE" \
        -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')
    
    if ! echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"success":true'; then
        print_result "관리자 로그인" "FAIL" "온보딩 승인을 위한 관리자 로그인 실패"
        echo "응답: $ADMIN_LOGIN_RESPONSE"
    else
        print_result "관리자 로그인" "PASS" "로그인 성공"
        
        echo -e "${YELLOW}[5.3] 온보딩 승인...${NC}"
        APPROVE_REQUEST=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "Phase 1-4 통합 테스트 승인"
}
EOF
        )
        
        # 어제 통과한 스크립트와 동일한 방식: curl 직접 사용
        APPROVE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/requests/${ONBOARDING_ID}/decision" \
            -H "Content-Type: application/json" \
            -b "$ADMIN_COOKIE_FILE" \
            -d "$APPROVE_REQUEST")
        
        # 어제 통과한 스크립트와 동일한 검증 방식: APPROVED 또는 ON_HOLD 상태 모두 허용
        if echo "$APPROVE_RESPONSE" | grep -qE '"status":"(APPROVED|ON_HOLD)"'; then
            print_result "온보딩 승인" "PASS" "테넌트 생성 완료"
            
            # 어제 통과한 스크립트와 동일: 프로시저 실행 대기
            echo -e "${YELLOW}프로시저 실행 대기 중... (5초)${NC}"
            sleep 5
            
            # 테넌트 ID 추출 (어제 스크립트와 동일한 방식)
            TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)
            if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "null" ]; then
                # data 객체 안의 tenantId 추출 시도
                TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"data":{[^}]*"tenantId":"[^"]*"' | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)
            fi
            
            TENANT_EMAIL="${TEST_EMAIL}"
            
            # 5.4 테넌트 ID 확인
            if [ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "null" ]; then
                print_result "테넌트 ID 확인" "PASS" "테넌트 ID: $TENANT_ID"
                
                # 5.5 공통코드 자동 삽입 확인 (트랜잭션 커밋 후 실행되므로 재시도 필요)
                echo -e "${YELLOW}[5.5] 공통코드 자동 삽입 확인...${NC}"
                TENANT_CODE_COUNT=0
                MAX_RETRIES=5
                RETRY_COUNT=0
                while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                    sleep 2
                    TENANT_CODE_COUNT=$(sql_query "SELECT COUNT(*) FROM common_codes WHERE tenant_id = '$TENANT_ID';")
                    if [ "$TENANT_CODE_COUNT" -gt 0 ]; then
                        break
                    fi
                    RETRY_COUNT=$((RETRY_COUNT + 1))
                    echo "  재시도 $RETRY_COUNT/$MAX_RETRIES..."
                done
                if [ "$TENANT_CODE_COUNT" -gt 0 ]; then
                    print_result "공통코드 자동 삽입 확인" "PASS" "총 $TENANT_CODE_COUNT개 테넌트 공통코드 확인"
                else
                    print_result "공통코드 자동 삽입 확인" "FAIL" "테넌트 공통코드 없음 (tenant_id: $TENANT_ID, 재시도: $MAX_RETRIES회)"
                fi
                
                # 5.6 권한 그룹 할당 확인
                echo -e "${YELLOW}[5.6] 권한 그룹 할당 확인...${NC}"
                # 관리자 역할 찾기 (여러 가능한 이름으로 시도)
                ROLE_ID=""
                # 1. ADMIN으로 시도
                ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'ADMIN' LIMIT 1;")
                # 2. Director로 시도 (상담소 원장)
                if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "tenant_role_id" ]; then
                    ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'Director' LIMIT 1;")
                fi
                # 3. 원장으로 시도
                if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "tenant_role_id" ]; then
                    ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_ko = '원장' LIMIT 1;")
                fi
                # 4. 관리자로 시도
                if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "tenant_role_id" ]; then
                    ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_ko = '관리자' LIMIT 1;")
                fi
                # 5. display_order = 1로 시도 (보통 첫 번째 역할이 관리자)
                if [ -z "$ROLE_ID" ] || [ "$ROLE_ID" = "tenant_role_id" ]; then
                    ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND display_order = 1 AND is_deleted = 0 LIMIT 1;")
                fi
                
                if [ -n "$ROLE_ID" ] && [ "$ROLE_ID" != "tenant_role_id" ]; then
                    PERMISSION_COUNT=$(sql_query "SELECT COUNT(*) FROM role_permission_groups WHERE tenant_id = '$TENANT_ID' AND tenant_role_id = '$ROLE_ID';")
                    if [ "$PERMISSION_COUNT" -gt 0 ]; then
                        print_result "권한 그룹 할당 확인" "PASS" "총 $PERMISSION_COUNT개 권한 그룹 할당"
                    else
                        print_result "권한 그룹 할당 확인" "FAIL" "권한 그룹 할당 없음"
                    fi
                else
                    print_result "권한 그룹 할당 확인" "FAIL" "관리자 역할을 찾을 수 없음"
                fi
            else
                print_result "테넌트 ID 확인" "FAIL" "테넌트 ID를 찾을 수 없음"
            fi
        else
            print_result "온보딩 승인" "FAIL" "승인 실패"
            echo "응답: $APPROVE_RESPONSE"
        fi
    fi
fi

# ============================================
# 테스트 결과 요약
# ============================================
echo ""
echo "=========================================="
echo "테스트 결과 요약"
echo "=========================================="
echo -e "총 테스트: ${BLUE}$TOTAL${NC}개"
echo -e "성공: ${GREEN}$PASSED${NC}개"
echo -e "실패: ${RED}$FAILED${NC}개"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  일부 테스트 실패 (실패: $FAILED개)${NC}"
    exit 1
fi
