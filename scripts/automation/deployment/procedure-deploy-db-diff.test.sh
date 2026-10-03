#!/bin/bash
# db-diff: BOOLEAN/tinyint 는 차이가 아니고, 개수가 다르면 목록에 남는다.
# confirm 이 없으면 CREATE/DROP 하지 않는다. 스테이징 CREATE 실패 시 실제 프로시저를 DROP 하지 않는다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
DIFF="$ROOT/scripts/automation/deployment/procedure-deploy-db-diff.sh"
DEPLOY="$ROOT/scripts/automation/deployment/deploy-standardized-procedures.sh"
WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/mg-db-diff-test.XXXXXX")
trap 'rm -rf "$WORKDIR"' EXIT

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

bash -n "$DIFF"
bash -n "$DEPLOY"

python3 - "$ROOT" "$WORKDIR/snap.tsv" <<'PY'
import sys
from pathlib import Path

root = Path(sys.argv[1])
out = Path(sys.argv[2])
deploy_dir = root / "database/schema/procedures_standardized/deployment"

def norm_keep(raw):
    return raw

def closing_paren(text, open_at):
    depth = 0
    for i in range(open_at, len(text)):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return i
    raise ValueError("unclosed")

def split_top(body):
    parts = []
    current = []
    depth = 0
    for ch in body:
        if ch == "(":
            depth += 1
            current.append(ch)
        elif ch == ")":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    tail = "".join(current).strip()
    if tail:
        parts.append(tail)
    return parts

lines = []
for path in sorted(deploy_dir.glob("*_deploy.sql")):
    name = path.name[: -len("_deploy.sql")]
    text = path.read_text(encoding="utf-8")
    key = "CREATE PROCEDURE " + name + "("
    idx = text.find(key)
    if idx < 0:
        key = "CREATE PROCEDURE `" + name + "`("
        idx = text.find(key)
    open_at = text.find("(", idx)
    end = closing_paren(text, open_at)
    params = []
    body = "\n".join(line.split("--", 1)[0] for line in text[open_at + 1:end].splitlines())
    for part in split_top(body):
        tokens = part.replace("\n", " ").split()
        if len(tokens) < 3:
            raise SystemExit(f"short parameter in {name}: {part!r}")
        mode, pname, data_type = tokens[0], tokens[1].strip("`"), tokens[2]
        if data_type.upper() in ("BOOLEAN", "BOOL"):
            data_type = "tinyint"
        params.append((mode, pname, data_type))
    if name == "GetIntegratedSalaryStatistics":
        params = params[:-2]
    lines.append(f"R\t{name}\t0\t\t\t")
    for ordinal, (mode, pname, data_type) in enumerate(params, 1):
        lines.append(f"P\t{name}\t{ordinal}\t{mode}\t{pname}\t{data_type}")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

LIST="$WORKDIR/list.txt"
set +e
out=$(PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT="$WORKDIR/snap.tsv" \
    PROCEDURE_DEPLOY_DB_DIFF_LIST="$LIST" \
    PROCEDURE_DEPLOY_DB_DIFF_CONFIRM="" \
    bash "$DIFF")
rc=$?
set -e
[ "$rc" -eq 0 ] || fail "dry-run exit $rc"
printf '%s\n' "$out" | grep -q $'DIFF\tGetIntegratedSalaryStatistics\tcount\t' || fail "count diff missing: $out"
if printf '%s\n' "$out" | grep -q $'DIFF\tUpdateBusinessTimeSetting\t'; then
    fail "BOOLEAN/tinyint was treated as a diff"
fi
if printf '%s\n' "$out" | grep -E $'DIFF\t(ProcessIntegratedSalaryCalculation|CalculateSalaryPreview|ApproveSalaryWithErpSync|ProcessSalaryPaymentWithErpSync|GetSalaryPreConfirmWarning|RecalcUnpaidSalaryCalculation|InsertSalaryAdjustmentForLateSessions)\t'; then
    fail "unchanged salary procedure listed"
