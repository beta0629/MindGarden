#!/bin/bash
# 개발 서버 내부에서 직접 실행하는 온보딩 테스트

TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
BASE_URL="http://localhost:8080"

echo "=========================================="
echo "🧪 온보딩 전체 플로우 테스트 (서버 내부)"
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

# 1. 서버 연결 확인
echo "📋 1단계: 서버 연결 확인"
echo "----------------------------------------"
if ! timeout 5 curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo "❌ 서버에 연결할 수 없습니다: $BASE_URL"
    exit 1
fi
echo "✅ 서버 연결 확인 완료"
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

REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    echo "$REQUEST_RESPONSE"
    exit 1
fi

echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
echo "응답: $REQUEST_RESPONSE"
echo ""

# 3. 온보딩 승인
echo "📋 3단계: 온보딩 승인 (관리자 계정 자동 생성 포함)"
echo "----------------------------------------"
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "테스트 승인 - 관리자 계정 자동 생성 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
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
echo "온보딩 요청 상태 확인:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        id,
        tenant_id,
        tenant_name,
        status,
        decision_status,
        decision_note
    FROM onboarding_requests 
    WHERE id = ${REQUEST_ID};
" 2>/dev/null || echo "❌ 온보딩 요청 조회 실패"

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

# 7. 역할 할당 확인
echo "📋 7단계: 역할 할당 확인"
echo "----------------------------------------"
echo "사용자 역할 할당 확인:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        u.id,
        u.email,
        u.tenant_id,
        ura.role_id,
        tr.role_name,
        tr.role_code
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN tenant_roles tr ON ura.role_id = tr.id
    WHERE u.tenant_id = '${TENANT_ID}' 
      AND u.email = '${EMAIL}';
" 2>/dev/null || echo "❌ 역할 할당 조회 실패"

echo ""

# 8. 대시보드 생성 확인
echo "📋 8단계: 대시보드 생성 확인"
echo "----------------------------------------"
echo "대시보드 생성 확인:"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        dashboard_id,
        tenant_id,
        dashboard_type,
        dashboard_name,
        role_code,
        is_default,
        created_at
    FROM tenant_dashboards 
    WHERE tenant_id = '${TENANT_ID}'
    ORDER BY created_at;
" 2>/dev/null || echo "❌ 대시보드 조회 실패"

echo ""

# 9. 최종 요약
echo "=========================================="
echo "✅ 전체 플로우 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "온보딩 요청 ID: $REQUEST_ID"
echo "이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""

