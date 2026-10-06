#!/usr/bin/env bash
# 추가 패키지 병합 회기 목록·보정.
# DB_HOST DB_USER DB_PASSWORD DB_NAME 은 환경 변수. 이 스크립트는 그 값을 출력하지 않는다.
# list: 회기 불일치 SELECT 와 상담료 INCOME 잔존 SELECT. 둘 다 세션 READ ONLY.
# repair --mode backup: 덤프만 쓴다. 트랜잭션을 시작하지 않는다.
# repair --mode dry-run|apply: 기본은 덤프 후 트랜잭션. --skip-backup 이면 덤프를 생략한다.
#         기본 종료는 ROLLBACK. COMMIT 은 --mode apply 와 REPAIR_CONFIRM=CONFIRM 이 같이 있을 때만.
# verify: 기대 파일의 전값에서 후값을 계산해 새 READ ONLY 세션으로 대조한다. 불일치는 보고만 하고 되돌리지 않는다.
# income-probe: 매출 취소 허용 목록·선례의 전표·분개 형태를 READ ONLY 로 읽는다. 적요 원문은 출력하지 않는다.
# income-backup: 같은 범위의 전표·매칭·분개 행을 덤프한다. KST 11:00–20:00 에는 거부한다. 쓰기 없음.
# income-cancel: 허용 목록 INCOME 을 CANCELLED 로만 바꾼다(#1491 cancelRelatedPostedIncomeTransactions 와 같은 상태 전이).
#         환불 EXPENSE·분개·반대 전표는 만들지 않는다. 적요 끝에 " [CANCEL_REASON]" 을 덧붙인다.
#         backup → dry-run|apply 순서. apply 는 workflow_dispatch + INCOME_CANCEL_CONFIRM=CONFIRM + KST 가드.
# income-cancel-verify: 새 READ ONLY 세션에서 backup 스냅샷 대비 전값 유지 또는 후값을 대조한다.
# 덤프는 --no-create-info 다. DROP/CREATE TABLE 이 들어가지 않는다.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SELECT_SQL="${ROOT}/scripts/ops/sql/additional_package_merged_session_mismatch_select.sql"
INCOME_SQL="${ROOT}/scripts/ops/sql/consultation_income_leftover_select.sql"
RESTORE_SQL="${ROOT}/scripts/ops/sql/session_restore_used_shortfall_select.sql"
TAIL_SQL="${ROOT}/scripts/ops/sql/additional_package_merged_session_repair_tail.sql"

die() {
  echo "::error::$1" >&2
  exit 1
}

CNF_FILES=()
WORK_DIRS=()
cleanup() {
  unset MYSQL_PWD || true
  local f
  for f in "${CNF_FILES[@]+"${CNF_FILES[@]}"}"; do
    rm -f "$f"
  done
  for f in "${WORK_DIRS[@]+"${WORK_DIRS[@]}"}"; do
    rm -rf "$f"
  done
}
trap cleanup EXIT

require_db_env() {
  [ -n "${DB_HOST:-}" ] || die "DB_HOST is empty"
  [ -n "${DB_USER:-}" ] || die "DB_USER is empty"
  [ -n "${DB_PASSWORD:-}" ] || die "DB_PASSWORD is empty"
  [ -n "${DB_NAME:-}" ] || die "DB_NAME is empty"
  case "$DB_HOST" in
    *[!A-Za-z0-9._:%-]*) die "DB_HOST has unsupported characters" ;;
  esac
  case "$DB_USER" in
    *[!A-Za-z0-9._-]*) die "DB_USER has unsupported characters" ;;
  esac
  case "$DB_NAME" in
    *[!A-Za-z0-9._-]*) die "DB_NAME has unsupported characters" ;;
  esac
  case "${DB_PORT:-3306}" in
    ''|*[!0-9]*) die "DB_PORT must be numeric" ;;
  esac
}

assert_select_readonly() {
  [ -f "$SELECT_SQL" ] || die "list SQL file missing"
  if grep -qiE '(^|[^a-z_@])(insert|update|delete|drop|alter|truncate|create|replace|grant|call|set)[[:space:]]' "$SELECT_SQL"; then
    die "list SQL file contains a write statement"
  fi
  if grep -qiE 'financial_transactions|into[[:space:]]+outfile|load_file' "$SELECT_SQL"; then
    die "list SQL file touches a forbidden object"
  fi
}

assert_income_select_readonly() {
  [ -f "$INCOME_SQL" ] || die "income list SQL file missing"
  if grep -qiE '(^|[^a-z_@])(insert|update|delete|drop|alter|truncate|create|replace|grant|call|set)[[:space:]]' "$INCOME_SQL"; then
    die "income list SQL file contains a write statement"
  fi
  if grep -qiE 'into[[:space:]]+outfile|load_file' "$INCOME_SQL"; then
    die "income list SQL file touches a forbidden object"
  fi
}

assert_restore_select_readonly() {
  [ -f "$RESTORE_SQL" ] || die "restore shortfall SQL file missing"
  if grep -qiE '(^|[^a-z_@])(insert|update|delete|drop|alter|truncate|create|replace|grant|call|set)[[:space:]]' "$RESTORE_SQL"; then
    die "restore shortfall SQL file contains a write statement"
  fi
  if grep -qiE 'financial_transactions|salary_|payout|into[[:space:]]+outfile|load_file' "$RESTORE_SQL"; then
    die "restore shortfall SQL file touches a forbidden object"
  fi
}

assert_generated_safe() {
  local file="$1"
  [ -f "$file" ] || die "generated SQL missing"
  if grep -qiE 'financial_transactions|into[[:space:]]+outfile|load_file|erp_sync_logs' "$file"; then
    die "generated SQL touches a forbidden object"
  fi
  if grep -qiE '^[[:space:]]*(commit|rollback)[[:space:]]*;[[:space:]]*$' "$file"; then
    die "generated SQL must not commit; the runner appends one ending"
  fi
  if grep -iE '^[[:space:]]*create[[:space:]]+' "$file" | grep -viE '^[[:space:]]*create[[:space:]]+temporary[[:space:]]+table[[:space:]]+' >/dev/null; then
    die "generated SQL creates a permanent object"
  fi
  if grep -iE '^[[:space:]]*insert[[:space:]]+into[[:space:]]+' "$file" \
      | grep -viE '^[[:space:]]*insert[[:space:]]+into[[:space:]]+(tmp_[A-Za-z0-9_]+|repair_allowlist|repair_expected_before)([^A-Za-z0-9_]|$)' >/dev/null; then
    die "generated SQL inserts into a base table"
  fi
  if grep -iE '^[[:space:]]*update[[:space:]]+' "$file" \
      | grep -viE '^[[:space:]]*update[[:space:]]+(consultant_client_mappings|schedules)([[:space:]]|$)' >/dev/null; then
    die "generated SQL updates a forbidden table"
  fi
  if grep -qiE '^[[:space:]]*(delete|drop|alter|truncate|grant|call)[[:space:]]' "$file"; then
    die "generated SQL contains a forbidden statement"
  fi
}

write_client_cnf() {
  local dest="$1"
  umask 077
  cat >"$dest" <<EOF
[client]
host=${DB_HOST}
port=${DB_PORT:-3306}
user=${DB_USER}
default-character-set=utf8mb4
EOF
  chmod 600 "$dest"
  CNF_FILES+=("$dest")
}

mysql_exec() {
  local init_cmd="$1"
  local sql_file="$2"
  local cnf
  cnf="$(mktemp)"
  write_client_cnf "$cnf"
  export MYSQL_PWD="${DB_PASSWORD}"
  mysql --defaults-extra-file="$cnf" --batch --connect-timeout=20 \
    --init-command="$init_cmd" "$DB_NAME" <"$sql_file"
}

mysql_query_to() {
  local init_cmd="$1"
  local sql_file="$2"
  local out_file="$3"
  local cnf
  cnf="$(mktemp)"
  write_client_cnf "$cnf"
  export MYSQL_PWD="${DB_PASSWORD}"
  mysql --defaults-extra-file="$cnf" --batch --connect-timeout=20 \
    --init-command="$init_cmd" "$DB_NAME" <"$sql_file" >"$out_file"
}

