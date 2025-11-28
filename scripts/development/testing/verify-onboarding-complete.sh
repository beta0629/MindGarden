#!/bin/bash
# 온보딩 완료 후 전체 검증 스크립트

TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
BASE_URL="http://localhost:8080"
ADMIN_EMAIL="superadmin@mindgarden.com"
ADMIN_PASS="admin123"

echo "=========================================="
echo "🧪 온보딩 완료 후 전체 검증"
echo "=========================================="
echo "시간: $(date)"
echo ""

# 환경 변수 로드
if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
fi

DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-core_solution}"

# 1. 온보딩 요청 생성 및 승인
echo "📋 1단계: 온보딩 요청 생성 및 승인"
echo "----------------------------------------"

# 관리자 로그인
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "${ADMIN_EMAIL}",
  "password": "${ADMIN_PASS}"
}
EOF
)

curl -s -c /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD" > /dev/null

# 온보딩 요청 생성
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

if [ -z "$REQUEST_ID" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    exit 1
fi

echo "✅ 온보딩 요청 생성: ID=$REQUEST_ID"

# 온보딩 승인
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "${ADMIN_EMAIL}",
  "note": "전체 검증 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

if ! echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "❌ 온보딩 승인 실패"
    exit 1
fi

echo "✅ 온보딩 승인 완료"
echo ""

# 프로시저 실행 대기
sleep 5

# 2. 테넌트 생성 확인
echo "📋 2단계: 테넌트 생성 확인"
echo "----------------------------------------"
TENANT_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT COUNT(*) FROM tenants WHERE tenant_id = '${TENANT_ID}';
" 2>/dev/null)

if [ "$TENANT_EXISTS" -eq 0 ]; then
    echo "❌ 테넌트가 생성되지 않았습니다"
    exit 1
fi

echo "✅ 테넌트 생성 확인"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT tenant_id, name, status, business_type FROM tenants WHERE tenant_id = '${TENANT_ID}';
" 2>/dev/null
echo ""

# 3. 관리자 계정 확인
echo "📋 3단계: 관리자 계정 확인"
echo "----------------------------------------"
ADMIN_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT COUNT(*) FROM users WHERE tenant_id = '${TENANT_ID}' AND email = '${EMAIL}';
" 2>/dev/null)

if [ "$ADMIN_EXISTS" -eq 0 ]; then
    echo "❌ 관리자 계정이 생성되지 않았습니다"
    exit 1
fi

echo "✅ 관리자 계정 생성 확인"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT id, email, username, tenant_id, role, is_active, is_email_verified 
    FROM users 
    WHERE tenant_id = '${TENANT_ID}' AND email = '${EMAIL}';
" 2>/dev/null
echo ""

# 4. 역할 할당 확인
echo "📋 4단계: 역할 할당 확인"
echo "----------------------------------------"
USER_ID=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT id FROM users WHERE tenant_id = '${TENANT_ID}' AND email = '${EMAIL}';
" 2>/dev/null)

if [ -n "$USER_ID" ]; then
    ROLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
        SELECT COUNT(*) 
        FROM user_role_assignments 
        WHERE user_id = ${USER_ID};
    " 2>/dev/null)
    
    if [ "$ROLE_COUNT" -gt 0 ]; then
        echo "✅ 역할 할당 확인 (개수: $ROLE_COUNT)"
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
            SELECT 
                ura.id,
                ura.user_id,
                ura.role_id,
                tr.role_name,
                tr.role_code
            FROM user_role_assignments ura
            LEFT JOIN tenant_roles tr ON ura.role_id = tr.id
            WHERE ura.user_id = ${USER_ID};
        " 2>/dev/null
    else
        echo "⚠️  역할이 할당되지 않았습니다"
    fi
else
    echo "❌ 사용자 ID를 찾을 수 없습니다"
fi
echo ""

# 5. 대시보드 생성 확인
echo "📋 5단계: 대시보드 생성 확인"
echo "----------------------------------------"
DASHBOARD_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT COUNT(*) FROM tenant_dashboards WHERE tenant_id = '${TENANT_ID}';
" 2>/dev/null)

if [ "$DASHBOARD_COUNT" -gt 0 ]; then
    echo "✅ 대시보드 생성 확인 (개수: $DASHBOARD_COUNT)"
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SELECT 
            dashboard_id,
            tenant_id,
            dashboard_type,
            dashboard_name,
            role_code,
            is_default
        FROM tenant_dashboards 
        WHERE tenant_id = '${TENANT_ID}'
        ORDER BY created_at;
    " 2>/dev/null
else
    echo "⚠️  대시보드가 생성되지 않았습니다"
fi
echo ""

# 6. 역할 템플릿 확인
echo "📋 6단계: 역할 템플릿 확인"
echo "----------------------------------------"
ROLE_TEMPLATE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = '${TENANT_ID}';
" 2>/dev/null)

if [ "$ROLE_TEMPLATE_COUNT" -gt 0 ]; then
    echo "✅ 역할 템플릿 생성 확인 (개수: $ROLE_TEMPLATE_COUNT)"
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SELECT 
            id,
            tenant_id,
            role_name,
            role_code,
            is_default
        FROM tenant_roles 
        WHERE tenant_id = '${TENANT_ID}'
        ORDER BY created_at;
    " 2>/dev/null
else
    echo "⚠️  역할 템플릿이 생성되지 않았습니다"
fi
echo ""

# 7. 관리자 계정 로그인 테스트
echo "📋 7단계: 관리자 계정 로그인 테스트"
echo "----------------------------------------"
LOGIN_TEST_PAYLOAD=$(cat <<EOF
{
  "email": "${EMAIL}",
  "password": "${ADMIN_PASSWORD}"
}
EOF
)

LOGIN_TEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_TEST_PAYLOAD")

if echo "$LOGIN_TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 관리자 계정 로그인 성공"
    echo "$LOGIN_TEST_RESPONSE" | head -5
else
    echo "❌ 관리자 계정 로그인 실패"
    echo "$LOGIN_TEST_RESPONSE"
fi
echo ""

# 8. 최종 요약
echo "=========================================="
echo "✅ 전체 검증 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "온보딩 요청 ID: $REQUEST_ID"
echo "관리자 이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""
echo "검증 결과:"
echo "  - 테넌트 생성: $([ "$TENANT_EXISTS" -gt 0 ] && echo '✅' || echo '❌')"
echo "  - 관리자 계정 생성: $([ "$ADMIN_EXISTS" -gt 0 ] && echo '✅' || echo '❌')"
echo "  - 역할 할당: $([ "$ROLE_COUNT" -gt 0 ] && echo '✅' || echo '⚠️')"
echo "  - 대시보드 생성: $([ "$DASHBOARD_COUNT" -gt 0 ] && echo '✅' || echo '⚠️')"
echo "  - 역할 템플릿 생성: $([ "$ROLE_TEMPLATE_COUNT" -gt 0 ] && echo '✅' || echo '⚠️')"
echo ""

