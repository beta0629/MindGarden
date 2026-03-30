#!/bin/bash
# 테넌트 생성 원인 확인 스크립트
# 온보딩 프로세스를 통해 생성된 것인지, 직접 수정한 것인지 확인

set -e

TENANT_ID="${1:-tenant-incheon-counseling-003}"

echo "=========================================="
echo "📋 테넌트 생성 원인 확인"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo ""

if [ -f /etc/mindgarden/dev.env ]; then
    source /etc/mindgarden/dev.env
else
    echo "❌ 환경 변수 파일을 찾을 수 없습니다: /etc/mindgarden/dev.env"
    exit 1
fi

# MySQL 쿼리 실행 함수
run_query() {
    mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" \
        --default-character-set=utf8mb4 \
        -N -e "$1" 2>/dev/null
}

echo "=========================================="
echo "1. 테넌트 정보 확인"
echo "=========================================="
TENANT_INFO=$(run_query "SELECT tenant_id, name, business_type, status, created_at, created_by, updated_at, updated_by FROM tenants WHERE tenant_id = '$TENANT_ID' AND (is_deleted IS NULL OR is_deleted = FALSE);")

if [ -z "$TENANT_INFO" ]; then
    echo "❌ 테넌트를 찾을 수 없습니다: $TENANT_ID"
    exit 1
fi

echo "$TENANT_INFO"
echo ""

echo "=========================================="
echo "2. 온보딩 요청 상태 확인"
echo "=========================================="
ONBOARDING_INFO=$(run_query "SELECT HEX(id) as id, tenant_id, tenant_name, status, decided_by, decision_at, decision_note FROM onboarding_request WHERE tenant_id = '$TENANT_ID' ORDER BY decision_at DESC LIMIT 1;")

if [ -z "$ONBOARDING_INFO" ]; then
    echo "⚠️ 온보딩 요청을 찾을 수 없습니다."
    echo "   → 이 테넌트는 온보딩 프로세스가 아닌 다른 방법으로 생성되었을 수 있습니다."
else
    echo "$ONBOARDING_INFO"
    echo ""
    echo "✅ 온보딩 요청이 존재합니다."
    echo "   → 이 테넌트는 온보딩 프로세스를 통해 생성된 것으로 보입니다."
fi
echo ""

echo "=========================================="
echo "3. 테넌트 생성 로그 확인 (최근)"
echo "=========================================="
echo "서버 로그에서 테넌트 생성 관련 로그를 확인하세요:"
echo "  sudo journalctl -u mindgarden-dev.service -n 1000 | grep -i -E \"($TENANT_ID|탁구상회|온보딩 승인 프로세스)\" | tail -20"
echo ""

echo "=========================================="
echo "4. 관리자 계정 확인"
echo "=========================================="
ADMIN_INFO=$(run_query "SELECT id, user_id, email, name, role, created_at, created_by FROM users WHERE tenant_id = '$TENANT_ID' AND role = 'ADMIN' AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY created_at DESC LIMIT 1;")

if [ -z "$ADMIN_INFO" ]; then
    echo "⚠️ 관리자 계정을 찾을 수 없습니다."
else
    echo "$ADMIN_INFO"
    echo ""
    echo "✅ 관리자 계정이 존재합니다."
fi
echo ""

echo "=========================================="
echo "✅ 확인 완료"
echo "=========================================="