mysqldump_where() {
  local table="$1"
  local where_sql="$2"
  local out_file="$3"
  local cnf
  cnf="$(mktemp)"
  write_client_cnf "$cnf"
  export MYSQL_PWD="${DB_PASSWORD}"
  local -a flags=(
    --defaults-extra-file="$cnf"
    --single-transaction
    --skip-lock-tables
    --no-tablespaces
    --set-gtid-purged=OFF
    --skip-comments
    --no-create-info
    --skip-extended-insert
  )
  if mysqldump --help 2>/dev/null | grep -q column-statistics; then
    flags+=(--column-statistics=0)
  fi
  mysqldump "${flags[@]}" "$DB_NAME" "$table" --where="$where_sql" >"$out_file"
}

load_allowlist() {
  local file="$1"
  ALLOW_VALUES=()
  [ -f "$file" ] || die "allowlist file missing"
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | tr -d '[:space:]')"
    [ -z "$line" ] && continue
    if ! [[ "$line" =~ ^[1-9][0-9]*,[1-9][0-9]*$ ]]; then
      die "allowlist line must be additional_mapping_id,schedule_id"
    fi
    ALLOW_VALUES+=("$line")
  done <"$file"
  if [ "${#ALLOW_VALUES[@]}" -eq 0 ]; then
    return 1
  fi
  local dup
  dup="$(printf '%s\n' "${ALLOW_VALUES[@]}" | sort | uniq -d || true)"
  if [ -n "$dup" ]; then
    die "allowlist has a duplicate pair"
  fi
  return 0
}

allowlist_preamble() {
  local joined=""
  local pair left right
  for pair in "${ALLOW_VALUES[@]}"; do
    left="${pair%%,*}"
    right="${pair##*,}"
    if [ -n "$joined" ]; then
      joined+=$", "
    fi
    joined+="(${left},${right})"
  done
  cat <<EOF
CREATE TEMPORARY TABLE repair_allowlist (
    additional_mapping_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    PRIMARY KEY (additional_mapping_id, schedule_id)
);
INSERT INTO repair_allowlist (additional_mapping_id, schedule_id) VALUES
${joined};
EOF
}

plan_body() {
  sed '${s/;[[:space:]]*$//}' "$SELECT_SQL"
}

cmd_list() {
  require_db_env
  assert_select_readonly
  assert_income_select_readonly
  assert_restore_select_readonly
  echo "=== additional package merged session mismatch (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "$SELECT_SQL"
  echo "=== consultation income leftover (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "$INCOME_SQL"
  echo "=== session restore used shortfall (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "$RESTORE_SQL"
}

load_expect_rows() {
  EXPECT_ROWS=()
  [ -n "${expect_before:-}" ] || return 0
  [ -f "$expect_before" ] || die "expect-before file missing"
  local line raw
  while IFS= read -r line || [ -n "$line" ]; do
    raw="${line%%#*}"
    raw="$(printf '%s' "$raw" | tr -d '[:space:]')"
    [ -z "$raw" ] && continue
    if ! [[ "$raw" =~ ^[0-9]+,[0-9]+,[0-9]+,[0-9]+,[0-9]+,[0-9]+,[A-Z_]+,[0-9]+,[A-Z_]+,[0-9]+,[0-9]+,[0-9]+,[0-9]+$ ]]; then
      die "expect-before line must be additional,schedule,target,total,used,remaining,status,version,schedule_status,sequence,schedule_version,schedule_mapping,apply_sequence"
    fi
    EXPECT_ROWS+=("$raw")
  done <"$expect_before"
  if [ "${#EXPECT_ROWS[@]}" -lt 1 ]; then
    die "expect-before file has no data row"
  fi
}

emit_expected_before() {
  cat <<'EOF'
CREATE TEMPORARY TABLE repair_expected_before (
    additional_mapping_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    target_mapping_id BIGINT NOT NULL,
    total_sessions INT NOT NULL,
    used_sessions INT NOT NULL,
    remaining_sessions INT NOT NULL,
    target_status VARCHAR(40) NOT NULL,
    target_version BIGINT NOT NULL,
    schedule_status VARCHAR(40) NOT NULL,
    schedule_session_sequence INT NOT NULL,
    schedule_version BIGINT NOT NULL,
    schedule_mapping_id BIGINT NOT NULL,
    apply_session_sequence INT NOT NULL,
    PRIMARY KEY (additional_mapping_id, schedule_id)
);
EOF
  if [ -z "${expect_before:-}" ]; then
    return 0
  fi
  load_expect_rows
  local raw
  local eb_add eb_sch eb_tgt eb_total eb_used eb_rem eb_status eb_ver
  local eb_sch_status eb_seq eb_sch_ver eb_sch_map eb_apply
  for raw in "${EXPECT_ROWS[@]}"; do
    IFS=',' read -r eb_add eb_sch eb_tgt eb_total eb_used eb_rem eb_status eb_ver eb_sch_status eb_seq eb_sch_ver eb_sch_map eb_apply <<<"$raw"
    echo "INSERT INTO repair_expected_before (additional_mapping_id, schedule_id, target_mapping_id, total_sessions, used_sessions, remaining_sessions, target_status, target_version, schedule_status, schedule_session_sequence, schedule_version, schedule_mapping_id, apply_session_sequence) VALUES (${eb_add}, ${eb_sch}, ${eb_tgt}, ${eb_total}, ${eb_used}, ${eb_rem}, '${eb_status}', ${eb_ver}, '${eb_sch_status}', ${eb_seq}, ${eb_sch_ver}, ${eb_sch_map}, ${eb_apply});"
  done
}

assert_text_readonly() {
  local file="$1"
  [ -f "$file" ] || die "read SQL file missing"
  if grep -qiE '(^|[^a-z_@])(insert|update|delete|drop|alter|truncate|create|replace|grant|call|set)[[:space:]]' "$file"; then
    die "generated read SQL contains a write statement"
  fi
  if grep -qiE 'financial_transactions|salary_|payout|into[[:space:]]+outfile|load_file' "$file"; then
    die "generated read SQL touches a forbidden object"
  fi
}

write_plan_backup() {
  local backup_dir="$1"
  local work
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  {
    allowlist_preamble
    echo "CREATE TEMPORARY TABLE tmp_plan AS"
    plan_body
    echo ";"
    echo "SELECT"
    echo "    p.tenant_id, p.additional_mapping_id, p.target_mapping_id, p.schedule_id, p.plan_status"
    echo "FROM tmp_plan p"
    echo "INNER JOIN repair_allowlist a"
    echo "    ON a.additional_mapping_id = p.additional_mapping_id"
    echo "   AND a.schedule_id = p.schedule_id;"
  } >"${work}/extract.sql"
  assert_generated_safe "${work}/extract.sql"

  mkdir -p "$backup_dir"
  echo "=== id extract (no base-table change) ==="
  mysql_query_to "SET SESSION cte_max_recursion_depth = 1000" "${work}/extract.sql" "${backup_dir}/plan_ids.tsv"
  if [ ! -s "${backup_dir}/plan_ids.tsv" ]; then
    die "allowlist matched no mismatch rows"
  fi
  # 헤더 한 줄은 식별자 이름이다. 데이터 행이 없으면 중단한다.
  local data_rows
  data_rows="$(tail -n +2 "${backup_dir}/plan_ids.tsv" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [ "$data_rows" = "0" ]; then
    die "allowlist matched no mismatch rows"
  fi

  local map_ids="" sch_ids="" tenants=""
  local tenant add_id target_id sch_id status
  while IFS=$'\t' read -r tenant add_id target_id sch_id status; do
    [ "$tenant" = "tenant_id" ] && continue
    case "$tenant" in
      ''|*[!A-Za-z0-9._:-]*) die "tenant id from plan has unsupported characters" ;;
    esac
    case "$add_id" in
      ''|*[!0-9]*) die "additional mapping id from plan is not numeric" ;;
    esac
    case "$sch_id" in
      ''|*[!0-9]*) die "schedule id from plan is not numeric" ;;
    esac
    case "$target_id" in
      ''|NULL|*[!0-9]*) die "target mapping id from plan is not numeric" ;;
    esac
    case ",${map_ids}," in
      *",${add_id},"*) ;;
      *) map_ids="${map_ids:+$map_ids,}${add_id}" ;;
    esac
    case ",${map_ids}," in
      *",${target_id},"*) ;;
      *) map_ids="${map_ids:+$map_ids,}${target_id}" ;;
    esac
    case ",${sch_ids}," in
      *",${sch_id},"*) ;;
      *) sch_ids="${sch_ids:+$sch_ids,}${sch_id}" ;;
    esac
    case ",${tenants}," in
      *",'${tenant}',"*) ;;
      *) tenants="${tenants:+$tenants,}'${tenant}'" ;;
    esac
  done <"${backup_dir}/plan_ids.tsv"

  [ -n "$map_ids" ] || die "no mapping ids to back up"
  [ -n "$sch_ids" ] || die "no schedule ids to back up"
  echo "=== backup rows before apply (artifact only) ==="
  mysqldump_where consultant_client_mappings \
    "id IN (${map_ids}) AND tenant_id IN (${tenants})" \
    "${backup_dir}/consultant_client_mappings.sql"
  mysqldump_where schedules \
    "id IN (${sch_ids}) AND tenant_id IN (${tenants})" \
    "${backup_dir}/schedules.sql"
  # 덤프 본문은 로그에 찍지 않는다. notes 가 들어 있을 수 있다.
  echo "backup files written (mappings, schedules)"
}

