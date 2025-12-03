#!/bin/bash
# bash 4.0 이상 필요 (연관 배열 지원)

# 대시보드 위젯 생성 테스트 스크립트
# 작성일: 2025-12-03
# 목적: 테넌트 온보딩 시 각 역할별 대시보드에 위젯이 제대로 생성되는지 확인

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
COOKIE_FILE="/tmp/test_dashboard_widgets_cookies_$$.txt"
ADMIN_COOKIE_FILE="/tmp/admin_dashboard_widgets_cookies_$$.txt"

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

# 함수: API 호출
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local cookie_file=$4
    
    # curl 명령어 배열로 구성
    local curl_args=(
        -s
        -X "$method"
        "${API_BASE_URL}${endpoint}"
    )
    
    # X-Tenant-Id 헤더 추가 (TENANT_ID가 설정되어 있는 경우)
    if [ -n "$TENANT_ID" ]; then
        curl_args+=(-H "X-Tenant-Id: $TENANT_ID")
    fi
    
    if [ -n "$data" ]; then
        curl_args+=(-H "Content-Type: application/json")
        if [ -n "$cookie_file" ] && [ -f "$cookie_file" ]; then
            curl_args+=(-b "$cookie_file" -c "$cookie_file")
        fi
        curl_args+=(-d "$data")
    else
        if [ -n "$cookie_file" ] && [ -f "$cookie_file" ]; then
            curl_args+=(-b "$cookie_file" -c "$cookie_file")
        fi
    fi
    
    curl "${curl_args[@]}"
}

# 함수: SQL 실행
sql_query() {
    local query=$1
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "$query" 2>/dev/null
}

# 함수: JSON에서 값 추출
extract_json_value() {
    local json=$1
    local key=$2
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

# 함수: JSON 배열 개수 추출
extract_json_array_count() {
    local json=$1
    local key=$2
    echo "$json" | grep -o "\"$key\":\[[^]]*\]" | grep -o '"[^"]*"' | wc -l | tr -d ' '
}

# 정리 함수
cleanup() {
    rm -f "$COOKIE_FILE" "$ADMIN_COOKIE_FILE"
}

trap cleanup EXIT

echo "=========================================="
echo "대시보드 위젯 생성 테스트 시작"
echo "=========================================="
echo ""

# ============================================
# 1. 테넌트 온보딩 생성
# ============================================
echo -e "${BLUE}=== 1. 테넌트 온보딩 생성 ===${NC}"
echo ""

TIMESTAMP=$(date +%s)
TEST_EMAIL="test-dashboard-${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

# 1.1 온보딩 신청
echo -e "${YELLOW}[1.1] 온보딩 신청...${NC}"
ONBOARDING_REQUEST=$(cat <<EOF
{
  "tenantName": "대시보드 위젯 테스트 상담소",
  "requestedBy": "${TEST_EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
)

ONBOARDING_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$ONBOARDING_REQUEST")

ONBOARDING_ID=$(echo "$ONBOARDING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$ONBOARDING_ID" ] || [ "$ONBOARDING_ID" = "null" ]; then
    print_result "온보딩 신청" "FAIL" "온보딩 신청 실패"
    echo "응답: $ONBOARDING_RESPONSE"
    exit 1
else
    print_result "온보딩 신청" "PASS" "요청 ID: $ONBOARDING_ID"
fi

# 1.2 관리자 로그인 및 승인
echo -e "${YELLOW}[1.2] 관리자 로그인 및 온보딩 승인...${NC}"
rm -f "$ADMIN_COOKIE_FILE"

ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -c "$ADMIN_COOKIE_FILE" \
    -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')

if ! echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_result "관리자 로그인" "FAIL" "로그인 실패"
    exit 1
fi

APPROVE_REQUEST=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "대시보드 위젯 테스트 승인"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/requests/${ONBOARDING_ID}/decision" \
    -H "Content-Type: application/json" \
    -b "$ADMIN_COOKIE_FILE" \
    -d "$APPROVE_REQUEST")

if echo "$APPROVE_RESPONSE" | grep -qE '"status":"(APPROVED|ON_HOLD)"'; then
    print_result "온보딩 승인" "PASS" "테넌트 생성 완료"
    
    # 테넌트 ID 추출
    TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"tenantId":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$TENANT_ID" ]; then
        # 응답에서 직접 추출 실패 시 DB에서 조회
        sleep 2
        TENANT_ID=$(sql_query "SELECT tenant_id FROM tenants WHERE tenant_name = '대시보드 위젯 테스트 상담소' ORDER BY created_at DESC LIMIT 1;")
    fi
    
    if [ -z "$TENANT_ID" ]; then
        print_result "테넌트 ID 조회" "FAIL" "테넌트 ID를 찾을 수 없음"
        exit 1
    else
        print_result "테넌트 ID 조회" "PASS" "테넌트 ID: $TENANT_ID"
    fi
else
    print_result "온보딩 승인" "FAIL" "승인 실패"
    echo "응답: $APPROVE_RESPONSE"
    exit 1
fi

# 대시보드 생성 대기 (프로시저 실행 시간)
echo -e "${YELLOW}대시보드 생성 대기 중...${NC}"
sleep 3

# ============================================
# 2. 각 역할별 대시보드 및 위젯 확인
# ============================================
echo -e "${BLUE}=== 2. 역할별 대시보드 위젯 확인 ===${NC}"
echo ""

# 역할별 예상 위젯 개수 (위젯 그룹 기반)
# bash 4.0 이상에서만 연관 배열 지원, 그렇지 않으면 함수로 처리
get_expected_widget_count() {
    local role=$1
    case "$role" in
        "ADMIN") echo 9 ;;      # 핵심 2개 + 관리 3개 + 통계 2개 + 시스템 2개
        "CONSULTANT") echo 9 ;; # 핵심 2개 + 상담 5개 + 내담자 2개
        "CLIENT") echo 9 ;;     # 핵심 2개 + 상담 7개
        "STAFF") echo 9 ;;      # 관리자와 동일
        *) echo 0 ;;
    esac
}

