#!/usr/bin/env bash
#
# 운영 DB 스냅샷을 개발 DB로 일일 반영 (배치용)
#
# 서버 경로: /opt/mindgarden/scripts/database/sync/prod-to-dev-daily.sh
# 반영: release/dev → deploy-procedures-dev.yml → publish-dev-sync-bundle.sh
#   (수동 SSH 반영은 런북에만 문서화. 이 스크립트에 수동 SSH 를 넣지 않는다.)
#
# D-1 의미:
#   - SYNC_MODE=from_file: 파일명에 포함된 "전일(어제) 날짜" 덤프를 사용 (운영 측이 전일분을 남겨야 함)
#   - SYNC_MODE=dump_live: 실행 시점의 운영 스냅샷을 개발에 넣음 (스케줄을 새벽에 두면 전일 업무 데이터에 가깝게 유지 가능)
#
# 설정 파일(우선순위):
#   1) /etc/mindgarden/prod-to-dev-sync.env
#   2) 동일 디렉터리의 prod-to-dev-daily.env
#
# 사용 예:
#   NON_INTERACTIVE=1 /opt/mindgarden/scripts/database/sync/prod-to-dev-daily.sh
#
# 권장 스케줄: 매일 새벽(예: 03:30 KST) — crontab.example 참고 (CRON_TZ=Asia/Seoul)
#
# 테스트: PROD_TO_DEV_DAILY_LIB_ONLY=1 로 source 하면 함수만 로드 (본문 미실행).
#
set -euo pipefail

# cron은 최소 PATH만 잡는 경우가 많음 — mysql/mysqldump/gunzip 찾기 실패 방지
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
umask 077

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

die() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
  exit 1
}

yesterday_ymd() {
  if ymd="$(date -d yesterday +%Y%m%d 2>/dev/null)"; then
    echo "$ymd"
    return 0
  fi
  date -v-1d +%Y%m%d
}

yesterday_ymd_dash() {
  if ymd="$(date -d yesterday +%Y-%m-%d 2>/dev/null)"; then
    echo "$ymd"
    return 0
  fi
  date -v-1d +%Y-%m-%d
}

# .dev BE 재기동 기본값 (env 로드 후·함수 진입 시 재적용). deploy-backend-dev.yml 과 동일 기본.
apply_dev_be_restart_defaults() {
  DEV_BE_SYSTEMD_UNIT="${DEV_BE_SYSTEMD_UNIT:-mindgarden-dev.service}"
  DEV_BE_HEALTH_URL="${DEV_BE_HEALTH_URL:-http://127.0.0.1:8080/actuator/health}"
  DEV_BE_HEALTH_TIMEOUT_SEC="${DEV_BE_HEALTH_TIMEOUT_SEC:-300}"
  DEV_BE_HEALTH_INTERVAL_SEC="${DEV_BE_HEALTH_INTERVAL_SEC:-5}"
  POST_SYNC_RESTART_DEV_BE="${POST_SYNC_RESTART_DEV_BE:-1}"
  SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-systemctl}"
  CURL_BIN="${CURL_BIN:-curl}"
}

run_dev_systemctl() {
  if [[ "$SYSTEMCTL_BIN" == "systemctl" ]]; then
    sudo "$SYSTEMCTL_BIN" "$@"
  else
    "$SYSTEMCTL_BIN" "$@"
  fi
}

dev_be_flyway_url_from_health() {
  local health="${1:-$DEV_BE_HEALTH_URL}"
  if [[ "$health" == */health ]]; then
    printf '%s\n' "${health%health}flyway"
  else
    printf '%s\n' "${health%/}/flyway"
  fi
}