run_repair_transaction() {
  local mode="$1"
  local work ending
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  if [ "$mode" = "apply" ]; then
    ending="COMMIT;"
  else
    ending="ROLLBACK;"
  fi
  {
    allowlist_preamble
    echo "START TRANSACTION;"
    echo "SELECT DISTINCT m.id FROM consultant_client_mappings m"
    echo "INNER JOIN repair_allowlist a ON a.additional_mapping_id = m.id"
    echo "FOR UPDATE;"
    echo "CREATE TEMPORARY TABLE tmp_plan AS"
    plan_body
    echo ";"
    emit_expected_before
    cat "$TAIL_SQL"
    echo "$ending"
  } >"${work}/apply.sql"

  # 끝의 COMMIT/ROLLBACK 한 줄만 허용하고 검사 대상에서는 뺀다.
  head -n -1 "${work}/apply.sql" >"${work}/apply_body.sql"
  assert_generated_safe "${work}/apply_body.sql"
  local last
  last="$(tail -n 1 "${work}/apply.sql")"
  if [ "$last" != "$ending" ]; then
    die "repair ending statement mismatch"
  fi

  echo "=== repair transaction ending=${ending} ==="
  mysql_exec "SET SESSION cte_max_recursion_depth = 1000" "${work}/apply.sql"
  echo "=== repair transaction finished ending=${ending} ==="
}

cmd_repair() {
  local allowlist="" mode="dry-run" backup_dir="" skip_backup=0
  expect_before=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --allowlist)
        allowlist="$2"
        shift 2
        ;;
      --mode)
        mode="$2"
        shift 2
        ;;
      --backup-dir)
        backup_dir="$2"
        shift 2
        ;;
      --expect-before)
        expect_before="$2"
        shift 2
        ;;
      --skip-backup)
        skip_backup=1
        shift
        ;;
      *)
        die "unknown repair argument"
        ;;
    esac
  done
  [ -n "$allowlist" ] || die "--allowlist is required"
  case "$mode" in
    backup|dry-run|apply) ;;
    *) die "--mode must be backup, dry-run, or apply" ;;
  esac
  if [ "$mode" = "backup" ] && [ "$skip_backup" -eq 1 ]; then
    die "--skip-backup cannot be combined with backup mode"
  fi
  if [ "$mode" = "apply" ] && [ "${REPAIR_CONFIRM:-}" != "CONFIRM" ]; then
    die "apply requires REPAIR_CONFIRM=CONFIRM"
  fi
  if [ "$skip_backup" -eq 0 ] && [ -z "$backup_dir" ]; then
    die "--backup-dir is required"
  fi
  if ! load_allowlist "$allowlist"; then
    echo "허용 목록이 비어 있어 보정은 수행하지 않습니다."
    exit 0
  fi
  if [ "$mode" != "backup" ]; then
    [ -f "$TAIL_SQL" ] || die "repair tail missing"
  fi
  require_db_env
  assert_select_readonly
  if [ "$skip_backup" -eq 0 ]; then
    write_plan_backup "$backup_dir"
  fi
  if [ "$mode" = "backup" ]; then
    echo "backup only; no transaction"
    return 0
  fi
  run_repair_transaction "$mode"
}

cmd_verify() {
  expect_before=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --expect-before)
        expect_before="$2"
        shift 2
        ;;
      *)
        die "unknown verify argument"
        ;;
    esac
  done
  [ -n "$expect_before" ] || die "--expect-before is required"
  load_expect_rows
  require_db_env

  # 매칭 version 은 행당 1 이고 used/remaining 은 일정 건수만큼 움직인다. tail 의 UPDATE 와 같다.
  declare -A pin_total pin_used pin_rem pin_ver pin_status pin_delta
  declare -A sch_tgt sch_apply sch_ver sch_status sch_before_map sch_before_seq
  local raw map_ids="" sch_ids=""
  local eb_add eb_sch eb_tgt eb_total eb_used eb_rem eb_status eb_ver
  local eb_sch_status eb_seq eb_sch_ver eb_sch_map eb_apply
  for raw in "${EXPECT_ROWS[@]}"; do
    IFS=',' read -r eb_add eb_sch eb_tgt eb_total eb_used eb_rem eb_status eb_ver eb_sch_status eb_seq eb_sch_ver eb_sch_map eb_apply <<<"$raw"
    if [ -n "${pin_delta[$eb_tgt]+x}" ]; then
      if [ "${pin_total[$eb_tgt]}" != "$eb_total" ] \
        || [ "${pin_used[$eb_tgt]}" != "$eb_used" ] \
        || [ "${pin_rem[$eb_tgt]}" != "$eb_rem" ] \
        || [ "${pin_ver[$eb_tgt]}" != "$eb_ver" ] \
        || [ "${pin_status[$eb_tgt]}" != "$eb_status" ]; then
        die "expect-before rows disagree on the target before image"
      fi
      pin_delta[$eb_tgt]=$((pin_delta[$eb_tgt] + 1))
    else
      pin_total[$eb_tgt]="$eb_total"
      pin_used[$eb_tgt]="$eb_used"
      pin_rem[$eb_tgt]="$eb_rem"
      pin_ver[$eb_tgt]="$eb_ver"
      pin_status[$eb_tgt]="$eb_status"
      pin_delta[$eb_tgt]=1
      map_ids="${map_ids:+$map_ids,}${eb_tgt}"
    fi
    if [ -n "${sch_apply[$eb_sch]+x}" ]; then
      die "expect-before lists the same schedule more than once"
    fi
    sch_tgt[$eb_sch]="$eb_tgt"
    sch_apply[$eb_sch]="$eb_apply"
    sch_ver[$eb_sch]="$eb_sch_ver"
    sch_status[$eb_sch]="$eb_sch_status"
    sch_before_map[$eb_sch]="$eb_sch_map"
    sch_before_seq[$eb_sch]="$eb_seq"
    sch_ids="${sch_ids:+$sch_ids,}${eb_sch}"
  done

  local work
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  cat >"${work}/verify.sql" <<EOF
SELECT 'mapping' AS row_kind,
       id,
       total_sessions,
       used_sessions,
       remaining_sessions,
       version,
       status,
       CAST(NULL AS SIGNED) AS mapping_id,
       CAST(NULL AS SIGNED) AS session_sequence
FROM consultant_client_mappings
WHERE id IN (${map_ids})
UNION ALL
SELECT 'schedule',
       id,
       CAST(NULL AS SIGNED),
       CAST(NULL AS SIGNED),
       CAST(NULL AS SIGNED),
       version,
       status,
       mapping_id,
       session_sequence