# 역할별 역할 ID 조회
echo -e "${YELLOW}[2.1] 역할별 TenantRole ID 조회...${NC}"
ADMIN_ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'Director' LIMIT 1;")
CONSULTANT_ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'Counselor' LIMIT 1;")
CLIENT_ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'Client' LIMIT 1;")
STAFF_ROLE_ID=$(sql_query "SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = '$TENANT_ID' AND name_en = 'Staff' LIMIT 1;")

if [ -z "$ADMIN_ROLE_ID" ] || [ -z "$CONSULTANT_ROLE_ID" ] || [ -z "$CLIENT_ROLE_ID" ] || [ -z "$STAFF_ROLE_ID" ]; then
    print_result "역할 ID 조회" "FAIL" "일부 역할 ID를 찾을 수 없음 (ADMIN: $ADMIN_ROLE_ID, CONSULTANT: $CONSULTANT_ROLE_ID, CLIENT: $CLIENT_ROLE_ID, STAFF: $STAFF_ROLE_ID)"
else
    print_result "역할 ID 조회" "PASS" "ADMIN: $ADMIN_ROLE_ID, CONSULTANT: $CONSULTANT_ROLE_ID, CLIENT: $CLIENT_ROLE_ID, STAFF: $STAFF_ROLE_ID"
fi

