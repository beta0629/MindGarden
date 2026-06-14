#!/bin/bash
#
# MindGarden NTP drift 검사기 (Discord 알람)
# - 시스템 시계 동기화 상태 확인 (timedatectl / chronyc)
# - offset 절대값 > 60s 이면 Discord webhook 발송
# - systemd timer 로 시간당 1회 실행 (ntp_drift_check.timer)
#
# 환경변수:
#   DISCORD_WEBHOOK_URL    Discord webhook URL (필수, 미설정 시 즉시 종료)
#   NTP_DRIFT_THRESHOLD    임계값 (초, 기본 60)
#   MARKER_FILE            중복 알람 방지 마커 (기본: /var/lib/mindgarden/ntp_drift_last_seen.txt)
#
# 운영 DB 직접 접근 금지 — 시스템 명령(timedatectl / chronyc)만 사용한다.
#
# 참고: docs/운영반영/NTP_DRIFT_DISCORD_ALERT_SETUP_GUIDE.md
# 패턴: scripts/automation/monitoring/log_watcher.sh
#

set -u

DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
NTP_DRIFT_THRESHOLD="${NTP_DRIFT_THRESHOLD:-60}"
MARKER_FILE="${MARKER_FILE:-/var/lib/mindgarden/ntp_drift_last_seen.txt}"

if [ -z "$DISCORD_WEBHOOK_URL" ]; then
  echo "[ntp_drift_check] DISCORD_WEBHOOK_URL 미설정 — exit 0 (정상 종료)"
  exit 0
fi

MARKER_DIR="$(dirname "$MARKER_FILE")"
if [ ! -d "$MARKER_DIR" ]; then
  mkdir -p "$MARKER_DIR" 2>/dev/null || sudo mkdir -p "$MARKER_DIR" 2>/dev/null || true
fi

# 1) 동기화 상태 + offset 추출 — chronyc 우선, 없으면 timedatectl
OFFSET_SECONDS=""
SYNC_STATUS="unknown"
SOURCE="unknown"

if command -v chronyc >/dev/null 2>&1; then
  CHRONY_OUT=$(chronyc tracking 2>/dev/null || true)
  if [ -n "$CHRONY_OUT" ]; then
    # 예: "System time     : 0.000123456 seconds slow of NTP time"
    OFFSET_SECONDS=$(echo "$CHRONY_OUT" \
      | awk -F':' '/^System time/ {print $2}' \
      | awk '{print $1}')
    # 동기화 상태 — Leap status, Reference ID 등으로 판단
    if echo "$CHRONY_OUT" | grep -qiE 'Leap status[[:space:]]*:[[:space:]]*Normal'; then
      SYNC_STATUS="yes"
    else
      SYNC_STATUS="no"
    fi
    SOURCE="chronyc"
  fi
fi

if [ -z "$OFFSET_SECONDS" ] && command -v timedatectl >/dev/null 2>&1; then
  TD_OUT=$(timedatectl status 2>/dev/null || true)
  if [ -n "$TD_OUT" ]; then
    if echo "$TD_OUT" | grep -qiE 'System clock synchronized:[[:space:]]*yes'; then
      SYNC_STATUS="yes"
    else
      SYNC_STATUS="no"
    fi
    # timedatectl 은 offset 직접 노출 X — 보조로 timedatectl show -p TimeUSec/Offset 시도
    OFFSET_RAW=$(timedatectl show-timesync --property=NTPMessage 2>/dev/null \
      | grep -oE 'offset=[-+]?[0-9.]+' | head -1 || true)
    if [ -n "$OFFSET_RAW" ]; then
      OFFSET_SECONDS="${OFFSET_RAW#offset=}"
    fi
    SOURCE="timedatectl"
  fi
fi

if [ -z "$OFFSET_SECONDS" ]; then
  echo "[ntp_drift_check] offset 측정 불가 (chronyc/timedatectl 미설치 또는 NTP 미가동) — exit 0"
  exit 0
fi

# 2) 절대값 계산 (소수 허용)
ABS_OFFSET=$(echo "$OFFSET_SECONDS" | awk '{v=$1; if (v < 0) v = -v; print v}')

# 3) 임계값 비교
EXCEEDED=$(awk -v a="$ABS_OFFSET" -v t="$NTP_DRIFT_THRESHOLD" \
  'BEGIN { print (a + 0 > t + 0) ? 1 : 0 }')

NOW=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

if [ "$EXCEEDED" != "1" ] && [ "$SYNC_STATUS" = "yes" ]; then
  echo "[ntp_drift_check] OK (offset=${OFFSET_SECONDS}s, threshold=${NTP_DRIFT_THRESHOLD}s, source=${SOURCE})"
  echo "$NOW OK ${OFFSET_SECONDS}" > "$MARKER_FILE" 2>/dev/null || true
  exit 0
fi

# 4) Discord 알람 발송
HOSTNAME_SAFE=$(hostname 2>/dev/null || echo "unknown-host")
REASON=""
if [ "$SYNC_STATUS" != "yes" ]; then
  REASON="System clock NOT synchronized"
fi
if [ "$EXCEEDED" = "1" ]; then
  if [ -n "$REASON" ]; then
    REASON="$REASON / offset |${OFFSET_SECONDS}s| > ${NTP_DRIFT_THRESHOLD}s"
  else
    REASON="offset |${OFFSET_SECONDS}s| > ${NTP_DRIFT_THRESHOLD}s"
  fi
fi

CONTENT=$(printf '🚨 [NTP] 시계 동기화 이상 — %s\n• host: `%s`\n• source: `%s`\n• reason: %s\n• checked_at: `%s`' \
  "$HOSTNAME_SAFE" "$HOSTNAME_SAFE" "$SOURCE" "$REASON" "$NOW")

if ! command -v jq >/dev/null 2>&1; then
  echo "[ntp_drift_check] jq 미설치 — Discord 발송 skip"
  exit 0
fi

PAYLOAD=$(jq -nc --arg content "$CONTENT" '{content: $content}' 2>/dev/null) || {
  echo "[ntp_drift_check] jq payload 생성 실패 — exit 0"
  exit 0
}

HTTP_CODE=$(curl -fsS -o /tmp/ntp_drift_curl.out -w '%{http_code}' \
  -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[ntp_drift_check] Discord 발송 OK (HTTP $HTTP_CODE, offset=${OFFSET_SECONDS}s)"
  echo "$NOW ALERT ${OFFSET_SECONDS}" > "$MARKER_FILE" 2>/dev/null || true
else
  echo "[ntp_drift_check] Discord 발송 실패 (HTTP $HTTP_CODE)"
  cat /tmp/ntp_drift_curl.out 2>/dev/null || true
fi
