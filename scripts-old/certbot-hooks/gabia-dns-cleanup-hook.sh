#!/bin/bash
# 가비아 DNS TXT 레코드 정리 안내 스크립트 (Certbot --manual-cleanup-hook)
# 가비아는 DNS API를 제공하지 않으므로, 수동으로 TXT 레코드를 삭제해야 합니다.

set -e

# Certbot이 제공하는 환경 변수
DOMAIN="${CERTBOT_DOMAIN}"
TXT_VALUE="${CERTBOT_VALIDATION}"

# 루트 도메인: *.example.com → example.com, example.com → 그대로 (apex는 co.kr로 잘리면 안 됨)
if [[ "$DOMAIN" == "*."* ]]; then
  ROOT_DOMAIN="${DOMAIN#\*.}"
else
  ROOT_DOMAIN="$DOMAIN"
fi

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
echo "   (챌린지가 끝났습니다. 성공 시 불필요한 TXT입니다. 실패했다면 이 값만 지우고 다시 시도하세요.)"
echo "   ※ cleanup 훅은 가비아 DNS를 자동 삭제하지 않습니다. 위 안내대로 수동 삭제만 가능합니다."
echo ""

echo "✅ 정리 안내 완료"