# Flyway actuator JSON 에서 state=PENDING 건수 (READ only). python3 우선, 없으면 grep.
count_flyway_pending_from_json() {
  local json="$1"
  if command -v python3 >/dev/null 2>&1; then
    printf '%s' "$json" | python3 -c '
import json, sys
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception:
    print(-1)
    raise SystemExit(0)
count = 0
def walk(obj):
    global count
    if isinstance(obj, dict):
        state = obj.get("state")
        if isinstance(state, str) and state.upper() == "PENDING":
            count += 1
        for v in obj.values():
            walk(v)
    elif isinstance(obj, list):
        for item in obj:
            walk(item)
walk(data)
print(count)
'
    return 0
  fi
  # jq 없을 때 fallback: PENDING 토큰 대략 카운트 (정확도 낮음 → 로그만)
  printf '%s' "$json" | grep -oE '"state"[[:space:]]*:[[:space:]]*"[Pp][Ee][Nn][Dd][Ii][Nn][Gg]"' | wc -l | tr -d ' '
}

# Flyway pending/실패 상태 READ only 로그 (heal·수동 SQL·데이터 수정 금지).
log_flyway_pending_readonly() {
  local flyway_url http_code body pending failed recent
  flyway_url="$(dev_be_flyway_url_from_health "$DEV_BE_HEALTH_URL")"
  log "Flyway 확인(READ only) 시도: $flyway_url (log=${LOG_FILE:-unset})"

  body="$("$CURL_BIN" -s -o - -w '\n%{http_code}' --max-time 8 "$flyway_url" 2>/dev/null || true)"
  http_code="$(printf '%s\n' "$body" | tail -n 1)"
  body="$(printf '%s\n' "$body" | sed '$d')"

  if [[ "$http_code" == "200" && -n "$body" ]]; then
    pending="$(count_flyway_pending_from_json "$body" || echo -1)"
    log "Flyway actuator PENDING count=${pending} (http=$http_code)"
    return 0
  fi

  log "Flyway actuator 불가(http=${http_code:-none}) — mysql_dev READ fallback"

  if ! declare -F mysql_dev >/dev/null 2>&1; then
    log "WARN: mysql_dev 없음 — Flyway DB 확인 skip. health 200 + pending 엔드포인트 불가로 종료 표기. log=${LOG_FILE:-unset}"
    return 0
  fi

  failed="$(mysql_dev -N --batch -e \
    "SELECT COUNT(*) FROM \`${DEV_DB_NAME}\`.flyway_schema_history WHERE success=0;" 2>/dev/null || echo "ERR")"
  recent="$(mysql_dev -N --batch -e \
    "SELECT version, description, success, installed_on
       FROM \`${DEV_DB_NAME}\`.flyway_schema_history
      ORDER BY installed_rank DESC LIMIT 5;" 2>/dev/null || echo "(조회 실패)")"
  log "flyway_schema_history success=0 count=${failed} (pending 엔드포인트 불가 → health 200 + failed=0 을 성공 기준으로 로그)"
  log "flyway_schema_history recent:"
  while IFS= read -r line; do
    [[ -n "$line" ]] && log "  $line"
  done <<< "$recent"
}

wait_dev_be_health_ok() {
  local elapsed=0 status="000"
  log "actuator/health 폴링 시작 url=$DEV_BE_HEALTH_URL timeout=${DEV_BE_HEALTH_TIMEOUT_SEC}s interval=${DEV_BE_HEALTH_INTERVAL_SEC}s log=${LOG_FILE:-unset}"
  while (( elapsed < DEV_BE_HEALTH_TIMEOUT_SEC )); do
    status="$("$CURL_BIN" -s -o /dev/null -w '%{http_code}' --max-time 5 "$DEV_BE_HEALTH_URL" 2>/dev/null || echo "000")"
    if [[ "$status" == "200" ]]; then
      log "dev BE health 200 (elapsed=${elapsed}s) url=$DEV_BE_HEALTH_URL"
      return 0
    fi
    sleep "$DEV_BE_HEALTH_INTERVAL_SEC"
    elapsed=$((elapsed + DEV_BE_HEALTH_INTERVAL_SEC))
  done
  die "dev BE health timeout (${DEV_BE_HEALTH_TIMEOUT_SEC}s) last_status=${status} url=$DEV_BE_HEALTH_URL log=${LOG_FILE:-unset}"
}

# 동기화 전체 성공 후 .dev BE 1회 재기동 → Flyway pending 적용. 단계 실패 시 호출되지 않음(set -e).
restart_dev_backend_after_successful_sync() {
  apply_dev_be_restart_defaults
  if [[ "$POST_SYNC_RESTART_DEV_BE" != "1" ]]; then
    log "POST_SYNC_RESTART_DEV_BE=$POST_SYNC_RESTART_DEV_BE — .dev BE 재기동 skip (log=${LOG_FILE:-unset})"
    return 0
  fi

  log "=== .dev BE 재기동 시작 unit=$DEV_BE_SYSTEMD_UNIT log=${LOG_FILE:-unset} ==="
  if ! run_dev_systemctl restart "$DEV_BE_SYSTEMD_UNIT"; then
    die "systemctl restart 실패 unit=$DEV_BE_SYSTEMD_UNIT log=${LOG_FILE:-unset}"
  fi
  wait_dev_be_health_ok
  log_flyway_pending_readonly
  log "=== .dev BE 재기동 완료 unit=$DEV_BE_SYSTEMD_UNIT log=${LOG_FILE:-unset} ==="
}

# LIB_ONLY / source 시 본문 미실행 (단위 테스트용)
if [[ "${PROD_TO_DEV_DAILY_LIB_ONLY:-0}" == "1" || "${BASH_SOURCE[0]}" != "${0}" ]]; then
  # shellcheck disable=SC2317
  return 0 2>/dev/null || exit 0
fi

# 설정 로드
if [[ -f /etc/mindgarden/prod-to-dev-sync.env ]]; then
  # shellcheck source=/dev/null
  source /etc/mindgarden/prod-to-dev-sync.env
elif [[ -f "$SCRIPT_DIR/prod-to-dev-daily.env" ]]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/prod-to-dev-daily.env"
else
  die "설정 파일이 없습니다. /etc/mindgarden/prod-to-dev-sync.env 또는 $SCRIPT_DIR/prod-to-dev-daily.env 를 준비하세요."
fi

apply_dev_be_restart_defaults

SYNC_MODE="${SYNC_MODE:-dump_live}"
TMP_DIR="${TMP_DIR:-/var/tmp}"
LOG_DIR="${LOG_DIR:-/var/log/mindgarden}"
RETAIN_LOCAL_DUMPS="${RETAIN_LOCAL_DUMPS:-0}"
NON_INTERACTIVE="${NON_INTERACTIVE:-0}"

PROD_MYSQL_PORT="${PROD_MYSQL_PORT:-3306}"
DEV_MYSQL_PORT="${DEV_MYSQL_PORT:-3306}"

[[ -n "${PROD_MYSQL_HOST:-}" ]] || die "PROD_MYSQL_HOST 미설정"
[[ -n "${PROD_DB_NAME:-}" ]] || die "PROD_DB_NAME 미설정"
[[ -n "${DEV_MYSQL_HOST:-}" ]] || die "DEV_MYSQL_HOST 미설정"
[[ -n "${DEV_DB_NAME:-}" ]] || die "DEV_DB_NAME 미설정"
[[ -n "${DEV_MYSQL_USER:-}" ]] || die "DEV_MYSQL_USER 미설정"

# 덤프·DROP DATABASE 전에 막는다. 개발 대상이 운영 호스트·스키마와 같으면 아무것도 하지 않는다.
dev_target_is_production() {
  [[ "$DEV_MYSQL_HOST" == "$PROD_MYSQL_HOST" && "$DEV_DB_NAME" == "$PROD_DB_NAME" ]]
}
if dev_target_is_production; then
  die "개발 DB 호스트·스키마가 운영과 같습니다. 복사·DROP·프로시저 재배포를 하지 않습니다."
fi

PROD_MYSQL_USER="${PROD_MYSQL_USER:-}"
EXTRA_DUMP_OPTS="${EXTRA_DUMP_OPTS:-}"
# 운영 덤프 계정에 SHOW ROUTINE 등이 없을 때 1 — 프로시저/이벤트는 Flyway·배포로 보완
DUMP_SKIP_ROUTINES="${DUMP_SKIP_ROUTINES:-0}"

mkdir -p "$LOG_DIR"
RUN_ID="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${LOG_DIR}/prod-to-dev-sync_${RUN_ID}.log"

exec > >(tee -a "$LOG_FILE") 2>&1

log "=== 운영→개발 DB 동기화 시작 (mode=$SYNC_MODE, D-1 label=$(yesterday_ymd_dash), log=$LOG_FILE) ==="
command -v mysql >/dev/null 2>&1 || die "mysql 클라이언트 없음(PATH 확인). which: $(command -v mysql || true)"
command -v mysqldump >/dev/null 2>&1 || die "mysqldump 없음(PATH 확인). which: $(command -v mysqldump || true)"
command -v gzip >/dev/null 2>&1 || die "gzip 없음"
command -v gunzip >/dev/null 2>&1 || die "gunzip 없음"
log "도구 경로: mysql=$(command -v mysql), mysqldump=$(command -v mysqldump)"
if [[ "${NON_INTERACTIVE:-0}" != "1" ]]; then
  log "경고: 대화형 모드입니다. cron에서는 NON_INTERACTIVE=1 필수."
fi

mysql_prod() {
  mysql -h "$PROD_MYSQL_HOST" -P "$PROD_MYSQL_PORT" -u "$PROD_MYSQL_USER" \
    ${PROD_MYSQL_PASSWORD:+-p"$PROD_MYSQL_PASSWORD"} "$@"
}

mysql_dev() {
  mysql -h "$DEV_MYSQL_HOST" -P "$DEV_MYSQL_PORT" -u "$DEV_MYSQL_USER" \
    ${DEV_MYSQL_PASSWORD:+-p"$DEV_MYSQL_PASSWORD"} "$@"
}

mysqldump_prod() {
  local routine_flags
  # 운영 루틴 본문은 가져오지 않는다. 운영 정의가 깨져 있거나 빠져 있으면
  # 개발에 복원된 정의가 그 상태로 덮인다. 루틴은 복원 후 저장소 db-diff 로 맞춘다.
  if [[ "$DUMP_SKIP_ROUTINES" == "1" ]]; then
    routine_flags=(--skip-routines --skip-triggers --skip-events)
  else
    routine_flags=(--skip-routines --triggers --events)
  fi
  # EXTRA_DUMP_OPTS 는 공백 구분 옵션 문자열(의도적 word-split)
  # shellcheck disable=SC2086
  mysqldump -h "$PROD_MYSQL_HOST" -P "$PROD_MYSQL_PORT" -u "$PROD_MYSQL_USER" \
    ${PROD_MYSQL_PASSWORD:+-p"$PROD_MYSQL_PASSWORD"} \
    --single-transaction \
    --no-tablespaces \
    "${routine_flags[@]}" \
    --hex-blob \
    --complete-insert \
    --extended-insert \
    --lock-tables=false \
    --set-gtid-purged=OFF \
    --set-charset \
    --default-character-set=utf8mb4 \
    $EXTRA_DUMP_OPTS \
    "$PROD_DB_NAME"
}

if [[ "$NON_INTERACTIVE" != "1" ]]; then
  echo "개발 DB '${DEV_DB_NAME}' @ ${DEV_MYSQL_HOST} 데이터가 덮어씌워집니다. 계속하려면 yes 입력:"
  read -r confirm
  [[ "$confirm" == "yes" ]] || die "사용자 취소"
fi

DUMP_FILE=""

if [[ "$SYNC_MODE" == "from_file" ]]; then
  [[ -n "${DUMP_DIR:-}" ]] || die "SYNC_MODE=from_file 인데 DUMP_DIR 미설정"
  PREFIX="${DUMP_FILE_PREFIX:-mind_garden_}"
  YD="$(yesterday_ymd)"
  CAND="${DUMP_DIR}/${PREFIX}${YD}.sql.gz"
  [[ -f "$CAND" ]] || die "전일 덤프 파일 없음: $CAND"
  DUMP_FILE="$CAND"
  log "전일(D-1) 덤프 사용: $DUMP_FILE"
elif [[ "$SYNC_MODE" == "dump_live" ]]; then
  [[ -n "$PROD_MYSQL_USER" ]] || die "dump_live 모드는 PROD_MYSQL_USER 필수"
  DUMP_FILE="${TMP_DIR}/mindgarden_prod_dump_${RUN_ID}.sql.gz"
  log "운영 덤프 생성 → $DUMP_FILE"
  mysqldump_prod | gzip > "$DUMP_FILE"
  log "덤프 완료 ($(du -h "$DUMP_FILE" | cut -f1))"
else
  die "알 수 없는 SYNC_MODE=$SYNC_MODE (dump_live | from_file 만 허용)"
fi

if ! gzip -t "$DUMP_FILE" 2>/dev/null; then
  die "덤프 gzip 무결성 실패: $DUMP_FILE"
fi

log "개발 DB 초기화 (DROP/CREATE) 후 복원"
mysql_dev -e "DROP DATABASE IF EXISTS \`${DEV_DB_NAME}\`; CREATE DATABASE \`${DEV_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
gunzip -c "$DUMP_FILE" | mysql -h "$DEV_MYSQL_HOST" -P "$DEV_MYSQL_PORT" -u "$DEV_MYSQL_USER" \
  ${DEV_MYSQL_PASSWORD:+-p"$DEV_MYSQL_PASSWORD"} \
  --default-character-set=utf8mb4 \
  "$DEV_DB_NAME"

if [[ -n "${POST_SYNC_SQL_FILE:-}" && -f "$POST_SYNC_SQL_FILE" ]]; then
  log "후처리 SQL 실행: $POST_SYNC_SQL_FILE"
  mysql_dev "$DEV_DB_NAME" < "$POST_SYNC_SQL_FILE"
elif [[ -z "${POST_SYNC_SQL_FILE:-}" ]]; then
  log "WARN: POST_SYNC_SQL_FILE 미설정 — 개발 DB에 운영 PII 암호문/평문이 그대로 남을 수 있음. prod-to-dev-daily.env.example 의 post-dev-sync-anonymize.sql 경로를 설정하세요."
elif [[ ! -f "$POST_SYNC_SQL_FILE" ]]; then
  log "WARN: POST_SYNC_SQL_FILE=$POST_SYNC_SQL_FILE 파일이 없음 — 후처리(PII 익명화) 건너뜀."
fi

# D-1 복원 후 .dev 전용 SCT feature 플래그 복원(운영 OFF 덮어쓰기 보정). 운영 WRITE 없음.
# POST_SYNC_SCT_SQL_FILE 이 있으면 그 경로, 없으면 이 스크립트 형제 post-dev-sync-sct-feature-enabled.sql
# 픽스처 DB 등 system_config/tenants 가 없으면 skip (익명화 POST_SYNC 블록과 무관).
POST_SYNC_SCT_SQL_FILE="${POST_SYNC_SCT_SQL_FILE:-$SCRIPT_DIR/post-dev-sync-sct-feature-enabled.sql}"
if [[ -f "$POST_SYNC_SCT_SQL_FILE" ]]; then
  sct_prereq_count="$(mysql_dev -N --batch -e \
    "SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA='${DEV_DB_NAME}'
       AND TABLE_NAME IN ('system_config','tenants');")"
  if [[ "${sct_prereq_count}" == "2" ]]; then
    log "SCT feature 후처리 SQL 실행: $POST_SYNC_SCT_SQL_FILE"
    if ! mysql_dev "$DEV_DB_NAME" < "$POST_SYNC_SCT_SQL_FILE"; then
      die "SCT feature 후처리 SQL 실패: $POST_SYNC_SCT_SQL_FILE"
    fi
  else
    log "WARN: system_config/tenants 없음 — SCT feature 후처리 skip ($POST_SYNC_SCT_SQL_FILE)"
  fi
else
  log "WARN: SCT feature 후처리 SQL 없음($POST_SYNC_SCT_SQL_FILE) — feature.sct.enabled 가 운영 OFF로 남을 수 있음."
fi

if [[ "$SYNC_MODE" == "dump_live" && "$RETAIN_LOCAL_DUMPS" != "1" ]]; then
  rm -f "$DUMP_FILE"
  log "임시 덤프 삭제"
fi

# DUMP_SKIP_ROUTINES 와 무관하게 덤프는 루틴을 빼고, DROP DATABASE 로 개발 루틴도 지워진다.
# 그래서 복원 직후 저장소 배포 SQL 로 db-diff safe-replace 한다. 운영 루틴 본문은 가져오지 않는다.
# 저장소 번들은 deploy-procedures-dev.yml 의 publish-dev-sync-bundle.sh 가 이 스크립트 옆 배포 루트에 갱신한다.
redeploy_dev_procedures_from_repo() {
  if dev_target_is_production; then
    die "개발 DB 호스트·스키마가 운영과 같습니다. 프로시저 재배포를 하지 않습니다."
  fi
  local repo deploy
  repo="${PROCEDURE_DEPLOY_REPO_ROOT:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
  deploy="$repo/scripts/automation/deployment/deploy-standardized-procedures.sh"
  [[ -f "$deploy" ]] || die "프로시저 배포 스크립트가 없습니다: $deploy"
  [[ -d "$repo/database/schema/procedures_standardized/deployment" ]] || die "배포 SQL 디렉터리가 없습니다."
  export PROCEDURE_DEPLOY_MODE=db-diff
  export PROCEDURE_DEPLOY_LOCAL_APPLY=1
  export DEV_SERVER_HOST="$DEV_MYSQL_HOST"
  export DEV_DB_HOST="$DEV_MYSQL_HOST"
  export DEV_DB_USER="$DEV_MYSQL_USER"
  export DEV_DB_PASSWORD="${DEV_MYSQL_PASSWORD:-}"
  export DEV_DB_NAME="$DEV_DB_NAME"
  # 배포 스크립트의 운영 동일 대상 가드도 같은 값으로 검사한다.
  export PROD_DB_HOST="$PROD_MYSQL_HOST"
  export PROD_DB_NAME="$PROD_DB_NAME"
  # 로컬 적용은 mysql -h 만 넘기므로 포트는 클라이언트 환경변수로 준다.
  export MYSQL_TCP_PORT="$DEV_MYSQL_PORT"
  unset DEPLOY_TARGET || true
  log "프로시저 db-diff dry-run (개발 DB host=${DEV_MYSQL_HOST} database=${DEV_DB_NAME})"
  PROCEDURE_DEPLOY_DB_DIFF_CONFIRM='' bash "$deploy" dev
  log "프로시저 db-diff 적용 (개발 DB만, 차이 있는 루틴만)"
  PROCEDURE_DEPLOY_DB_DIFF_CONFIRM=CONFIRM bash "$deploy" dev
}

# Flyway 소유 온보딩 프로시저(FLYWAY_SOURCES.tsv)도 표준 배포 SQL 에 들어 있어 이 db-diff 로 함께 되살아난다.
redeploy_dev_procedures_from_repo

# 동기화 단계가 모두 성공한 뒤에만 .dev BE 재기동 (Flyway pending 적용). 실패 시 여기까지 오지 않음.
restart_dev_backend_after_successful_sync

log "=== 완료: 개발 DB=${DEV_DB_NAME}, 참고 D-1 날짜 라벨=$(yesterday_ymd_dash), log=$LOG_FILE ==="
