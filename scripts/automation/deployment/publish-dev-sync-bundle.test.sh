#!/bin/bash
# 야간 복사 번들: crontab 경로에서 배포 루트를 고르고, 스크립트·배포 SQL 을 그 루트에 교체한다.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
PUB="$ROOT/scripts/automation/deployment/publish-dev-sync-bundle.sh"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/mg-bundle-test.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

bash -n "$PUB"
# shellcheck disable=SC1090
. "$PUB"

echo "=== crontab 파싱 ==="
got=$(printf '%s\n' '# 30 3 * * * /old/scripts/database/sync/prod-to-dev-daily.sh' \
    '30 3 * * * NON_INTERACTIVE=1 /srv/mg/scripts/database/sync/prod-to-dev-daily.sh >> /var/log/x.log 2>&1' \
    | dev_sync_bundle_root_from_crontab)
[ "$got" = "/srv/mg" ] || fail "root=$got"
if printf '%s\n' '30 3 * * * echo nothing' | dev_sync_bundle_root_from_crontab >/dev/null; then
    fail "cron 없음인데 루트를 골랐습니다."
fi
if printf '%s\n' '30 3 * * * relative/scripts/database/sync/prod-to-dev-daily.sh' | dev_sync_bundle_root_from_crontab >/dev/null; then
    fail "상대 경로를 허용했습니다."
fi

echo "=== 원격 교체 (ssh 는 로컬 실행 스텁) ==="
REMOTE_ROOT="$WORK/remote"
mkdir -p "$REMOTE_ROOT/database/schema/procedures_standardized/deployment" \
    "$REMOTE_ROOT/database/schema/procedures_flyway_dev_sync" "$REMOTE_ROOT/scripts/database/sync"
echo stale > "$REMOTE_ROOT/database/schema/procedures_standardized/deployment/RemovedProc_deploy.sql"
echo stale > "$REMOTE_ROOT/database/schema/procedures_flyway_dev_sync/RemovedProc_devsync.sql"
echo "keep" > "$REMOTE_ROOT/scripts/database/sync/local-only.txt"
STUB="$WORK/bin"
mkdir -p "$STUB"
cat > "$STUB/ssh" <<EOF
#!/bin/bash
shift
if [ "\$1" = "crontab -l 2>/dev/null || true" ]; then
    echo "30 3 * * * NON_INTERACTIVE=1 $REMOTE_ROOT/scripts/database/sync/prod-to-dev-daily.sh"
    exit 0
fi
eval "\$1"
EOF
chmod +x "$STUB/ssh"
out=$(PATH="$STUB:$PATH" DEV_SERVER_HOST=dev.example DEV_SERVER_USER=deploy bash "$PUB" 2>&1) || fail "publish 실패: $out"
expected=$(ls "$ROOT"/database/schema/procedures_standardized/*_standardized.sql | wc -l | tr -d ' ')
actual=$(find "$REMOTE_ROOT/database/schema/procedures_standardized/deployment" -name '*_deploy.sql' | wc -l | tr -d ' ')
[ "$expected" = "$actual" ] || fail "SQL expected=$expected actual=$actual"
[ ! -e "$REMOTE_ROOT/database/schema/procedures_standardized/deployment/RemovedProc_deploy.sql" ] || fail "저장소에 없는 SQL 이 남았습니다."
for f in scripts/database/sync/prod-to-dev-daily.sh scripts/database/sync/apply-flyway-procedures-dev.sh \
    scripts/automation/deployment/deploy-standardized-procedures.sh \
    scripts/automation/deployment/procedure-deploy-changed-only.sh scripts/automation/deployment/procedure-deploy-db-diff.sh; do
    cmp -s "$ROOT/$f" "$REMOTE_ROOT/$f" || fail "갱신 안 됨: $f"
done

echo "=== 개발 재적재 SQL 도 번들에 실린다 (운영 배포 폴더와 분리) ==="
dev_expected=$(ls "$ROOT"/database/schema/procedures_flyway_dev_sync/*_devsync.sql | wc -l | tr -d ' ')
dev_actual=$(find "$REMOTE_ROOT/database/schema/procedures_flyway_dev_sync" -name '*_devsync.sql' | wc -l | tr -d ' ')
[ "$dev_expected" = "$dev_actual" ] || fail "개발 재적재 SQL expected=$dev_expected actual=$dev_actual"
[ -f "$REMOTE_ROOT/database/schema/procedures_flyway_dev_sync/MANIFEST.tsv" ] || fail "MANIFEST 가 실리지 않았습니다."
[ ! -e "$REMOTE_ROOT/database/schema/procedures_flyway_dev_sync/RemovedProc_devsync.sql" ] \
    || fail "저장소에 없는 개발 재적재 SQL 이 남았습니다."
if ls "$REMOTE_ROOT"/database/schema/procedures_standardized/deployment/*_devsync.sql >/dev/null 2>&1; then
    fail "개발 재적재 SQL 이 운영 배포 폴더에 섞였습니다."
fi
[ -f "$REMOTE_ROOT/scripts/database/sync/local-only.txt" ] || fail "서버 전용 파일을 지웠습니다."
if ls -d "$REMOTE_ROOT"/.mg-sync-bundle.* >/dev/null 2>&1; then
    fail "임시 폴더가 남았습니다."
fi
printf '%s\n' "$out" | grep -q "remote bundle ok: ${expected} sql, dev-sync ${dev_expected} sql" \
    || fail "원격 결과 없음: $out"

echo "=== crontab 에 동기화가 없으면 아무것도 하지 않는다 ==="
cat > "$STUB/ssh" <<'EOF'
#!/bin/bash
shift
if [ "$1" = "crontab -l 2>/dev/null || true" ]; then
    exit 0
fi
echo "unexpected remote command" >&2
exit 97
EOF
out2=$(PATH="$STUB:$PATH" DEV_SERVER_HOST=dev.example bash "$PUB" 2>&1) || fail "cron 없음에서 실패: $out2"
printf '%s\n' "$out2" | grep -q 'warning' || fail "warning 없음: $out2"

echo "PASS publish-dev-sync-bundle"
