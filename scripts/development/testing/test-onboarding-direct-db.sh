#!/bin/bash
# DB에서 직접 온보딩 승인 및 프로시저 실행 테스트

TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 온보딩 DB 직접 테스트"
echo "=========================================="
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

# 1. 온보딩 요청 생성 (DB 직접)
echo "📋 1단계: 온보딩 요청 생성 (DB 직접)"
echo "----------------------------------------"
REQUEST_ID=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    INSERT INTO onboarding_requests (
        tenant_id, tenant_name, requested_by, status, risk_level, 
        business_type, checklist_json, created_at, updated_at
    ) VALUES (
        '${TENANT_ID}', '${TENANT_NAME}', '${EMAIL}', 'PENDING', 'LOW',
        'CONSULTATION', '{\"adminPassword\": \"${ADMIN_PASSWORD}\"}', NOW(), NOW()
    );
    SELECT LAST_INSERT_ID();
" 2>/dev/null)

if [ -z "$REQUEST_ID" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    exit 1
fi

echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
echo ""

# 2. 비밀번호 해시 생성 (Java BCrypt 필요 - 임시로 간단한 해시 사용)
echo "📋 2단계: 관리자 비밀번호 해시 생성"
echo "----------------------------------------"
# 실제로는 Java에서 BCrypt로 해시해야 하지만, 테스트를 위해 프로시저에서 처리하도록 함
# 여기서는 임시 해시를 생성 (실제로는 Java에서 생성된 해시를 사용해야 함)
ADMIN_PASSWORD_HASH="\$2a\$10\$dummy.hash.for.testing.purposes.only"
echo "⚠️  실제 운영에서는 Java에서 BCrypt 해시를 생성해야 합니다"
echo ""

# 3. 프로시저 직접 실행
echo "📋 3단계: ProcessOnboardingApproval 프로시저 실행"
echo "----------------------------------------"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << EOF
SET @p_request_id = ${REQUEST_ID};
SET @p_tenant_id = '${TENANT_ID}';
SET @p_tenant_name = '${TENANT_NAME}';
SET @p_business_type = 'CONSULTATION';
SET @p_approved_by = 'superadmin@mindgarden.com';
SET @p_decision_note = 'DB 직접 테스트 승인';
SET @p_contact_email = '${EMAIL}';
SET @p_admin_password_hash = '${ADMIN_PASSWORD_HASH}';
SET @p_success = FALSE;
SET @p_message = '';

CALL ProcessOnboardingApproval(
    @p_request_id,
    @p_tenant_id,
    @p_tenant_name,
    @p_business_type,
    @p_approved_by,
    @p_decision_note,
    @p_contact_email,
    @p_admin_password_hash,
    @p_success,
    @p_message
);

SELECT @p_success as success, @p_message as message;
EOF

echo ""

# 4. 프로시저 실행 대기
echo "📋 4단계: 프로시저 실행 대기 (3초)"
echo "----------------------------------------"
sleep 3
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
    echo ""
    echo "프로시저 로그 확인:"
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
    " 2>/dev/null
fi

echo ""

# 7. 최종 요약
echo "=========================================="
echo "✅ 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "온보딩 요청 ID: $REQUEST_ID"
echo "이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""

