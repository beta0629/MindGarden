#!/bin/bash
# 표준화된 프로시저 배포 스크립트 (GitHub Actions용)
# DELIMITER 없는 배포용 파일 사용

set -e

# 환경 변수 설정 (기본값: 개발 환경)
ENV="${1:-dev}"
PROCEDURES_DEPLOY_DIR="database/schema/procedures_standardized/deployment"

# dev/prod 공통: docs/standards DEPLOYMENT_STANDARD 개발 서버 예시와 동일한 폴백 비밀번호.
# prod에서 PROD_DB_PASSWORD(또는 워크플로의 DEV_DB_PASSWORD 주입)가 비어 있으면 개발과 동일 기본값 사용.
# 예외: DEPLOY_TARGET=production_mysql(GitHub Actions 운영 MySQL 전용)일 때는 폴백 없음 — PROD_DB_PASSWORD 필수.
DEFAULT_DEV_DB_PASSWORD='MindGardenDev2025!@#'

# 환경별 설정
# prod: MySQL이 개발 DB(beta0629 등)일 때 운영 서버에서 3306으로 붙으면 방화벽(2003)으로 실패하는 경우가 많음.
# → PROD_SSH_JUMP_HOST(워크플로에서 DEV_SERVER_HOST 주입)가 있으면 SCP·SSH는 그 호스트로 한다. 없으면 PROD_SERVER_* (운영 점프).
# deploy-procedures-prod-safe.sh(운영 DB 직접)와 경로가 다름.
if [ "$ENV" = "prod" ]; then
    SERVER="${PROD_SSH_JUMP_HOST:-${PROD_SERVER_HOST:-beta74.cafe24.com}}"
    SERVER_USER="${PROD_SSH_JUMP_USER:-${PROD_SERVER_USER:-root}}"
    if [ "${DEPLOY_TARGET:-}" = "production_mysql" ]; then
        DB_HOST="${PROD_DB_HOST:-beta74.cafe24.com}"
        DB_USER="${PROD_DB_USER:-mindgarden_prod}"
        DB_PASS="${PROD_DB_PASSWORD:-}"
    else
        DB_HOST="${PROD_DB_HOST:-beta0629.cafe24.com}"
        DB_USER="${PROD_DB_USER:-mindgarden_dev}"
        DB_PASS="${PROD_DB_PASSWORD:-${DEFAULT_DEV_DB_PASSWORD}}"
    fi
    DB_NAME="${PROD_DB_NAME:-core_solution}"
    echo "🚀 운영 환경 프로시저 배포 시작..."
else
    SERVER="${DEV_SERVER_HOST:-beta0629.cafe24.com}"
    SERVER_USER="${DEV_SERVER_USER:-root}"
    DB_HOST="${DEV_DB_HOST:-beta0629.cafe24.com}"
    DB_USER="${DEV_DB_USER:-mindgarden_dev}"
    DB_PASS="${DEV_DB_PASSWORD:-${DEFAULT_DEV_DB_PASSWORD}}"
    DB_NAME="${DEV_DB_NAME:-core_solution}"
    echo "🚀 개발 환경 프로시저 배포 시작..."
fi

echo "SSH 배포 서버: $SERVER ($SERVER_USER)"
echo "MySQL 대상: host=$DB_HOST user=$DB_USER database=$DB_NAME"

if [ -z "$DB_PASS" ]; then
    echo "❌ 오류: DB 비밀번호가 설정되지 않았습니다."
    exit 1
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

