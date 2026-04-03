#!/bin/bash
# 표준화된 프로시저 배포 스크립트 (GitHub Actions용)
# DELIMITER 없는 배포용 파일 사용

set -e

# 환경 변수 설정 (기본값: 개발 환경)
ENV="${1:-dev}"
PROCEDURES_DEPLOY_DIR="database/schema/procedures_standardized/deployment"

fail() {
    echo "❌ $1"
    exit 1
}

# prod (일반): 개발 서버 SSH 점프 후 DEV_DB_* 로 mysql — deploy-procedures-prod.yml
# prod (DEPLOY_TARGET=production_mysql): 운영 호스트 SSH — deploy-procedures-production-mysql.yml (PROD_SERVER_HOST, PROD_SSH_JUMP_HOST 미사용)
if [ "$ENV" = "prod" ]; then
    if [ "${DEPLOY_TARGET:-}" = "production_mysql" ]; then
        [ -n "${PROD_SERVER_HOST:-}" ] || fail "production_mysql: PROD_SERVER_HOST 필수 (GitHub: PRODUCTION_HOST)"
        SERVER="$PROD_SERVER_HOST"
        SERVER_USER="${PROD_SERVER_USER:-root}"
        [ -n "${PROD_DB_HOST:-}" ] || fail "production_mysql: PROD_DB_HOST 필수"
        [ -n "${PROD_DB_USER:-}" ] || fail "production_mysql: PROD_DB_USER 필수"
        [ -n "${PROD_DB_PASSWORD:-}" ] || fail "production_mysql: PROD_DB_PASSWORD 필수"
        [ -n "${PROD_DB_NAME:-}" ] || fail "production_mysql: PROD_DB_NAME 필수"
        DB_HOST="$PROD_DB_HOST"
        DB_USER="$PROD_DB_USER"
        DB_PASS="$PROD_DB_PASSWORD"
        DB_NAME="$PROD_DB_NAME"
    else
        [ -n "${PROD_SSH_JUMP_HOST:-}" ] || fail "PROD_SSH_JUMP_HOST 필수 (GitHub: DEV_SERVER_HOST — 개발 서버 SSH)"
        SERVER="$PROD_SSH_JUMP_HOST"
        SERVER_USER="${PROD_SSH_JUMP_USER:-root}"
        [ -n "${PROD_DB_HOST:-}" ] || fail "prod: PROD_DB_HOST 필수 (개발 DB 호스트)"
        [ -n "${PROD_DB_USER:-}" ] || fail "prod: PROD_DB_USER 필수"
        [ -n "${PROD_DB_PASSWORD:-}" ] || fail "prod: PROD_DB_PASSWORD 필수 (폴백 없음)"
        [ -n "${PROD_DB_NAME:-}" ] || fail "prod: PROD_DB_NAME 필수"
        DB_HOST="$PROD_DB_HOST"
        DB_USER="$PROD_DB_USER"
        DB_PASS="$PROD_DB_PASSWORD"
        DB_NAME="$PROD_DB_NAME"
    fi
    echo "🚀 운영 환경 프로시저 배포 시작..."
else
    [ -n "${DEV_SERVER_HOST:-}" ] || fail "DEV_SERVER_HOST 필수"
    # GitHub dev 워크플로: 시크릿 생략 시 흔한 케이스(앱·DB 동일 서버) — 원격 전용 DB면 DEV_DB_HOST 필수
    if [ -z "${DEV_DB_HOST:-}" ]; then
        echo "ℹ️  DEV_DB_HOST 미설정 → 127.0.0.1 사용 (SSH 대상 서버의 로컬 MySQL). 별도 DB 호스트면 환경변수 DEV_DB_HOST를 설정하세요."
        DEV_DB_HOST="127.0.0.1"
    fi
    [ -n "${DEV_DB_USER:-}" ] || fail "DEV_DB_USER 필수"
    [ -n "${DEV_DB_PASSWORD:-}" ] || fail "DEV_DB_PASSWORD 필수 (폴백 없음)"
    [ -n "${DEV_DB_NAME:-}" ] || fail "DEV_DB_NAME 필수"

    SERVER="$DEV_SERVER_HOST"
    SERVER_USER="${DEV_SERVER_USER:-root}"
    DB_HOST="$DEV_DB_HOST"
    DB_USER="$DEV_DB_USER"
    DB_PASS="$DEV_DB_PASSWORD"
    DB_NAME="$DEV_DB_NAME"
    echo "🚀 개발 환경 프로시저 배포 시작..."
