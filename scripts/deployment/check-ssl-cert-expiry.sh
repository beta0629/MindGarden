#!/usr/bin/env bash
# Let's Encrypt(및 /etc/letsencrypt/live 하위) 인증서 만료일 점검
# - WARN: 설정 일수 이내 만료 예정
# - CRITICAL: 설정 일수 이내(더 짧은 구간) 만료 예정 → exit 1 (cron 메일용)
#
# 환경변수:
#   WARN_DAYS=30          이 일수 이하면 경고 출력
#   CRITICAL_DAYS=14      이 일수 이하면 CRITICAL + exit 1
#   MAILTO=user@x.com     (선택) mail 명령 있으면 요약 메일 (비어 있으면 스킵)
#   WEBHOOK_URL=https://   (선택) POST JSON 알림 (curl 필요)
#
# cron 예:
#   0 9 * * * root WARN_DAYS=30 CRITICAL_DAYS=14 /root/scripts/check-ssl-cert-expiry.sh >> /var/log/ssl-expiry.log 2>&1

set -euo pipefail

WARN_DAYS="${WARN_DAYS:-30}"
CRITICAL_DAYS="${CRITICAL_DAYS:-14}"
LIVE_DIR="${LIVE_DIR:-/etc/letsencrypt/live}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[ssl-expiry] root 또는 cert.pem 읽기 권한이 필요합니다." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "[ssl-expiry] openssl 없음" >&2
  exit 1
fi

now_epoch=$(date +%s)
had_critical=0
lines=()

# set -e + 빈 find 시 read 실패로 조기 종료 방지
set +e
while IFS= read -r -d '' cert; do
  [[ -n "$cert" ]] || continue
  name=$(basename "$(dirname "$cert")")
  end=$(openssl x509 -enddate -noout -in "$cert" 2>/dev/null | cut -d= -f2-)
  [[ -n "$end" ]] || continue
  end_epoch=$(date -d "$end" +%s 2>/dev/null) || continue
  left=$(( (end_epoch - now_epoch) / 86400 ))

  line="$name  만료: $end  (남은 일수: ${left}일)"
  lines+=("$line")

  if (( left < CRITICAL_DAYS )); then
    echo "[CRITICAL] $line" >&2
    had_critical=1
  elif (( left < WARN_DAYS )); then
    echo "[WARN] $line" >&2
  fi
# cert.pem 은 보통 archive 로 가는 심볼릭 링크이므로 -type f 만 쓰면 제외됨
done < <(find "$LIVE_DIR" -maxdepth 2 \( -type f -o -type l \) -name cert.pem -print0 2>/dev/null)
set -e

if [[ ${#lines[@]} -eq 0 ]]; then
  echo "[ssl-expiry] $LIVE_DIR 에서 cert.pem 을 찾지 못했습니다." >&2
  exit 0
fi

echo "======== $(date -Is) SSL 만료 점검 ========"
printf '%s\n' "${lines[@]}"

summary=$(printf '%s\n' "${lines[@]}")

# Slack/기타 Incoming Webhook (JSON { "text": "..." }) — python3 있으면 이스케이프 안전
if [[ -n "${WEBHOOK_URL:-}" ]] && command -v curl >/dev/null 2>&1 && (( had_critical )); then
  if command -v python3 >/dev/null 2>&1; then
    payload=$(python3 -c 'import json,sys; print(json.dumps({"text": sys.stdin.read()}))' <<<"$summary")
    curl -sS -X POST -H 'Content-Type: application/json' -d "$payload" "$WEBHOOK_URL" >/dev/null 2>&1 || true
  else
    curl -sS -X POST -H 'Content-Type: application/json' \
      --data-binary "{\"text\":\"SSL 만료 임박 — 서버 $(hostname 2>/dev/null). 로그 확인: check-ssl-cert-expiry.sh\"}" \
      "$WEBHOOK_URL" >/dev/null 2>&1 || true
  fi
fi

if [[ -n "${MAILTO:-}" ]] && command -v mail >/dev/null 2>&1 && (( had_critical )); then
  echo "$summary" | mail -s "[CRITICAL] SSL 만료 임박 (서버 $(hostname -f 2>/dev/null || hostname))" "$MAILTO" || true
fi

exit "$had_critical"
