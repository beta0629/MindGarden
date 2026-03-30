#!/bin/bash
# 이메일 중복 확인 스크립트
# 사용법: ./check-email-duplicate.sh beta74@live.co.kr

EMAIL="${1:-beta74@live.co.kr}"
EMAIL_LOWER=$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]')

echo "=========================================="
echo "이메일 중복 확인: $EMAIL"
echo "=========================================="
echo ""

# 데이터베이스 정보 (환경 변수에서 가져오기)
DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_NAME="${DB_NAME:-core_solution}"
DB_HOST="${DB_HOST:-localhost}"

echo "1. users 테이블에서 이메일 조회:"
mysql -u "$DB_USER" -p"${DB_PASSWORD}" -h "$DB_HOST" "$DB_NAME" <<EOF
SELECT 
    id, 
    email, 
    role, 
    tenant_id, 
    is_deleted, 
    created_at,
    updated_at
FROM users 
WHERE LOWER(email) = '$EMAIL_LOWER' 
   OR email = '$EMAIL'
   OR email = '$EMAIL_LOWER';
EOF

echo ""
echo "2. onboarding_requests 테이블에서 이메일 조회:"
mysql -u "$DB_USER" -p"${DB_PASSWORD}" -h "$DB_HOST" "$DB_NAME" <<EOF
SELECT 
    id,
    tenant_id,
    tenant_name,
    requested_by,
    status,
    is_deleted,
    created_at,
    decision_at
FROM onboarding_requests 
WHERE LOWER(requested_by) = '$EMAIL_LOWER' 
   OR requested_by = '$EMAIL'
   OR requested_by = '$EMAIL_LOWER';
EOF

echo ""
echo "3. 중복 확인 요약:"
mysql -u "$DB_USER" -p"${DB_PASSWORD}" -h "$DB_HOST" "$DB_NAME" <<EOF
SELECT 
    'users' AS table_name,
    COUNT(*) AS count,
    GROUP_CONCAT(CONCAT('id:', id, ', role:', role, ', tenant:', tenant_id) SEPARATOR ' | ') AS details
FROM users 
WHERE LOWER(email) = '$EMAIL_LOWER' AND is_deleted = FALSE
UNION ALL
SELECT 
    'onboarding_requests (APPROVED)' AS table_name,
    COUNT(*) AS count,
    GROUP_CONCAT(CONCAT('id:', id, ', status:', status) SEPARATOR ' | ') AS details
FROM onboarding_requests 
WHERE LOWER(requested_by) = '$EMAIL_LOWER' 
  AND status = 'APPROVED' 
  AND is_deleted = FALSE
UNION ALL
SELECT 
    'onboarding_requests (PENDING)' AS table_name,
    COUNT(*) AS count,
    GROUP_CONCAT(CONCAT('id:', id, ', status:', status) SEPARATOR ' | ') AS details
FROM onboarding_requests 
WHERE LOWER(requested_by) = '$EMAIL_LOWER' 
  AND status = 'PENDING' 
  AND is_deleted = FALSE;
EOF

echo ""
echo "=========================================="
echo "조회 완료"
echo "=========================================="