fi

echo "SSH 배포 서버: $SERVER ($SERVER_USER)"
echo "MySQL 대상: host=$DB_HOST user=$DB_USER database=$DB_NAME"

if [ -z "$DB_PASS" ]; then
    fail "DB 비밀번호가 설정되지 않았습니다."
fi

echo ""

# 배포할 프로시저 목록
PROCEDURES=(
    "CheckTimeConflict"
    "GetRefundableSessions"
    "GetRefundStatistics"
    "ValidateIntegratedAmount"
    "GetConsolidatedFinancialData"
    "ProcessIntegratedSalaryCalculation"
    "GetIntegratedSalaryStatistics"
    "CalculateSalaryPreview"
    "ProcessDiscountAccounting"
    "UpdateDailyStatistics"
    "UpdateConsultantPerformance"
)

# 배포용 파일이 없으면 생성
if [ ! -d "$PROCEDURES_DEPLOY_DIR" ] || [ -z "$(ls -A $PROCEDURES_DEPLOY_DIR/*_deploy.sql 2>/dev/null)" ]; then
    echo "📦 배포용 프로시저 파일 생성 중..."
    cd "$(dirname "$0")/../.."
    bash database/schema/procedures_standardized/create_deployment_files.sh
    cd - > /dev/null
fi

# 프로시저 파일을 서버로 업로드
echo "📤 프로시저 파일 업로드 중..."
for proc in "${PROCEDURES[@]}"; do
    file="${PROCEDURES_DEPLOY_DIR}/${proc}_deploy.sql"
    if [ -f "$file" ]; then
        scp "$file" "$SERVER_USER@$SERVER:/tmp/${proc}_deploy.sql" 2>&1 | grep -v "Warning" || true
        echo "✅ ${proc}_deploy.sql 업로드 완료"
    else
        echo "⚠️  파일을 찾을 수 없습니다: $file"
    fi
done

echo ""
echo "📥 서버에서 프로시저 배포 중..."

# SSH로 접속하여 프로시저 배포
ssh "$SERVER_USER@$SERVER" bash << ENDSSH
set -e

DB_HOST="$DB_HOST"
DB_USER="$DB_USER"
DB_PASS="$DB_PASS"
DB_NAME="$DB_NAME"

# 각 프로시저 배포 (DELIMITER 사용)
for proc in ${PROCEDURES[@]}; do
    file="/tmp/\${proc}_deploy.sql"
    if [ -f "\$file" ]; then
        echo "배포 중: \$proc"
        mysql -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" < "\$file" 2>&1 | grep -v "Warning: Using a password" || true

        if [ \${PIPESTATUS[0]} -eq 0 ]; then
            echo "✅ \$proc 배포 완료"
        else
            echo "❌ \$proc 배포 실패"
        fi
    fi
done

echo ""
echo "🔍 배포된 프로시저 확인..."
mysql -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '\$DB_NAME' AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME IN ('CheckTimeConflict', 'GetRefundableSessions', 'GetRefundStatistics', 'ValidateIntegratedAmount', 'GetConsolidatedFinancialData') ORDER BY ROUTINE_NAME;" 2>&1 | grep -v "Warning\|ROUTINE_NAME"

ENDSSH

echo ""
echo "✅ 프로시저 배포 완료!"
