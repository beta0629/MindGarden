#!/bin/bash
# 수동 배포 입력(procedures) → 배포 SQL 경로 목록 변환을 확인한다.
# 비어 있으면 아무것도 고르지 않고, 형식 오류·없는 파일은 실패한다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
MAP="$ROOT/scripts/automation/deployment/procedure-deploy-dispatch-list.sh"
DEPLOY="$ROOT/scripts/automation/deployment/deploy-standardized-procedures.sh"
WF_DIR="$ROOT/.github/workflows"
ORIG_PATH="$PATH"
WORKDIR=$(mktemp -d "${TMPDIR:-/tmp}/mg-proc-dispatch-test.XXXXXX")
trap 'rm -rf "$WORKDIR"' EXIT

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

bash -n "$MAP"

if grep -n -E 'ProcessIntegratedSalaryCalculation|CalculateSalaryPreview|GetIntegratedSalaryStatistics|ApproveSalaryWithErpSync|ProcessSalaryPaymentWithErpSync|RecalcUnpaidSalaryCalculation|GetSalaryPreConfirmWarning|InsertSalaryAdjustmentForLateSessions' "$MAP"; then
    fail "mapping hardcodes a procedure name"
fi
if grep -n -E 'procedure_deploy_is_ident\(\)' "$MAP"; then
    fail "mapping reimplements procedure_deploy_is_ident"
fi

STUB="$WORKDIR/bin"
mkdir -p "$STUB"
for tool in ssh scp mysql; do
    printf '#!/bin/bash\necho "%s invoked" >&2\nexit 97\n' "$tool" > "$STUB/$tool"
    chmod +x "$STUB/$tool"
done

run_map() {
    local out err
    out=$(mktemp "${TMPDIR:-/tmp}/mg-map-out.XXXXXX")
    err=$(mktemp "${TMPDIR:-/tmp}/mg-map-err.XXXXXX")
    set +e
    env -i PATH="$ORIG_PATH" HOME="${HOME:-/tmp}" TMPDIR="${TMPDIR:-/tmp}" \
        PROCEDURE_DEPLOY_REQUESTED="$1" bash "$MAP" >"$out" 2>"$err"
    rc=$?
    set -e
    stdout=$(cat "$out")
    stderr=$(cat "$err")
    rm -f "$out" "$err"
}

run_plan() {
    local list="$1" out err
    out=$(mktemp "${TMPDIR:-/tmp}/mg-plan-out.XXXXXX")
    err=$(mktemp "${TMPDIR:-/tmp}/mg-plan-err.XXXXXX")
    set +e
    env -i PATH="$STUB:$ORIG_PATH" HOME="${HOME:-/tmp}" TMPDIR="${TMPDIR:-/tmp}" \
        GITHUB_EVENT_NAME=workflow_dispatch \
        PROCEDURE_DEPLOY_PLAN_ONLY=1 \
        PROCEDURE_DEPLOY_NO_FETCH=1 \
        ${list:+PROCEDURE_DEPLOY_CHANGED_FILES="$list"} \
        bash "$DEPLOY" dev >"$out" 2>"$err"
    plan_rc=$?
    set -e
    plan_out=$(cat "$out")
    plan_err=$(cat "$err")
    rm -f "$out" "$err"
}

DEPLOY_DIR="database/schema/procedures_standardized/deployment"
A=GetSalaryPreConfirmWarning
B=RecalcUnpaidSalaryCalculation
C=InsertSalaryAdjustmentForLateSessions

echo "=== empty input selects nothing ==="
for input in "" "   " " , ,"; do
    run_map "$input"
    [ "$rc" -eq 0 ] || fail "empty input rc=$rc stderr=$stderr"
    [ -z "$stdout" ] || fail "empty input produced: $stdout"
done

echo "=== empty input keeps the existing dispatch behavior ==="
run_plan ""
[ "$plan_rc" -eq 0 ] || fail "empty dispatch rc=$plan_rc stderr=$plan_err"
if printf '%s\n' "$plan_out" | grep -q '^PLAN safe-replace '; then
    fail "empty dispatch planned: $plan_out"
