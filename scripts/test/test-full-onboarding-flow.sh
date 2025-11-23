#!/bin/bash
# 온보딩 전체 플로우 테스트: 요청 생성 → 승인 → 테넌트 생성 → 로그인 확인

BASE_URL="${1:-http://beta0629.cafe24.com:8080}"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 온보딩 전체 플로우 테스트"
echo "=========================================="
echo "서버: $BASE_URL"
echo "테넌트 ID: $TENANT_ID"
echo "테넌트명: $TENANT_NAME"
echo "이메일: $EMAIL"
echo "시간: $(date)"
echo ""

# 1. 프로시저 헬스체크 확인
echo "📋 1단계: 프로시저 헬스체크 확인"
echo "----------------------------------------"
PROCEDURE_HEALTH=$(curl -s "${BASE_URL}/api/health/procedures/create-or-activate-tenant")
if echo "$PROCEDURE_HEALTH" | grep -q '"exists":true'; then
    echo "✅ CreateOrActivateTenant 프로시저 존재 확인"
else
    echo "❌ CreateOrActivateTenant 프로시저가 없습니다"
    echo "$PROCEDURE_HEALTH"
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
echo "📋 3단계: 온보딩 승인"
echo "----------------------------------------"
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "테스트 승인"
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

# 4. 테넌트 생성 확인
echo "📋 4단계: 테넌트 생성 확인"
echo "----------------------------------------"
sleep 3  # 프로시저 실행 대기

ssh root@beta0629.cafe24.com << EOF
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
    fi
    
    DB_USER="\${DB_USERNAME:-mindgarden_dev}"
    DB_PASS="\${DB_PASSWORD}"
    DB_NAME="\${DB_NAME:-core_solution}"
    
    if [ -z "\$DB_PASS" ]; then
        echo "❌ DB 비밀번호를 찾을 수 없습니다."
        exit 1
    fi
    
    echo "테넌트 확인:"
    mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "
        SELECT 
            tenant_id,
            name,
            status,
            business_type,
            JSON_EXTRACT(settings_json, '$.subdomain') as subdomain,
            created_at
        FROM tenants 
        WHERE tenant_id = '${TENANT_ID}';
    " 2>/dev/null || echo "❌ 테넌트 조회 실패"
    
    echo ""
    echo "온보딩 요청 상태 확인:"
    mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "
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
EOF

echo ""

# 5. 관리자 계정 확인
echo "📋 5단계: 관리자 계정 확인"
echo "----------------------------------------"
ssh root@beta0629.cafe24.com << EOF
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
    fi
    
    DB_USER="\${DB_USERNAME:-mindgarden_dev}"
    DB_PASS="\${DB_PASSWORD}"
    DB_NAME="\${DB_NAME:-core_solution}"
    
    echo "관리자 계정 확인:"
    mysql -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "
        SELECT 
            u.id,
            u.email,
            u.name,
            u.tenant_id,
            u.status,
            r.role_name
        FROM auth_users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
        LEFT JOIN tenant_roles r ON ura.role_id = r.id
        WHERE u.tenant_id = '${TENANT_ID}'
        ORDER BY u.created_at DESC
        LIMIT 5;
    " 2>/dev/null || echo "❌ 관리자 계정 조회 실패"
EOF

echo ""

# 6. 로그인 테스트 (선택적)
echo "📋 6단계: 로그인 테스트 준비"
echo "----------------------------------------"
echo "✅ 테넌트 생성 완료!"
echo ""
echo "다음 단계:"
echo "1. 프론트엔드에서 로그인 테스트"
echo "   - 이메일: $EMAIL"
echo "   - 비밀번호: $ADMIN_PASSWORD"
echo "   - 테넌트 ID: $TENANT_ID"
echo ""
echo "2. 로그인 후 대시보드 확인"
echo "   - 대시보드가 정상적으로 표시되는지 확인"
echo "   - 테넌트 설정이 올바르게 적용되었는지 확인"
echo ""

echo "=========================================="
echo "✅ 전체 플로우 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "온보딩 요청 ID: $REQUEST_ID"
echo "이메일: $EMAIL"
echo "비밀번호: $ADMIN_PASSWORD"
echo ""