FROM schedules
WHERE id IN (${sch_ids});
EOF
  assert_text_readonly "${work}/verify.sql"

  echo "=== post-commit readback (read only, new session) ==="
  declare -A printed_map
  for raw in "${EXPECT_ROWS[@]}"; do
    IFS=',' read -r eb_add eb_sch eb_tgt eb_total eb_used eb_rem eb_status eb_ver eb_sch_status eb_seq eb_sch_ver eb_sch_map eb_apply <<<"$raw"
    if [ -z "${printed_map[$eb_tgt]+x}" ]; then
      echo "before_pin mapping id=${eb_tgt} total=${pin_total[$eb_tgt]} used=${pin_used[$eb_tgt]} remaining=${pin_rem[$eb_tgt]} version=${pin_ver[$eb_tgt]} status=${pin_status[$eb_tgt]}"
      echo "expected_after mapping id=${eb_tgt} total=${pin_total[$eb_tgt]} used=$((pin_used[$eb_tgt] + pin_delta[$eb_tgt])) remaining=$((pin_rem[$eb_tgt] - pin_delta[$eb_tgt])) version=$((pin_ver[$eb_tgt] + 1)) status=${pin_status[$eb_tgt]}"
      printed_map[$eb_tgt]=1
    fi
    echo "before_pin schedule id=${eb_sch} mapping_id=${sch_before_map[$eb_sch]} session_sequence=${sch_before_seq[$eb_sch]} version=${sch_ver[$eb_sch]} status=${sch_status[$eb_sch]}"
    echo "expected_after schedule id=${eb_sch} mapping_id=${sch_tgt[$eb_sch]} session_sequence=${sch_apply[$eb_sch]} version=$((sch_ver[$eb_sch] + 1)) status=${sch_status[$eb_sch]}"
  done

  mysql_query_to "SET SESSION TRANSACTION READ ONLY" "${work}/verify.sql" "${work}/actual.tsv"

  declare -A got_map got_sch
  local kind="" id="" total="" used="" rem="" version="" status="" mapping_id="" seq=""
  local match=1
  while IFS=$'\t' read -r kind id total used rem version status mapping_id seq || [ -n "$kind" ]; do
    [ -z "$kind" ] && continue
    [ "$kind" = "row_kind" ] && continue
    if [ "$kind" = "mapping" ]; then
      got_map[$id]=1
      echo "actual mapping id=${id} total=${total} used=${used} remaining=${rem} version=${version} status=${status}"
      if [ -z "${pin_delta[$id]+x}" ] \
        || [ "$total" != "${pin_total[$id]}" ] \
        || [ "$used" != "$((pin_used[$id] + pin_delta[$id]))" ] \
        || [ "$rem" != "$((pin_rem[$id] - pin_delta[$id]))" ] \
        || [ "$version" != "$((pin_ver[$id] + 1))" ] \
        || [ "$status" != "${pin_status[$id]}" ]; then
        match=0
      fi
    elif [ "$kind" = "schedule" ]; then
      got_sch[$id]=1
      echo "actual schedule id=${id} mapping_id=${mapping_id} session_sequence=${seq} version=${version} status=${status}"
      if [ -z "${sch_apply[$id]+x}" ] \
        || [ "$mapping_id" != "${sch_tgt[$id]}" ] \
        || [ "$seq" != "${sch_apply[$id]}" ] \
        || [ "$version" != "$((sch_ver[$id] + 1))" ] \
        || [ "$status" != "${sch_status[$id]}" ]; then
        match=0
      fi
    else
      echo "actual unexpected row_kind=${kind}"
      match=0
    fi
  done <"${work}/actual.tsv"

  local tgt sid
  for tgt in "${!pin_delta[@]}"; do
    if [ -z "${got_map[$tgt]+x}" ]; then
      echo "actual mapping id=${tgt} MISSING"
      match=0
    fi
  done
  for sid in "${!sch_apply[@]}"; do
    if [ -z "${got_sch[$sid]+x}" ]; then
      echo "actual schedule id=${sid} MISSING"
      match=0
    fi
  done

  if [ "$match" -eq 1 ]; then
    echo "POST_COMMIT_MATCH=yes"
    return 0
  fi
  echo "POST_COMMIT_MATCH=no"
  echo "::error::committed rows differ from the expected after image; leaving the committed rows in place"
  exit 1
}

assert_income_read_safe() {
  local file="$1"
  [ -f "$file" ] || die "income read SQL file missing"
  if grep -qiE '(^|[^a-z_@])(insert|update|delete|drop|alter|truncate|create|replace|grant|call|set)[[:space:]]' "$file"; then
    die "income read SQL contains a write statement"
  fi
  if grep -qiE 'into[[:space:]]+outfile|load_file' "$file"; then
    die "income read SQL touches a forbidden object"
  fi
}

load_tenant_env() {
  local file="$1"
  [ -f "$file" ] || die "tenant env file missing"
  local line
  line="$(grep -E '^TENANT_ID=' "$file" | tail -n 1 || true)"
  INCOME_TENANT="${line#TENANT_ID=}"
  [ -n "$INCOME_TENANT" ] || die "TENANT_ID is empty in the tenant env file"
  if ! [[ "$INCOME_TENANT" =~ ^[A-Za-z0-9._:-]+$ ]]; then
    die "TENANT_ID has unsupported characters"
  fi
}

load_income_allowlist() {
  local file="$1"
  INCOME_ROWS=()
  [ -f "$file" ] || die "income allowlist file missing"
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | tr -d '[:space:]')"
    [ -z "$line" ] && continue
    if ! [[ "$line" =~ ^[1-9][0-9]*,[1-9][0-9]*,[1-9][0-9]*$ ]]; then
      die "income allowlist line must be mapping_id,income_tx_id,amount"
    fi
    INCOME_ROWS+=("$line")
  done <"$file"
  [ "${#INCOME_ROWS[@]}" -gt 0 ] || return 1
  local dup
  dup="$(printf '%s\n' "${INCOME_ROWS[@]}" | cut -d, -f1 | sort | uniq -d || true)"
  [ -z "$dup" ] || die "income allowlist repeats a mapping"
  dup="$(printf '%s\n' "${INCOME_ROWS[@]}" | cut -d, -f2 | sort | uniq -d || true)"
  [ -z "$dup" ] || die "income allowlist repeats a transaction"
  return 0
}

load_income_precedent() {
  local file="$1"
  [ -f "$file" ] || die "income precedent file missing"
  local line rows=()
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | tr -d '[:space:]')"
    [ -z "$line" ] && continue
    if ! [[ "$line" =~ ^[1-9][0-9]*,[1-9][0-9]*,[1-9][0-9]*$ ]]; then
      die "income precedent line must be mapping_id,income_tx_id,cancel_tx_id"
    fi
    rows+=("$line")
  done <"$file"
  [ "${#rows[@]}" -eq 1 ] || die "income precedent file must have exactly one data row"
  IFS=',' read -r PREC_MAPPING PREC_INCOME_TX PREC_CANCEL_TX <<<"${rows[0]}"
}

load_income_denylist() {
  local file="$1"
  DENY_IDS=()
  [ -f "$file" ] || die "income denylist file missing"
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="$(printf '%s' "$line" | tr -d '[:space:]')"
    [ -z "$line" ] && continue
    [[ "$line" =~ ^[1-9][0-9]*$ ]] || die "income denylist line must be a mapping id"
    DENY_IDS+=("$line")
  done <"$file"
  [ "${#DENY_IDS[@]}" -gt 0 ] || die "income denylist is empty"
}

# 허용 목록 매칭·전표가 거부 목록·선례와 겹치면 DB 접속 전에 중단한다.
assert_income_scope() {
  local raw m tx d
  for raw in "${INCOME_ROWS[@]}"; do
    IFS=, read -r m tx _ <<<"$raw"
    for d in "${DENY_IDS[@]}"; do
      [ "$m" != "$d" ] || die "income allowlist contains a denied mapping"
    done
    [ "$m" != "$PREC_MAPPING" ] || die "income allowlist contains the precedent mapping"
    [ "$tx" != "$PREC_INCOME_TX" ] || die "income allowlist contains the precedent income"
    [ "$tx" != "$PREC_CANCEL_TX" ] || die "income allowlist contains the precedent cancel entry"
  done
}

income_id_lists() {
  INCOME_MAP_IDS=""
  INCOME_TX_IDS=""
  local raw m tx
  for raw in "${INCOME_ROWS[@]}"; do
    IFS=, read -r m tx _ <<<"$raw"
    INCOME_MAP_IDS="${INCOME_MAP_IDS:+$INCOME_MAP_IDS,}${m}"
    INCOME_TX_IDS="${INCOME_TX_IDS:+$INCOME_TX_IDS,}${tx}"
  done
}

