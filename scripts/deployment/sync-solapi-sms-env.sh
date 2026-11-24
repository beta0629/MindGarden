#!/usr/bin/env bash
# Solapi SMS 자격증명을 개발·운영 서버 ENV에 반영 (값은 로컬 sms.local.env만 사용, Git 금지)
#
# [2026-11-24 재학 결정]
# - .dev(DEV_HOST / DEV_ENV_FILE) 의 SMS_TEST_MODE 는 항상 true (개발 실발송 금지).
# - 운영(PROD) 만 실발송(SMS_TEST_MODE=false).
# - 예전(2026-05-22) "dev 실발송 검증을 위해 false" 주석은 무효.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_ENV="${SMS_LOCAL_ENV:-$ROOT/config/environments/sms.local.env}"
DEV_HOST="${DEV_HOST:?DEV_HOST 환경변수를 설정하세요}"
PROD_HOST="${PROD_HOST:?PROD_HOST 환경변수를 설정하세요}"
DEV_ENV_FILE="/etc/mindgarden/dev.env"
PROD_ENV_FILE="/etc/mindgarden/prod-from-dev.env"

# 허용 범위의 설정 상수 (하드코딩 금지 예외: SMS_TEST_MODE 강제·환경파일 basename)
SMS_TEST_MODE_TRUE="true"
SMS_TEST_MODE_FALSE="false"

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

# DEV 대상이면 test_mode 인자와 무관하게 항상 true 로 coerce (2026-11-24).
coerce_test_mode_for_target() {
  local host="$1" remote_file="$2" test_mode="$3"
  local base
  base="$(basename "$remote_file")"
  if [[ "$host" == "$DEV_HOST" || "$base" == "dev.env" || "$remote_file" == "$DEV_ENV_FILE" ]]; then
    if [[ "$test_mode" != "$SMS_TEST_MODE_TRUE" ]]; then
      echo "WARN: DEV 대상에 SMS_TEST_MODE=${test_mode} 요청 → ${SMS_TEST_MODE_TRUE} 로 coerce (2026-11-24 정책)" >&2
    fi
    printf '%s' "$SMS_TEST_MODE_TRUE"
    return 0
  fi
  printf '%s' "$test_mode"
}

merge_remote() {
  local host="$1" remote_file="$2" test_mode="$3"
  test_mode="$(coerce_test_mode_for_target "$host" "$remote_file" "$test_mode")"
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
# [2026-11-24 재학 결정] .dev 는 항상 SMS_TEST_MODE=true (개발 실발송 금지, 운영만 실발송).
# 예전(2026-05-22) false 전환 주석은 무효. merge_remote 인자로 false 가 와도 DEV 면 true 로 coerce.
merge_remote "$DEV_HOST" "$DEV_ENV_FILE" "$SMS_TEST_MODE_TRUE"
ssh "root@${DEV_HOST}" "systemctl restart mindgarden-dev.service && systemctl is-active mindgarden-dev.service"

echo "== 운영 ($PROD_HOST) blue/green =="
# 운영 분기는 기존대로 false 유지 (실발송).
merge_remote "$PROD_HOST" "$PROD_ENV_FILE" "$SMS_TEST_MODE_FALSE"
ssh "root@${PROD_HOST}" "systemctl restart mindgarden-core-blue.service mindgarden-core-green.service && systemctl is-active mindgarden-core-blue.service mindgarden-core-green.service"

echo "DONE: Solapi SMS env synced (keys not printed)."
