#!/usr/bin/env bash
# 배포 대상 서버와 러너의 시간 차이 확인. 기준(CLOCK_SKEW_WARN_SECONDS, 기본 30초)을 넘으면 큰 경고만 남긴다.
# 서버 시간(NTP)은 바꾸지 않는다. SSH 접속 자체가 실패하면 exit 1.
#
# 사용:
#   CLOCK_SKEW_SSH_HOST=... CLOCK_SKEW_SSH_USER=... CLOCK_SKEW_SSH_KEY="$(키 내용)" check-server-clock-skew.sh
#   check-server-clock-skew.sh --evaluate <서버 epoch> <요청 전 러너 epoch> <응답 후 러너 epoch>   # 판정만 (자가 테스트용)
# 환경 변수(선택): CLOCK_SKEW_SSH_PORT(기본 22), CLOCK_SKEW_WARN_SECONDS(기본 30), CLOCK_SKEW_LABEL(표시용 이름)
set -euo pipefail

THRESHOLD="${CLOCK_SKEW_WARN_SECONDS:-30}"
LABEL="${CLOCK_SKEW_LABEL:-배포 서버}"

is_int() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

evaluate() {
  local server="$1" before="$2" after="$3"
  if ! is_int "$server" || ! is_int "$before" || ! is_int "$after" || ! is_int "$THRESHOLD"; then
    echo "::error::서버 시간 확인 값이 숫자가 아닙니다 (server=$server, before=$before, after=$after, threshold=$THRESHOLD)"
    return 1
  fi
  local midpoint=$(((before + after) / 2))
  local skew=$((server - midpoint))
  local abs=${skew#-}
  local rtt=$((after - before))
  echo "🕒 ${LABEL} 시간 차이: ${skew}초 (서버-러너, 왕복 ${rtt}초, 경고 기준 ${THRESHOLD}초)"
  if [ "$abs" -gt "$THRESHOLD" ]; then
    echo "################################################################"
    echo "#  ⚠️  ${LABEL} 시간이 러너와 ${abs}초 차이납니다 (기준 ${THRESHOLD}초)"
    echo "#  세션·토큰 만료·예약 시각이 어긋날 수 있습니다. 서버 NTP 상태를 확인하세요."
    echo "#  (이 단계는 시간을 바꾸지 않습니다)"
    echo "################################################################"
    echo "::warning title=⚠️ ${LABEL} 시간 차이 ${abs}초 (기준 ${THRESHOLD}초)::서버 시간이 러너와 ${skew}초 어긋납니다. 서버 NTP(timedatectl) 상태를 확인하세요."
    echo "CLOCK_SKEW_RESULT=WARN"
  else
    echo "✅ 시간 차이 기준 이내"
    echo "CLOCK_SKEW_RESULT=OK"
  fi
}

if [ "${1:-}" = "--evaluate" ]; then
  evaluate "${2:-}" "${3:-}" "${4:-}"
  exit $?
fi

HOST="${CLOCK_SKEW_SSH_HOST:-}"
USER_NAME="${CLOCK_SKEW_SSH_USER:-}"
KEY="${CLOCK_SKEW_SSH_KEY:-}"
PORT="${CLOCK_SKEW_SSH_PORT:-22}"
if [ -z "$HOST" ] || [ -z "$USER_NAME" ] || [ -z "$KEY" ]; then
  echo "::error::CLOCK_SKEW_SSH_HOST / CLOCK_SKEW_SSH_USER / CLOCK_SKEW_SSH_KEY 가 필요합니다."
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT
printf '%s\n' "$KEY" > "$WORK_DIR/key"
chmod 600 "$WORK_DIR/key"

BEFORE="$(date -u +%s)"
SERVER="$(ssh -i "$WORK_DIR/key" -p "$PORT" \
  -o BatchMode=yes -o ConnectTimeout=15 \
  -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$WORK_DIR/known_hosts" \
  "${USER_NAME}@${HOST}" 'date -u +%s' | tr -d '\r\n')"
AFTER="$(date -u +%s)"
evaluate "$SERVER" "$BEFORE" "$AFTER"