# 적요·비고 원문은 출력하지 않는다. 상품명은 {package} 로, 사유는 코드 기본 문구일 때만 보인다.
emit_income_probe_sql() {
  local t="$1" maps="$2" txs="$3"
  cat <<EOF
SELECT 'ft_column' AS section, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE,
       COLUMN_DEFAULT IS NOT NULL AS has_default, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'financial_transactions'
ORDER BY ORDINAL_POSITION;

SELECT 'mapping' AS section, m.id, m.status, m.payment_status, m.deposit_confirmed + 0 AS deposit_confirmed,
       m.payment_date IS NOT NULL AS has_payment_date, m.total_sessions, m.used_sessions,
       m.remaining_sessions, m.package_price, m.payment_amount, m.version, m.is_deleted + 0 AS is_deleted,
       m.terminated_at IS NOT NULL AS has_terminated_at, m.updated_at
FROM consultant_client_mappings m
WHERE m.tenant_id = '${t}' AND m.id IN (${maps})
ORDER BY m.id;

SELECT 'tx' AS section, ft.id, ft.related_entity_id, ft.related_entity_type, ft.transaction_type,
       ft.category, ft.subcategory, ft.category_code_id, ft.subcategory_code_id,
       ft.amount, ft.amount_before_tax, ft.tax_amount, ft.withholding_tax_amount,
       ft.card_merchant_fee_amount, ft.tax_included + 0 AS tax_included, ft.status, ft.transaction_date,
       ft.approver_id IS NOT NULL AS has_approver, ft.approved_at IS NOT NULL AS has_approved_at,
       CHAR_LENGTH(ft.approval_comment) AS approval_comment_len,
       ft.department IS NOT NULL AS has_department, ft.project_code IS NOT NULL AS has_project_code,
       ft.branch_code IS NOT NULL AS has_branch_code,
       ft.is_deleted + 0 AS is_deleted, ft.deleted_at IS NOT NULL AS has_deleted_at, ft.version,
       ft.created_at, ft.updated_at,
       SUBSTRING_INDEX(ft.description, ' - ', 1) AS desc_head,
       CHAR_LENGTH(ft.description) AS desc_len,
       CASE
           WHEN ft.transaction_type <> 'EXPENSE' OR ft.description IS NULL THEN NULL
           WHEN REGEXP_REPLACE(
                    REPLACE(ft.description, IFNULL(NULLIF(m.package_name, ''), CHAR(1)), '{package}'),
                    '사유: [^)]*', '사유: {reason}')
                REGEXP '^[^-]+ - [{]package[}] [(][0-9]+회기 환불, 사유: [{]reason[}][)]( .부가세 분리: 공급가 [0-9,]+원, 부가세 [0-9,]+원.)?$'
           THEN REGEXP_REPLACE(
                    REPLACE(ft.description, IFNULL(NULLIF(m.package_name, ''), CHAR(1)), '{package}'),
                    '사유: [^)]*', '사유: {reason}')
           ELSE CONCAT('{withheld len=', CHAR_LENGTH(ft.description), '}')
       END AS expense_desc_template,
       CASE WHEN ft.description LIKE '%사유: %' THEN
           CASE WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(ft.description, '사유: ', -1), ')', 1)
                     IN ('관리자 처리', '기타', '환불테스트')
                THEN SUBSTRING_INDEX(SUBSTRING_INDEX(ft.description, '사유: ', -1), ')', 1)
                ELSE CONCAT('{custom len=',
                            CHAR_LENGTH(SUBSTRING_INDEX(SUBSTRING_INDEX(ft.description, '사유: ', -1), ')', 1)),
                            '}')
           END
       END AS desc_reason,
       ft.description LIKE CONCAT('%', m.package_name, '%') AS desc_has_package_name,
       CASE WHEN ft.remarks IS NULL THEN 'NULL'
            WHEN ft.remarks LIKE 'orderPublicId=%' THEN 'ORDER_REF'
            ELSE CONCAT('OTHER len=', CHAR_LENGTH(ft.remarks)) END AS remarks_kind
FROM financial_transactions ft
LEFT JOIN consultant_client_mappings m
    ON m.tenant_id = ft.tenant_id AND m.id = ft.related_entity_id
WHERE ft.tenant_id = '${t}'
  AND (
      ft.id IN (${txs})
      OR (ft.related_entity_id IN (${maps}) AND ft.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%')
  )
ORDER BY ft.related_entity_id, ft.id;

SELECT 'journal' AS section, ae.id AS entry_id, ae.financial_transaction_id, ae.entry_type, ae.amount,
       ae.balance_sheet_category, ae.subcategory, ae.approval_status, ae.entry_status,
       ae.posted_at IS NOT NULL AS has_posted_at, ae.related_transaction_type,
       ae.total_debit, ae.total_credit, ae.is_deleted + 0 AS is_deleted, ae.entry_date, ae.created_at,
       (SELECT COUNT(*) FROM erp_journal_entry_lines l
         WHERE l.tenant_id = ae.tenant_id AND l.journal_entry_id = ae.id) AS line_count
FROM accounting_entries ae
INNER JOIN financial_transactions ft
    ON ft.tenant_id = ae.tenant_id AND ft.id = ae.financial_transaction_id
WHERE ae.tenant_id = '${t}'
  AND (
      ft.id IN (${txs})
      OR (ft.related_entity_id IN (${maps}) AND ft.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%')
  )
ORDER BY ae.financial_transaction_id, ae.id;

SELECT 'journal_line' AS section, l.journal_entry_id, l.line_number, l.account_id,
       l.debit_amount, l.credit_amount, l.is_deleted + 0 AS is_deleted,
       SUBSTRING_INDEX(l.description, ' - ', 1) AS line_desc_head
FROM erp_journal_entry_lines l
INNER JOIN accounting_entries ae
    ON ae.tenant_id = l.tenant_id AND ae.id = l.journal_entry_id
INNER JOIN financial_transactions ft
    ON ft.tenant_id = ae.tenant_id AND ft.id = ae.financial_transaction_id
WHERE l.tenant_id = '${t}'
  AND (
      ft.id IN (${txs})
      OR (ft.related_entity_id IN (${maps}) AND ft.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%')
  )
ORDER BY l.journal_entry_id, l.line_number;
EOF
}

cmd_income_probe() {
  local allowlist="" precedent="" denylist="" tenant_env=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --allowlist) allowlist="$2"; shift 2 ;;
      --precedent) precedent="$2"; shift 2 ;;
      --denylist) denylist="$2"; shift 2 ;;
      --tenant-env) tenant_env="$2"; shift 2 ;;
      *) die "unknown income-probe argument" ;;
    esac
  done
  [ -n "$allowlist" ] && [ -n "$precedent" ] && [ -n "$denylist" ] && [ -n "$tenant_env" ] \
    || die "income-probe needs --allowlist --precedent --denylist --tenant-env"
  load_tenant_env "$tenant_env"
  load_income_allowlist "$allowlist" || die "income allowlist is empty"
  load_income_precedent "$precedent"
  load_income_denylist "$denylist"
  assert_income_scope
  income_id_lists
  require_db_env
  local work
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  emit_income_probe_sql "$INCOME_TENANT" \
    "${INCOME_MAP_IDS},${PREC_MAPPING}" \
    "${INCOME_TX_IDS},${PREC_INCOME_TX},${PREC_CANCEL_TX}" >"${work}/probe.sql"
  assert_income_read_safe "${work}/probe.sql"
  echo "=== income sales cancel probe (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "${work}/probe.sql"
}

# 운영 시간 KST 11:00–20:00 에는 DB 에 접속하지 않는다.
assert_outside_kst_operating_hours() {
  local hour
  hour="$(TZ=Asia/Seoul date +%H)"
  hour=$((10#$hour))
  if [ "$hour" -ge 11 ] && [ "$hour" -le 19 ]; then
    die "KST ${hour}:00 is within 11:00-20:00 operating hours; refusing to connect"
  fi
}

cmd_income_backup() {
  local allowlist="" precedent="" denylist="" tenant_env="" backup_dir=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --allowlist) allowlist="$2"; shift 2 ;;
      --precedent) precedent="$2"; shift 2 ;;
      --denylist) denylist="$2"; shift 2 ;;
      --tenant-env) tenant_env="$2"; shift 2 ;;
      --backup-dir) backup_dir="$2"; shift 2 ;;
      *) die "unknown income-backup argument" ;;
    esac
  done
  [ -n "$allowlist" ] && [ -n "$precedent" ] && [ -n "$denylist" ] && [ -n "$tenant_env" ] && [ -n "$backup_dir" ] \
    || die "income-backup needs --allowlist --precedent --denylist --tenant-env --backup-dir"
  load_tenant_env "$tenant_env"
  load_income_allowlist "$allowlist" || die "income allowlist is empty"
  load_income_precedent "$precedent"
  load_income_denylist "$denylist"
  assert_income_scope
  income_id_lists
  assert_outside_kst_operating_hours
  require_db_env

  local t="$INCOME_TENANT"
  local maps="${INCOME_MAP_IDS},${PREC_MAPPING}"
  local txs="${INCOME_TX_IDS},${PREC_INCOME_TX},${PREC_CANCEL_TX}"
  local ft_where="tenant_id = '${t}' AND (id IN (${txs}) OR (related_entity_id IN (${maps}) AND related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%'))"
  local ft_ids="SELECT f.id FROM financial_transactions f WHERE f.tenant_id = '${t}' AND (f.id IN (${txs}) OR (f.related_entity_id IN (${maps}) AND f.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%'))"

  mkdir -p "$backup_dir"
  echo "=== income backup rows (artifact only, no transaction) ==="
  mysqldump_where financial_transactions "$ft_where" "${backup_dir}/financial_transactions.sql"
  mysqldump_where consultant_client_mappings "tenant_id = '${t}' AND id IN (${maps})" \
    "${backup_dir}/consultant_client_mappings.sql"
  mysqldump_where accounting_entries "tenant_id = '${t}' AND financial_transaction_id IN (${ft_ids})" \
    "${backup_dir}/accounting_entries.sql"
  mysqldump_where erp_journal_entry_lines \
    "tenant_id = '${t}' AND journal_entry_id IN (SELECT a.id FROM accounting_entries a WHERE a.tenant_id = '${t}' AND a.financial_transaction_id IN (${ft_ids}))" \
    "${backup_dir}/erp_journal_entry_lines.sql"
  # 덤프 본문은 로그에 찍지 않는다. 적요·notes 가 들어 있다. 행 수만 남긴다.
  local f
  for f in financial_transactions consultant_client_mappings accounting_entries erp_journal_entry_lines; do
    echo "backup ${f}: rows=$(grep -c '^INSERT INTO' "${backup_dir}/${f}.sql" || true)"
  done
}