fi
printf '%s\n' "$plan_err" | grep -q '배포 커밋 범위가 없어' || fail "empty dispatch message changed: $plan_err"

echo "=== valid list maps to deploy SQL paths in order ==="
run_map " ${A}, ${B} ,${C} "
[ "$rc" -eq 0 ] || fail "valid rc=$rc stderr=$stderr"
expected=$(printf '%s\n' "${DEPLOY_DIR}/${A}_deploy.sql" "${DEPLOY_DIR}/${B}_deploy.sql" "${DEPLOY_DIR}/${C}_deploy.sql")
[ "$stdout" = "$expected" ] || fail "valid got: $stdout"

echo "=== mapped list plans exactly those procedures ==="
list="$WORKDIR/list.txt"
printf '%s\n' "$stdout" > "$list"
run_plan "$list"
[ "$plan_rc" -eq 0 ] || fail "plan rc=$plan_rc stderr=$plan_err"
plans=$(printf '%s\n' "$plan_out" | grep '^PLAN safe-replace ' || true)
expected_plans=$(printf 'PLAN safe-replace %s\n' "$A" "$B" "$C")
[ "$plans" = "$expected_plans" ] || fail "plan got: $plans"
for other in ProcessIntegratedSalaryCalculation CalculateSalaryPreview GetIntegratedSalaryStatistics ApproveSalaryWithErpSync ProcessSalaryPaymentWithErpSync; do
    if printf '%s\n' "$plans" | grep -q -F "$other"; then
        fail "plan touched $other"
    fi
done

echo "=== duplicates are listed once ==="
run_map "${A},${A}, ${A}"
[ "$rc" -eq 0 ] || fail "dup rc=$rc"
[ "$stdout" = "${DEPLOY_DIR}/${A}_deploy.sql" ] || fail "dup got: $stdout"

echo "=== invalid identifiers are refused ==="
for bad in "${A};DROP" "1Proc" "../${A}" "${A} X" "${A}-x" "\`${A}\`" "${A}/x" "\$(id)"; do
    run_map "${B},${bad}"
    [ "$rc" -eq 2 ] || fail "invalid '$bad' rc=$rc"
    printf '%s\n' "$stderr" | grep -q '거부' || fail "invalid '$bad' message: $stderr"
done

echo "=== missing deploy SQL fails the job ==="
missing_name="NoSuchProcedureForDispatchTest"
[ ! -e "$ROOT/${DEPLOY_DIR}/${missing_name}_deploy.sql" ] || fail "fixture name exists"
run_map "$missing_name"
[ "$rc" -eq 3 ] || fail "missing rc=$rc"
printf '%s\n' "$stderr" | grep -q "배포 SQL 없음: ${DEPLOY_DIR}/${missing_name}_deploy.sql" || fail "missing message: $stderr"
run_map "${A},${missing_name}"
[ "$rc" -eq 3 ] || fail "mixed missing rc=$rc"

echo "=== workflows call the mapping and forward the input ==="
for wf in deploy-procedures-dev.yml deploy-procedures-prod.yml deploy-procedures-production-mysql.yml; do
    grep -q 'procedure-deploy-dispatch-list.sh' "$WF_DIR/$wf" || fail "$wf does not call the mapping"
    grep -q 'PROCEDURE_DEPLOY_REQUESTED' "$WF_DIR/$wf" || fail "$wf does not pass the input"
    grep -q -E '^      procedures:' "$WF_DIR/$wf" || fail "$wf has no procedures input"
done
grep -q -E '^      procedures:' "$WF_DIR/deploy.yml" || fail "deploy.yml has no procedures input"
grep -q 'procedures=\$INPUT_PROCEDURES' "$WF_DIR/deploy.yml" || fail "deploy.yml does not forward procedures"

echo "PASS procedure-deploy-dispatch-list"
