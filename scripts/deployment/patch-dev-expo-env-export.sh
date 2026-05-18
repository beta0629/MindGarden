#!/usr/bin/env bash
#
# 개발 서버 /opt/mindgarden/start.sh 에 Expo env export 를 idempotent 하게 삽입한다.
# SSH: ssh root@<dev-host> 'bash -s' < scripts/deployment/patch-dev-expo-env-export.sh
#
# 시크릿(EXPO_ACCESS_TOKEN 값)은 /etc/mindgarden/dev.env 에만 두고, 이 스크립트는 export 줄만 추가한다.
#
set -euo pipefail

START_SCRIPT="${START_SCRIPT:-/opt/mindgarden/start.sh}"
MARKER="# mindgarden: expo push env exports"

if [[ ! -f "$START_SCRIPT" ]]; then
  echo "ERROR: start script not found: $START_SCRIPT" >&2
  exit 1
fi

if grep -qF "$MARKER" "$START_SCRIPT"; then
  echo "OK: already patched ($MARKER)"
  exit 0
fi

# source /etc/mindgarden/dev.env 직후에 export 블록 삽입
sed -i.bak "/source \\/etc\\/mindgarden\\/dev.env/a\\
$MARKER\\
export EXPO_ACCESS_TOKEN\\
export EXPO_PUSH_API_URL\\
" "$START_SCRIPT"

echo "Patched: $START_SCRIPT (backup: ${START_SCRIPT}.bak)"
echo "Next: set EXPO_ACCESS_TOKEN in /etc/mindgarden/dev.env (export form recommended), then:"
echo "  systemctl restart mindgarden-dev"
