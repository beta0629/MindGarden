#!/bin/bash
# 표준화된 프로시저 배포 스크립트 (GitHub Actions용)
# DELIMITER 없는 배포용 파일 사용

set -e

# 환경 변수 설정 (기본값: 개발 환경)
ENV="${1:-dev}"
PROCEDURES_DEPLOY_DIR="database/schema/procedures_standardized/deployment"

# 환경별 설정
# prod: SSH 점프는 운영(PROD_SERVER_*, 기본 beta74). MySQL 대상은 워크플로가 DEV_DB_*와 동일 값을 PROD_DB_*로 주입하는 전제(로컬 기본은 개발 DB와 동일 호스트·계정).
# deploy-procedures-prod-safe.sh(운영 DB 직접)와 경로가 다름 — 운영 DB에 직접 넣을 때는 해당 스크립트를 사용.
# prod DB 비민번호는 환경 변수(PROD_DB_PASSWORD) 필수 — 평문 기본값 없음.
if [ "$ENV" = "prod" ]; then
    SERVER="${PROD_SERVER_HOST:-beta74.cafe24.com}"
    SERVER_USER="${PROD_SERVER_USER:-root}"
    DB_HOST="${PROD_DB_HOST:-beta0629.cafe24.com}"
    DB_USER="${PROD_DB_USER:-mindgarden_dev}"
    DB_PASS="${PROD_DB_PASSWORD:-}"
    DB_NAME="${PROD_DB_NAME:-core_solution}"
    echo "🚀 운영 환경 프로시저 배포 시작..."
else
    SERVER="${DEV_SERVER_HOST:-beta0629.cafe24.com}"
    SERVER_USER="${DEV_SERVER_USER:-root}"
    DB_HOST="${DEV_DB_HOST:-beta0629.cafe24.com}"
    DB_USER="${DEV_DB_USER:-mindgarden_dev}"
    DB_PASS="${DEV_DB_PASSWORD:-MindGardenDev2025!@#}"
    DB_NAME="${DEV_DB_NAME:-core_solution}"
    echo "🚀 개발 환경 프로시저 배포 시작..."
fi

echo "SSH 배포 서버: $SERVER ($SERVER_USER)"
echo "MySQL 대상: host=$DB_HOST user=$DB_USER database=$DB_NAME"

if [ -z "$DB_PASS" ]; then
    echo "❌ 오류: DB 비밀번호가 설정되지 않았습니다."
    if [ "$ENV" = "prod" ]; then
        echo "   운영(prod): PROD_DB_PASSWORD 환경 변수를 설정하세요. 운영 분기에는 기본 비밀번호가 없습니다."
    fi
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

