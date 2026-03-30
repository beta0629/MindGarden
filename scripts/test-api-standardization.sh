#!/bin/bash

##############################################################################
# CoreSolution 표준화 API 테스트 스크립트
# 작성일: 2025-12-02
# 목적: AI 모니터링, 스케줄러, 보안 표준화 API 기능 테스트
##############################################################################

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장 변수
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 리포트 파일
REPORT_DIR="docs/project-management/archive/2025-12-02"
REPORT_FILE="$REPORT_DIR/API_TEST_REPORT.md"

# 테스트 시작 시간
START_TIME=$(date +%s)

# API 기본 URL
API_URL="http://localhost:8080"

# 로그인 정보
ADMIN_EMAIL="superadmin@mindgarden.com"
ADMIN_PASSWORD="admin123"

# JWT 토큰 저장 변수
JWT_TOKEN=""

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

section() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

##############################################################################
# 초기화
##############################################################################

init() {
    log "API 테스트 초기화 중..."
    mkdir -p "$REPORT_DIR"
    
    # 서버 상태 확인
    if curl -s "$API_URL/actuator/health" > /dev/null 2>&1; then
        success "서버 연결 성공: $API_URL"
    else
        fail "서버 연결 실패: $API_URL (서버가 실행 중인지 확인하세요)"
        echo ""
        echo -e "${YELLOW}서버를 시작하려면: ./scripts/start-all.sh local dev${NC}"
        exit 1
    fi
}

##############################################################################
# 로그인
##############################################################################

login() {
    section "로그인 테스트"
    
    log "관리자 로그인 시도: $ADMIN_EMAIL"
    
    # 세션 쿠키를 저장할 파일
    COOKIE_FILE="/tmp/mindgarden_cookies.txt"
    rm -f "$COOKIE_FILE"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -c "$COOKIE_FILE" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
    
    # JWT 토큰 확인 (있으면 JWT, 없으면 세션 기반)
    JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$JWT_TOKEN" ]; then
        success "로그인 성공 (JWT 토큰 길이: ${#JWT_TOKEN})"
    elif echo "$RESPONSE" | grep -q '"success":true'; then
        success "로그인 성공 (세션 기반)"
        # 세션 기반이므로 JWT_TOKEN을 빈 문자열로 설정
        JWT_TOKEN=""
    else
        fail "로그인 실패"
        echo "응답: $RESPONSE"
        exit 1
    fi
}

##############################################################################
# Phase 1: 모니터링 API 테스트
##############################################################################

test_monitoring_apis() {
    section "Phase 1: 모니터링 API 테스트"
    
    # 쿠키 파일
    COOKIE_FILE="/tmp/mindgarden_cookies.txt"
    
    # 인증 헤더 설정
    if [ -n "$JWT_TOKEN" ]; then
        AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"
    else
        AUTH_HEADER=""
    fi
    
    # 1. 대시보드 조회
    log "모니터링 대시보드 조회..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/dashboard" \
            -H "$AUTH_HEADER")
    else
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/dashboard" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success\|dashboard"; then
        success "모니터링 대시보드 조회 성공"
    else
        fail "모니터링 대시보드 조회 실패"
        log "응답: $RESPONSE"
    fi
    
    # 2. 메트릭 조회
    log "시스템 메트릭 조회 (최근 10분)..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/metrics?minutes=10" \
            -H "$AUTH_HEADER")
    else
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/metrics?minutes=10" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success\|metrics"; then
        success "시스템 메트릭 조회 성공"
    else
        fail "시스템 메트릭 조회 실패"
        log "응답: $RESPONSE"
    fi
    
    # 3. 이상 탐지 조회
    log "이상 탐지 목록 조회..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/anomalies?severity=HIGH" \
            -H "$AUTH_HEADER")
    else
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/anomalies?severity=HIGH" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success\|anomalies"; then
        success "이상 탐지 목록 조회 성공"
    else
        fail "이상 탐지 목록 조회 실패"
        log "응답: $RESPONSE"
    fi
    
    # 4. 보안 위협 조회
    log "보안 위협 목록 조회 (최근 24시간)..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/threats?hours=24" \
            -H "$AUTH_HEADER")
    else
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/monitoring/threats?hours=24" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success\|threats"; then
        success "보안 위협 목록 조회 성공"
    else
        fail "보안 위협 목록 조회 실패"
        log "응답: $RESPONSE"
    fi
}

##############################################################################
# Phase 2: 스케줄러 API 테스트
##############################################################################

