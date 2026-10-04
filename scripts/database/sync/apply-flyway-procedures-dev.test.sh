#!/bin/bash
# apply-flyway-procedures-dev.sh 테스트.
# 가드(운영 동일 대상 거부)는 DB 없이 확인하고, 실제 적용은 일회용 MySQL 컨테이너에서만 한다.
# 필요 env(적용 테스트): DB_HOST DB_USER DB_PASS, PROCEDURE_STAGING_TEST_DB=disposable
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
APPLY="$ROOT/scripts/database/sync/apply-flyway-procedures-dev.sh"
DEV_SYNC_REL="database/schema/procedures_flyway_dev_sync"
FIXTURE_DEV="mg_fixture_flyway_dev"

pass=0
fail=0

ok() {
    pass=$((pass + 1))
    echo "ok - $1"
}

ng() {
    fail=$((fail + 1))
    echo "NOT ok - $1" >&2
}

bash -n "$APPLY"
ok "스크립트 문법"

echo "=== 1) 대상이 운영 호스트·스키마와 같으면 아무것도 하지 않는다 ==="
set +e
out=$(DEV_MYSQL_HOST=db.example.invalid DEV_DB_NAME=same_schema DEV_MYSQL_USER=u \
    DEV_MYSQL_PASSWORD=p PROD_MYSQL_HOST=db.example.invalid PROD_DB_NAME=same_schema \
    bash "$APPLY" 2>&1)
rc=$?
set -e
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "운영과 같습니다"; then
    ok "운영 동일 대상 거부"
else
    ng "운영 동일 대상을 통과시켰습니다 (rc=$rc): $out"
fi

echo "=== 2) 호스트만 같고 스키마가 다르면 운영으로 보지 않는다 ==="
set +e
out=$(DEV_MYSQL_HOST=db.example.invalid DEV_DB_NAME=dev_schema DEV_MYSQL_USER=u \
    DEV_MYSQL_PASSWORD=p PROD_MYSQL_HOST=db.example.invalid PROD_DB_NAME=prod_schema \
    bash "$APPLY" 2>&1)
rc=$?
set -e
if printf '%s' "$out" | grep -q "운영과 같습니다"; then
    ng "스키마가 다른데 운영으로 판정했습니다: $out"
else
    ok "스키마가 다르면 진행 시도 (접속 실패로 끝남)"
fi

echo "=== 3) MANIFEST 가 없으면 막는다 ==="
EMPTY=$(mktemp -d "${TMPDIR:-/tmp}/mg-flyway-apply-empty.XXXXXX")
set +e
out=$(FLYWAY_PROC_DEV_SYNC_DIR="$EMPTY/nope" DEV_MYSQL_HOST=h DEV_DB_NAME=d DEV_MYSQL_USER=u \
    bash "$APPLY" 2>&1)
rc=$?
set -e
rm -rf "$EMPTY"
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "폴더가 없습니다"; then
    ok "SQL 폴더 없으면 FAIL"
else
    ng "SQL 폴더가 없는데 통과했습니다 (rc=$rc): $out"
fi

if [ "${PROCEDURE_STAGING_TEST_DB:-}" != "disposable" ]; then
    echo ""
    echo "apply-flyway-procedures-dev.test summary pass=$pass fail=$fail (DB 적용 테스트는 건너뜀)"
    [ "$fail" -eq 0 ] || exit 1
    echo "PASS apply-flyway-procedures-dev (guard only)"
    exit 0
fi

: "${DB_HOST:?DB_HOST 필요}"
: "${DB_USER:?DB_USER 필요}"
: "${DB_PASS:?DB_PASS 필요}"
[ ! -f /etc/mindgarden/prod-to-dev-sync.env ] \
    || { echo "실서버 동기화 설정이 있는 머신에서는 실행하지 않습니다." >&2; exit 1; }

q() {
    MYSQL_PWD="$DB_PASS" mysql -h "$DB_HOST" -u "$DB_USER" -N --batch "$@"
}

trap 'q -e "DROP DATABASE IF EXISTS ${FIXTURE_DEV}" >/dev/null 2>&1 || true' EXIT
q -e "DROP DATABASE IF EXISTS ${FIXTURE_DEV}; CREATE DATABASE ${FIXTURE_DEV} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

run_apply() {
    DEV_MYSQL_HOST="$DB_HOST" DEV_MYSQL_USER="$DB_USER" DEV_MYSQL_PASSWORD="$DB_PASS" \
        DEV_DB_NAME="$FIXTURE_DEV" DEV_MYSQL_PORT="${MYSQL_TCP_PORT:-3306}" \
        PROD_MYSQL_HOST=prod.invalid PROD_DB_NAME=prod_schema \
        bash "$APPLY" 2>&1
}

expected_names=$(awk -F '\t' '/^[[:space:]]*#/ { next } NF > 1 { print $1 }' \
    "$ROOT/$DEV_SYNC_REL/MANIFEST.tsv" | sort)
expected_count=$(printf '%s\n' "$expected_names" | grep -c . || true)

