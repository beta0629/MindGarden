#!/bin/bash
# 개발 서버 야간 운영→개발 복사(cron)가 쓰는 스크립트와 프로시저 배포 SQL 을 저장소 기준으로 갱신한다.
# 복사가 DROP DATABASE 로 루틴을 지우므로, 복사 직후 저장소 SQL 로 safe-replace 하려면 서버에 이 번들이 있어야 한다.
# 대상 경로는 개발 서버 crontab 의 prod-to-dev-daily.sh 경로에서 읽는다. DDL 은 하지 않는다.
# 필요 env: DEV_SERVER_HOST, DEV_SERVER_USER(기본 root)
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
SYNC_REL="scripts/database/sync/prod-to-dev-daily.sh"
SQL_REL="database/schema/procedures_standardized/deployment"
# 예전 번들(#1410)의 개발 전용 재적재 폴더·스크립트. 지금은 표준 배포 SQL 에 합쳐져 서버에서 지운다.
LEGACY_DEV_SYNC_SQL_REL="database/schema/procedures_flyway_dev_sync"
LEGACY_DEV_SYNC_APPLY_REL="scripts/database/sync/apply-flyway-procedures-dev.sh"

fail() {
    echo "❌ $1" >&2
    exit 1
}

# crontab 내용에서 prod-to-dev-daily.sh 가 있는 배포 루트를 고른다.
dev_sync_bundle_root_from_crontab() {
    local path root
    path=$(grep -v '^[[:space:]]*#' | grep -oE "[^[:space:]\"']*/${SYNC_REL//./\\.}" | head -n 1 || true)
    [ -n "$path" ] || return 1
    root=${path%/"$SYNC_REL"}
    case "$root" in
        /*) ;;
        *) return 1 ;;
    esac
    case "$root" in
        *[!A-Za-z0-9._/-]*) return 1 ;;
    esac
    printf '%s\n' "$root"
}

dev_sync_bundle_build() {
    local dest="$1" std name
    mkdir -p "$dest/scripts/database/sync" "$dest/scripts/automation/deployment" "$dest/$SQL_REL"
    # Flyway 원본에서 만든 표준 SQL 이 원본과 같을 때만 싣는다.
    bash "$ROOT/scripts/database/sync/flyway-procedure-extract.sh" check >/dev/null \
        || fail "Flyway 원본 표준 SQL 이 원본과 다릅니다. flyway-procedure-extract.sh generate 를 돌리세요."
    cp "$ROOT/$SYNC_REL" "$dest/scripts/database/sync/"
    cp "$ROOT/scripts/database/sync/post-dev-sync-anonymize.sql" "$dest/scripts/database/sync/"
    cp "$ROOT/scripts/database/sync/post-dev-sync-anonymize-dry-run.sql" "$dest/scripts/database/sync/"
    for f in deploy-standardized-procedures.sh procedure-deploy-changed-only.sh procedure-deploy-db-diff.sh; do
        cp "$ROOT/scripts/automation/deployment/$f" "$dest/scripts/automation/deployment/"
    done
    bash "$ROOT/database/schema/procedures_standardized/create_deployment_files.sh" >/dev/null
    for std in "$ROOT"/database/schema/procedures_standardized/*_standardized.sql; do
        name=$(basename "$std" _standardized.sql)
        cp "$ROOT/$SQL_REL/${name}_deploy.sql" "$dest/$SQL_REL/"
    done
}

# 원격: stdin 의 tar 를 임시 폴더에 푼 뒤 스크립트는 덮고 SQL 폴더는 통째로 교체한다.
DEV_SYNC_BUNDLE_REMOTE=$(cat <<'REMOTE'
set -euo pipefail
root="$1"
sql_rel="$2"
legacy_dev_sync_rel="$3"
legacy_apply_rel="$4"
tmp=$(mktemp -d "${root}/.mg-sync-bundle.XXXXXX")
trap 'rm -rf "$tmp"' EXIT
tar -xzf - -C "$tmp"
mkdir -p "$root/scripts/database/sync" "$root/scripts/automation/deployment" "$(dirname "$root/$sql_rel")"
for f in "$tmp"/scripts/database/sync/*; do
    install -m 0750 "$f" "$root/scripts/database/sync/"
done
for f in "$tmp"/scripts/automation/deployment/*; do
    install -m 0750 "$f" "$root/scripts/automation/deployment/"
done
rm -rf "$root/${sql_rel}.old"
if [ -d "$root/$sql_rel" ]; then
    mv "$root/$sql_rel" "$root/${sql_rel}.old"
fi
mv "$tmp/$sql_rel" "$root/$sql_rel"
rm -rf "$root/${sql_rel}.old"
rm -rf "$root/$legacy_dev_sync_rel" "$root/${legacy_dev_sync_rel}.old"
rm -f "$root/$legacy_apply_rel"
echo "remote bundle ok: $(find "$root/$sql_rel" -name '*_deploy.sql' | wc -l | tr -d ' ') sql"
REMOTE
)

dev_sync_bundle_main() {
    local user remote_root work count cron
    : "${DEV_SERVER_HOST:?DEV_SERVER_HOST 필요}"
    user="${DEV_SERVER_USER:-root}"
    cron=$(ssh "$user@$DEV_SERVER_HOST" "crontab -l 2>/dev/null || true") || fail "개발 서버 SSH 실패 (crontab 조회)"
    if ! remote_root=$(printf '%s\n' "$cron" | dev_sync_bundle_root_from_crontab); then
        echo "::warning::개발 서버 crontab 에 ${SYNC_REL} 가 없어 야간 복사 번들을 갱신하지 않습니다."
        return 0
    fi
    work=$(mktemp -d "${TMPDIR:-/tmp}/mg-dev-sync-bundle.XXXXXX")
    # shellcheck disable=SC2064
    trap "rm -rf '$work'" RETURN
    dev_sync_bundle_build "$work"
    count=$(find "$work/$SQL_REL" -name '*_deploy.sql' | wc -l | tr -d ' ')
    [ "$count" -gt 0 ] || fail "번들에 배포 SQL 이 없습니다."
    echo "야간 복사 번들 갱신: 배포 SQL ${count}개, 스크립트 6개 → crontab 기준 배포 루트"
    # 새 번들을 임시 폴더에 푼 뒤 교체한다. 저장소에서 빠진 프로시저 SQL 은 남기지 않는다.
    tar -C "$work" -czf - scripts database \
        | ssh "$user@$DEV_SERVER_HOST" "bash -c $(printf '%q' "$DEV_SYNC_BUNDLE_REMOTE") mg-sync-bundle $(printf '%q' "$remote_root") $(printf '%q' "$SQL_REL") $(printf '%q' "$LEGACY_DEV_SYNC_SQL_REL") $(printf '%q' "$LEGACY_DEV_SYNC_APPLY_REL")"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
    dev_sync_bundle_main "$@"
fi
