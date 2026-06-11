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

# 운영 P0 hotfix 2026-06-11 — mind_garden 재적재 차단 (SSOT 가드)
# 배경: core_solution / mind_garden 양쪽에 동명 프로시저가 적재되면
#   SimpleJdbcCallOperations.metaData() 가 INFORMATION_SCHEMA.ROUTINES 다중 매칭으로
#   시그니처를 결정하지 못해 일별 통계 배치(00:00·00:05) 가 100% 실패한다.
# 정책: 표준 프로시저 SSOT 스키마는 core_solution 만 허용한다. mind_garden 잔존 객체는
#   docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md 절차에 따라 별도 수동 정리한다.
# 회피 우회: 환경변수 ALLOW_MIND_GARDEN_REDEPLOY=true 를 명시(긴급 검수용)할 때만 통과.
case "${DB_NAME}" in
    mind_garden|mind_garden_legacy_*)
        if [ "${ALLOW_MIND_GARDEN_REDEPLOY:-false}" != "true" ]; then
            fail "표준 프로시저는 '${DB_NAME}' 스키마에 재적재할 수 없습니다 (P0 충돌 차단). 운영 SSOT 는 core_solution 만 허용합니다. 정리 가이드: docs/운영반영/MIND_GARDEN_LEGACY_CLEANUP_GUIDE.md"
        fi
        echo "::warning::ALLOW_MIND_GARDEN_REDEPLOY=true 우회로 '${DB_NAME}' 적재를 강제 진행합니다. 운영 검수자 확인이 필요합니다."
        ;;
esac

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
    "ApproveSalaryWithErpSync"
    "ProcessSalaryPaymentWithErpSync"
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
        if ! scp "$file" "$SERVER_USER@$SERVER:/tmp/${proc}_deploy.sql"; then
            fail "SCP 실패: ${proc}_deploy.sql → ${SERVER_USER}@${SERVER}:/tmp/"
        fi
        echo "✅ ${proc}_deploy.sql 업로드 완료"
    else
        echo "⚠️  파일을 찾을 수 없습니다: $file"
    fi
done

echo ""
echo "📥 서버에서 프로시저 배포 중..."

# MySQL 8: root 등으로 만들어진 프로시저는 일반 계정이 DROP 할 수 없음(1227 SYSTEM_USER).
# 재시도 순서: PROD_DB_ROUTINE_ADMIN_* → PROD_DB_ROUTINE_FALLBACK_ROOT_PASSWORD(root) → root + 앱 DB 비밀번호(127.0.0.1·DB_HOST).
ROUTINE_ADMIN_USER="${PROD_DB_ROUTINE_ADMIN_USER:-}"
ROUTINE_ADMIN_PASS="${PROD_DB_ROUTINE_ADMIN_PASSWORD:-}"
ROUTINE_FALLBACK_ROOT_PASS="${PROD_DB_ROUTINE_FALLBACK_ROOT_PASSWORD:-}"

# SSH로 접속하여 프로시저 배포 (한 건이라도 mysql 실패 시 비정상 종료 → CI 실패)
ssh "$SERVER_USER@$SERVER" bash << ENDSSH
set -euo pipefail

DB_HOST="$DB_HOST"
DB_USER="$DB_USER"
DB_PASS="$DB_PASS"
DB_NAME="$DB_NAME"
ROUTINE_ADMIN_USER="$ROUTINE_ADMIN_USER"
ROUTINE_ADMIN_PASS="$ROUTINE_ADMIN_PASS"
ROUTINE_FALLBACK_ROOT_PASS="$ROUTINE_FALLBACK_ROOT_PASS"
# 비밀번호는 CI 로컬에서 heredoc 전개 시 원격 스크립트에 포함됨(기존 -p 와 동일 수준). 클라이언트 경고 회피용.
export MYSQL_PWD="\$DB_PASS"
trap 'unset MYSQL_PWD 2>/dev/null || true' EXIT

