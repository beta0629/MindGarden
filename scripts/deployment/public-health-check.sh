#!/usr/bin/env bash
# 배포 후 공개 URL 헬스체크. 실패하면 exit 1 (배포 실패).
#
# 사용: public-health-check.sh <공개 기본 URL>
#   공개 기본 URL 은 repository variable 로만 넘긴다(예: vars.PRODUCTION_PUBLIC_BASE_URL). 비어 있으면 실패.
# 환경 변수(선택):
#   PUBLIC_HEALTH_PATH          기본 /actuator/health
#   PUBLIC_HEALTH_ATTEMPTS      기본 10
#   PUBLIC_HEALTH_INTERVAL_SEC  기본 6
#
# 통과 조건: HTTP 200 이고 본문 status 가 UP.
set -euo pipefail

BASE_URL="${1:-}"
HEALTH_PATH="${PUBLIC_HEALTH_PATH:-/actuator/health}"
ATTEMPTS="${PUBLIC_HEALTH_ATTEMPTS:-10}"
INTERVAL="${PUBLIC_HEALTH_INTERVAL_SEC:-6}"

if [ -z "$BASE_URL" ]; then
  echo "::error::공개 URL 이 비어 있습니다. repository variable(예: PRODUCTION_PUBLIC_BASE_URL / DEV_PUBLIC_BASE_URL)을 설정하세요."
  exit 1
fi
case "$ATTEMPTS$INTERVAL" in
  *[!0-9]*)
    echo "::error::PUBLIC_HEALTH_ATTEMPTS / PUBLIC_HEALTH_INTERVAL_SEC 는 숫자여야 합니다."
    exit 1
    ;;
esac

URL="${BASE_URL%/}${HEALTH_PATH}"
BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

echo "🌐 공개 URL 헬스체크: $URL (최대 ${ATTEMPTS}회, ${INTERVAL}초 간격)"
i=1
while [ "$i" -le "$ATTEMPTS" ]; do
  : > "$BODY_FILE"
  if ! code="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' --connect-timeout 5 --max-time 10 "$URL" 2>/dev/null)"; then
    code="000"
  fi
  if [ "$code" = "200" ] && grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"' "$BODY_FILE"; then
    echo "✅ 공개 URL 헬스 통과 (HTTP $code, 시도 $i/$ATTEMPTS)"
    exit 0
  fi
  echo "⏳ 공개 URL 헬스 미통과 (HTTP $code, 시도 $i/$ATTEMPTS): $(head -c 200 "$BODY_FILE" | tr -d '\r\n')"
  if [ "$i" -lt "$ATTEMPTS" ]; then
    sleep "$INTERVAL"
  fi
  i=$((i + 1))
done

echo "::error::공개 URL 헬스체크 실패 — $URL 가 ${ATTEMPTS}회 안에 200·UP 을 돌려주지 않았습니다. 배포를 실패 처리합니다."
exit 1
