#!/bin/bash
# 표준화된 프로시저 배포 스크립트 (GitHub Actions용)
# 배포 커밋 범위에서 바뀐 프로시저 파일만 교체한다.
# 새 정의는 스테이징 이름으로 먼저 만들고, 성공한 뒤에만 실제 프로시저를 바꾼다.
# 실제 프로시저를 DROP 하기 전에 SHOW CREATE 를 저장해 최종 CREATE 실패 시 되돌린다.

set -e

# 환경 변수 설정 (기본값: 개발 환경)
ENV="${1:-dev}"

fail() {
    echo "❌ $1"
    exit 1
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck disable=SC1091
. "$SCRIPT_DIR/procedure-deploy-changed-only.sh"

# 접속 값만 채운다. DDL 은 하지 않는다.
procedure_deploy_bind_target() {
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
    else
        [ -n "${DEV_SERVER_HOST:-}" ] || fail "DEV_SERVER_HOST 필수"
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
    fi
    export SERVER SERVER_USER DB_HOST DB_USER DB_PASS DB_NAME
}

# 저장소 SQL 과 information_schema.PARAMETERS 가 다른 프로시저만 고른다.
# confirm 이 CONFIRM 이 아니면 SELECT 만 하고 끝난다.
procedure_deploy_db_diff_gate() {
    local snap list confirm_label
    procedure_deploy_bind_target
    if [ "$ENV" = "dev" ] && [ "${DEPLOY_TARGET:-}" = "production_mysql" ]; then
        fail "개발 db-diff 가 production_mysql 대상을 가리킵니다. DDL 하지 않습니다."
    fi
    if [ "$ENV" = "dev" ] && [ -n "${PROD_DB_HOST:-}" ] && [ "$DB_HOST" = "$PROD_DB_HOST" ] \
        && [ -n "${PROD_DB_NAME:-}" ] && [ "$DB_NAME" = "$PROD_DB_NAME" ]; then
        fail "개발 db-diff 대상 호스트·스키마가 운영 DB 와 같습니다. DDL 하지 않습니다."
    fi
    echo "db-diff MySQL host=${DB_HOST} database=${DB_NAME} env=${ENV} deploy_target=${DEPLOY_TARGET:-}"
    snap=$(mktemp "${TMPDIR:-/tmp}/mg-proc-snap.XXXXXX")
    list=$(mktemp "${TMPDIR:-/tmp}/mg-proc-difflist.XXXXXX")
    if ! procedure_deploy_fetch_parameter_snapshot >"$snap"; then
        rm -f "$snap" "$list"
        fail "information_schema 조회에 실패했습니다. DDL 은 하지 않았습니다."
    fi
    export PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT="$snap"
    export PROCEDURE_DEPLOY_DB_DIFF_LIST="$list"
    if ! bash "$SCRIPT_DIR/procedure-deploy-db-diff.sh"; then
        rm -f "$snap" "$list"
        fail "db-diff 비교에 실패했습니다. DDL 은 하지 않았습니다."
    fi
    rm -f "$snap"
    if [ "${PROCEDURE_DEPLOY_DB_DIFF_CONFIRM:-}" != "CONFIRM" ]; then
        rm -f "$list"
        echo "db-diff dry-run. CREATE/DROP 하지 않습니다."
        exit 0
    fi
    if [ ! -s "$list" ]; then
        rm -f "$list"
        echo "db-diff: 저장소와 다른 프로시저가 없습니다. DDL 하지 않습니다."
        exit 0
    fi
    export PROCEDURE_DEPLOY_CHANGED_FILES="$list"
    confirm_label="CONFIRM"
    echo "db-diff confirm=${confirm_label}. 아래 파일만 safe-replace 합니다."
    cat "$list"
}

procedure_deploy_fetch_parameter_snapshot() {
    local sql
    sql="SELECT 'P', SPECIFIC_NAME, ORDINAL_POSITION, IFNULL(PARAMETER_MODE,''), IFNULL(PARAMETER_NAME,''), IFNULL(DATA_TYPE,'') FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' UNION ALL SELECT 'R', ROUTINE_NAME, 0, '', '', '' FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' ORDER BY 2, 1, 3"
    if [ "${PROCEDURE_DEPLOY_LOCAL_APPLY:-}" = "1" ]; then
        procedure_deploy_mysql_dispatch query "$sql"
        return $?
    fi
    # 원격에서는 SELECT 만 실행한다.
    # shellcheck disable=SC2087
    ssh "$SERVER_USER@$SERVER" bash -s << ENDSSH
set -euo pipefail
export MYSQL_PWD="$DB_PASS"
trap 'unset MYSQL_PWD 2>/dev/null || true' EXIT
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" -N --batch -e "$sql"
ENDSSH
}

if [ "${PROCEDURE_DEPLOY_MODE:-}" = "db-diff" ]; then
    procedure_deploy_db_diff_gate
fi

names_file=$(mktemp "${TMPDIR:-/tmp}/mg-proc-names.XXXXXX")
list_rc=0
procedure_deploy_list_names >"$names_file" || list_rc=$?
if [ "$list_rc" -ne 0 ]; then
    rm -f "$names_file"
    if [ "${GITHUB_EVENT_NAME:-}" = "push" ]; then
        fail "배포 커밋 범위를 확인하지 못해 프로시저를 적용하지 않습니다. 변경되지 않은 프로시저는 교체하지 않습니다."
    fi
    echo "배포 커밋 범위가 없어 프로시저를 교체하지 않습니다." >&2
    exit 0
fi
PROCEDURES=()
while IFS= read -r proc_name; do
    if [ -n "$proc_name" ]; then
        PROCEDURES[${#PROCEDURES[@]}]="$proc_name"
    fi
done <"$names_file"
rm -f "$names_file"

if [ "${PROCEDURE_DEPLOY_PLAN_ONLY:-}" = "1" ]; then
    for proc in "${PROCEDURES[@]}"; do
        printf 'PLAN safe-replace %s\n' "$proc"
    done
    exit 0
fi

if [ "${#PROCEDURES[@]}" -eq 0 ]; then
    echo "변경된 표준 프로시저 파일이 없습니다. 다른 프로시저는 실행하거나 DROP 하지 않습니다." >&2
    exit 0
fi

for proc in "${PROCEDURES[@]}"; do
    printf 'PLAN safe-replace %s\n' "$proc"
done

# prod (일반): 개발 서버 SSH 점프 후 DEV_DB_* 로 mysql — deploy-procedures-prod.yml
# prod (DEPLOY_TARGET=production_mysql): 운영 호스트 SSH — deploy-procedures-production-mysql.yml (PROD_SERVER_HOST, PROD_SSH_JUMP_HOST 미사용)
procedure_deploy_bind_target
if [ "$ENV" = "prod" ]; then
    echo "🚀 운영 환경 프로시저 배포 시작..."
else
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
if [ "${PROCEDURE_DEPLOY_LOCAL_APPLY:-}" = "1" ]; then
    for proc in "${PROCEDURES[@]}"; do
        sql_file=$(procedure_deploy_resolve_sql "$proc") || fail "배포 SQL 없음: $proc"
        procedure_deploy_safe_replace "$proc" "$sql_file" || fail "safe-replace 실패: $proc"
    done
    echo "변경된 프로시저 로컬 적용 완료" >&2
    exit 0
fi

echo "📤 변경된 프로시저 파일만 업로드"
runner_remote="/tmp/procedure-deploy-changed-only.sh"
scp "$SCRIPT_DIR/procedure-deploy-changed-only.sh" "$SERVER_USER@$SERVER:$runner_remote" || fail "SCP 실패: runner"
for proc in "${PROCEDURES[@]}"; do
    sql_file=$(procedure_deploy_resolve_sql "$proc") || fail "배포 SQL 없음: $proc"
    if ! scp "$sql_file" "$SERVER_USER@$SERVER:/tmp/${proc}_deploy.sql"; then
        fail "SCP 실패: ${proc}_deploy.sql"
    fi
    echo "✅ ${proc}_deploy.sql 업로드 완료"
done

echo ""
echo "📥 변경된 프로시저만 교체"

# MySQL 8: root 등으로 만들어진 프로시저는 일반 계정이 DROP 할 수 없음(1227 SYSTEM_USER).
# 재시도는 설정된 DB 호스트에서만 한다.
ROUTINE_ADMIN_USER="${PROD_DB_ROUTINE_ADMIN_USER:-}"
ROUTINE_ADMIN_PASS="${PROD_DB_ROUTINE_ADMIN_PASSWORD:-}"
ROUTINE_FALLBACK_ROOT_PASS="${PROD_DB_ROUTINE_FALLBACK_ROOT_PASSWORD:-}"

# 변경된 프로시저만 원격에서 교체한다. 한 건이라도 실패하면 중단한다.
for proc in "${PROCEDURES[@]}"; do
# 접속 값은 이 쪽에서 원격 스크립트에 넣는다.
# shellcheck disable=SC2087
ssh "$SERVER_USER@$SERVER" bash -s << ENDSSH || fail "safe-replace 실패: $proc"
set -euo pipefail
export DB_HOST="$DB_HOST"
export DB_USER="$DB_USER"
export DB_PASS="$DB_PASS"
export DB_NAME="$DB_NAME"
export ROUTINE_ADMIN_USER="$ROUTINE_ADMIN_USER"
export ROUTINE_ADMIN_PASS="$ROUTINE_ADMIN_PASS"
export ROUTINE_FALLBACK_ROOT_PASS="$ROUTINE_FALLBACK_ROOT_PASS"
export MYSQL_PWD="\$DB_PASS"
trap 'unset MYSQL_PWD 2>/dev/null || true' EXIT
bash /tmp/procedure-deploy-changed-only.sh apply-one "$proc" "/tmp/${proc}_deploy.sql"
ENDSSH
done

echo ""
echo "✅ 변경된 프로시저 교체 완료"
