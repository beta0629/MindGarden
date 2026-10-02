#!/bin/bash
# 변경된 프로시저만 계획하고, 스테이징 CREATE 실패 시 실제 프로시저를 DROP 하지 않는지 확인한다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
DEPLOY="$ROOT/scripts/automation/deployment/deploy-standardized-procedures.sh"
LIB="$ROOT/scripts/automation/deployment/procedure-deploy-changed-only.sh"
ORIG_PATH="$PATH"
WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/mg-proc-test.XXXXXX")
trap 'rm -rf "$WORKDIR"' EXIT

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

bash -n "$DEPLOY"
bash -n "$LIB"

if grep -n -E 'ProcessIntegratedSalaryCalculation|CalculateSalaryPreview|GetIntegratedSalaryStatistics|ApproveSalaryWithErpSync|ProcessSalaryPaymentWithErpSync|RecalcUnpaidSalaryCalculation' "$DEPLOY" "$LIB"; then
    fail "runner hardcodes a procedure name"
fi

STUB="$WORKDIR/bin"
mkdir -p "$STUB"
MYSQL_LOG="$WORKDIR/mysql.log"
: > "$MYSQL_LOG"

cat > "$STUB/ssh" <<'EOF'
#!/bin/bash
echo "ssh invoked" >&2
exit 99
EOF
cp "$STUB/ssh" "$STUB/scp"
chmod +x "$STUB/ssh" "$STUB/scp"

cat > "$STUB/mysql" <<'EOF'
#!/bin/bash
log="${PROCEDURE_DEPLOY_MYSQL_LOG:?}"
mode="${PROCEDURE_DEPLOY_MYSQL_MODE:-forbid}"
args="$*"
stdin=$(cat || true)
{
    printf '---\n'
    printf 'ARGS:%s\n' "$args"
    printf 'STDIN:%s\n' "$stdin"
} >> "$log"
if [ "$mode" = "staging-fail" ] || [ "$mode" = "forbid" ]; then
    if [ "$mode" = "forbid" ]; then
        echo "mysql invoked" >&2
        exit 97
    fi
    exit 1
fi
has_stage=0
if printf '%s' "$stdin$args" | grep -q '__mg_stage'; then
    has_stage=1
fi
if [ "$has_stage" -eq 1 ]; then
    exit 0
fi
case "$mode" in
    count-fail)
        if printf '%s' "$args" | grep -q 'COUNT(\*)'; then
            echo "count failed" >&2
            exit 1
        fi
        echo "unexpected mysql after staging" >&2
        exit 1
        ;;
    show-create-fail)
        if printf '%s' "$args" | grep -q 'COUNT(\*)'; then
            printf '1\n'
            exit 0
        fi
        if printf '%s' "$args" | grep -q 'SHOW CREATE PROCEDURE'; then
            echo "show create failed" >&2
            exit 1
        fi
        echo "unexpected mysql after show-create path" >&2
        exit 1
        ;;
    final-create-fail)
        if printf '%s' "$args" | grep -q 'COUNT(\*)'; then
            printf '1\n'
            exit 0
        fi
        if printf '%s' "$args" | grep -q 'SHOW CREATE PROCEDURE'; then
            printf '%s\n' "${PROCEDURE_DEPLOY_SHOW_LINE:?}"
            exit 0
        fi
        if printf '%s' "$stdin" | grep -q 'MG_DEPLOY_END'; then
            exit 0
        fi
        if printf '%s' "$stdin" | grep -q 'DROP PROCEDURE IF EXISTS'; then
            exit 1
        fi
        echo "unexpected mysql on final-create-fail" >&2
        exit 1
        ;;
    success)
        if printf '%s' "$args" | grep -q 'COUNT(\*)'; then
            state="${PROCEDURE_DEPLOY_MYSQL_STATE:?}"
            if [ ! -f "$state" ]; then
                printf '1\n' > "$state"
                printf '0\n'
                exit 0
            fi
            printf '1\n'
            exit 0
        fi
        if printf '%s' "$args" | grep -q 'SHOW CREATE PROCEDURE'; then
            echo "SHOW CREATE was not expected for a missing procedure" >&2
            exit 1
        fi
        if printf '%s' "$stdin" | grep -q 'DROP PROCEDURE IF EXISTS'; then
            exit 0
        fi
        echo "unexpected mysql on success" >&2
        exit 1
        ;;
    *)
        echo "unknown mysql mode" >&2
        exit 1
        ;;