echo "=== 4) 비어 있는 개발 스키마에 MANIFEST 전부를 만든다 ==="
if out=$(run_apply); then
    actual=$(q -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_DEV}' AND ROUTINE_TYPE='PROCEDURE' ORDER BY ROUTINE_NAME" | sort)
    if [ "$actual" = "$expected_names" ]; then
        ok "프로시저 ${expected_count}개 생성"
    else
        diff <(printf '%s\n' "$expected_names") <(printf '%s\n' "$actual") >&2 || true
        ng "생성된 프로시저 목록이 MANIFEST 와 다릅니다"
    fi
    if printf '%s' "$out" | grep -q "flyway-dev-sync created=${expected_count} kept=0 failed=0"; then
        ok "결과 요약 created=${expected_count}"
    else
        ng "결과 요약이 다릅니다: $(printf '%s' "$out" | grep flyway-dev-sync || true)"
    fi
    if printf '%s' "$out" | grep -q "^name | result | reason$"; then
        ok "프로시저별 결과 표 출력"
    else
        ng "결과 표가 없습니다"
    fi
    if printf '%s' "$out" | grep -q -F "$DB_PASS"; then
        ng "비밀번호가 출력되었습니다"
    else
        ok "비밀번호 미출력"
    fi
else
    ng "적용 실패: $out"
fi

echo "=== 5) 스테이징 프로시저가 남지 않는다 ==="
leftover=$(q -e "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_DEV}' AND ROUTINE_NAME LIKE '%__mg_stage'")
if [ "$leftover" = "0" ]; then
    ok "스테이징 잔존 없음"
else
    ng "스테이징 프로시저가 ${leftover}건 남았습니다"
fi

echo "=== 6) 호출부가 기대하는 파라미터 개수로 생성된다 ==="
params=$(q -e "SELECT COUNT(*) FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA='${FIXTURE_DEV}' AND SPECIFIC_NAME='ProcessOnboardingApproval'")
if [ "$params" = "12" ]; then
    ok "ProcessOnboardingApproval 파라미터 12개 (p_domain_suffix 포함)"
else
    ng "ProcessOnboardingApproval 파라미터가 ${params}개입니다 (기대 12)"
fi

echo "=== 7) 이미 있는 정의는 바꾸지 않는다 ==="
q "$FIXTURE_DEV" -e "DROP PROCEDURE IF EXISTS SetupTenantCategoryMapping;
CREATE PROCEDURE SetupTenantCategoryMapping(IN p_only INT) SELECT p_only;"
if out=$(run_apply); then
    params=$(q -e "SELECT COUNT(*) FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA='${FIXTURE_DEV}' AND SPECIFIC_NAME='SetupTenantCategoryMapping'")
    if [ "$params" = "1" ]; then
        ok "기존 정의 유지 (PlSqlInitializer 가 더 새 본문을 덮어쓴 경우 보호)"
    else
        ng "기존 정의를 덮어썼습니다 (params=$params)"
    fi
    if printf '%s' "$out" | grep -q "flyway-dev-sync created=0 kept=${expected_count} failed=0"; then
        ok "요약 created=0 kept=${expected_count} (재실행은 아무것도 바꾸지 않음)"
    else
        ng "재실행 요약이 다릅니다: $(printf '%s' "$out" | grep flyway-dev-sync || true)"
    fi
else
    ng "재실행 실패: $out"
fi

echo "=== 8) 재적재 SQL 이 깨지면 exit 1 과 실패 표를 낸다 ==="
BROKEN=$(mktemp -d "${TMPDIR:-/tmp}/mg-flyway-apply-broken.XXXXXX")
cp "$ROOT/$DEV_SYNC_REL/MANIFEST.tsv" "$BROKEN/"
cp "$ROOT/$DEV_SYNC_REL"/*_devsync.sql "$BROKEN/"
cat >"$BROKEN/ActivateDefaultComponents_devsync.sql" <<'SQL'
DELIMITER //

DROP PROCEDURE IF EXISTS ActivateDefaultComponents //

CREATE PROCEDURE ActivateDefaultComponents(IN p_only INT)
BEGIN
    THIS IS NOT SQL;
END //

DELIMITER ;
SQL
q "$FIXTURE_DEV" -e "DROP PROCEDURE IF EXISTS ActivateDefaultComponents;"
set +e
out=$(FLYWAY_PROC_DEV_SYNC_DIR="$BROKEN" DEV_MYSQL_HOST="$DB_HOST" DEV_MYSQL_USER="$DB_USER" \
    DEV_MYSQL_PASSWORD="$DB_PASS" DEV_DB_NAME="$FIXTURE_DEV" \
    DEV_MYSQL_PORT="${MYSQL_TCP_PORT:-3306}" \
    PROD_MYSQL_HOST=prod.invalid PROD_DB_NAME=prod_schema bash "$APPLY" 2>&1)
rc=$?
set -e
rm -rf "$BROKEN"
if [ "$rc" -ne 0 ] && printf '%s' "$out" | grep -q "failed=1"; then
    ok "실패 시 exit 1 + 실패 건수 표기"
else
    ng "깨진 SQL 인데 통과했습니다 (rc=$rc): $out"
fi
left=$(q -e "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_DEV}' AND ROUTINE_NAME LIKE '%__mg_stage'")
if [ "$left" = "0" ]; then
    ok "실패해도 스테이징이 남지 않음"
else
    ng "실패 후 스테이징이 ${left}건 남았습니다"
fi

echo ""
echo "apply-flyway-procedures-dev.test summary pass=$pass fail=$fail"
[ "$fail" -eq 0 ] || exit 1
echo "PASS apply-flyway-procedures-dev"
