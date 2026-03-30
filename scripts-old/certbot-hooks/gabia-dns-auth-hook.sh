#!/bin/bash
# Certbot manual-auth-hook: Gabia DNS-01, 권위 ns 조회 + 고정문자열 매칭(-F)
# Certbot이 훅 stderr를 파이프로 받으면 풀 버퍼링되어 로그가 끝에 한꺼번에 보임 → stdbuf로 줄 단위 출력.

# stderr가 터미널이 아닐 때만(파이프 등) 한 번 재실행
if [ -z "${GABIA_HOOK_LINEBUF:-}" ] && ! [ -t 2 ] && command -v stdbuf >/dev/null 2>&1; then
  export GABIA_HOOK_LINEBUF=1
  exec stdbuf -oL -eL bash "$0" "$@"
fi

set -euo pipefail

DOMAIN="${CERTBOT_DOMAIN}"
TXT_VALUE="${CERTBOT_VALIDATION}"

if [ -z "$DOMAIN" ] || [ -z "$TXT_VALUE" ]; then
    echo "❌ CERTBOT_DOMAIN / CERTBOT_VALIDATION 없음" >&2
    echo "   CERTBOT_DOMAIN=${DOMAIN:-}" >&2
    echo "   CERTBOT_VALIDATION=${TXT_VALUE:-}" >&2
    env | grep CERTBOT >&2 || true
    exit 1
fi

# *.example.com → example.com, example.com → 그대로 (co.kr apex 잘리면 안 됨)
if [[ "$DOMAIN" == "*."* ]]; then
  ROOT_DOMAIN="${DOMAIN#\*.}"
else
  ROOT_DOMAIN="$DOMAIN"
fi

CHALLENGE_DOMAIN="_acme-challenge.${ROOT_DOMAIN}"

echo "" >&2
echo "==========================================" >&2
echo "가비아 DNS TXT (이번 챌린지)" >&2
echo "==========================================" >&2
echo "도메인: ${ROOT_DOMAIN}" >&2
echo "Challenge: ${CHALLENGE_DOMAIN}" >&2
echo "TXT 값: ${TXT_VALUE}" >&2
echo "" >&2
echo "📋 호스트: _acme-challenge / 타입: TXT / 값: (위와 동일)" >&2
echo "" >&2

# certbot이 로그를 한꺼번에 보여줄 때를 대비: 값을 파일로도 남김 (다른 SSH 창에서 cat)
ACME_HINT="/run/gabia-acme-last.txt"
umask 077
{
  echo "CHALLENGE_DOMAIN=${CHALLENGE_DOMAIN}"
  echo "TXT_VALUE=${TXT_VALUE}"
} >"$ACME_HINT" 2>/dev/null || {
  ACME_HINT="/tmp/gabia-acme-last.txt"
  umask 077
  {
    echo "CHALLENGE_DOMAIN=${CHALLENGE_DOMAIN}"
    echo "TXT_VALUE=${TXT_VALUE}"
  } >"$ACME_HINT"
}
echo "📎 터미널에 안 보이면: sudo cat ${ACME_HINT}" >&2
# certbot이 훅 stderr를 종료 시까지 묶어 두는 경우가 많음 → 다른 SSH에서 tail -f 로 실시간 확인
HOOK_LIVE_LOG="/run/gabia-acme-hook-live.log"
: >"$HOOK_LIVE_LOG" 2>/dev/null || HOOK_LIVE_LOG="/tmp/gabia-acme-hook-live.log"
: >"$HOOK_LIVE_LOG"
chmod 600 "$HOOK_LIVE_LOG" 2>/dev/null || true
_loglive() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >>"$HOOK_LIVE_LOG"; }
_loglive "=== 챌린지 시작 domain=${ROOT_DOMAIN} txt=${TXT_VALUE}"
echo "📡 실시간 로그 (certbot 창 말고 다른 터미널): sudo tail -f ${HOOK_LIVE_LOG}" >&2
echo "" >&2

# 가비아 저장·전파할 시간 (초). 줄이려면: sudo GABIA_GRACE_SEC=30 certbot ...
GABIA_GRACE_SEC="${GABIA_GRACE_SEC:-120}"
echo "⏸  지금 가비아에 위 TXT를 추가·저장하세요. ${GABIA_GRACE_SEC}초 후 DNS 조회를 시작합니다." >&2
echo "   (유예 시간 변경: GABIA_GRACE_SEC=180 등 환경변수)" >&2
_grace_left="$GABIA_GRACE_SEC"
while [ "$_grace_left" -gt 0 ]; do
  _step=15
  [ "$_grace_left" -lt 15 ] && _step="$_grace_left"
  echo "⏸  등록 유예… 남은 약 ${_grace_left}초" >&2
  _loglive "⏸ 유예 남은 ${_grace_left}초"
  sleep "$_step"
  _grace_left=$((_grace_left - _step))
done
echo "" >&2
echo "DNS 확인 중 (ns1.gabia → ns2.gabia → 8.8.8.8), 매 10초마다 재시도…" >&2

MAX_RETRIES=60
RETRY_COUNT=0

while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
    # 매 루프마다 찍어서 '바로 팅김' 오해 줄임 (1회차부터 보임)
    echo "⏳ 확인 $((RETRY_COUNT + 1))/${MAX_RETRIES} — ${CHALLENGE_DOMAIN}" >&2

    R1=$(dig +short TXT "${CHALLENGE_DOMAIN}" @ns1.gabia.co.kr 2>/dev/null || true)
    R2=$(dig +short TXT "${CHALLENGE_DOMAIN}" @ns2.gabia.co.kr 2>/dev/null || true)
    R3=$(dig +short TXT "${CHALLENGE_DOMAIN}" @8.8.8.8 2>/dev/null || true)
    RESULT="${R1}${R2}${R3}"
    _ns1_preview=$(echo "$R1" | tr '\n' ' ' | cut -c1-160)
    _loglive "⏳ 확인 $((RETRY_COUNT + 1))/${MAX_RETRIES} @ns1.gabia: ${_ns1_preview:-<비어있음>}"

    if echo "$RESULT" | grep -Fq "$TXT_VALUE"; then
        echo "✅ DNS TXT 확인 완료" >&2
        _loglive "✅ DNS TXT 확인 완료"
        exit 0
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 10
done

echo "❌ TXT 미확인. dig TXT ${CHALLENGE_DOMAIN} @ns1.gabia.co.kr" >&2
_loglive "❌ TXT 미확인 종료"
exit 1