# 매출 취소 사유. 파일 값만 쓰고 SQL 에는 16진 리터럴로 넣는다.
load_cancel_reason() {
  local file="$1"
  local line
  line="$(grep -E '^CANCEL_REASON=' "$file" | tail -n 1 || true)"
  CANCEL_REASON="${line#CANCEL_REASON=}"
  [ -n "$CANCEL_REASON" ] || die "CANCEL_REASON is empty in the tenant env file"
  [ "${#CANCEL_REASON}" -le 100 ] || die "CANCEL_REASON is longer than 100 characters"
  case "$CANCEL_REASON" in
    *[\'\"\`\\\;\$\[\]]*) die "CANCEL_REASON has unsupported characters" ;;
  esac
  if printf '%s' "$CANCEL_REASON" | LC_ALL=C grep -q '[[:cntrl:]]'; then
    die "CANCEL_REASON has control characters"
  fi
  CANCEL_REASON_HEX="$(printf '%s' "$CANCEL_REASON" | od -An -tx1 | tr -d ' \n')"
  [ -n "$CANCEL_REASON_HEX" ] || die "CANCEL_REASON could not be encoded"
}

# 운영 COMMIT 은 workflow_dispatch 실행에서만. DB 접속 전에 확인한다.
assert_income_apply_allowed() {
  [ "${GITHUB_EVENT_NAME:-}" = "workflow_dispatch" ] \
    || die "income apply runs only from workflow_dispatch (event=${GITHUB_EVENT_NAME:-none}); no database connection"
  [ "${INCOME_CANCEL_CONFIRM:-}" = "CONFIRM" ] \
    || die "income apply requires INCOME_CANCEL_CONFIRM=CONFIRM; no database connection"
  assert_outside_kst_operating_hours
}

income_cancel_load_scope() {
  local allowlist="$1" denylist="$2" tenant_env="$3"
  load_tenant_env "$tenant_env"
  load_cancel_reason "$tenant_env"
  load_income_allowlist "$allowlist" || die "income allowlist is empty"
  load_income_denylist "$denylist"
  PREC_MAPPING="" PREC_INCOME_TX="" PREC_CANCEL_TX=""
  assert_income_scope
  income_id_lists
}

income_cancel_suffix_sql() {
  echo "CONCAT(' [', CONVERT(X'${CANCEL_REASON_HEX}' USING utf8mb4), ']')"
}

# 전값 스냅샷. 적요는 길이·SHA-256 만 남긴다.
emit_income_before_sql() {
  local t="$1" txs="$2" suffix
  suffix="$(income_cancel_suffix_sql)"
  cat <<EOF
SELECT ft.id, ft.related_entity_id, ft.related_entity_type, ft.transaction_type, ft.status,
       ft.amount, ft.version, ft.is_deleted + 0,
       CHAR_LENGTH(ft.description), SHA2(ft.description, 256),
       CHAR_LENGTH(CONCAT(ft.description, ${suffix})),
       SHA2(CONCAT(ft.description, ${suffix}), 256)
FROM financial_transactions ft
WHERE ft.tenant_id = '${t}' AND ft.id IN (${txs})
ORDER BY ft.id;
EOF
}

# income_before.tsv 열: id mapping type tx_type status amount version is_deleted
#                        desc_len desc_sha after_len after_sha
assert_income_before_file() {
  local file="$1"
  [ -f "$file" ] || die "income before snapshot missing; run --mode backup first"
  local rows
  rows="$(grep -c . "$file" || true)"
  [ "$rows" -eq "${#INCOME_ROWS[@]}" ] \
    || die "income before snapshot has ${rows} rows; expected ${#INCOME_ROWS[@]}"
  local raw m tx amt id rm rtype ttype st am ver del _rest found
  for raw in "${INCOME_ROWS[@]}"; do
    IFS=, read -r m tx amt <<<"$raw"
    found=0
    while IFS=$'\t' read -r id rm rtype ttype st am ver del _rest; do
      [ "$id" = "$tx" ] || continue
      found=1
      [ "$rm" = "$m" ] || die "tx ${tx}: related mapping ${rm} is not ${m}"
      case "$rtype" in
        CONSULTANT_CLIENT_MAPPING|CONSULTANT_CLIENT_MAPPING_ADDITIONAL) ;;
        *) die "tx ${tx}: related entity type is not a mapping slot" ;;
      esac
      [ "$ttype" = "INCOME" ] || die "tx ${tx}: type ${ttype} is not INCOME"
      [ "$st" = "COMPLETED" ] || die "tx ${tx}: status ${st} is not COMPLETED"
      [ "${am%.00}" = "$amt" ] || die "tx ${tx}: amount ${am} is not ${amt}"
      [ "$del" = "0" ] || die "tx ${tx}: row is deleted"
      [[ "$ver" =~ ^[0-9]+$ ]] || die "tx ${tx}: version is not numeric"
    done <"$file"
    [ "$found" -eq 1 ] || die "tx ${tx}: not found in tenant"
  done
}

income_cancel_backup() {
  local backup_dir="$1"
  local t="$INCOME_TENANT"
  local txs="$INCOME_TX_IDS" maps="$INCOME_MAP_IDS"
  local work
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  mkdir -p "$backup_dir"
  # 실패한 백업이 남긴 스냅샷으로 dry-run/apply 가 이어지지 않게, 검증을 통과한 뒤에만 제자리에 둔다.
  rm -f "${backup_dir}/income_before.tsv"
  echo "=== income cancel backup (artifact only, no transaction) ==="
  mysqldump_where financial_transactions "tenant_id = '${t}' AND id IN (${txs})" \
    "${backup_dir}/financial_transactions.sql"
  mysqldump_where consultant_client_mappings "tenant_id = '${t}' AND id IN (${maps})" \
    "${backup_dir}/consultant_client_mappings.sql"
  mysqldump_where accounting_entries "tenant_id = '${t}' AND financial_transaction_id IN (${txs})" \
    "${backup_dir}/accounting_entries.sql"
  mysqldump_where erp_journal_entry_lines \
    "tenant_id = '${t}' AND journal_entry_id IN (SELECT a.id FROM accounting_entries a WHERE a.tenant_id = '${t}' AND a.financial_transaction_id IN (${txs}))" \
    "${backup_dir}/erp_journal_entry_lines.sql"
  local f
  for f in financial_transactions consultant_client_mappings accounting_entries erp_journal_entry_lines; do
    if grep -qiE '^[[:space:]]*(drop|create)[[:space:]]' "${backup_dir}/${f}.sql"; then
      die "backup ${f} contains DROP/CREATE"
    fi
    echo "backup ${f}: rows=$(grep -c '^INSERT INTO' "${backup_dir}/${f}.sql" || true)"
  done
  emit_income_before_sql "$t" "$txs" >"${work}/before.sql"
  assert_income_read_safe "${work}/before.sql"
  mysql_query_to "SET SESSION TRANSACTION READ ONLY" "${work}/before.sql" "${work}/before.raw"
  tail -n +2 "${work}/before.raw" >"${work}/income_before.tsv"
  assert_income_before_file "${work}/income_before.tsv"
  mv "${work}/income_before.tsv" "${backup_dir}/income_before.tsv"
  echo "before snapshot rows=$(grep -c . "${backup_dir}/income_before.tsv")"
}