# 각 역할별 대시보드 조회 및 위젯 확인
check_dashboard_widgets() {
    local role_name=$1
    local role_id=$2
    local expected_count=$3
    
    echo -e "${YELLOW}[2.2] ${role_name} 대시보드 위젯 확인...${NC}"
    
    DASHBOARD_RESPONSE=$(api_call "GET" "/api/v1/tenant/dashboards/by-role/${role_id}" "" "$ADMIN_COOKIE_FILE")
    
    if ! echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
        print_result "${role_name} 대시보드 조회" "FAIL" "대시보드 조회 실패"
        echo "응답: $DASHBOARD_RESPONSE"
        return
    fi
    
    # dashboardConfig에서 설정 추출 (Python으로 JSON 파싱)
    DASHBOARD_CONFIG=$(echo "$DASHBOARD_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'dashboardConfig' in data['data']:
        print(data['data']['dashboardConfig'])
    elif 'dashboardConfig' in data:
        print(data['dashboardConfig'])
    else:
        print('')
except:
    print('')
" 2>/dev/null)
    
    if [ -z "$DASHBOARD_CONFIG" ]; then
        print_result "${role_name} 대시보드 설정 추출" "FAIL" "dashboardConfig를 찾을 수 없음"
        echo "응답: $DASHBOARD_RESPONSE" | head -c 300
        echo ""
        return
    fi
    
    # 레거시 대시보드 확인 (Python으로 JSON 파싱)
    IS_LEGACY=$(echo "$DASHBOARD_CONFIG" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('1' if data.get('isLegacy') == True else '0')
except:
    print('0')
" 2>/dev/null || echo "0")
    
    COMPONENT_TYPE=$(echo "$DASHBOARD_CONFIG" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('componentType', ''))
except:
    print('')
" 2>/dev/null)
    
    VERSION=$(echo "$DASHBOARD_CONFIG" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('version', ''))
except:
    print('')
" 2>/dev/null)
    
    if [ "$IS_LEGACY" -gt 0 ]; then
        # 레거시 대시보드: componentType 확인
        if [ -n "$COMPONENT_TYPE" ]; then
            print_result "${role_name} 대시보드 (레거시)" "PASS" "레거시 대시보드 생성됨 (componentType: $COMPONENT_TYPE, version: $VERSION)"
        else
            print_result "${role_name} 대시보드 (레거시)" "FAIL" "레거시 대시보드이지만 componentType이 없음"
        fi
    else
        # 위젯 기반 대시보드: 위젯 개수 확인
        WIDGET_COUNT=$(echo "$DASHBOARD_CONFIG" | grep -o '"type":"[^"]*"' | wc -l | tr -d ' ')
        WIDGET_TYPES=$(echo "$DASHBOARD_CONFIG" | grep -o '"type":"[^"]*"' | cut -d'"' -f4 | sort | uniq | tr '\n' ',' | sed 's/,$//')
        
        if [ "$WIDGET_COUNT" -ge "$expected_count" ]; then
            print_result "${role_name} 대시보드 위젯" "PASS" "위젯 개수: $WIDGET_COUNT (예상: ${expected_count}개 이상), 타입: $WIDGET_TYPES"
        else
            print_result "${role_name} 대시보드 위젯" "FAIL" "위젯 개수: $WIDGET_COUNT (예상: ${expected_count}개 이상)"
            echo "대시보드 설정: $DASHBOARD_CONFIG" | head -c 500
            echo ""
        fi
    fi
}

# 각 역할별 확인
if [ -n "$ADMIN_ROLE_ID" ]; then
    check_dashboard_widgets "ADMIN" "$ADMIN_ROLE_ID" "$(get_expected_widget_count "ADMIN")"
fi

if [ -n "$CONSULTANT_ROLE_ID" ]; then
    check_dashboard_widgets "CONSULTANT" "$CONSULTANT_ROLE_ID" "$(get_expected_widget_count "CONSULTANT")"
fi

if [ -n "$CLIENT_ROLE_ID" ]; then
    check_dashboard_widgets "CLIENT" "$CLIENT_ROLE_ID" "$(get_expected_widget_count "CLIENT")"
fi

if [ -n "$STAFF_ROLE_ID" ]; then
    check_dashboard_widgets "STAFF" "$STAFF_ROLE_ID" "$(get_expected_widget_count "STAFF")"
fi

# ============================================
# 3. 위젯 그룹별 위젯 확인
# ============================================
echo -e "${BLUE}=== 3. 위젯 그룹별 위젯 확인 ===${NC}"
echo ""

check_widget_groups() {
    local role_code=$1
    local role_name=$2
    
    echo -e "${YELLOW}[3.1] ${role_name} 위젯 그룹 확인...${NC}"
    
    GROUP_COUNT=$(sql_query "SELECT COUNT(*) FROM widget_groups WHERE business_type = 'CONSULTATION' AND role_code = '$role_code' AND is_deleted = 0;")
    WIDGET_COUNT=$(sql_query "SELECT COUNT(*) FROM widget_definitions WHERE business_type = 'CONSULTATION' AND role_code = '$role_code' AND is_deleted = 0;")
    
    if [ "$GROUP_COUNT" -gt 0 ] && [ "$WIDGET_COUNT" -gt 0 ]; then
        print_result "${role_name} 위젯 그룹" "PASS" "그룹: $GROUP_COUNT개, 위젯: $WIDGET_COUNT개"
        
        # 그룹별 위젯 개수 출력
        sql_query "SELECT group_name_ko, COUNT(wd.widget_id) as widget_count 
                   FROM widget_groups wg 
                   LEFT JOIN widget_definitions wd ON wg.group_id = wd.group_id 
                   WHERE wg.business_type = 'CONSULTATION' AND wg.role_code = '$role_code' AND wg.is_deleted = 0 AND (wd.is_deleted = 0 OR wd.is_deleted IS NULL)
                   GROUP BY wg.group_id, wg.group_name_ko 
                   ORDER BY wg.display_order;" | while read -r line; do
            if [ -n "$line" ]; then
                echo "   - $line"
            fi
        done
    else
        print_result "${role_name} 위젯 그룹" "FAIL" "그룹: $GROUP_COUNT개, 위젯: $WIDGET_COUNT개"
    fi
    echo ""
}

check_widget_groups "ADMIN" "관리자"
check_widget_groups "CONSULTANT" "상담사"
check_widget_groups "CLIENT" "내담자"
check_widget_groups "STAFF" "스텝"

# ============================================
# 최종 결과
# ============================================
echo "=========================================="
echo "테스트 결과 요약"
echo "=========================================="
echo -e "총 테스트: ${TOTAL}개"
echo -e "${GREEN}통과: ${PASSED}개${NC}"
echo -e "${RED}실패: ${FAILED}개${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}❌ 일부 테스트 실패${NC}"
    exit 1
fi

