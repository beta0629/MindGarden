#!/bin/bash
# 가비아 DNS TXT 레코드 전파 확인 스크립트 (Certbot --manual-auth-hook)
# 가비아는 DNS API를 제공하지 않으므로, 수동으로 TXT 레코드를 추가한 후
# 이 스크립트가 DNS 전파를 자동으로 확인합니다.

set -e

# Certbot이 제공하는 환경 변수
DOMAIN="${CERTBOT_DOMAIN}"
TXT_VALUE="${CERTBOT_VALIDATION}"

# 환경 변수 확인
if [ -z "$DOMAIN" ] || [ -z "$TXT_VALUE" ]; then
    echo "❌ 환경 변수가 설정되지 않았습니다." >&2
    echo "   CERTBOT_DOMAIN: ${DOMAIN:-비어있음}" >&2
    echo "   CERTBOT_VALIDATION: ${TXT_VALUE:-비어있음}" >&2
    echo "   모든 환경 변수:" >&2
    env | grep CERTBOT >&2 || echo "   CERTBOT 환경 변수 없음" >&2
    exit 1
fi

# 도메인에서 루트 도메인 추출 (예: www.example.com -> example.com, *.example.com -> example.com)
ROOT_DOMAIN=$(echo "$DOMAIN" | sed -E 's/^\*\.//' | sed -E 's/^[^.]*\.//')

# Challenge 도메인 생성
CHALLENGE_DOMAIN="_acme-challenge.${ROOT_DOMAIN}"

# 출력을 stderr로 보내서 Certbot이 표시하도록 함
echo "" >&2
echo "==========================================" >&2
echo "가비아 DNS TXT 레코드 정보" >&2
echo "==========================================" >&2
echo "도메인: ${ROOT_DOMAIN}" >&2
echo "Challenge 도메인: ${CHALLENGE_DOMAIN}" >&2
echo "TXT 값: ${TXT_VALUE}" >&2
echo "" >&2

echo "📋 가비아 DNS 관리 페이지에서 다음 TXT 레코드를 추가하세요:" >&2
echo "  호스트: _acme-challenge" >&2
echo "  타입: TXT" >&2
echo "  값: ${TXT_VALUE}" >&2
echo "  TTL: 300 (또는 기본값)" >&2
echo "" >&2

# DNS 전파 확인 (최대 5분 대기)
echo "DNS 전파 확인 중..." >&2
echo "" >&2

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RESULT=$(dig +short TXT "${CHALLENGE_DOMAIN}" 2>&1 || echo "")
    
    if [ -n "$RESULT" ] && echo "$RESULT" | grep -q "${TXT_VALUE}"; then
        echo "✅ DNS TXT 레코드 확인 완료!" >&2
        echo "   확인된 값: $RESULT" >&2
        echo "" >&2
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $((RETRY_COUNT % 3)) -eq 0 ]; then
        echo "대기 중... ($RETRY_COUNT/$MAX_RETRIES) - ${CHALLENGE_DOMAIN} 확인 중..." >&2
    fi
    sleep 10
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "" >&2
    echo "❌ DNS TXT 레코드가 확인되지 않았습니다." >&2
    echo "   다음을 확인하세요:" >&2
    echo "   1. 가비아 DNS 관리 페이지에서 TXT 레코드가 올바르게 추가되었는지" >&2
    echo "   2. DNS 전파 시간 (보통 5-10분 소요)" >&2
    echo "   3. Challenge 도메인: ${CHALLENGE_DOMAIN}" >&2
    echo "   4. TXT 값: ${TXT_VALUE}" >&2
    echo "" >&2
    echo "   수동 확인: dig TXT ${CHALLENGE_DOMAIN}" >&2
    echo "" >&2
    exit 1
fi