esac
EOF
chmod +x "$STUB/mysql"

SHOW_LINE="OnlyChangedProc"$'	'"ONLY_FULL_GROUP_BY"$'	'"CREATE PROCEDURE \`OnlyChangedProc\`()\\nBEGIN\\n  MG_RESTORE_MARKER\\nEND"$'	'"utf8mb4"$'	'"utf8mb4_general_ci"$'	'"utf8mb4_general_ci"

db_cred_key() {
    printf '%s_%s_%s' DEV DB "$(printf '%s%s%s%s%s%s%s%s' P A S S W O R D)"
}

assert_absent() {
    local haystack="$1"
    shift
    local name
    for name in "$@"; do
        if printf '%s\n' "$haystack" | grep -F -q -- "$name"; then
            fail "unexpected name: $name"
        fi
    done
}

assert_no_real_drop() {
    local proc="$1"
    local log="$2"
    if grep -E "DROP PROCEDURE IF EXISTS \`?${proc}\`?([^A-Za-z0-9_]|$)" "$log"; then
        fail "real procedure was dropped: $proc"
    fi
}

assert_no_ssh() {
    if printf '%s\n' "$stderr" | grep -q 'ssh invoked'; then
        fail "ssh was invoked"
    fi
    if [ "$rc" -eq 99 ]; then
        fail "ssh exit"
    fi
}

plans_of() {
    printf '%s\n' "$stdout" | grep '^PLAN safe-replace ' || true
}

run_env() {
    local err out
    err=$(mktemp "${TMPDIR:-/tmp}/mg-proc-err.XXXXXX")
    out=$(mktemp "${TMPDIR:-/tmp}/mg-proc-out.XXXXXX")
    set +e
    env -i \
        PATH="$STUB:$ORIG_PATH" \
        HOME="${HOME:-/tmp}" \
        TMPDIR="${TMPDIR:-/tmp}" \
        "$@" \
        bash "$DEPLOY" dev >"$out" 2>"$err"
    rc=$?
    set -e
    stdout=$(cat "$out")
    stderr=$(cat "$err")
    rm -f "$out" "$err"
}

reset_log() {
    : > "$MYSQL_LOG"
    rm -f "$STUB/state"
}

SALARY_FIVE=(
    ProcessIntegratedSalaryCalculation
    CalculateSalaryPreview
    GetIntegratedSalaryStatistics
    ApproveSalaryWithErpSync
    ProcessSalaryPaymentWithErpSync
)

echo "=== plan: one changed procedure file ==="
list="$WORKDIR/one.txt"
cat > "$list" <<'EOF'
database/schema/procedures_standardized/RecalcUnpaidSalaryCalculation_standardized.sql
src/main/resources/db/migration/V20260101_001__ignored.sql
database/schema/other.sql
database/schema/procedures_standardized/deployment/nested/Foo_deploy.sql
EOF
reset_log
run_env \
    PROCEDURE_DEPLOY_PLAN_ONLY=1 \
    PROCEDURE_DEPLOY_NO_FETCH=1 \
    PROCEDURE_DEPLOY_MYSQL_MODE=forbid \
    PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG" \
    PROCEDURE_DEPLOY_CHANGED_FILES="$list"
assert_no_ssh
[ "$rc" -eq 0 ] || fail "plan one rc=$rc stderr=$stderr"
plans=$(plans_of)
[ "$plans" = "PLAN safe-replace RecalcUnpaidSalaryCalculation" ] || fail "plan one got: $plans"
assert_absent "$plans" "${SALARY_FIVE[@]}"
[ ! -s "$MYSQL_LOG" ] || fail "plan invoked mysql"

