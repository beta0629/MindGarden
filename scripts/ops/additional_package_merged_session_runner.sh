#!/usr/bin/env bash
# 추가 패키지 병합 회기 목록·보정.
# DB_HOST DB_USER DB_PASSWORD DB_NAME 은 환경 변수. 이 스크립트는 그 값을 출력하지 않는다.
# list: 회기 불일치 SELECT 와 상담료 INCOME 잔존 SELECT. 둘 다 세션 READ ONLY.
# repair --mode backup: 덤프만 쓴다. 트랜잭션을 시작하지 않는다.
# repair --mode dry-run|apply: 기본은 덤프 후 트랜잭션. --skip-backup 이면 덤프를 생략한다.
#         기본 종료는 ROLLBACK. COMMIT 은 --mode apply 와 REPAIR_CONFIRM=CONFIRM 이 같이 있을 때만.
# verify: 기대 파일의 전값에서 후값을 계산해 새 READ ONLY 세션으로 대조한다. 불일치는 보고만 하고 되돌리지 않는다.
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

usage() {
  echo "usage: DB_HOST DB_USER DB_PASSWORD DB_NAME $0 list" >&2
  echo "       DB_* $0 repair --allowlist FILE --mode backup --backup-dir DIR" >&2
  echo "       DB_* REPAIR_CONFIRM $0 repair --allowlist FILE --mode dry-run|apply [--backup-dir DIR] [--skip-backup] [--expect-before FILE]" >&2
  echo "       DB_* $0 verify --expect-before FILE" >&2
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