proc_failed=0
# 각 프로시저 배포 (배포용 SQL에 DELIMITER 포함)
for proc in ${PROCEDURES[@]}; do
    file="/tmp/\${proc}_deploy.sql"
    if [ -f "\$file" ]; then
        echo "배포 중: \$proc"
        log="/tmp/mysql_deploy_\${proc}.log"
        if mysql -h "\$DB_HOST" -u "\$DB_USER" "\$DB_NAME" < "\$file" >"\$log" 2>&1; then
            echo "✅ \$proc 배포 완료"
        else
            echo "❌ \$proc 배포 실패 (1차: \$DB_USER)"
            cat "\$log"
            if grep -qE '1227|SYSTEM_USER' "\$log"; then
                retry_ok=0
                if [ -n "\${ROUTINE_ADMIN_USER:-}" ]; then
                    echo "::notice::1227(SYSTEM_USER) → PRODUCTION_DB_PROCEDURE_USER 로 재시도: \$proc"
                    export MYSQL_PWD="\$ROUTINE_ADMIN_PASS"
                    if mysql -h "\$DB_HOST" -u "\$ROUTINE_ADMIN_USER" "\$DB_NAME" < "\$file" >"\${log}.admin" 2>&1; then
                        retry_ok=1
                    else
                        cat "\${log}.admin"
                    fi
                    export MYSQL_PWD="\$DB_PASS"
                fi
                if [ "\$retry_ok" -eq 0 ] && [ -n "\${ROUTINE_FALLBACK_ROOT_PASS:-}" ]; then
                    echo "::notice::1227(SYSTEM_USER) → root(PRODUCTION_MYSQL_ROOT_PASSWORD) 로 재시도: \$proc"
                    export MYSQL_PWD="\$ROUTINE_FALLBACK_ROOT_PASS"
                    for rh in 127.0.0.1 "\$DB_HOST"; do
                        if mysql -h "\$rh" -u root "\$DB_NAME" < "\$file" >"\${log}.root.\${rh}" 2>&1; then
                            retry_ok=1
                            break
                        fi
                    done
                    export MYSQL_PWD="\$DB_PASS"
                fi
                if [ "\$retry_ok" -eq 0 ]; then
                    echo "::notice::1227(SYSTEM_USER) → root + 앱 DB 비밀번호 동일 가정(127.0.0.1·DB_HOST) 재시도: \$proc"
                    export MYSQL_PWD="\$DB_PASS"
                    for rh in 127.0.0.1 "\$DB_HOST"; do
                        if mysql -h "\$rh" -u root "\$DB_NAME" < "\$file" >"\${log}.rootpw.\${rh}" 2>&1; then
                            retry_ok=1
                            break
                        fi
                    done
                    export MYSQL_PWD="\$DB_PASS"
                fi
                if [ "\$retry_ok" -eq 1 ]; then
                    echo "✅ \$proc 배포 완료 (SYSTEM_USER 재시도)"
                else
                    proc_failed=1
                fi
            else
                proc_failed=1
            fi
        fi
    else
        echo "⚠️  원격에 없음(스킵): \$file"
    fi
done

if [ "\$proc_failed" -ne 0 ]; then
    echo "::error::표준 프로시저 mysql 적용이 하나 이상 실패했습니다. MySQL 8 SYSTEM_USER(1227)이면: (1) Secret PRODUCTION_DB_PROCEDURE_USER·PASSWORD (2) PRODUCTION_MYSQL_ROOT_PASSWORD (3) 로컬 MySQL에서 root 비밀번호가 앱 DB와 동일한 경우 자동 root 재시도. PRODUCTION_DB_HOST=127.0.0.1 권장."
    exit 1
fi

echo ""
echo "🔍 DB 연결·스키마 확인..."
vlog="/tmp/mysql_deploy_verify.log"
if ! mysql -h "\$DB_HOST" -u "\$DB_USER" "\$DB_NAME" -e "SELECT DATABASE() AS current_schema, COUNT(*) AS procedure_count FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE';" >"\$vlog" 2>&1; then
    cat "\$vlog"
    exit 1
fi
cat "\$vlog"

ENDSSH

echo ""
echo "✅ 프로시저 배포 완료 (모든 mysql 단계 성공)"