fi
diff_count=$(printf '%s\n' "$out" | grep -c $'^DIFF\t' || true)
[ "$diff_count" -eq 1 ] || fail "expected 1 diff, got $diff_count: $out"
[ ! -s "$LIST" ] || fail "dry-run wrote a deploy list"

: > "$LIST"
set +e
out2=$(PROCEDURE_DEPLOY_DB_DIFF_SNAPSHOT="$WORKDIR/snap.tsv" \
    PROCEDURE_DEPLOY_DB_DIFF_LIST="$LIST" \
    PROCEDURE_DEPLOY_DB_DIFF_CONFIRM="CONFIRM" \
    bash "$DIFF")
rc2=$?
set -e
[ "$rc2" -eq 0 ] || fail "confirm exit $rc2: $out2"
grep -q 'GetIntegratedSalaryStatistics_deploy.sql' "$LIST" || fail "confirm list missing target"
if grep -E 'ProcessIntegratedSalaryCalculation|GetSalaryPreConfirmWarning' "$LIST"; then
    fail "confirm list includes an unchanged salary procedure"
fi

STUB="$WORKDIR/bin"
mkdir -p "$STUB"
MYSQL_LOG="$WORKDIR/mysql.log"
: > "$MYSQL_LOG"
cat > "$STUB/mysql" <<'EOF'
#!/bin/bash
log="${PROCEDURE_DEPLOY_MYSQL_LOG:?}"
snap="${PROCEDURE_DEPLOY_TEST_SNAPSHOT:?}"
args="$*"
stdin=$(cat || true)
{
    printf '---\n'
    printf 'ARGS:%s\n' "$args"
    printf 'STDIN:%s\n' "$stdin"
} >> "$log"
if printf '%s' "$args" | grep -q 'information_schema.PARAMETERS'; then
    cat "$snap"
    exit 0
fi
if printf '%s' "$stdin$args" | grep -q '__mg_stage'; then
    echo "staging create failed" >&2
    exit 1
fi
if printf '%s' "$stdin$args" | grep -q 'DROP PROCEDURE'; then
    echo "dropped real procedure" >&2
    exit 98
fi
echo "unexpected mysql" >&2
exit 97
EOF
cat > "$STUB/ssh" <<'EOF'
#!/bin/bash
echo "ssh invoked" >&2
exit 99
EOF
cp "$STUB/ssh" "$STUB/scp"
chmod +x "$STUB/mysql" "$STUB/ssh" "$STUB/scp"

export PATH="$STUB:$PATH"
export PROCEDURE_DEPLOY_MYSQL_LOG="$MYSQL_LOG"
export PROCEDURE_DEPLOY_TEST_SNAPSHOT="$WORKDIR/snap.tsv"
export PROCEDURE_DEPLOY_MODE=db-diff
export PROCEDURE_DEPLOY_LOCAL_APPLY=1
export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=""
export DEV_SERVER_HOST=dev-runner.example
export DEV_DB_HOST=dev-db.example
export DEV_DB_USER=app
export DEV_DB_PASSWORD=secret-not-printed
export DEV_DB_NAME=core_solution
unset DEPLOY_TARGET PROD_DB_HOST PROD_DB_NAME || true

set +e
dry=$(bash "$DEPLOY" dev)
dry_rc=$?
set -e
[ "$dry_rc" -eq 0 ] || fail "deploy dry-run exit $dry_rc: $dry"
printf '%s\n' "$dry" | grep -q 'db-diff dry-run. CREATE/DROP 하지 않습니다.' || fail "dry-run message missing"
printf '%s\n' "$dry" | grep -q 'db-diff MySQL host=dev-db.example database=core_solution' || fail "host line missing"
if grep 'DROP PROCEDURE' "$MYSQL_LOG" | grep -v '__mg_stage'; then
    fail "dry-run issued DROP"
fi
if printf '%s\n' "$dry" | grep -q 'secret-not-printed'; then
    fail "password printed"
fi

export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=CONFIRM
: > "$MYSQL_LOG"
set +e
apply=$(bash "$DEPLOY" dev 2>&1)
apply_rc=$?
set -e
[ "$apply_rc" -ne 0 ] || fail "staging failure should not exit 0"
if grep 'DROP PROCEDURE' "$MYSQL_LOG" | grep -v '__mg_stage'; then
    fail "staging failure still dropped a routine"
