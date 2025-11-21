#!/bin/bash
# 가비아 DNS TXT 레코드 정리 안내 스크립트 (Certbot --manual-cleanup-hook)
# 가비아는 DNS API를 제공하지 않으므로, 수동으로 TXT 레코드를 삭제해야 합니다.

set -e

# Certbot이 제공하는 환경 변수
DOMAIN="${CERTBOT_DOMAIN}"
TXT_VALUE="${CERTBOT_VALIDATION}"

# 도메인에서 루트 도메인 추출
ROOT_DOMAIN=$(echo "$DOMAIN" | sed -E 's/^\*\.//' | sed -E 's/^[^.]*\.//')

echo ""
echo "=========================================="
echo "가비아 DNS TXT 레코드 정리 안내"
echo "=========================================="
echo "도메인: ${ROOT_DOMAIN}"
echo "Challenge 도메인: _acme-challenge.${ROOT_DOMAIN}"
echo ""

echo "📋 가비아 DNS 관리 페이지에서 다음 TXT 레코드를 삭제하세요:"
echo "  호스트: _acme-challenge"
echo "  타입: TXT"
echo "  값: ${TXT_VALUE}"
echo ""
echo "   (인증서 발급이 완료되었으므로 더 이상 필요하지 않습니다)"
echo ""

echo "✅ 정리 안내 완료"

