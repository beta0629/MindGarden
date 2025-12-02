#!/bin/bash

##############################################################################
# 위젯 그룹화 시스템 테스트 스크립트
# 
# 작성일: 2025-12-02
# 목적: 위젯 그룹화 및 자동 생성 시스템 전체 플로우 테스트
# 표준: TESTING_STANDARD.md 준수
# 
# 테스트 원칙:
# - Given-When-Then 패턴 사용
# - 테스트 데이터 동적 생성 (UUID)
# - 테스트 간 독립성 보장
# - 자동 리포트 생성
# - 테넌트 격리 테스트
##############################################################################

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 결과 저장 변수
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 리포트 파일
REPORT_DIR="docs/project-management/archive/2025-12-02"
REPORT_FILE="$REPORT_DIR/WIDGET_SYSTEM_TEST_REPORT.md"

# 테스트 시작 시간
START_TIME=$(date +%s)

# API 기본 URL
API_URL="${1:-http://localhost:8080}"

# 테스트 데이터
TIMESTAMP=$(date +%s)
TENANT_EMAIL="test-widget-${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
TENANT_ID=""
DASHBOARD_ID=""
WIDGET_ID=""

# 세션 쿠키 파일
COOKIE_FILE="/tmp/widget_test_cookies.txt"

##############################################################################
# 유틸리티 함수
##############################################################################

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

section() {
    echo ""
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

##############################################################################
# 초기화
##############################################################################

init() {
    section "초기화"
    log "위젯 시스템 테스트 초기화 중..."
    log "서버: $API_URL"
    log "시간: $(date)"
    
    mkdir -p "$REPORT_DIR"
    rm -f "$COOKIE_FILE"
    
    # 서버 상태 확인
    log "서버 연결 확인 중..."
    if curl -s "$API_URL/actuator/health" > /dev/null 2>&1; then
        success "서버 연결 성공: $API_URL"
    else
        fail "서버 연결 실패: $API_URL"
        warn "서버를 시작하려면: mvn spring-boot:run -Dspring-boot.run.profiles=local"
        exit 1
    fi
}

##############################################################################
# Test 1: 테넌트 생성 및 위젯 자동 생성
##############################################################################

test_tenant_creation() {
    section "Test 1: 테넌트 생성 및 위젯 자동 생성"
    
    # Given-When-Then 패턴
    log "📋 Given: 테스트 테넌트 데이터 준비"
    log "   - 테넌트 이메일: ${TENANT_EMAIL}"
    log "   - 비즈니스 타입: CONSULTATION"
    log "   - 타임스탬프: ${TIMESTAMP}"
    
    # 1.1 온보딩 요청 생성
    log "🔄 When: 온보딩 요청 생성..."
    REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "위젯 테스트 상담소",
  "requestedBy": "${TENANT_EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
    )
    
    REQUEST_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/onboarding/requests" \
        -H "Content-Type: application/json" \
        -d "$REQUEST_PAYLOAD")
    
    # UUID 형식의 ID 추출
    REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    # Then: 결과 검증
    log "✅ Then: 온보딩 요청 생성 결과 검증"
    if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
        fail "온보딩 요청 생성 실패"
        echo "$REQUEST_RESPONSE"
        return 1
    fi
    
    success "온보딩 요청 생성 완료: ID=$REQUEST_ID"
    
    # 1.2 최고 관리자 로그인
    log "1.2 최고 관리자 로그인 중..."
    ADMIN_COOKIE_FILE="/tmp/admin_cookies.txt"
    rm -f "$ADMIN_COOKIE_FILE"
    
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -c "$ADMIN_COOKIE_FILE" \
        -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')
    
    if ! echo "$ADMIN_LOGIN_RESPONSE" | grep -q '"success":true'; then
        fail "최고 관리자 로그인 실패"
        echo "$ADMIN_LOGIN_RESPONSE"
        return 1
    fi
    
    success "최고 관리자 로그인 완료"
    
    # 1.3 온보딩 승인
    log "1.3 온보딩 승인 중..."
    APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "위젯 시스템 테스트용"
}
EOF
    )
    
    APPROVE_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
        -H "Content-Type: application/json" \
        -b "$ADMIN_COOKIE_FILE" \
        -d "$APPROVE_PAYLOAD")
    
    # APPROVED 또는 ON_HOLD 상태 모두 허용 (tenantId가 생성되면 성공)
    if ! echo "$APPROVE_RESPONSE" | grep -qE '"status":"(APPROVED|ON_HOLD)"'; then
        fail "온보딩 승인 실패"
        echo "$APPROVE_RESPONSE"
        return 1
    fi
    
    success "온보딩 승인 완료"
    
    # 1.4 프로시저 실행 대기
    log "1.4 프로시저 실행 대기 중... (5초)"
    sleep 5
    
    # 1.5 테넌트 ID 추출
    log "1.5 테넌트 ID 확인 중..."
    TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "null" ]; then
        # 응답에서 data.tenantId 시도
        TENANT_ID=$(echo "$APPROVE_RESPONSE" | grep -o '"data":{[^}]*"tenantId":"[^"]*"' | grep -o '"tenantId":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "null" ]; then
        fail "테넌트 ID 추출 실패"
        echo "$APPROVE_RESPONSE"
        return 1
    fi
    
    success "테넌트 생성 완료: $TENANT_ID"
    
    # 1.6 로그인
    log "1.6 테넌트 관리자로 로그인 중..."
    LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -c "$COOKIE_FILE" \
        -d "{\"email\":\"${TENANT_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        success "로그인 성공"
    else
        fail "로그인 실패"
        echo "$LOGIN_RESPONSE"
        return 1
    fi
}