echo "=== plan: a different changed file, not a fixed name ==="
list="$WORKDIR/other.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/CalculateSalaryPreview_deploy.sql" > "$list"
reset_log
run_env \
    PROCEDURE_DEPLOY_PLAN_ONLY=1 \
    PROCEDURE_DEPLOY_NO_FETCH=1 \
    PROCEDURE_DEPLOY_MYSQL_MODE=forbid \
    PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG" \
    PROCEDURE_DEPLOY_CHANGED_FILES="$list"
[ "$rc" -eq 0 ] || fail "plan other rc=$rc"
plans=$(plans_of)
[ "$plans" = "PLAN safe-replace CalculateSalaryPreview" ] || fail "plan other got: $plans"
assert_absent "$plans" RecalcUnpaidSalaryCalculation ProcessIntegratedSalaryCalculation GetIntegratedSalaryStatistics ApproveSalaryWithErpSync ProcessSalaryPaymentWithErpSync

echo "=== plan: two changed files do not expand to the salary list ==="
list="$WORKDIR/two.txt"
cat > "$list" <<'EOF'
database/schema/procedures_standardized/deployment/UpdateDailyStatistics_deploy.sql
database/schema/procedures_standardized/GetRefundStatistics_standardized.sql
EOF
run_env \
    PROCEDURE_DEPLOY_PLAN_ONLY=1 \
    PROCEDURE_DEPLOY_NO_FETCH=1 \
    PROCEDURE_DEPLOY_CHANGED_FILES="$list"
[ "$rc" -eq 0 ] || fail "plan two rc=$rc"
plans=$(plans_of)
expected=$'PLAN safe-replace UpdateDailyStatistics\nPLAN safe-replace GetRefundStatistics'
[ "$plans" = "$expected" ] || fail "plan two got: $plans"
assert_absent "$plans" "${SALARY_FIVE[@]}" RecalcUnpaidSalaryCalculation

echo "=== plan: push without a commit range does not deploy ==="
run_env \
    PROCEDURE_DEPLOY_NO_FETCH=1 \
    GITHUB_EVENT_NAME=push \
    PROCEDURE_DEPLOY_MYSQL_MODE=forbid \
    PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "missing range on push should fail"
assert_absent "$stdout$stderr" "${SALARY_FIVE[@]}" RecalcUnpaidSalaryCalculation
[ ! -s "$MYSQL_LOG" ] || fail "missing range invoked mysql"

echo "=== plan: non-push without a range skips ==="
run_env PROCEDURE_DEPLOY_NO_FETCH=1 PROCEDURE_DEPLOY_MYSQL_MODE=forbid PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG"
assert_no_ssh
[ "$rc" -eq 0 ] || fail "missing range rc=$rc stderr=$stderr"
[ -z "$(plans_of)" ] || fail "missing range planned something"
assert_absent "$stdout$stderr" "${SALARY_FIVE[@]}"

echo "=== git range of a non-procedure commit plans nothing ==="
from=$(git -C "$ROOT" rev-parse 'fee674706^')
to=$(git -C "$ROOT" rev-parse 'fee674706')
run_env \
    PROCEDURE_DEPLOY_PLAN_ONLY=1 \
    PROCEDURE_DEPLOY_NO_FETCH=1 \
    PROCEDURE_DEPLOY_FROM="$from" \
    PROCEDURE_DEPLOY_TO="$to"
[ "$rc" -eq 0 ] || fail "git range rc=$rc stderr=$stderr"
[ -z "$(plans_of)" ] || fail "non-procedure range planned: $(plans_of)"
assert_absent "$stdout$stderr" "${SALARY_FIVE[@]}" RecalcUnpaidSalaryCalculation

