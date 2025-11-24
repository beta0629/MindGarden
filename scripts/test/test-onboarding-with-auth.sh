#!/bin/bash
# 관리자 계정으로 로그인 후 온보딩 승인 테스트

TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
BASE_URL="http://localhost:8080"
ADMIN_EMAIL="superadmin@mindgarden.com"
ADMIN_PASSWORD="admin123"

echo "=========================================="
echo "🧪 온보딩 전체 플로우 테스트 (인증 포함)"
echo "=========================================="
echo "서버: $BASE_URL"
echo "테넌트 ID: $TENANT_ID"
echo "테넌트명: $TENANT_NAME"
echo "이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo "시간: $(date)"
echo ""

# 환경 변수 로드
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
fi

DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-core_solution}"

# 1. 관리자 로그인
echo "📋 1단계: 관리자 로그인"
echo "----------------------------------------"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "${ADMIN_EMAIL}",
  "password": "${ADMIN_PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD")

# 세션 기반 인증인 경우 쿠키 사용
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 관리자 로그인 성공"
    echo "응답: $LOGIN_RESPONSE"
else
    echo "❌ 관리자 로그인 실패"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 2. 온보딩 요청 생성
echo "📋 2단계: 온보딩 요청 생성"
echo "----------------------------------------"
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantId": "${TENANT_ID}",
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    echo "$REQUEST_RESPONSE"
    exit 1
fi

echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
echo ""

# 3. 온보딩 승인
echo "📋 3단계: 온보딩 승인 (관리자 계정 자동 생성 포함)"
echo "----------------------------------------"
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "${ADMIN_EMAIL}",
  "note": "테스트 승인 - 관리자 계정 자동 생성 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "✅ 온보딩 승인 완료"
    echo "응답: $APPROVE_RESPONSE"
else
    echo "❌ 온보딩 승인 실패"
    echo "$APPROVE_RESPONSE"
    exit 1
fi
echo ""

# 4. 프로시저 실행 대기
echo "📋 4단계: 프로시저 실행 대기 (5초)"
echo "----------------------------------------"
sleep 5
echo "✅ 대기 완료"
echo ""

# 5. 테넌트 생성 확인
echo "📋 5단계: 테넌트 생성 확인"
echo "----------------------------------------"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        tenant_id,
        name,
        status,
        business_type,
        created_at
    FROM tenants 
    WHERE tenant_id = '${TENANT_ID}';
" 2>/dev/null || echo "❌ 테넌트 조회 실패"

echo ""

# 6. 관리자 계정 확인 (핵심 테스트)
echo "📋 6단계: 관리자 계정 자동 생성 확인 (핵심)"
echo "----------------------------------------"
echo "관리자 계정 확인 (users 테이블):"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        id,
        email,
        username,
        name,
        tenant_id,
        role,
        is_active,
        is_email_verified,
        created_at
    FROM users 
    WHERE tenant_id = '${TENANT_ID}' 
      AND email = '${EMAIL}'
    ORDER BY created_at DESC
    LIMIT 5;
" 2>/dev/null || echo "❌ 관리자 계정 조회 실패"

echo ""
echo "관리자 계정 개수 확인:"
ADMIN_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT COUNT(*) 
    FROM users 
    WHERE tenant_id = '${TENANT_ID}' 
      AND email = '${EMAIL}';
" 2>/dev/null)

if [ "$ADMIN_COUNT" -gt 0 ]; then
    echo "✅ 관리자 계정이 생성되었습니다! (개수: $ADMIN_COUNT)"
else
    echo "❌ 관리자 계정이 생성되지 않았습니다!"
fi

echo ""

# 7. 최종 요약
echo "=========================================="
echo "✅ 전체 플로우 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "온보딩 요청 ID: $REQUEST_ID"
echo "이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""

