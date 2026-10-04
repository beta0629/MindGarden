#!/bin/bash
# 일회용 MySQL 에서 야간 운영→개발 복사를 끝까지 실행한다.
# - 운영 픽스처 스키마의 테이블 데이터는 개발로 복사된다.
# - 운영 픽스처의 루틴 본문(깨진 시그니처 포함)은 가져오지 않는다.
# - 복사 직후 개발 스키마에 저장소의 모든 표준 프로시저가 db-diff safe-replace 로 들어온다.
# - Flyway 소유 온보딩 프로시저(FLYWAY_SOURCES.tsv)도 표준 배포 SQL 로 함께 다시 들어온다.
# - 개발 대상이 운영 호스트·스키마와 같으면 덤프·DROP 전에 멈춘다.
# 필요 env: DB_HOST DB_USER DB_PASS, PROCEDURE_STAGING_TEST_DB=disposable
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
FIXTURE_PROD="mg_fixture_prod"
FIXTURE_DEV="mg_fixture_dev"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

[ "${PROCEDURE_STAGING_TEST_DB:-}" = "disposable" ] \
    || fail "PROCEDURE_STAGING_TEST_DB=disposable 일 때만 실행합니다 (일회용 컨테이너 DB 전용)."
[ ! -f /etc/mindgarden/prod-to-dev-sync.env ] \
    || fail "실서버 동기화 설정이 있는 머신에서는 실행하지 않습니다."
: "${DB_HOST:?DB_HOST 필요}"
: "${DB_USER:?DB_USER 필요}"
: "${DB_PASS:?DB_PASS 필요}"

q() {
    MYSQL_PWD="$DB_PASS" mysql -h "$DB_HOST" -u "$DB_USER" -N --batch "$@"
}

WORK=$(mktemp -d "${TMPDIR:-/tmp}/mg-sync-test.XXXXXX")
trap 'rm -rf "$WORK"; q -e "DROP DATABASE IF EXISTS ${FIXTURE_PROD}; DROP DATABASE IF EXISTS ${FIXTURE_DEV}" >/dev/null 2>&1 || true' EXIT

q -e "DROP DATABASE IF EXISTS ${FIXTURE_PROD}; DROP DATABASE IF EXISTS ${FIXTURE_DEV};
CREATE DATABASE ${FIXTURE_PROD}; CREATE DATABASE ${FIXTURE_DEV};
CREATE TABLE ${FIXTURE_PROD}.sync_probe (id INT PRIMARY KEY, label VARCHAR(20));
INSERT INTO ${FIXTURE_PROD}.sync_probe VALUES (1, 'copied');
CREATE PROCEDURE ${FIXTURE_PROD}.GetIntegratedSalaryStatistics(IN p_only INT) SELECT p_only;
CREATE PROCEDURE ${FIXTURE_PROD}.ProdOnlyRoutine() SELECT 1;
CREATE PROCEDURE ${FIXTURE_DEV}.DevStaleRoutine() SELECT 1;"

# 서버에 올라가는 번들과 같은 구조로 배포 루트를 만든다.
# shellcheck disable=SC1091
. "$ROOT/scripts/automation/deployment/publish-dev-sync-bundle.sh"
BUNDLE="$WORK/root"
dev_sync_bundle_build "$BUNDLE"
SYNC="$BUNDLE/scripts/database/sync/prod-to-dev-daily.sh"
[ -x "$SYNC" ] || chmod +x "$SYNC"

write_env() {
    local dev_db="$1"
    mkdir -p "$WORK/log" "$WORK/tmp"
    cat >"$BUNDLE/scripts/database/sync/prod-to-dev-daily.env" <<EOF
SYNC_MODE=dump_live
NON_INTERACTIVE=1
DUMP_SKIP_ROUTINES=1
TMP_DIR=$WORK/tmp
LOG_DIR=$WORK/log
PROD_MYSQL_HOST=$DB_HOST
PROD_DB_NAME=$FIXTURE_PROD
PROD_MYSQL_USER=$DB_USER
PROD_MYSQL_PASSWORD=$DB_PASS
DEV_MYSQL_HOST=$DB_HOST
DEV_DB_NAME=$dev_db
DEV_MYSQL_USER=$DB_USER
DEV_MYSQL_PASSWORD=$DB_PASS
EOF
}

