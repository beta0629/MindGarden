#!/bin/bash

# 운영 DB 자동 권한 확인 및 부여 스크립트
# 프로덕션 설정 파일에서 DB 접속 정보를 자동으로 읽어서 실행

echo "========================================"
echo "재무 거래 삭제 권한 자동 확인 및 부여"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="root"

echo ""
echo "1. 운영 서버 접속 및 권한 확인..."

# 운영 서버에서 설정 파일 읽어서 DB 정보 추출 및 권한 확인
ssh ${SSH_USER}@${PROD_SERVER} << 'EOF'
# 설정 파일 경로 찾기
CONFIG_FILE=""
POSSIBLE_PATHS=(
    "/home/mindgard/mindgarden/src/main/resources/application-prod.yml"
    "/home/mindgard/mindgarden/application-prod.yml"
    "/home/mindgard/application-prod.yml"
    "/opt/mindgarden/config/application-prod.yml"
    "/var/lib/mindgarden/config/application-prod.yml"
    "$(find /home -name "application-prod.yml" 2>/dev/null | head -1)"
    "$(find /opt -name "application-prod.yml" 2>/dev/null | head -1)"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CONFIG_FILE="$path"
        break
    fi
done

if [ -z "$CONFIG_FILE" ]; then
    echo "⚠️  설정 파일을 찾을 수 없습니다. 기본값을 사용합니다."
    echo ""
fi

if [ -n "$CONFIG_FILE" ]; then
    echo "✅ 설정 파일 찾음: $CONFIG_FILE"
else
    echo "✅ 기본값 사용 (설정 파일 없음)"
fi

# DB 정보 (application-prod.yml의 기본값 사용)
# 명시적으로 기본값 사용 (환경변수가 이미 설정되어 있어도 무시)
DB_USER="mindgarden"
DB_PASS="mindgarden2025"
DB_NAME="mind_garden"

echo "📋 DB 정보:"
echo "   - 사용자: $DB_USER"
echo "   - 데이터베이스: $DB_NAME"
echo ""

# 권한 존재 여부 확인
echo "2. 권한 존재 여부 확인 중..."
PERMISSION_COUNT=$(mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "SELECT COUNT(*) FROM role_permissions WHERE role_name = 'BRANCH_SUPER_ADMIN' AND permission_code = 'FINANCIAL_TRANSACTION_DELETE' AND is_active = TRUE;" 2>/dev/null || echo "0")
PERMISSION_COUNT=${PERMISSION_COUNT:-0}

# 숫자로 변환 실패시 0으로 처리
if ! [[ "$PERMISSION_COUNT" =~ ^[0-9]+$ ]]; then
    PERMISSION_COUNT=0
fi

if [ "$PERMISSION_COUNT" -gt 0 ]; then
    echo "✅ 권한이 이미 존재합니다!"
    echo ""
    echo "📋 현재 권한 상태:"
    mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        rp.role_name AS '역할명',
        rp.permission_code AS '권한코드',
        p.permission_name AS '권한명',
        CASE 
            WHEN rp.is_active = TRUE THEN '✅ 활성화됨' 
            ELSE '❌ 비활성화됨' 
        END AS '상태',
        rp.updated_at AS '수정일시'
    FROM role_permissions rp
    LEFT JOIN permissions p ON rp.permission_code = p.permission_code
    WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
      AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';
    " 2>/dev/null
    echo ""
    echo "🛑 중복 배포를 방지하기 위해 종료합니다."
    exit 0
fi

echo "⚠️  권한이 없습니다. 권한을 부여합니다..."
echo ""

# 권한 부여
echo "3. 권한 부여 중..."
mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << SQL 2>/dev/null

-- 1. 권한 코드 추가
INSERT IGNORE INTO permissions (
    permission_code, 
    permission_name, 
    permission_description, 
    category, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'FINANCIAL_TRANSACTION_DELETE', 
    '재무 거래 삭제', 
    'ERP 재무 거래를 삭제할 수 있는 권한 (논리 삭제)', 
    'FINANCIAL', 
    TRUE, 
    NOW(), 
    NOW()
);

-- 2. BRANCH_SUPER_ADMIN 역할에 권한 부여
INSERT IGNORE INTO role_permissions (
    role_name, 
    permission_code, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'BRANCH_SUPER_ADMIN', 
    'FINANCIAL_TRANSACTION_DELETE', 
    TRUE, 
    NOW(), 
    NOW()
);

-- 3. 비활성화된 권한이 있다면 활성화
UPDATE role_permissions 
SET 
    is_active = TRUE, 
    updated_at = NOW()
WHERE 
    role_name = 'BRANCH_SUPER_ADMIN' 
    AND permission_code = 'FINANCIAL_TRANSACTION_DELETE'
    AND is_active = FALSE;

SQL

if [ $? -eq 0 ]; then
    echo "✅ 권한 부여 완료!"
    echo ""
    echo "4. 최종 확인:"
    mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SELECT 
        rp.role_name AS '역할명',
        rp.permission_code AS '권한코드',
        p.permission_name AS '권한명',
        CASE 
            WHEN rp.is_active = TRUE THEN '✅ 활성화됨' 
            ELSE '❌ 비활성화됨' 
        END AS '상태'
    FROM role_permissions rp
    LEFT JOIN permissions p ON rp.permission_code = p.permission_code
    WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
      AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';
    " 2>/dev/null
else
    echo "❌ 권한 부여 실패"
    exit 1
fi

EOF

echo ""
echo "========================================"
echo "작업 완료!"
echo "========================================"

