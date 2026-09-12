#!/usr/bin/env bash
# 상담일지↔일정 링크 보정 SQL 회귀 테스트 (로컬 MySQL 8)
#
# 목적: consultation_session_link_repair_{dry_run,apply}.sql 이 PII 암호문 환경에서
#       내담자를 어떻게 해석하고 어떤 case_code 를 내는지 고정한다.
#       운영 dry-run 한 번이 곧 운영 DB 접속이므로, 분류 회귀는 로컬에서 잡는다.
#
# 사용법: MYSQL_SOCKET 또는 MYSQL_HOST/MYSQL_PORT 로 로컬 MySQL 8 지정
#   scripts/ops/test/run_session_link_repair_test.sh
#
# 검증 시나리오
#   1) 동일 client 가 slot A/B 두 일정 보유 + 일지 2건이 한쪽에만 → BY_DATE_SLOT + ORPHAN 이동
#   2) slot A 1건 / slot B 0건 + session_number 불일치 → MANUAL_CONTENT_SPLIT_REQUIRED (자동 이동 없음)
#   3) slot A/B 가 서로 다른 client → 폴백 불가, UNRESOLVED_NAME_PII (apply 후보 0)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$(cd "$HERE/.." && pwd)"
DRY_RUN_SQL="$OPS_DIR/consultation_session_link_repair_dry_run.sql"
APPLY_SQL="$OPS_DIR/consultation_session_link_repair_apply.sql"
DB=mg_session_link_test
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ -n "${MYSQL_SOCKET:-}" ]; then
  MYSQL_CONN=(--no-defaults -S "$MYSQL_SOCKET" -u "${MYSQL_USER:-root}")
else
  MYSQL_CONN=(--no-defaults -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" -u "${MYSQL_USER:-root}")
fi

FAILED=0

mysql_run() { mysql "${MYSQL_CONN[@]}" "$@"; }

# 워크플로 preamble 과 동일한 세션 변수 생성 (하드코딩 금지 — 인자만 사용)
build_preamble() {
  local client_id="$1" client_name="$2" session_date="$3" slot_a="$4" slot_b="$5"
  local esc_name="${client_name//\'/\'\'}"
  {
    echo "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "SET character_set_connection = utf8mb4;"
    echo "SET collation_connection = utf8mb4_unicode_ci;"
    echo "SET @client_name = CONVERT('${esc_name}' USING utf8mb4) COLLATE utf8mb4_unicode_ci;"
    echo "SET @client_id = ${client_id:-0};"
    echo "SET @session_date = '${session_date}';"
    echo "SET @slot_a_time = '${slot_a}';"
    echo "SET @slot_b_time = '${slot_b}';"
  } > "$WORK/preamble.sql"
}

run_sql_script() {
  local script="$1"
  cat "$WORK/preamble.sql" "$script" \
    | mysql "${MYSQL_CONN[@]}" "$DB" --batch --skip-column-names --default-character-set=utf8mb4 \
        --init-command="SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci; SET collation_connection = utf8mb4_unicode_ci;"
}

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  ok   $label = $actual"
  else
    echo "  FAIL $label: expected [$expected], got [$actual]"
    FAILED=$((FAILED + 1))
  fi
}

reset_db() {
  mysql_run < "$HERE/session_link_repair_schema.sql"
  mysql_run "$DB" -e "DROP TABLE IF EXISTS consultation_records_repair_bak_session_link;"
}

echo "== 시나리오 1: 동일 client · 일지 2건이 slot B 에만 (구조적 이동 가능) =="
reset_db
mysql_run "$DB" <<'SQL'
INSERT INTO schedules (id, tenant_id, client_id, consultant_id, date, start_time, end_time, status, session_sequence, mapping_id)
VALUES
  (9001, 'tenant-test-001', 101, 201, '2026-09-10', '11:00:00.000000', '11:50:00.000000', 'COMPLETED', 5, 301),
  (9002, 'tenant-test-001', 101, 201, '2026-09-10', '12:00:00.000000', '12:50:00.000000', 'COMPLETED', 6, 301),
  (9003, 'tenant-test-001', 102, 201, '2026-09-10', '15:00:00.000000', '15:50:00.000000', 'COMPLETED', 2, 302);
