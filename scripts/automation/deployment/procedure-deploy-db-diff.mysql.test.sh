#!/bin/bash
# 일회용 MySQL 8 에서 db-diff 본문 해시가 실제 ROUTINE_DEFINITION 과 맞는지 끝까지 검사한다.
# 1) 저장소 배포 SQL 전부 적용 → hash-report 전부 same
# 2) 주석·공백만 다른 정의 → same, 본문 한 줄 변경 → differ, DROP → missing
# 3) db-diff dry-run 은 body/missing 만 목록에 올리고, CONFIRM 후 다시 전부 same
# 출력에 본문이 섞이지 않는지도 본다(이름·해시·상태만).
# 필요 env: DB_HOST DB_USER DB_PASS DB_NAME, PROCEDURE_STAGING_TEST_DB=disposable
# 개발·운영 DB 에는 실행하지 않는다. 일회용 컨테이너 전용.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
DEPLOY="$ROOT/scripts/automation/deployment/deploy-standardized-procedures.sh"
SQL_DIR="$ROOT/database/schema/procedures_standardized/deployment"
SAME_PROC="GetIntegratedSalaryStatistics"
BODY_PROC="UpdateBusinessTimeSetting"
DROP_PROC="CalculateSalaryPreview"

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

WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/mg-db-diff-mysql.XXXXXX")
trap 'rm -rf "$WORKDIR"' EXIT

db() {
    MYSQL_PWD="$DB_PASS" mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" "$@"
}

run_deploy() {
    env -u DEPLOY_TARGET -u PROD_DB_HOST -u PROD_DB_NAME \
        PROCEDURE_DEPLOY_LOCAL_APPLY=1 \
        PROCEDURE_DEPLOY_MODE="$1" \
        PROCEDURE_DEPLOY_DB_DIFF_CONFIRM="${2:-}" \
        DEV_SERVER_HOST="${DB_HOST}" \
        DEV_DB_HOST="$DB_HOST" DEV_DB_USER="$DB_USER" DEV_DB_PASSWORD="$DB_PASS" DEV_DB_NAME="$DB_NAME" \
        ROUTINE_ADMIN_USER="" ROUTINE_ADMIN_PASS="" ROUTINE_FALLBACK_ROOT_PASS="" \
        bash "$DEPLOY" dev 2>&1
}

assert_no_body() {
    if printf '%s\n' "$1" | grep -qiE 'DECLARE|proc_main|SELECT .* FROM'; then
        fail "procedure body text printed"
    fi
    if printf '%s\n' "$1" | grep -qF -- "$DB_PASS"; then
        fail "password printed"
    fi
}

status_of() {
    printf '%s\n' "$1" | awk -F '\t' -v n="$2" '$1 == "HASH" && $2 == n { sub("status=", "", $5); print $5 }'
}

bash "$ROOT/database/schema/procedures_standardized/create_deployment_files.sh" >/dev/null
total=0
for f in "$SQL_DIR"/*_deploy.sql; do
    db < "$f" >/dev/null || fail "apply failed: $(basename "$f")"
    total=$((total + 1))
done
echo "applied repo procedures: $total"

report=$(run_deploy db-diff-hash) || fail "hash-report exit: $report"
assert_no_body "$report"
printf '%s\n' "$report" | grep -q "^hash-report procedures repo=$total same=$total differ=0 missing=0 unavailable=0$" \
    || fail "fresh apply is not all same: $(printf '%s\n' "$report" | grep -v $'\tstatus=same$')"
echo "case identical: all $total same"

# 주석·공백만 다른 정의는 same 이어야 한다.
awk '
    /^[A-Za-z_]+: *BEGIN|^BEGIN/ && !done { print; print "    -- cosmetic comment"; print ""; print "    /* block */"; done = 1; next }
    { gsub(/^    /, "\t"); print }
' "$SQL_DIR/${SAME_PROC}_deploy.sql" > "$WORKDIR/cosmetic.sql"
cmp -s "$WORKDIR/cosmetic.sql" "$SQL_DIR/${SAME_PROC}_deploy.sql" && fail "cosmetic fixture did not change the file"
db < "$WORKDIR/cosmetic.sql" >/dev/null || fail "cosmetic apply failed"

# 본문 한 줄 변경은 differ 여야 한다.
sed 's/DECLARE v_updated_count INT DEFAULT 0;/DECLARE v_updated_count INT DEFAULT 1;/' \
    "$SQL_DIR/${BODY_PROC}_deploy.sql" > "$WORKDIR/changed.sql"
cmp -s "$WORKDIR/changed.sql" "$SQL_DIR/${BODY_PROC}_deploy.sql" && fail "body fixture did not change the file"
db < "$WORKDIR/changed.sql" >/dev/null || fail "changed apply failed"

db -e "DROP PROCEDURE IF EXISTS ${DROP_PROC}" || fail "drop failed"

report=$(run_deploy db-diff-hash) || fail "hash-report exit: $report"
assert_no_body "$report"
[ "$(status_of "$report" "$SAME_PROC")" = "same" ] || fail "cosmetic change was reported as $(status_of "$report" "$SAME_PROC")"
[ "$(status_of "$report" "$BODY_PROC")" = "differ" ] || fail "body change was reported as $(status_of "$report" "$BODY_PROC")"
[ "$(status_of "$report" "$DROP_PROC")" = "missing" ] || fail "dropped procedure was reported as $(status_of "$report" "$DROP_PROC")"
echo "case crafted: $SAME_PROC=same $BODY_PROC=differ $DROP_PROC=missing"

dry=$(run_deploy db-diff) || fail "db-diff dry-run exit: $dry"
assert_no_body "$dry"
printf '%s\n' "$dry" | grep -qE $'^DIFF\t'"$BODY_PROC"$'\tbody\trepo=[0-9a-f]{16}\tdb=[0-9a-f]{16}$' || fail "body diff missing: $dry"
printf '%s\n' "$dry" | grep -q $'^DIFF\t'"$DROP_PROC"$'\tmissing\t' || fail "missing diff missing: $dry"
diff_count=$(printf '%s\n' "$dry" | grep -c $'^DIFF\t' || true)
[ "$diff_count" -eq 2 ] || fail "expected 2 diffs, got $diff_count"

applied=$(run_deploy db-diff CONFIRM) || fail "db-diff CONFIRM exit: $applied"
assert_no_body "$applied"
report=$(run_deploy db-diff-hash) || fail "hash-report exit: $report"
printf '%s\n' "$report" | grep -q "^hash-report procedures repo=$total same=$total differ=0 missing=0 unavailable=0$" \
    || fail "CONFIRM did not converge: $(printf '%s\n' "$report" | grep -v $'\tstatus=same$')"
echo "case confirm: converged to all same"

echo "procedure-deploy-db-diff.mysql.test.sh PASS"
