#!/bin/bash
# 일회용 MySQL 컨테이너에 저장소의 모든 배포 SQL 을 실제 safe-replace 경로로 적용한다.
# 1) 스테이징 CREATE(<이름>__mg_stage) 2) 새 프로시저 생성 3) 같은 SQL 로 재교체(SHOW CREATE 저장 경로).
# 한 건이라도 실패하면 표를 찍고 exit 1.
# 필요 env: DB_HOST DB_USER DB_PASS DB_NAME, PROCEDURE_STAGING_TEST_DB=disposable
# 개발·운영 DB 에는 실행하지 않는다. CI 서비스 컨테이너 전용.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PROC_DIR="$ROOT/database/schema/procedures_standardized"
RUNNER="$ROOT/scripts/automation/deployment/procedure-deploy-changed-only.sh"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

[ "${PROCEDURE_STAGING_TEST_DB:-}" = "disposable" ] \
    || fail "PROCEDURE_STAGING_TEST_DB=disposable 일 때만 실행합니다 (일회용 컨테이너 DB 전용)."
: "${DB_HOST:?DB_HOST 필요}"
: "${DB_USER:?DB_USER 필요}"
: "${DB_PASS:?DB_PASS 필요}"
: "${DB_NAME:?DB_NAME 필요}"
export DB_HOST DB_USER DB_PASS DB_NAME
export ROUTINE_ADMIN_USER="" ROUTINE_ADMIN_PASS="" ROUTINE_FALLBACK_ROOT_PASS=""

bash -n "$RUNNER"
bash "$PROC_DIR/create_deployment_files.sh" >/dev/null

# shellcheck disable=SC1090
. "$RUNNER"

server_version=$(procedure_deploy_mysql_dispatch query "SELECT VERSION()") || fail "MySQL 접속 실패"
echo "MySQL server version: $server_version"

table=$(mktemp "${TMPDIR:-/tmp}/mg-stage-table.XXXXXX")
log=$(mktemp "${TMPDIR:-/tmp}/mg-stage-log.XXXXXX")
all_log=$(mktemp "${TMPDIR:-/tmp}/mg-stage-all.XXXXXX")
trap 'rm -f "$table" "$log" "$all_log"' EXIT

total=0
failed=0
for std in "$PROC_DIR"/*_standardized.sql; do
    proc=$(basename "$std" _standardized.sql)
    sql="$PROC_DIR/deployment/${proc}_deploy.sql"
    total=$((total + 1))
    reason=""
    : >"$log"
    stage=$(procedure_deploy_staging_name "$proc")
    stage_sql=$(mktemp "${TMPDIR:-/tmp}/mg-stage-sql.XXXXXX")
    if [ ! -f "$sql" ]; then
        reason="배포 SQL 없음"
    elif ! procedure_deploy_write_staging_sql "$proc" "$sql" "$stage_sql" 2>>"$log"; then
        reason="스테이징 SQL 생성 실패"
    elif ! procedure_deploy_mysql_dispatch file "$stage_sql" 2>>"$log"; then
        reason="스테이징 CREATE 실패"
    elif ! procedure_deploy_mysql_dispatch query "DROP PROCEDURE IF EXISTS \`${stage}\`" 2>>"$log"; then
        reason="스테이징 정리 실패"
    elif ! procedure_deploy_safe_replace "$proc" "$sql" 2>>"$log"; then
        reason="신규 safe-replace 실패"
    elif ! procedure_deploy_safe_replace "$proc" "$sql" 2>>"$log"; then
        reason="재교체 safe-replace 실패"
    else
        left=$(procedure_deploy_mysql_dispatch query "$(procedure_deploy_exists_sql "$stage")" | tr -d '[:space:]')
        real=$(procedure_deploy_mysql_dispatch query "$(procedure_deploy_exists_sql "$proc")" | tr -d '[:space:]')
        if [ "$left" != "0" ]; then
            reason="스테이징 프로시저가 남아 있음"
        elif [ "$real" != "1" ]; then
            reason="실제 프로시저 없음"
        fi
    fi
    rm -f "$stage_sql"
    if [ -n "$reason" ]; then
        mysql_error=$(grep -E 'ERROR [0-9]+' "$log" | tail -n 1 | cut -c1-160 || true)
        [ -z "$mysql_error" ] || reason="${reason} / ${mysql_error}"
        cat "$log" >>"$all_log"
        failed=$((failed + 1))
        printf '%s | failed | %s\n' "$proc" "$reason" >>"$table"
    else
        printf '%s | success | staging+create+replace\n' "$proc" >>"$table"
    fi
done

echo "name | result | reason"
cat "$table"
echo "staging-mysql total=$total failed=$failed"
[ "$total" -gt 0 ] || fail "배포 SQL 이 없습니다."
if [ "$failed" -ne 0 ]; then
    echo "--- mysql 오류 로그 ---" >&2
    cat "$all_log" >&2
    exit 1
fi
echo "OK: 모든 배포 SQL 이 실제 MySQL 에서 safe-replace 됩니다."