fi
printf '%s\n' "$apply" | grep -q '스테이징 CREATE 실패' || fail "staging failure message missing: $apply"

export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=""
export DEPLOY_TARGET=production_mysql
export PROD_DB_HOST=dev-db.example
export PROD_DB_NAME=core_solution
set +e
blocked=$(bash "$DEPLOY" dev 2>&1)
blocked_rc=$?
set -e
[ "$blocked_rc" -ne 0 ] || fail "dev db-diff must refuse production_mysql"
printf '%s\n' "$blocked" | grep -q 'production_mysql' || fail "refuse message missing: $blocked"

# CONFIRM: 첫 프로시저 스테이징 CREATE 가 실패해도 다음 프로시저를 계속 처리하고 표를 찍은 뒤 exit 1.
grep -v $'\tTestMappingSync\t' "$WORKDIR/snap.tsv" > "$WORKDIR/snap2.tsv"
STATE="$WORKDIR/created-TestMappingSync"
cat > "$STUB/mysql" <<'EOF'
#!/bin/bash
log="${PROCEDURE_DEPLOY_MYSQL_LOG:?}"
snap="${PROCEDURE_DEPLOY_TEST_SNAPSHOT:?}"
state="${PROCEDURE_DEPLOY_TEST_STATE:?}"
args="$*"
stdin=$(cat || true)
printf -- '---\nARGS:%s\nSTDIN:%s\n' "$args" "$stdin" >> "$log"
if printf '%s' "$args" | grep -q 'information_schema.PARAMETERS'; then
    cat "$snap"
    exit 0
fi
if printf '%s' "$stdin" | grep -q 'GetIntegratedSalaryStatistics__mg_stage'; then
    echo "ERROR 1064 (42000) at line 8: syntax error near ';'" >&2
    exit 1
fi
if printf '%s' "$stdin$args" | grep -q '__mg_stage'; then
    exit 0
fi
if printf '%s' "$args" | grep -q "ROUTINE_NAME = 'TestMappingSync'"; then
    if [ -f "$state" ]; then echo 1; else echo 0; fi
    exit 0
fi
if printf '%s' "$stdin" | grep -q 'CREATE PROCEDURE TestMappingSync'; then
    : > "$state"
    exit 0
fi
if printf '%s' "$stdin$args" | grep -q 'DROP PROCEDURE'; then
    echo "REAL_DROP" >> "$log"
    exit 98
fi
echo "unexpected mysql" >&2
exit 97
EOF
chmod +x "$STUB/mysql"
unset DEPLOY_TARGET PROD_DB_HOST PROD_DB_NAME
export PROCEDURE_DEPLOY_TEST_SNAPSHOT="$WORKDIR/snap2.tsv"
export PROCEDURE_DEPLOY_TEST_STATE="$STATE"
export PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=CONFIRM
: > "$MYSQL_LOG"
set +e
multi=$(bash "$DEPLOY" dev 2>&1)
multi_rc=$?
set -e
[ "$multi_rc" -eq 1 ] || fail "partial failure must exit 1, got $multi_rc: $multi"
printf '%s\n' "$multi" | grep -q '^name | result | reason$' || fail "result table header missing: $multi"
printf '%s\n' "$multi" | grep -q '^GetIntegratedSalaryStatistics | failed | ERROR 1064' \
    || fail "failed row missing: $multi"
printf '%s\n' "$multi" | grep -q '^TestMappingSync | success | $' || fail "later procedure was not processed: $multi"
printf '%s\n' "$multi" | grep -q 'summary total=2 success=1 failed=1 skipped=0' || fail "summary missing: $multi"
[ -f "$STATE" ] || fail "TestMappingSync was not created after the earlier failure"
if grep -q 'REAL_DROP' "$MYSQL_LOG"; then
    fail "a failed staging CREATE dropped the real routine"
fi
if printf '%s\n' "$multi" | grep -q 'secret-not-printed'; then
    fail "password printed"
fi

echo "procedure-deploy-db-diff.test.sh PASS"