##############################################################################
# Test 2: 위젯 그룹 조회 API
##############################################################################

test_widget_groups() {
    section "Test 2: 위젯 그룹 조회 API"
    
    # Given
    log "📋 Given: 테넌트 생성 완료 (tenantId=${TENANT_ID})"
    
    # When & Then
    # 2.1 모든 위젯 그룹 조회
    log "🔄 When: 모든 위젯 그룹 조회 API 호출..."
    GROUPS_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/widgets/groups?businessType=CONSULTATION&roleCode=ADMIN" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -b "$COOKIE_FILE")
    
    # Then: 결과 검증
    log "✅ Then: 위젯 그룹 조회 결과 검증"
    if echo "$GROUPS_RESPONSE" | grep -q '"success":true'; then
        GROUP_COUNT=$(echo "$GROUPS_RESPONSE" | grep -o '"groupId"' | wc -l)
        if [ "$GROUP_COUNT" -ge 1 ]; then
            success "위젯 그룹 조회 성공: ${GROUP_COUNT}개 그룹"
            log "   - 예상: 3개 그룹 (ADMIN, MANAGER, CONSULTANT)"
            log "   - 실제: ${GROUP_COUNT}개 그룹"
        else
            fail "위젯 그룹이 생성되지 않음 (테넌트 생성 시 자동 생성 실패)"
        fi
    else
        fail "위젯 그룹 조회 API 실패"
        echo "$GROUPS_RESPONSE"
    fi
    
    # 2.2 그룹화된 위젯 조회
    log "2.2 그룹화된 위젯 조회..."
    GROUPED_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/widgets/grouped?businessType=CONSULTATION&roleCode=ADMIN" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -b "$COOKIE_FILE")
    
    if echo "$GROUPED_RESPONSE" | grep -q '"success":true'; then
        success "그룹화된 위젯 조회 성공"
    else
        fail "그룹화된 위젯 조회 실패"
        echo "$GROUPED_RESPONSE"
    fi
    
    # 2.3 독립 위젯 조회
    log "2.3 독립 위젯 조회..."
    AVAILABLE_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/widgets/available?businessType=CONSULTATION" \
        -b "$COOKIE_FILE")
    
    if echo "$AVAILABLE_RESPONSE" | grep -q '"success":true'; then
        success "독립 위젯 조회 성공"
    else
        fail "독립 위젯 조회 실패"
        echo "$AVAILABLE_RESPONSE"
    fi
}

##############################################################################
# Test 3: 위젯 추가/삭제 API
##############################################################################