INSERT INTO consultation_records (id, tenant_id, consultation_id, client_id, consultant_id, session_date, session_number,
  client_condition, main_issues, created_at, updated_at)
VALUES
  (5001, 'tenant-test-001', 9002, 101, 201, '2026-09-10', 5, 'A 회기 본문', 'A 이슈', NOW(6), NOW(6)),
  (5002, 'tenant-test-001', 9002, 101, 201, '2026-09-10', 6, 'B 회기 본문', 'B 이슈', NOW(6), NOW(6));
SQL

build_preamble 0 '홍길동' '2026-09-10' '11:00:00' '12:00:00'
OUT="$(run_sql_script "$DRY_RUN_SQL")"
assert_eq "match_mode" "BY_DATE_SLOT" "$(printf '%s' "$OUT" | awk -F'\t' 'NF>=7 && $1 ~ /^(BY_|UNRESOLVED|NO_MATCH)/ {print $1; exit}')"
assert_eq "case_code" "STRUCT_ORPHAN_DOUBLE_SAFE_CANDIDATE" "$(printf '%s' "$OUT" | awk -F'\t' '$1 ~ /^(STRUCT_|MANUAL_|NO_RECORDS|AMBIGUOUS_|LINK_OK)/ {print $1; exit}')"
# 5b 미리보기는 record 당 1건만 (apply 와 동일 개수)
assert_eq "5001 미리보기 행 수" "1" "$(printf '%s' "$OUT" | awk -F'\t' '$1 == "5001" && $6 ~ /_PREVIEW$/ { n++ } END { print n + 0 }')"
assert_eq "5001 미리보기 이동 대상" "9001" "$(printf '%s' "$OUT" | awk -F'\t' '$1 == "5001" && $6 ~ /_PREVIEW$/ { print $3; exit }')"

build_preamble 0 '홍길동' '2026-09-10' '11:00:00' '12:00:00'
run_sql_script "$APPLY_SQL" > /dev/null
assert_eq "apply 후 slot A 일지" "5001" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT GROUP_CONCAT(id) FROM consultation_records WHERE consultation_id=9001 AND is_deleted=0;")"
assert_eq "apply 후 slot B 일지" "5002" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT GROUP_CONCAT(id) FROM consultation_records WHERE consultation_id=9002 AND is_deleted=0;")"
assert_eq "session_number 동기화" "5" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT session_number FROM consultation_records WHERE id=5001;")"
# 본문 TEXT 는 절대 변경하지 않는다
assert_eq "본문 보존(5001)" "A 회기 본문" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT client_condition FROM consultation_records WHERE id=5001;")"
assert_eq "백업 적재" "1" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT COUNT(*) FROM consultation_records_repair_bak_session_link;")"

echo "== 시나리오 2: slot A 1건 / slot B 0건 + session_number 불일치 (수동 분리) =="
reset_db
mysql_run "$DB" <<'SQL'
INSERT INTO schedules (id, tenant_id, client_id, consultant_id, date, start_time, end_time, status, session_sequence, mapping_id)
VALUES
  (9001, 'tenant-test-001', 101, 201, '2026-09-10', '11:00:00.000000', '11:50:00.000000', 'COMPLETED', 13, 301),
  (9002, 'tenant-test-001', 101, 201, '2026-09-10', '12:00:00.000000', '12:50:00.000000', 'COMPLETED', 14, 301),
  (9003, 'tenant-test-001', 102, 201, '2026-09-10', '15:00:00.000000', '15:50:00.000000', 'COMPLETED', 2, 302);
INSERT INTO consultation_records (id, tenant_id, consultation_id, client_id, consultant_id, session_date, session_number,
  client_condition, main_issues, created_at, updated_at)
VALUES
  (5001, 'tenant-test-001', 9001, 101, 201, '2026-09-10', 1, '합쳐진 본문', '이슈', NOW(6), NOW(6));
