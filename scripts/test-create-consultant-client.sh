#!/bin/bash

# 내담자와 상담사 생성 테스트 스크립트
# 사용법: ./scripts/test-create-consultant-client.sh <admin_email> <admin_password>

set -e

BASE_URL="http://localhost:8080"
COOKIE_FILE="/tmp/test-create-cookies.txt"
TIMESTAMP=$(date +%s)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 관리자 계정 정보
ADMIN_EMAIL="${1:-test-onboarding-1764739066@test.com}"
ADMIN_PASSWORD="${2:-test1234}"

log_info "관리자 계정: $ADMIN_EMAIL"
log_info "테스트 시작: 내담자 및 상담사 생성"

# 1. 관리자 로그인
log_info "1. 관리자 로그인 시도..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
    -c "$COOKIE_FILE" \
    -b "$COOKIE_FILE")

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    log_success "로그인 성공"
    TENANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.tenantId // empty')
    log_info "테넌트 ID: $TENANT_ID"
else
    log_error "로그인 실패"
    echo "응답: $LOGIN_RESPONSE"
    exit 1
fi

# 2. 상담사 생성
log_info "2. 상담사 생성 시도..."
CONSULTANT_EMAIL="consultant-test-${TIMESTAMP}@test.com"
CONSULTANT_NAME="테스트상담사${TIMESTAMP}"

CONSULTANT_DATA=$(cat <<EOF
{
    "username": "consultant_${TIMESTAMP}",
    "email": "$CONSULTANT_EMAIL",
    "password": "consultant123",
    "name": "$CONSULTANT_NAME",
    "phone": "010-1234-5678",
    "address": "서울시 강남구",
    "addressDetail": "테헤란로 123",
    "postalCode": "06123",
    "specialization": "스트레스, 불안, 우울증",
    "qualifications": "상담심리사 1급",
    "notes": "테스트용 상담사"
}
EOF
)

CONSULTANT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/consultants" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d "$CONSULTANT_DATA")

if echo "$CONSULTANT_RESPONSE" | grep -q '"success":true'; then
    CONSULTANT_ID=$(echo "$CONSULTANT_RESPONSE" | jq -r '.data.id // empty')
    log_success "상담사 생성 성공: ID=$CONSULTANT_ID, Email=$CONSULTANT_EMAIL"
else
    log_error "상담사 생성 실패"
    echo "응답: $CONSULTANT_RESPONSE"
    exit 1
fi

# 3. 내담자 생성
log_info "3. 내담자 생성 시도..."
CLIENT_EMAIL="client-test-${TIMESTAMP}@test.com"
CLIENT_NAME="테스트내담자${TIMESTAMP}"

CLIENT_DATA=$(cat <<EOF
{
    "username": "client_${TIMESTAMP}",
    "email": "$CLIENT_EMAIL",
    "password": "client123",
    "name": "$CLIENT_NAME",
    "age": 30,
    "phone": "010-9876-5432",
    "address": "서울시 서초구",
    "addressDetail": "서초대로 456",
    "postalCode": "06543",
    "consultationPurpose": "테스트용 상담",
    "consultationHistory": "이전 상담 경험 없음",
    "emergencyContact": "테스트부모",
    "emergencyPhone": "010-1111-2222",
    "notes": "테스트용 내담자"
}
EOF
)

CLIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/clients" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d "$CLIENT_DATA")

if echo "$CLIENT_RESPONSE" | grep -q '"success":true'; then
    CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.data.id // empty')
    log_success "내담자 생성 성공: ID=$CLIENT_ID, Email=$CLIENT_EMAIL"
else
    log_error "내담자 생성 실패"
    echo "응답: $CLIENT_RESPONSE"
    exit 1
fi

# 4. 결과 요약
log_info "========================================="
log_success "테스트 완료!"
log_info "생성된 상담사:"
log_info "  - ID: $CONSULTANT_ID"
log_info "  - Email: $CONSULTANT_EMAIL"
log_info "  - Name: $CONSULTANT_NAME"
log_info ""
log_info "생성된 내담자:"
log_info "  - ID: $CLIENT_ID"
log_info "  - Email: $CLIENT_EMAIL"
log_info "  - Name: $CLIENT_NAME"
log_info "========================================="

# 5. 생성된 계정으로 로그인 테스트
log_info "5. 생성된 계정 로그인 테스트..."

# 상담사 로그인 테스트
log_info "5-1. 상담사 로그인 테스트..."
CONSULTANT_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$CONSULTANT_EMAIL\",\"password\":\"consultant123\"}" \
    -c "/tmp/consultant-cookies.txt")

if echo "$CONSULTANT_LOGIN" | grep -q '"success":true'; then
    log_success "상담사 로그인 성공"
else
    log_error "상담사 로그인 실패"
    echo "응답: $CONSULTANT_LOGIN"
fi

# 내담자 로그인 테스트
log_info "5-2. 내담자 로그인 테스트..."
CLIENT_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"client123\"}" \
    -c "/tmp/client-cookies.txt")

if echo "$CLIENT_LOGIN" | grep -q '"success":true'; then
    log_success "내담자 로그인 성공"
else
    log_error "내담자 로그인 실패"
    echo "응답: $CLIENT_LOGIN"
fi

log_success "모든 테스트 완료!"