assert_income_cancel_sql_safe() {
  local file="$1"
  [ -f "$file" ] || die "generated income cancel SQL missing"
  if grep -qiE 'into[[:space:]]+outfile|load_file|accounting_entries|erp_journal_entry_lines|consultant_client_mappings[^;]*set[[:space:]]' "$file"; then
    die "generated income cancel SQL touches a forbidden object"
  fi
  if grep -qiE '^[[:space:]]*(commit|rollback)[[:space:]]*;[[:space:]]*$' "$file"; then
    die "generated income cancel SQL must not commit; the runner appends one ending"
  fi
  if grep -iE '^[[:space:]]*create[[:space:]]+' "$file" | grep -viE '^[[:space:]]*create[[:space:]]+temporary[[:space:]]+table[[:space:]]+tmp_' >/dev/null; then
    die "generated income cancel SQL creates a permanent object"
  fi
  if grep -iE '^[[:space:]]*insert[[:space:]]+into[[:space:]]+' "$file" \
      | grep -viE '^[[:space:]]*insert[[:space:]]+into[[:space:]]+tmp_[A-Za-z0-9_]+([^A-Za-z0-9_]|$)' >/dev/null; then
    die "generated income cancel SQL inserts into a base table"
  fi
  local updates
  updates="$(grep -ciE '^[[:space:]]*update[[:space:]]+' "$file" || true)"
  [ "$updates" -eq 1 ] || die "generated income cancel SQL must have exactly one UPDATE"
  grep -qiE '^[[:space:]]*update[[:space:]]+financial_transactions[[:space:]]+ft([[:space:]]|$)' "$file" \
    || die "generated income cancel SQL updates a forbidden table"
  if grep -qiE '^[[:space:]]*(delete|drop|alter|truncate|grant|call|replace)[[:space:]]' "$file"; then
    die "generated income cancel SQL contains a forbidden statement"
  fi
}

