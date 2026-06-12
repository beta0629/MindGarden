#!/bin/bash
#
# MindGarden 운영 BE 로그 감시기 (Discord 알람)
# - 운영 BE journalctl 에서 ERROR/FATAL/[OPS-ALERT] 패턴 추출 → Discord webhook 발송
# - systemd timer 로 5분 cron 처럼 실행 (log_watcher.timer)
# - 중복 방지: 마지막 처리 timestamp 마커 파일 사용
#
# 환경변수:
#   DISCORD_WEBHOOK_URL  Discord webhook URL (필수, 미설정 시 즉시 종료)
#   SERVICE_NAME         감시할 systemd 서비스명 (기본: mindgarden-core-blue.service)
#   MARKER_FILE          마지막 처리 시각 저장 파일 (기본: /var/lib/mindgarden/log_watcher_last_seen.txt)
#   LOG_PATTERNS         grep -iE 패턴 (기본: ERROR|FATAL|\[OPS-ALERT\]|...)
#
# 운영 DB 직접 접근 금지 — journalctl 만 사용한다.
#
# 참고: docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md §6 Phase 1
# 설치 가이드: docs/운영반영/LOG_WATCHER_DISCORD_ALERT_SETUP_GUIDE.md
#

set -u

SERVICE_NAME="${SERVICE_NAME:-mindgarden-core-blue.service}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
MARKER_FILE="${MARKER_FILE:-/var/lib/mindgarden/log_watcher_last_seen.txt}"
LOG_PATTERNS="${LOG_PATTERNS:-ERROR|FATAL|\[OPS-ALERT\]|Unable to determine|silent first|stub mode in production}"

if [ -z "$DISCORD_WEBHOOK_URL" ]; then
  echo "[log_watcher] DISCORD_WEBHOOK_URL 미설정 — exit 0 (정상 종료)"
  exit 0
fi

# 마커 디렉터리 보장
MARKER_DIR="$(dirname "$MARKER_FILE")"
if [ ! -d "$MARKER_DIR" ]; then
  mkdir -p "$MARKER_DIR" 2>/dev/null || sudo mkdir -p "$MARKER_DIR"
fi

# 마지막 처리 시각 (없으면 5분 전부터)
if [ -f "$MARKER_FILE" ] && [ -s "$MARKER_FILE" ]; then
  SINCE=$(cat "$MARKER_FILE")
else
  # macOS / GNU date 호환: 우선 GNU date 시도, 실패 시 macOS date
  SINCE=$(date -u -d '5 minutes ago' '+%Y-%m-%d %H:%M:%S' 2>/dev/null \
    || date -u -v-5M '+%Y-%m-%d %H:%M:%S' 2>/dev/null \
    || date -u '+%Y-%m-%d %H:%M:%S')
fi
NOW=$(date -u '+%Y-%m-%d %H:%M:%S')

# 매칭 로그 추출 (sudo 권한 필요 — systemd unit 에서는 root/mindgarden user 로 실행)
MATCHED=$(journalctl -u "$SERVICE_NAME" --since "$SINCE" --until "$NOW" --no-pager 2>/dev/null \
  | grep -iE "$LOG_PATTERNS" \
  | head -20 || true)

if [ -z "$MATCHED" ]; then
  echo "$NOW" > "$MARKER_FILE"
  echo "[log_watcher] 매칭 없음 ($SINCE ~ $NOW)"
  exit 0
fi

# Discord 메시지 한도 2000자 — 헤더·코드블럭 마커 등 약 200자 여유 두고 1800자로 제한
TRUNCATED=$(echo "$MATCHED" | head -c 1800)

CONTENT=$(printf '🚨 운영 BE 알람 (%s ~ %s)\n```\n%s\n```' "$SINCE" "$NOW" "$TRUNCATED")

PAYLOAD=$(jq -nc --arg content "$CONTENT" '{content: $content}' 2>/dev/null) || {
  echo "[log_watcher] jq 미설치 또는 실패 — Discord 발송 skip"
  exit 0
}

HTTP_CODE=$(curl -fsS -o /tmp/log_watcher_curl.out -w '%{http_code}' \
  -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "[log_watcher] Discord 발송 OK (HTTP $HTTP_CODE)"
  echo "$NOW" > "$MARKER_FILE"
else
  echo "[log_watcher] Discord 발송 실패 (HTTP $HTTP_CODE)"
  cat /tmp/log_watcher_curl.out 2>/dev/null || true
  # 마커는 갱신하지 않음 — 다음 실행 시 같은 구간을 재시도
fi
