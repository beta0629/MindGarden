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
# 본문 ERROR/FATAL 패턴 + BE 부트 실패·재시작 루프 시그널 (Started/Stopped/main process exited/Restart counter).
# 운영 환경별 추가 패턴은 /etc/mindgarden/log_watcher.env 의 LOG_PATTERNS 로 override 한다.
LOG_PATTERNS="${LOG_PATTERNS:-ERROR|FATAL|\[OPS-ALERT\]|Unable to determine|silent first|stub mode in production|Started|Stopped|main process exited|Restart counter}"

# 재시작 루프 감지 — 5분 윈도우에 RestartCount 3회 이상이면 별도 critical 알람.
RESTART_LOOP_WINDOW_SEC="${RESTART_LOOP_WINDOW_SEC:-300}"
RESTART_LOOP_THRESHOLD="${RESTART_LOOP_THRESHOLD:-3}"
RESTART_MARKER_FILE="${RESTART_MARKER_FILE:-/var/lib/mindgarden/log_watcher_restart_count.txt}"

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
  # restart loop 검사는 매칭 유무와 무관하게 항상 수행 — 본문 발송만 skip 한다.
else
  # Discord 메시지 한도 2000자 — 헤더·코드블럭 마커 등 약 200자 여유 두고 1800자로 제한
  TRUNCATED=$(echo "$MATCHED" | head -c 1800)

  CONTENT=$(printf '🚨 운영 BE 알람 (%s ~ %s)\n```\n%s\n```' "$SINCE" "$NOW" "$TRUNCATED")

  if ! command -v jq >/dev/null 2>&1; then
    echo "[log_watcher] jq 미설치 — Discord 발송 skip"
  else
    PAYLOAD=$(jq -nc --arg content "$CONTENT" '{content: $content}' 2>/dev/null) || PAYLOAD=""
    if [ -n "$PAYLOAD" ]; then
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
    fi
  fi
fi

# -------------------------------------------------------------------
# BE 재시작 루프 감지 (P1) — systemctl RestartCount 가 5분 윈도우에 임계값 이상이면 critical 알람.
# 별도 마커 파일($RESTART_MARKER_FILE) — 본문 마커($MARKER_FILE) 와 분리.
# graceful skip: systemctl/jq 미설치, NRestarts 미노출, 권한 부족 등.
# -------------------------------------------------------------------
if ! command -v systemctl >/dev/null 2>&1; then
  echo "[log_watcher] systemctl 미설치 — restart loop 검사 skip"
  exit 0
fi

# NRestarts 추출 (systemd v230+). 미노출 시 0 으로 폴백.
CURRENT_RESTARTS=$(systemctl show "$SERVICE_NAME" -p NRestarts --value 2>/dev/null || echo "0")
if ! [[ "$CURRENT_RESTARTS" =~ ^[0-9]+$ ]]; then
  echo "[log_watcher] NRestarts 미노출 (raw='$CURRENT_RESTARTS') — restart loop 검사 skip"
  exit 0
fi

NOW_EPOCH=$(date -u '+%s')

# 마커 형식: "<epoch> <restart_count>" 한 줄.
PREV_EPOCH=0
PREV_RESTARTS=0
if [ -f "$RESTART_MARKER_FILE" ] && [ -s "$RESTART_MARKER_FILE" ]; then
  read -r PREV_EPOCH PREV_RESTARTS < "$RESTART_MARKER_FILE" 2>/dev/null || true
  PREV_EPOCH=${PREV_EPOCH:-0}
  PREV_RESTARTS=${PREV_RESTARTS:-0}
fi

if ! [[ "$PREV_EPOCH" =~ ^[0-9]+$ ]]; then PREV_EPOCH=0; fi
if ! [[ "$PREV_RESTARTS" =~ ^[0-9]+$ ]]; then PREV_RESTARTS=0; fi

DELTA_SEC=$(( NOW_EPOCH - PREV_EPOCH ))
DELTA_RESTARTS=$(( CURRENT_RESTARTS - PREV_RESTARTS ))
if [ "$DELTA_RESTARTS" -lt 0 ]; then
  # 서비스 reload·재배포로 NRestarts 가 0 으로 리셋된 경우 — delta 무시.
  DELTA_RESTARTS=0
fi

echo "[log_watcher] restart-loop check: window=${DELTA_SEC}s, delta=${DELTA_RESTARTS}, current=${CURRENT_RESTARTS}"

# 윈도우 안에 임계값 이상 재시작이면 critical 알람.
if [ "$DELTA_SEC" -le "$RESTART_LOOP_WINDOW_SEC" ] \
   && [ "$DELTA_RESTARTS" -ge "$RESTART_LOOP_THRESHOLD" ]; then

  if ! command -v jq >/dev/null 2>&1; then
    echo "[log_watcher] jq 미설치 — restart loop Discord 발송 skip"
  else
    RESTART_CONTENT=$(printf '🚨 BE restart loop detected — %s\n• window: 최근 %ds\n• new restarts: %d (총 %d회)\n• 즉시 점검 필요 (배포 롤백 또는 BE 부트 실패 가능성).' \
      "$SERVICE_NAME" "$DELTA_SEC" "$DELTA_RESTARTS" "$CURRENT_RESTARTS")
    RESTART_PAYLOAD=$(jq -nc --arg content "$RESTART_CONTENT" '{content: $content}' 2>/dev/null) || RESTART_PAYLOAD=""
    if [ -n "$RESTART_PAYLOAD" ]; then
      RHTTP=$(curl -fsS -o /tmp/log_watcher_restart_curl.out -w '%{http_code}' \
        -X POST "$DISCORD_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$RESTART_PAYLOAD" 2>/dev/null || echo "000")
      if [ "$RHTTP" = "204" ] || [ "$RHTTP" = "200" ]; then
        echo "[log_watcher] restart loop Discord 발송 OK (HTTP $RHTTP)"
      else
        echo "[log_watcher] restart loop Discord 발송 실패 (HTTP $RHTTP)"
        cat /tmp/log_watcher_restart_curl.out 2>/dev/null || true
      fi
    fi
  fi
fi

# 매 실행마다 마커 갱신 — 다음 실행 시 정확한 delta 측정.
RESTART_MARKER_DIR="$(dirname "$RESTART_MARKER_FILE")"
if [ ! -d "$RESTART_MARKER_DIR" ]; then
  mkdir -p "$RESTART_MARKER_DIR" 2>/dev/null || sudo mkdir -p "$RESTART_MARKER_DIR" 2>/dev/null || true
fi
echo "$NOW_EPOCH $CURRENT_RESTARTS" > "$RESTART_MARKER_FILE" 2>/dev/null || true