emit_assert() {
  local name="$1" cond="$2"
  cat <<EOF
SET @n = '${name}';
SET @c = (${cond});
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM \`ASSERT_FAILED__', @n, '\`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;
EOF
}

# 한 트랜잭션. 잠금 → 전값 대조 → UPDATE 1회 → 후값 대조. 어느 assert 든 실패하면 오류로 끊겨 롤백된다.
emit_income_cancel_sql() {
  local before_file="$1"
  local t="$INCOME_TENANT" txs="$INCOME_TX_IDS" maps="$INCOME_MAP_IDS"
  local n="${#INCOME_ROWS[@]}" suffix deny raw m tx amt
  local id _rm _rtype _ttype _st _am ver _del _dlen dsha alen asha
  suffix="$(income_cancel_suffix_sql)"
  deny="$(IFS=,; echo "${DENY_IDS[*]}")"
  echo "CREATE TEMPORARY TABLE tmp_income_cancel (mapping_id BIGINT PRIMARY KEY, tx_id BIGINT NOT NULL UNIQUE, amount DECIMAL(19,2) NOT NULL);"
  for raw in "${INCOME_ROWS[@]}"; do
    IFS=, read -r m tx amt <<<"$raw"
    echo "INSERT INTO tmp_income_cancel (mapping_id, tx_id, amount) VALUES (${m}, ${tx}, ${amt});"
  done
  echo "CREATE TEMPORARY TABLE tmp_income_expected (tx_id BIGINT PRIMARY KEY, version BIGINT NOT NULL, desc_sha CHAR(64) NOT NULL, after_len INT NOT NULL, after_sha CHAR(64) NOT NULL);"
  while IFS=$'\t' read -r id _rm _rtype _ttype _st _am ver _del _dlen dsha alen asha; do
    [[ "$id" =~ ^[0-9]+$ && "$ver" =~ ^[0-9]+$ && "$alen" =~ ^[0-9]+$ ]] || die "before snapshot has a malformed row"
    [[ "$dsha" =~ ^[0-9a-f]{64}$ && "$asha" =~ ^[0-9a-f]{64}$ ]] || die "before snapshot has a malformed hash"
    echo "INSERT INTO tmp_income_expected (tx_id, version, desc_sha, after_len, after_sha) VALUES (${id}, ${ver}, '${dsha}', ${alen}, '${asha}');"
  done <"$before_file"
  cat <<EOF
START TRANSACTION;
SELECT ft.id FROM financial_transactions ft WHERE ft.tenant_id = '${t}' AND ft.id IN (${txs}) FOR UPDATE;
SELECT m.id FROM consultant_client_mappings m WHERE m.tenant_id = '${t}' AND m.id IN (${maps}) FOR SHARE;
CREATE TEMPORARY TABLE tmp_income_before AS
SELECT ft.id, ft.related_entity_id, ft.related_entity_type, ft.transaction_type, ft.status, ft.amount,
       ft.version, ft.is_deleted + 0 AS is_deleted, CHAR_LENGTH(ft.description) AS desc_len,
       SHA2(ft.description, 256) AS desc_sha,
       CHAR_LENGTH(CONCAT(ft.description, ${suffix})) AS after_len,
       SHA2(CONCAT(ft.description, ${suffix}), 256) AS after_sha
FROM financial_transactions ft
WHERE ft.tenant_id = '${t}' AND ft.id IN (${txs});
SELECT 'BEFORE' AS phase, b.id, b.related_entity_id AS mapping_id, b.transaction_type, b.status, b.amount,
       b.version, b.desc_len, LEFT(b.desc_sha, 12) AS desc_sha12
FROM tmp_income_before b ORDER BY b.id;
EOF
  emit_assert "allowlist_no_denied_mapping" "SELECT COUNT(*) = 0 FROM tmp_income_cancel WHERE mapping_id IN (${deny})"
  emit_assert "before_row_count" "SELECT COUNT(*) = ${n} FROM tmp_income_before"
  emit_assert "before_matches_allowlist" "SELECT COUNT(*) = ${n} FROM tmp_income_before b INNER JOIN tmp_income_cancel a ON a.tx_id = b.id AND a.mapping_id = b.related_entity_id AND a.amount = b.amount WHERE b.transaction_type = 'INCOME' AND b.status = 'COMPLETED' AND b.is_deleted = 0 AND b.related_entity_type IN ('CONSULTANT_CLIENT_MAPPING', 'CONSULTANT_CLIENT_MAPPING_ADDITIONAL') AND b.desc_sha IS NOT NULL"
  emit_assert "before_matches_backup_snapshot" "SELECT COUNT(*) = ${n} FROM tmp_income_before b INNER JOIN tmp_income_expected e ON e.tx_id = b.id AND e.version = b.version AND e.desc_sha = b.desc_sha AND e.after_len = b.after_len AND e.after_sha = b.after_sha"
  emit_assert "description_fits_column" "SELECT COUNT(*) = 0 FROM tmp_income_before b WHERE b.after_len > (SELECT IFNULL(c.CHARACTER_MAXIMUM_LENGTH, 0) FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'financial_transactions' AND c.COLUMN_NAME = 'description')"
  emit_assert "mapping_no_deposit" "SELECT COUNT(*) = ${n} FROM consultant_client_mappings m INNER JOIN tmp_income_cancel a ON a.mapping_id = m.id WHERE m.tenant_id = '${t}' AND IFNULL(m.deposit_confirmed + 0, 0) = 0 AND IFNULL(m.is_deleted + 0, 0) = 0"
  cat <<EOF
UPDATE financial_transactions ft
INNER JOIN tmp_income_cancel a ON a.tx_id = ft.id AND a.mapping_id = ft.related_entity_id AND a.amount = ft.amount
SET ft.status = 'CANCELLED',
    ft.description = CONCAT(ft.description, ${suffix}),
    ft.version = ft.version + 1,
    ft.updated_at = NOW(6)
WHERE ft.tenant_id = '${t}'
  AND ft.id IN (${txs})
  AND ft.transaction_type = 'INCOME'
  AND ft.status = 'COMPLETED'
  AND ft.is_deleted = 0;
SET @rc = ROW_COUNT();
EOF
  emit_assert "update_row_count" "SELECT @rc = ${n}"
  emit_assert "after_matches_expected" "SELECT COUNT(*) = ${n} FROM financial_transactions ft INNER JOIN tmp_income_expected e ON e.tx_id = ft.id WHERE ft.tenant_id = '${t}' AND ft.status = 'CANCELLED' AND ft.version = e.version + 1 AND CHAR_LENGTH(ft.description) = e.after_len AND SHA2(ft.description, 256) = e.after_sha"
  cat <<EOF
SELECT 'AFTER' AS phase, ft.id, ft.related_entity_id AS mapping_id, ft.transaction_type, ft.status, ft.amount,
       ft.version, CHAR_LENGTH(ft.description) AS desc_len, LEFT(SHA2(ft.description, 256), 12) AS desc_sha12
FROM financial_transactions ft
WHERE ft.tenant_id = '${t}' AND ft.id IN (${txs})
ORDER BY ft.id;
EOF
}

cmd_income_cancel() {
  local allowlist="" denylist="" tenant_env="" backup_dir="" mode=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --allowlist) allowlist="$2"; shift 2 ;;
      --denylist) denylist="$2"; shift 2 ;;
      --tenant-env) tenant_env="$2"; shift 2 ;;
      --backup-dir) backup_dir="$2"; shift 2 ;;
      --mode) mode="$2"; shift 2 ;;
      *) die "unknown income-cancel argument" ;;
    esac
  done
  [ -n "$allowlist" ] && [ -n "$denylist" ] && [ -n "$tenant_env" ] && [ -n "$backup_dir" ] \
    || die "income-cancel needs --allowlist --denylist --tenant-env --backup-dir --mode"
  case "$mode" in
    backup|dry-run|apply) ;;
    *) die "income-cancel --mode must be backup, dry-run, or apply" ;;
  esac
  if [ "$mode" = "apply" ]; then
    assert_income_apply_allowed
  fi
  income_cancel_load_scope "$allowlist" "$denylist" "$tenant_env"

  if [ "$mode" = "backup" ]; then
    require_db_env
    income_cancel_backup "$backup_dir"
    return 0
  fi

  local before_file="${backup_dir}/income_before.tsv"
  assert_income_before_file "$before_file"
  [ -s "${backup_dir}/financial_transactions.sql" ] || die "financial_transactions backup missing; run --mode backup first"
  require_db_env

  local work ending
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  if [ "$mode" = "apply" ]; then
    ending="COMMIT;"
  else
    ending="ROLLBACK;"
  fi
  emit_income_cancel_sql "$before_file" >"${work}/body.sql"
  assert_income_cancel_sql_safe "${work}/body.sql"
  { cat "${work}/body.sql"; echo "$ending"; } >"${work}/apply.sql"
  echo "=== income cancel transaction rows=${#INCOME_ROWS[@]} ending=${ending} ==="
  mysql_exec "SET SESSION sql_safe_updates = 0" "${work}/apply.sql"
  echo "=== income cancel transaction finished ending=${ending} ==="
}

# 새 READ ONLY 세션. --expect before 는 변경 없음, after 는 커밋된 후값을 대조한다.
cmd_income_cancel_verify() {
  local allowlist="" denylist="" tenant_env="" backup_dir="" expect=""
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --allowlist) allowlist="$2"; shift 2 ;;
      --denylist) denylist="$2"; shift 2 ;;
      --tenant-env) tenant_env="$2"; shift 2 ;;
      --backup-dir) backup_dir="$2"; shift 2 ;;
      --expect) expect="$2"; shift 2 ;;
      *) die "unknown income-cancel-verify argument" ;;
    esac
  done
  [ -n "$allowlist" ] && [ -n "$denylist" ] && [ -n "$tenant_env" ] && [ -n "$backup_dir" ] \
    || die "income-cancel-verify needs --allowlist --denylist --tenant-env --backup-dir --expect"
  case "$expect" in
    before|after) ;;
    *) die "income-cancel-verify --expect must be before or after" ;;
  esac
  income_cancel_load_scope "$allowlist" "$denylist" "$tenant_env"
  local before_file="${backup_dir}/income_before.tsv"
  assert_income_before_file "$before_file"
  require_db_env
  local work
  work="$(mktemp -d)"
  WORK_DIRS+=("$work")
  emit_income_before_sql "$INCOME_TENANT" "$INCOME_TX_IDS" >"${work}/now.sql"
  assert_income_read_safe "${work}/now.sql"
  mysql_query_to "SET SESSION TRANSACTION READ ONLY" "${work}/now.sql" "${work}/now.raw"
  tail -n +2 "${work}/now.raw" >"${work}/now.tsv"

  local ok=1 id rm rtype ttype st am ver del dlen dsha alen asha
  local nid nrm nrtype nttype nst nam nver ndel ndlen ndsha _nalen _nasha
  printf 'phase\tid\tmapping_id\tstatus\tamount\tversion\tdesc_len\tdesc_sha12\n'
  while IFS=$'\t' read -r id rm rtype ttype st am ver del dlen dsha alen asha; do
    printf 'BEFORE\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$rm" "$st" "$am" "$ver" "$dlen" "${dsha:0:12}"
    local line
    line="$(awk -F'\t' -v k="$id" '$1 == k' "${work}/now.tsv")"
    if [ -z "$line" ]; then
      echo "NOW	${id}	missing"
      ok=0
      continue
    fi
    IFS=$'\t' read -r nid nrm nrtype nttype nst nam nver ndel ndlen ndsha _nalen _nasha <<<"$line"
    printf 'NOW\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$nid" "$nrm" "$nst" "$nam" "$nver" "$ndlen" "${ndsha:0:12}"
    [ "$nrm" = "$rm" ] && [ "$nrtype" = "$rtype" ] && [ "$nttype" = "$ttype" ] && [ "$nam" = "$am" ] && [ "$ndel" = "$del" ] || ok=0
    if [ "$expect" = "before" ]; then
      [ "$nst" = "$st" ] && [ "$nver" = "$ver" ] && [ "$ndlen" = "$dlen" ] && [ "$ndsha" = "$dsha" ] || ok=0
    else
      [ "$nst" = "CANCELLED" ] && [ "$nver" = "$((ver + 1))" ] && [ "$ndlen" = "$alen" ] && [ "$ndsha" = "$asha" ] || ok=0
    fi
  done <"$before_file"
  if [ "$ok" -eq 1 ]; then
    echo "READBACK_MATCH=yes expect=${expect}"
    return 0
  fi
  echo "READBACK_MATCH=no expect=${expect}"
  die "income readback differs from the expected ${expect} image; nothing was changed by this check"
}

usage() {
  echo "usage: DB_HOST DB_USER DB_PASSWORD DB_NAME $0 list" >&2
  echo "       DB_* $0 repair --allowlist FILE --mode backup --backup-dir DIR" >&2
  echo "       DB_* REPAIR_CONFIRM $0 repair --allowlist FILE --mode dry-run|apply [--backup-dir DIR] [--skip-backup] [--expect-before FILE]" >&2
  echo "       DB_* $0 verify --expect-before FILE" >&2
  echo "       DB_* $0 income-probe --allowlist FILE --precedent FILE --denylist FILE --tenant-env FILE" >&2
  echo "       DB_* $0 income-backup --allowlist FILE --precedent FILE --denylist FILE --tenant-env FILE --backup-dir DIR" >&2
  echo "       DB_* $0 income-cancel --mode backup|dry-run --allowlist FILE --denylist FILE --tenant-env FILE --backup-dir DIR" >&2
  echo "       DB_* GITHUB_EVENT_NAME=workflow_dispatch INCOME_CANCEL_CONFIRM=CONFIRM $0 income-cancel --mode apply ..." >&2
  echo "       DB_* $0 income-cancel-verify --expect before|after --allowlist FILE --denylist FILE --tenant-env FILE --backup-dir DIR" >&2
  exit 1
}

main() {
  local cmd="${1:-}"
  if [ "$#" -gt 0 ]; then
    shift
  fi
  case "$cmd" in
    list) cmd_list "$@" ;;
    repair) cmd_repair "$@" ;;
    verify) cmd_verify "$@" ;;
    income-probe) cmd_income_probe "$@" ;;
    income-backup) cmd_income_backup "$@" ;;
    income-cancel) cmd_income_cancel "$@" ;;
    income-cancel-verify) cmd_income_cancel_verify "$@" ;;
    query)
      require_db_env
      sql_file="${1:-}"
      [ -f "$sql_file" ] || die "query file missing"
      assert_text_readonly "$sql_file"
      mysql_exec "SET SESSION TRANSACTION READ ONLY" "$sql_file"
      ;;
    *) usage ;;
  esac
}

main "$@"
