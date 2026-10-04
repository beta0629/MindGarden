#!/bin/bash
# 야간 운영→개발 복사 뒤 개발 DB 에만 Flyway 소유 온보딩 프로시저를 다시 심는다.
#
# 왜 필요한가: 복사는 --skip-routines 덤프 + DROP DATABASE 라 개발 스키마의 루틴이 모두 사라지고,
# 그 뒤 저장소가 되살리는 것은 procedures_standardized 44개뿐이다. Flyway 가 소유한 온보딩
# 프로시저는 flyway_schema_history 가 "적용됨"으로 복원되므로 Flyway 도 다시 만들지 않는다.
#
# 적용 규칙
#   - 개발 DB 전용. 대상 호스트·스키마가 운영과 같으면 아무것도 하지 않는다.
#   - 없는 프로시저만 만든다(기본). 이미 있는 정의는 건드리지 않는다.
#     애플리케이션 기동 때 PlSqlInitializer 가 더 새 본문으로 덮는 프로시저가 있기 때문이다.
#   - 교체는 공용 safe-replace 를 쓴다(스테이징 이름 선검증 → SHOW CREATE 백업 → 실패 시 복원).
#   - 프로시저별 결과 표를 찍고, 하나라도 success 가 아니면 exit 1.
#
# 필요 env: DEV_MYSQL_HOST, DEV_DB_NAME, DEV_MYSQL_USER, DEV_MYSQL_PASSWORD
#          (미설정이면 /etc/mindgarden/prod-to-dev-sync.env 또는 같은 폴더의 prod-to-dev-daily.env 에서 읽는다)
# 선택 env: DEV_MYSQL_PORT, PROD_MYSQL_HOST, PROD_DB_NAME(운영 동일 대상 가드),
#          FLYWAY_PROC_DEV_SYNC_DIR(기본: 배포 루트의 database/schema/procedures_flyway_dev_sync)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="${PROCEDURE_DEPLOY_REPO_ROOT:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
DEV_SYNC_DIR="${FLYWAY_PROC_DEV_SYNC_DIR:-$DEPLOY_ROOT/database/schema/procedures_flyway_dev_sync}"

flyway_dev_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

flyway_dev_fail() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
    exit 1
}

flyway_dev_load_env() {
    [ -n "${DEV_MYSQL_HOST:-}" ] && return 0
    if [ -f /etc/mindgarden/prod-to-dev-sync.env ]; then
        # shellcheck source=/dev/null
        . /etc/mindgarden/prod-to-dev-sync.env
    elif [ -f "$SCRIPT_DIR/prod-to-dev-daily.env" ]; then
        # shellcheck source=/dev/null
        . "$SCRIPT_DIR/prod-to-dev-daily.env"
    else
        flyway_dev_fail "개발 DB 접속 설정이 없습니다. DEV_MYSQL_* 를 주거나 동기화 설정 파일을 두세요."
    fi
}

# 운영과 같은 대상이면 아무것도 하지 않는다. 호스트·스키마가 모두 같을 때만 운영으로 본다.
flyway_dev_assert_not_production() {
    if [ -n "${PROD_MYSQL_HOST:-}" ] && [ "$DB_HOST" = "$PROD_MYSQL_HOST" ] \
        && [ -n "${PROD_DB_NAME:-}" ] && [ "$DB_NAME" = "$PROD_DB_NAME" ]; then
        flyway_dev_fail "대상 호스트·스키마가 운영과 같습니다. 개발 전용 프로시저 재적재를 하지 않습니다."
    fi
}

flyway_dev_manifest_names() {
    local manifest="$DEV_SYNC_DIR/MANIFEST.tsv"
    [ -f "$manifest" ] || flyway_dev_fail "MANIFEST.tsv 가 없습니다: $manifest"
    awk -F '\t' '
        /^[[:space:]]*#/ { next }
        NF < 1 { next }
        {
            name = $1
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", name)
            if (name != "") print name
        }
    ' "$manifest"
}