SQL

build_preamble 0 '홍길동' '2026-09-10' '11:00:00' '12:00:00'
OUT="$(run_sql_script "$DRY_RUN_SQL")"
assert_eq "match_mode" "BY_DATE_SLOT" "$(printf '%s' "$OUT" | awk -F'\t' 'NF>=7 && $1 ~ /^(BY_|UNRESOLVED|NO_MATCH)/ {print $1; exit}')"
assert_eq "case_code" "MANUAL_CONTENT_SPLIT_REQUIRED" "$(printf '%s' "$OUT" | awk -F'\t' '$1 ~ /^(STRUCT_|MANUAL_|NO_RECORDS|AMBIGUOUS_|LINK_OK)/ {print $1; exit}')"
# 링크 이동 후보는 없고, session_number 동기화만 미리보기에 뜬다
assert_eq "orphan/wrong 이동 미리보기" "0" "$(printf '%s' "$OUT" | grep -cE 'STRUCT_(ORPHAN|WRONG_LINK)_PREVIEW')"
assert_eq "session_number 동기화 미리보기" "1" "$(printf '%s' "$OUT" | grep -cE 'SESSION_NUMBER_SYNC_PREVIEW')"

echo "== 시나리오 3: slot A/B 가 서로 다른 client → 폴백 불가 =="
reset_db
mysql_run "$DB" <<'SQL'
INSERT INTO schedules (id, tenant_id, client_id, consultant_id, date, start_time, end_time, status, session_sequence, mapping_id)
VALUES
  (9001, 'tenant-test-001', 101, 201, '2026-09-10', '11:00:00.000000', '11:50:00.000000', 'COMPLETED', 13, 301),
  (9002, 'tenant-test-001', 102, 201, '2026-09-10', '12:00:00.000000', '12:50:00.000000', 'COMPLETED', 14, 302);
INSERT INTO consultation_records (id, tenant_id, consultation_id, client_id, consultant_id, session_date, session_number,
  client_condition, created_at, updated_at)
VALUES
  (5001, 'tenant-test-001', 9001, 101, 201, '2026-09-10', 1, '본문', NOW(6), NOW(6));
SQL

build_preamble 0 '홍길동' '2026-09-10' '11:00:00' '12:00:00'
OUT="$(run_sql_script "$DRY_RUN_SQL")"
assert_eq "match_mode" "UNRESOLVED_NAME_PII" "$(printf '%s' "$OUT" | awk -F'\t' 'NF>=7 && $1 ~ /^(BY_|UNRESOLVED|NO_MATCH)/ {print $1; exit}')"
assert_eq "case_code" "NO_RECORDS" "$(printf '%s' "$OUT" | awk -F'\t' '$1 ~ /^(STRUCT_|MANUAL_|NO_RECORDS|AMBIGUOUS_|LINK_OK)/ {print $1; exit}')"
# 4c 는 client 미해석이어도 slot 별 client_id 를 노출해야 한다 (재실행 입력 확보용)
assert_eq "4c slot 행 수" "2" "$(printf '%s' "$OUT" | awk -F'\t' 'NF == 9 && $9 ~ /^SLOT_/ { n++ } END { print n + 0 }')"
assert_eq "4c 노출 client_id" "101,102" "$(printf '%s' "$OUT" | awk -F'\t' 'NF == 9 && $9 ~ /^SLOT_/ { printf "%s%s", sep, $2; sep = "," }')"

build_preamble 0 '홍길동' '2026-09-10' '11:00:00' '12:00:00'
run_sql_script "$APPLY_SQL" > /dev/null
assert_eq "미해석 시 apply no-op" "9001" "$(mysql_run "$DB" --batch --skip-column-names -e "SELECT consultation_id FROM consultation_records WHERE id=5001;")"

echo
if [ "$FAILED" -eq 0 ]; then
  echo "PASS: session link repair SQL 회귀 테스트 전부 통과"
else
  echo "FAIL: $FAILED 건 실패"
fi
exit "$FAILED"