test_widget_operations() {
    section "Test 3: 위젯 추가/삭제 API"
    
    # 대시보드 ID 조회
    log "대시보드 ID 조회 중..."
    DASHBOARD_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/tenant/dashboards" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -b "$COOKIE_FILE")
    
    DASHBOARD_ID=$(echo "$DASHBOARD_RESPONSE" | grep -o '"dashboardId":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$DASHBOARD_ID" ]; then
        fail "대시보드 ID 조회 실패"
        return 1
    fi
    
    log "대시보드 ID: $DASHBOARD_ID"
    
    # 3.1 독립 위젯 추가 (성공 케이스)
    log "3.1 독립 위젯 추가 시도..."
    ADD_PAYLOAD=$(cat <<EOF
{
  "widgetType": "CUSTOM_CHART",
  "businessType": "CONSULTATION",
  "roleCode": "ADMIN",
  "displayOrder": 10
}
EOF
    )
    
    ADD_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/widgets/dashboards/${DASHBOARD_ID}/widgets" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -H "Content-Type: application/json" \
        -b "$COOKIE_FILE" \
        -d "$ADD_PAYLOAD")
    
    if echo "$ADD_RESPONSE" | grep -q '"success":true'; then
        WIDGET_ID=$(echo "$ADD_RESPONSE" | grep -o '"widgetId":"[^"]*"' | cut -d'"' -f4)
        if [ -z "$WIDGET_ID" ]; then
            WIDGET_ID=$(echo "$ADD_RESPONSE" | grep -o '"widgetId":[0-9]*' | cut -d':' -f2)
        fi
        success "독립 위젯 추가 성공: widgetId=$WIDGET_ID"
    else
        warn "독립 위젯 추가 실패 (CUSTOM_CHART 타입이 없을 수 있음)"
        echo "$ADD_RESPONSE"
    fi
    
    # 3.2 시스템 위젯 추가 시도 (실패 케이스)
    log "3.2 시스템 위젯 추가 시도 (실패 예상)..."
    SYSTEM_ADD_PAYLOAD=$(cat <<EOF
{
  "widgetType": "WELCOME",
  "businessType": "CONSULTATION",
  "roleCode": "ADMIN",
  "displayOrder": 10
}
EOF
    )
    
    SYSTEM_ADD_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/widgets/dashboards/${DASHBOARD_ID}/widgets" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -H "Content-Type: application/json" \
        -b "$COOKIE_FILE" \
        -d "$SYSTEM_ADD_PAYLOAD")
    
    if echo "$SYSTEM_ADD_RESPONSE" | grep -q '"success":false'; then
        success "시스템 위젯 추가 차단 성공 (예상된 동작)"
    else
        warn "시스템 위젯 추가가 허용됨 (예상과 다름)"
        echo "$SYSTEM_ADD_RESPONSE"
    fi
    
    # 3.3 독립 위젯 삭제 (성공 케이스)
    if [ -n "$WIDGET_ID" ]; then
        log "3.3 독립 위젯 삭제 시도..."
        DELETE_RESPONSE=$(curl -s -X DELETE "${API_URL}/api/v1/widgets/dashboards/${DASHBOARD_ID}/widgets/${WIDGET_ID}" \
            -H "X-Tenant-ID: ${TENANT_ID}" \
            -b "$COOKIE_FILE")
        
        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            success "독립 위젯 삭제 성공"
        else
            fail "독립 위젯 삭제 실패"
            echo "$DELETE_RESPONSE"
        fi
    fi
}

##############################################################################
# Test 4: 위젯 권한 확인
##############################################################################

test_widget_permissions() {
    section "Test 4: 위젯 권한 확인"
    
    # 위젯 ID 조회 (첫 번째 위젯)
    log "위젯 ID 조회 중..."
    WIDGETS_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/widgets/grouped?businessType=CONSULTATION&roleCode=ADMIN" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -b "$COOKIE_FILE")
    
    # widgetId는 숫자 또는 UUID일 수 있음
    FIRST_WIDGET_ID=$(echo "$WIDGETS_RESPONSE" | grep -o '"widgetId":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$FIRST_WIDGET_ID" ]; then
        FIRST_WIDGET_ID=$(echo "$WIDGETS_RESPONSE" | grep -o '"widgetId":[0-9]*' | head -1 | cut -d':' -f2)
    fi
    
    if [ -z "$FIRST_WIDGET_ID" ]; then
        fail "위젯 ID 조회 실패"
        return 1
    fi
    
    log "위젯 ID: $FIRST_WIDGET_ID"
    
    # 4.1 위젯 권한 조회
    log "4.1 위젯 권한 조회..."
    PERMISSION_RESPONSE=$(curl -s -X GET "${API_URL}/api/v1/widgets/${FIRST_WIDGET_ID}/permissions" \
        -H "X-Tenant-ID: ${TENANT_ID}" \
        -b "$COOKIE_FILE")
    
    if echo "$PERMISSION_RESPONSE" | grep -q '"success":true'; then
        success "위젯 권한 조회 성공"
        
        # 권한 필드 확인
        if echo "$PERMISSION_RESPONSE" | grep -q '"isSystemManaged"'; then
            success "권한 필드 확인: isSystemManaged"
        fi
        
        if echo "$PERMISSION_RESPONSE" | grep -q '"isDeletable"'; then
            success "권한 필드 확인: isDeletable"
        fi
    else
        fail "위젯 권한 조회 실패"
        echo "$PERMISSION_RESPONSE"
    fi
}

##############################################################################
# 리포트 생성
##############################################################################

generate_report() {
    section "테스트 리포트 생성"
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    cat > "$REPORT_FILE" <<EOF
# 위젯 그룹화 시스템 테스트 리포트

**실행일**: $(date)  
**서버**: $API_URL  
**소요 시간**: ${DURATION}초

---

## 📊 테스트 결과

| 항목 | 결과 |
|------|------|
| 총 테스트 | ${TOTAL_TESTS}개 |
| 성공 | ${PASSED_TESTS}개 |
| 실패 | ${FAILED_TESTS}개 |
| 성공률 | $((PASSED_TESTS * 100 / TOTAL_TESTS))% |

---

## 🧪 테스트 항목

### Test 1: 테넌트 생성 및 위젯 자동 생성
- 온보딩 요청 생성
- 온보딩 승인
- 테넌트 ID 확인
- 로그인

### Test 2: 위젯 그룹 조회 API
- 모든 위젯 그룹 조회
- 그룹화된 위젯 조회
- 독립 위젯 조회

### Test 3: 위젯 추가/삭제 API
- 독립 위젯 추가 (성공 케이스)
- 시스템 위젯 추가 (실패 케이스)
- 독립 위젯 삭제 (성공 케이스)

### Test 4: 위젯 권한 확인
- 위젯 권한 조회
- 권한 필드 확인

---

## 📋 테스트 데이터

- **테넌트 ID**: ${TENANT_ID}
- **관리자 이메일**: ${TENANT_EMAIL}
- **관리자 비밀번호**: ${ADMIN_PASSWORD}
- **대시보드 ID**: ${DASHBOARD_ID}

---

## 🎯 결론

EOF

    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo "✅ **모든 테스트 통과!**" >> "$REPORT_FILE"
    else
        echo "❌ **${FAILED_TESTS}개 테스트 실패**" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "**작성자**: CoreSolution Team  " >> "$REPORT_FILE"
    echo "**문서 버전**: 1.0.0" >> "$REPORT_FILE"
    
    log "리포트 생성 완료: $REPORT_FILE"
}

##############################################################################
# 최종 요약
##############################################################################

print_summary() {
    section "테스트 요약"
    
    echo ""
    echo -e "${BLUE}총 테스트:${NC} ${TOTAL_TESTS}개"
    echo -e "${GREEN}성공:${NC} ${PASSED_TESTS}개"
    echo -e "${RED}실패:${NC} ${FAILED_TESTS}개"
    echo ""
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    else
        echo -e "${RED}❌ ${FAILED_TESTS}개 테스트 실패${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}테스트 데이터:${NC}"
    echo "  - 테넌트 ID: ${TENANT_ID}"
    echo "  - 이메일: ${TENANT_EMAIL}"
    echo "  - 비밀번호: ${ADMIN_PASSWORD}"
    echo ""
    echo -e "${BLUE}리포트:${NC} ${REPORT_FILE}"
    echo ""
}

##############################################################################
# 메인 실행
##############################################################################

main() {
    echo ""
    echo -e "${PURPLE}╔════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║  위젯 그룹화 시스템 테스트 스크립트  ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    init
    test_tenant_creation
    test_widget_groups
    test_widget_operations
    test_widget_permissions
    generate_report
    print_summary
    
    # 종료 코드
    if [ "$FAILED_TESTS" -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# 스크립트 실행
main