test_scheduler_apis() {
    section "Phase 2: 스케줄러 API 테스트"
    
    COOKIE_FILE="/tmp/mindgarden_cookies.txt"
    
    # 상담일지 알림 수동 실행
    log "상담일지 미작성 확인 수동 실행..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X POST "$API_URL/api/admin/consultation-record-alerts/manual-check?daysBack=1" \
            -H "Authorization: Bearer $JWT_TOKEN")
    else
        RESPONSE=$(curl -s -X POST "$API_URL/api/admin/consultation-record-alerts/manual-check?daysBack=1" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success"; then
        success "상담일지 미작성 확인 수동 실행 성공"
    else
        fail "상담일지 미작성 확인 수동 실행 실패"
        log "응답: $RESPONSE"
    fi
    
    # 상담일지 알림 시스템 상태 확인
    log "상담일지 알림 시스템 상태 확인..."
    if [ -n "$JWT_TOKEN" ]; then
        RESPONSE=$(curl -s -X GET "$API_URL/api/admin/consultation-record-alerts/status" \
            -H "Authorization: Bearer $JWT_TOKEN")
    else
        RESPONSE=$(curl -s -X GET "$API_URL/api/admin/consultation-record-alerts/status" \
            -b "$COOKIE_FILE")
    fi
    
    if echo "$RESPONSE" | grep -q "success\|systemStatus"; then
        success "상담일지 알림 시스템 상태 확인 성공"
    else
        fail "상담일지 알림 시스템 상태 확인 실패"
        log "응답: $RESPONSE"
    fi
}

##############################################################################
# Phase 3: 데이터베이스 테스트
##############################################################################

test_database() {
    section "Phase 3: 데이터베이스 테스트"
    
    # 환경 변수 로드
    ENV_FILE="config/environments/development/dev.env"
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    else
        fail "dev.env 파일을 찾을 수 없습니다"
        return
    fi
    
    DB_HOST="${DB_HOST:-beta0629.cafe24.com}"
    DB_PORT="${DB_PORT:-3306}"
    DB_NAME="${DB_NAME:-core_solution}"
    DB_USER="${DB_USER:-mindgarden_dev}"
    DB_PASS="${DB_PASS:-MindGardenDev2025!@#}"
    
    # 스케줄러 실행 로그 테이블 확인
    log "scheduler_execution_log 테이블 확인..."
    COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -se "SELECT COUNT(*) FROM scheduler_execution_log;" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        success "scheduler_execution_log 테이블 존재 (레코드: $COUNT)"
    else
        fail "scheduler_execution_log 테이블 조회 실패"
    fi
    
    # 보안 감사 로그 테이블 확인
    log "security_audit_log 테이블 확인..."
    COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -se "SELECT COUNT(*) FROM security_audit_log;" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        success "security_audit_log 테이블 존재 (레코드: $COUNT)"
    else
        fail "security_audit_log 테이블 조회 실패"
    fi
    
    # AI 모니터링 테이블 확인
    log "system_metrics 테이블 확인..."
    COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -se "SELECT COUNT(*) FROM system_metrics;" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        success "system_metrics 테이블 존재 (레코드: $COUNT)"
    else
        fail "system_metrics 테이블 조회 실패"
    fi
    
    log "ai_anomaly_detection 테이블 확인..."
    COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -se "SELECT COUNT(*) FROM ai_anomaly_detection;" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        success "ai_anomaly_detection 테이블 존재 (레코드: $COUNT)"
    else
        fail "ai_anomaly_detection 테이블 조회 실패"
    fi
    
    log "security_threat_detection 테이블 확인..."
    COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
        -se "SELECT COUNT(*) FROM security_threat_detection;" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        success "security_threat_detection 테이블 존재 (레코드: $COUNT)"
    else
        fail "security_threat_detection 테이블 조회 실패"
    fi
}

##############################################################################
# 리포트 생성
##############################################################################

generate_report() {
    section "리포트 생성 중..."
    
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    local PASS_RATE=0
    
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    cat > "$REPORT_FILE" << EOF
# CoreSolution 표준화 API 테스트 리포트

**작성일**: $(date '+%Y-%m-%d %H:%M:%S')  
**테스트 실행 시간**: ${DURATION}초  
**버전**: 1.0.0

---

## 📊 테스트 결과 요약

| 항목 | 결과 |
|------|------|
| 총 테스트 수 | ${TOTAL_TESTS} |
| 성공 | ${PASSED_TESTS} ✅ |
| 실패 | ${FAILED_TESTS} ❌ |
| 성공률 | ${PASS_RATE}% |

---

## 🎯 테스트 단계별 결과

### Phase 1: 모니터링 API 테스트
- 모니터링 대시보드 조회
- 시스템 메트릭 조회
- 이상 탐지 목록 조회
- 보안 위협 목록 조회

### Phase 2: 스케줄러 API 테스트
- 상담일지 미작성 확인 수동 실행
- 상담일지 알림 시스템 상태 확인

### Phase 3: 데이터베이스 테스트
- scheduler_execution_log 테이블 확인
- security_audit_log 테이블 확인
- system_metrics 테이블 확인
- ai_anomaly_detection 테이블 확인
- security_threat_detection 테이블 확인

---

## 📌 결론

EOF

    if [ "$PASS_RATE" -ge 90 ]; then
        echo "✅ **테스트 통과**: API 테스트가 성공적으로 완료되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    elif [ "$PASS_RATE" -ge 70 ]; then
        echo "⚠️ **주의 필요**: 일부 API에서 문제가 발견되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    else
        echo "❌ **개선 필요**: 많은 API에서 문제가 발견되었습니다. (성공률: ${PASS_RATE}%)" >> "$REPORT_FILE"
    fi
    
    cat >> "$REPORT_FILE" << EOF

---

**최종 업데이트**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log "리포트 생성 완료: $REPORT_FILE"
}

##############################################################################
# 메인 실행
##############################################################################

main() {
    echo ""
    echo "=========================================="
    echo "CoreSolution 표준화 API 테스트"
    echo "=========================================="
    echo ""
    
    init
    login
    test_monitoring_apis
    test_scheduler_apis
    test_database
    generate_report
    
    echo ""
    echo "=========================================="
    echo "테스트 완료"
    echo "=========================================="
    echo ""
    echo "총 테스트: $TOTAL_TESTS"
    echo "성공: $PASSED_TESTS ✅"
    echo "실패: $FAILED_TESTS ❌"
    echo ""
    echo "리포트: $REPORT_FILE"
    echo ""
    
    # 실패가 있으면 종료 코드 1 반환
    if [ "$FAILED_TESTS" -gt 0 ]; then
        exit 1
    fi
}

# 스크립트 실행
main