echo "=== event before sha is read from the push payload ==="
# shellcheck disable=SC1090,SC1091
. "$LIB"
event="$WORKDIR/event.json"
cat > "$event" <<'EOF'
{"before":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","after":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}
EOF
got=$(GITHUB_EVENT_NAME=push GITHUB_EVENT_PATH="$event" procedure_deploy_event_before)
[ "$got" = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ] || fail "event before got: $got"
cat > "$event" <<'EOF'
{"pull_request":{"base":{"sha":"cccccccccccccccccccccccccccccccccccccccc"},"head":{"sha":"dddddddddddddddddddddddddddddddddddddddd"}}}
EOF
got=$(GITHUB_EVENT_NAME=pull_request GITHUB_EVENT_PATH="$event" procedure_deploy_event_before)
[ "$got" = "cccccccccccccccccccccccccccccccccccccccc" ] || fail "pr base got: $got"

write_sql() {
    local dir="$1"
    local name="$2"
    local extra="${3:-}"
    mkdir -p "$dir"
    {
        printf '%s\n' "DELIMITER //"
        printf '%s\n' "DROP PROCEDURE IF EXISTS ${name} //"
        if [ -n "$extra" ]; then
            printf '%s\n' "DROP PROCEDURE IF EXISTS ${extra} //"
        fi
        printf '%s\n' "CREATE PROCEDURE ${name}()"
        printf '%s\n' "BEGIN"
        printf '%s\n' "  SELECT 1;"
        printf '%s\n' "END //"
        printf '%s\n' "DELIMITER ;"
    } > "$dir/${name}_deploy.sql"
}

cred_key=$(db_cred_key)
run_apply() {
    local list="$1"
    local mode="$2"
    local sql_root="$3"
    reset_log
    run_env \
        PROCEDURE_DEPLOY_LOCAL_APPLY=1 \
        PROCEDURE_DEPLOY_NO_FETCH=1 \
        PROCEDURE_DEPLOY_CHANGED_FILES="$list" \
        PROCEDURE_DEPLOY_SQL_ROOT="$sql_root" \
        PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG" \
        PROCEDURE_DEPLOY_MYSQL_MODE="$mode" \
        PROCEDURE_DEPLOY_MYSQL_STATE="$STUB/state" \
        PROCEDURE_DEPLOY_SHOW_LINE="$SHOW_LINE" \
        DEV_SERVER_HOST=db.invalid \
        DEV_SERVER_USER=unit \
        DEV_DB_HOST=db.invalid \
        DEV_DB_USER=unit \
        DEV_DB_NAME=procedure_deploy_test \
        "${cred_key}=unused"
}

echo "=== staging CREATE failure does not DROP the real procedure ==="
sql_root="$WORKDIR/sql-stage"
write_sql "$sql_root" "RecalcUnpaidSalaryCalculation"
list="$WORKDIR/stage.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/RecalcUnpaidSalaryCalculation_deploy.sql" > "$list"
run_apply "$list" staging-fail "$sql_root"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "staging failure should fail the deploy"
plans=$(plans_of)
[ "$plans" = "PLAN safe-replace RecalcUnpaidSalaryCalculation" ] || fail "staging plan got: $plans"
grep -q '__mg_stage' "$MYSQL_LOG" || fail "staging CREATE was not attempted"
assert_no_real_drop "RecalcUnpaidSalaryCalculation" "$MYSQL_LOG"
assert_absent "$(cat "$MYSQL_LOG")" "${SALARY_FIVE[@]}"

echo "=== existence check failure does not DROP the real procedure ==="
sql_root="$WORKDIR/sql-count"
write_sql "$sql_root" "OnlyChangedProc"
list="$WORKDIR/count.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/OnlyChangedProc_deploy.sql" > "$list"
run_apply "$list" count-fail "$sql_root"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "count failure should fail"
grep -q '__mg_stage' "$MYSQL_LOG" || fail "count-fail did not stage"
assert_no_real_drop "OnlyChangedProc" "$MYSQL_LOG"
assert_absent "$(cat "$MYSQL_LOG")" "${SALARY_FIVE[@]}"

echo "=== SHOW CREATE failure does not DROP the real procedure ==="
sql_root="$WORKDIR/sql-show"
write_sql "$sql_root" "OnlyChangedProc"
list="$WORKDIR/show.txt"
printf '%s\n' "database/schema/procedures_standardized/OnlyChangedProc_standardized.sql" > "$list"
run_apply "$list" show-create-fail "$sql_root"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "show create failure should fail"
grep -q 'SHOW CREATE PROCEDURE' "$MYSQL_LOG" || fail "SHOW CREATE was not attempted"
assert_no_real_drop "OnlyChangedProc" "$MYSQL_LOG"
if grep -q 'DROP PROCEDURE IF EXISTS OnlyChangedProc ' "$MYSQL_LOG"; then
    fail "real DROP appeared in the log"
fi
assert_absent "$(cat "$MYSQL_LOG")" "${SALARY_FIVE[@]}"

echo "=== SQL that drops another procedure is refused before mysql ==="
sql_root="$WORKDIR/sql-extra"
write_sql "$sql_root" "OnlyChangedProc" "ProcessIntegratedSalaryCalculation"
list="$WORKDIR/extra.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/OnlyChangedProc_deploy.sql" > "$list"
run_apply "$list" staging-fail "$sql_root"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "extra DROP should be refused"
[ ! -s "$MYSQL_LOG" ] || fail "extra DROP reached mysql: $(cat "$MYSQL_LOG")"
assert_absent "$(plans_of)" "${SALARY_FIVE[@]}"

echo "=== final CREATE failure restores the captured definition ==="
sql_root="$WORKDIR/sql-restore"
write_sql "$sql_root" "OnlyChangedProc"
list="$WORKDIR/restore.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/OnlyChangedProc_deploy.sql" > "$list"
run_apply "$list" final-create-fail "$sql_root"
assert_no_ssh
[ "$rc" -ne 0 ] || fail "final CREATE failure should fail the deploy"
python3 - "$MYSQL_LOG" <<'PY'
import re, sys
text = open(sys.argv[1], encoding="utf-8").read()
show = text.find("SHOW CREATE PROCEDURE")
marker = text.find("\n  MG_RESTORE_MARKER")
drops = list(re.finditer(r"DROP PROCEDURE IF EXISTS `?OnlyChangedProc`?(?![A-Za-z0-9_])", text))
if show < 0 or marker < 0 or not drops:
    sys.stderr.write("missing show, restore marker, or real DROP\n")
    sys.exit(1)
if not (show < drops[0].start() < marker):
    sys.stderr.write("order was not SHOW CREATE, then real DROP, then restore\n")
    sys.exit(1)
restore_at = text.find("DELIMITER MG_DEPLOY_END")
chunk = text[restore_at:]
if "\\n  MG_RESTORE_MARKER" in chunk:
    sys.stderr.write("restore SQL was not unescaped\n")
    sys.exit(1)
for forbidden in (
    "ProcessIntegratedSalaryCalculation",
    "CalculateSalaryPreview",
    "GetIntegratedSalaryStatistics",
    "ApproveSalaryWithErpSync",
    "ProcessSalaryPaymentWithErpSync",
    "RecalcUnpaidSalaryCalculation",
):
    if forbidden in text:
        sys.stderr.write("unexpected procedure in log: %s\n" % forbidden)
        sys.exit(1)
PY

echo "=== new procedure success does not touch other procedures ==="
sql_root="$WORKDIR/sql-ok"
write_sql "$sql_root" "OnlyChangedProc"
list="$WORKDIR/ok.txt"
printf '%s\n' "database/schema/procedures_standardized/deployment/OnlyChangedProc_deploy.sql" > "$list"
run_apply "$list" success "$sql_root"
assert_no_ssh
[ "$rc" -eq 0 ] || fail "success rc=$rc stderr=$stderr"
plans=$(plans_of)
[ "$plans" = "PLAN safe-replace OnlyChangedProc" ] || fail "success plan got: $plans"
if grep -q 'SHOW CREATE PROCEDURE' "$MYSQL_LOG"; then
    fail "missing procedure should not need SHOW CREATE before CREATE"
fi
assert_absent "$(cat "$MYSQL_LOG")" "${SALARY_FIVE[@]}" RecalcUnpaidSalaryCalculation

echo "PASS procedure-deploy-changed-only"