flyway_dev_apply_main() {
    local runner results names_file name sql exists_count created kept not_ok
    flyway_dev_load_env

    [ -n "${DEV_MYSQL_HOST:-}" ] || flyway_dev_fail "DEV_MYSQL_HOST 미설정"
    [ -n "${DEV_DB_NAME:-}" ] || flyway_dev_fail "DEV_DB_NAME 미설정"
    [ -n "${DEV_MYSQL_USER:-}" ] || flyway_dev_fail "DEV_MYSQL_USER 미설정"

    runner="$DEPLOY_ROOT/scripts/automation/deployment/procedure-deploy-changed-only.sh"
    [ -f "$runner" ] || flyway_dev_fail "safe-replace 스크립트가 없습니다: $runner"
    [ -d "$DEV_SYNC_DIR" ] || flyway_dev_fail "개발 재적재 SQL 폴더가 없습니다: $DEV_SYNC_DIR"

    DB_HOST="$DEV_MYSQL_HOST"
    DB_USER="$DEV_MYSQL_USER"
    DB_PASS="${DEV_MYSQL_PASSWORD:-}"
    DB_NAME="$DEV_DB_NAME"
    export DB_HOST DB_USER DB_PASS DB_NAME
    export MYSQL_TCP_PORT="${DEV_MYSQL_PORT:-3306}"
    export ROUTINE_ADMIN_USER="${ROUTINE_ADMIN_USER:-}"
    export ROUTINE_ADMIN_PASS="${ROUTINE_ADMIN_PASS:-}"
    export ROUTINE_FALLBACK_ROOT_PASS="${ROUTINE_FALLBACK_ROOT_PASS:-}"

    flyway_dev_assert_not_production

    # shellcheck disable=SC1090
    . "$runner"

    flyway_dev_log "Flyway 소유 온보딩 프로시저 개발 재적재 (host=${DB_HOST} database=${DB_NAME})"

    results=$(mktemp "${TMPDIR:-/tmp}/mg-flyway-proc-results.XXXXXX")
    names_file=$(mktemp "${TMPDIR:-/tmp}/mg-flyway-proc-names.XXXXXX")
    # shellcheck disable=SC2064
    trap "rm -f '$results' '$names_file'" EXIT

    flyway_dev_manifest_names >"$names_file"
    [ -s "$names_file" ] || flyway_dev_fail "MANIFEST 에 프로시저가 없습니다."

    while IFS= read -r name; do
        [ -n "$name" ] || continue
        if ! procedure_deploy_is_ident "$name"; then
            procedure_deploy_result_add "$results" "$name" failed "프로시저 이름 형식이 아님"
            continue
        fi
        sql="$DEV_SYNC_DIR/${name}_devsync.sql"
        if [ ! -f "$sql" ]; then
            procedure_deploy_result_add "$results" "$name" failed "재적재 SQL 없음"
            continue
        fi
        if ! exists_count=$(procedure_deploy_mysql_dispatch query "$(procedure_deploy_exists_sql "$name")"); then
            procedure_deploy_result_add "$results" "$name" failed "존재 확인 실패"
            continue
        fi
        exists_count=$(printf '%s' "$exists_count" | tr -d '[:space:]')
        if [ "$exists_count" != "0" ]; then
            procedure_deploy_result_add "$results" "$name" success "이미 있음 — 교체하지 않음"
            continue
        fi
        if procedure_deploy_safe_replace "$name" "$sql"; then
            procedure_deploy_result_add "$results" "$name" success "생성"
        else
            procedure_deploy_result_add "$results" "$name" failed "$(printf '%s' 'safe-replace 실패')"
        fi
    done <"$names_file"

    echo ""
    echo "Flyway 온보딩 프로시저 개발 재적재 결과"
    procedure_deploy_result_print "$results"
    created=$(awk -F '\t' '$2 == "success" && $3 == "생성" { n++ } END { print n + 0 }' "$results")
    kept=$(awk -F '\t' '$3 ~ /이미 있음/ { n++ } END { print n + 0 }' "$results")
    not_ok=$(procedure_deploy_result_not_ok_count "$results")
    echo "flyway-dev-sync created=${created} kept=${kept} failed=${not_ok}"
    if [ "$not_ok" -ne 0 ]; then
        flyway_dev_fail "개발 재적재 실패 ${not_ok}건. 위 표를 확인하세요."
    fi
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    flyway_dev_apply_main "$@"
fi
