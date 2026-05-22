#!/usr/bin/env bash
# Solapi SMS 자격증명을 개발·운영 서버 ENV에 반영 (값은 로컬 sms.local.env만 사용, Git 금지)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_ENV="${SMS_LOCAL_ENV:-$ROOT/config/environments/sms.local.env}"
DEV_HOST="${DEV_HOST:-beta0629.cafe24.com}"
PROD_HOST="${PROD_HOST:-beta74.cafe24.com}"
DEV_ENV_FILE="/etc/mindgarden/dev.env"
PROD_ENV_FILE="/etc/mindgarden/prod-from-dev.env"

if [[ ! -f "$LOCAL_ENV" ]]; then
  echo "ERROR: $LOCAL_ENV 없음. example 복사 후 SMS_API_KEY·SMS_API_SECRET 를 채우세요." >&2
  exit 1
fi

# shellcheck source=/dev/null
set -a
source "$LOCAL_ENV"
set +a

if [[ -z "${SMS_API_KEY:-}" || -z "${SMS_API_SECRET:-}" ]]; then
  echo "ERROR: SMS_API_KEY·SMS_API_SECRET 가 비어 있습니다 ($LOCAL_ENV)" >&2
  exit 1
fi

SMS_PROVIDER="${SMS_PROVIDER:-solapi}"
SMS_AUTH_ENABLED="${SMS_AUTH_ENABLED:-true}"

merge_remote() {
  local host="$1" remote_file="$2" test_mode="$3"
  local tmp="/tmp/mindgarden-sms-merge-$$.env"
  {
    echo "SMS_PROVIDER=${SMS_PROVIDER}"
    echo "SMS_AUTH_ENABLED=${SMS_AUTH_ENABLED}"
    echo "SMS_TEST_MODE=${test_mode}"
    echo "SMS_API_KEY=${SMS_API_KEY}"
    echo "SMS_API_SECRET=${SMS_API_SECRET}"
    if [[ -n "${SMS_SENDER_NUMBER:-}" ]]; then
      echo "SMS_SENDER_NUMBER=${SMS_SENDER_NUMBER}"
    fi
  } >"$tmp"
  chmod 600 "$tmp"
  scp -q "$tmp" "root@${host}:${tmp}"
  rm -f "$tmp"
  ssh "root@${host}" "python3 -" "$remote_file" "$tmp" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
frag_path = pathlib.Path(sys.argv[2])
frag = {}
for line in frag_path.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    frag[k.strip()] = v
if not path.exists():
    path.write_text("")
lines = path.read_text().splitlines()
keys = set(frag)
out = [ln for ln in lines if ln.strip() and not ln.strip().startswith("#") and ln.split("=", 1)[0].strip() not in keys]
out.extend(f"{k}={v}" for k, v in sorted(frag.items()))
path.write_text("\n".join(out) + "\n")
path.chmod(0o600)
frag_path.unlink(missing_ok=True)
PY
  echo "OK merge $host:$remote_file (SMS_TEST_MODE=$test_mode)"
}

echo "== 개발 ($DEV_HOST) =="
merge_remote "$DEV_HOST" "$DEV_ENV_FILE" "true"
ssh "root@${DEV_HOST}" "systemctl restart mindgarden-dev.service && systemctl is-active mindgarden-dev.service"

echo "== 운영 ($PROD_HOST) blue/green =="
merge_remote "$PROD_HOST" "$PROD_ENV_FILE" "false"
ssh "root@${PROD_HOST}" "systemctl restart mindgarden-core-blue.service mindgarden-core-green.service && systemctl is-active mindgarden-core-blue.service mindgarden-core-green.service"

echo "DONE: Solapi SMS env synced (keys not printed)."