echo "=== guard: 개발 대상이 운영 호스트·스키마와 같으면 덤프·DROP 전에 멈춘다 ==="
write_env "$FIXTURE_PROD"
set +e
guard_out=$(bash "$SYNC" 2>&1)
guard_rc=$?
set -e
[ "$guard_rc" -ne 0 ] || fail "운영과 같은 대상에서 exit 0: $guard_out"
printf '%s\n' "$guard_out" | grep -q '운영과 같습니다' || fail "guard 메시지 없음: $guard_out"
[ "$(q -e "SELECT COUNT(*) FROM ${FIXTURE_PROD}.sync_probe")" = "1" ] || fail "guard 가 운영 픽스처를 건드렸습니다."
[ "$(q -e "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_PROD}'")" = "2" ] \
    || fail "guard 가 운영 픽스처 루틴을 건드렸습니다."

echo "=== 복사 후 개발 스키마에 저장소 프로시저 전부 ==="
write_env "$FIXTURE_DEV"
if ! bash "$SYNC" >"$WORK/sync.out" 2>&1; then
    cat "$WORK/sync.out" >&2
    fail "야간 복사 실패"
fi
if grep -q -F "$DB_PASS" "$WORK/sync.out"; then
    fail "비밀번호가 출력되었습니다."
fi

[ "$(q -e "SELECT label FROM ${FIXTURE_DEV}.sync_probe WHERE id=1")" = "copied" ] || fail "테이블 데이터가 복사되지 않았습니다."

standardized=$(cd "$ROOT/database/schema/procedures_standardized" && ls ./*_standardized.sql | sed 's#^\./##; s#_standardized\.sql$##')
flyway_owned=$(awk -F '\t' '/^[[:space:]]*#/ { next } NF > 1 { print $1 }' \
    "$ROOT/database/schema/procedures_standardized/FLYWAY_SOURCES.tsv")
expected=$(printf '%s\n' "$standardized" | grep . | sort)
actual=$(q -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_DEV}' AND ROUTINE_TYPE='PROCEDURE' ORDER BY ROUTINE_NAME" | sort)
if [ "$expected" != "$actual" ]; then
    diff <(printf '%s\n' "$expected") <(printf '%s\n' "$actual") >&2 || true
    fail "개발 스키마 프로시저가 저장소 목록과 다릅니다."
fi
while IFS= read -r name; do
    [ -n "$name" ] || continue
    [ "$(q -e "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='${FIXTURE_DEV}' AND ROUTINE_NAME='${name}'")" = "1" ] \
        || fail "Flyway 소유 온보딩 프로시저가 복사 뒤 되살아나지 않았습니다: $name"
done <<<"$flyway_owned"
params=$(q -e "SELECT COUNT(*) FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA='${FIXTURE_DEV}' AND SPECIFIC_NAME='GetIntegratedSalaryStatistics'")
[ "$params" = "11" ] || fail "GetIntegratedSalaryStatistics 가 저장소 정의가 아닙니다 (params=$params)."
grep -q 'summary total=' "$WORK/sync.out" || fail "프로시저별 결과 표가 없습니다."
echo "repo procedures=$(printf '%s\n' "$expected" | wc -l | tr -d ' ') (Flyway 원본 $(printf '%s\n' "$flyway_owned" | wc -l | tr -d ' ') 포함) dev procedures=$(printf '%s\n' "$actual" | wc -l | tr -d ' ')"
echo "PASS prod-to-dev-daily.mysql"
