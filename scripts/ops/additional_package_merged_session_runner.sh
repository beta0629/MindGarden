#!/usr/bin/env bash
# 추가 패키지 병합 회기 목록·보정.
# DB_HOST DB_USER DB_PASSWORD DB_NAME 은 환경 변수. 이 스크립트는 그 값을 출력하지 않는다.
# list: 회기 불일치 SELECT 와 상담료 INCOME 잔존 SELECT. 둘 다 세션 READ ONLY.
# repair: 허용 목록 파일이 비어 있으면 DB 에 접속하지 않는다.
#         기본 종료는 ROLLBACK. COMMIT 은 --mode apply 와 REPAIR_CONFIRM=CONFIRM 이 같이 있을 때만.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SELECT_SQL="${ROOT}/scripts/ops/sql/additional_package_merged_session_mismatch_select.sql"
INCOME_SQL="${ROOT}/scripts/ops/sql/consultation_income_leftover_select.sql"
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
      | grep -viE '^[[:space:]]*insert[[:space:]]+into[[:space:]]+(tmp_[A-Za-z0-9_]+|repair_allowlist)([^A-Za-z0-9_]|$)' >/dev/null; then
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
  echo "=== additional package merged session mismatch (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "$SELECT_SQL"
  echo "=== consultation income leftover (read only) ==="
  mysql_exec "SET SESSION TRANSACTION READ ONLY" "$INCOME_SQL"
}

cmd_repair() {
  local allowlist="" mode="dry-run" backup_dir=""
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
      *)
        die "unknown repair argument"
        ;;
    esac
  done
  [ -n "$allowlist" ] || die "--allowlist is required"
  [ -n "$backup_dir" ] || die "--backup-dir is required"
  case "$mode" in
    dry-run|apply) ;;
    *) die "--mode must be dry-run or apply" ;;
  esac
  if [ "$mode" = "apply" ] && [ "${REPAIR_CONFIRM:-}" != "CONFIRM" ]; then
    die "apply requires REPAIR_CONFIRM=CONFIRM"
  fi
  if ! load_allowlist "$allowlist"; then
    echo "허용 목록이 비어 있어 보정은 수행하지 않습니다."
    exit 0
  fi
  require_db_env
  assert_select_readonly
  [ -f "$TAIL_SQL" ] || die "repair tail missing"

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

  {
    allowlist_preamble
    echo "START TRANSACTION;"
    echo "SELECT DISTINCT m.id FROM consultant_client_mappings m"
    echo "INNER JOIN repair_allowlist a ON a.additional_mapping_id = m.id"
    echo "FOR UPDATE;"
    echo "CREATE TEMPORARY TABLE tmp_plan AS"
    plan_body
    echo ";"
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

usage() {
  echo "usage: DB_HOST DB_USER DB_PASSWORD DB_NAME $0 list" >&2
  echo "       DB_* REPAIR_CONFIRM $0 repair --allowlist FILE --mode dry-run|apply --backup-dir DIR" >&2
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
    *) usage ;;
  esac
}

main "$@"
