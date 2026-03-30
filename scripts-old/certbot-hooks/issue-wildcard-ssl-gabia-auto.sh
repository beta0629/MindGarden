#!/bin/bash
# 가비아 DNS를 사용한 와일드카드 SSL 인증서 발급 스크립트 (DNS 전파 자동 확인)
# 사용법: ./issue-wildcard-ssl-gabia-auto.sh <domain>
# 예시: ./issue-wildcard-ssl-gabia-auto.sh core-solution.co.kr

set -e

if [ -z "$1" ]; then
    echo "사용법: $0 <domain>"
    echo "예시: $0 core-solution.co.kr"
    exit 1
fi

DOMAIN="$1"
WILDCARD_DOMAIN="*.${DOMAIN}"

# Hook 스크립트 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_HOOK="${SCRIPT_DIR}/gabia-dns-auth-hook.sh"
CLEANUP_HOOK="${SCRIPT_DIR}/gabia-dns-cleanup-hook.sh"

# Hook 스크립트 실행 권한 확인
if [ ! -x "$AUTH_HOOK" ]; then
    chmod +x "$AUTH_HOOK"
fi
if [ ! -x "$CLEANUP_HOOK" ]; then
    chmod +x "$CLEANUP_HOOK"
fi

echo "=========================================="
echo "와일드카드 SSL 인증서 발급 (가비아 DNS)"
echo "도메인: ${WILDCARD_DOMAIN}, ${DOMAIN}"
echo "=========================================="
echo ""
echo "⚠️  가비아는 DNS API를 제공하지 않으므로,"
echo "   DNS TXT 레코드를 수동으로 추가해야 합니다."
echo ""
echo "이 스크립트는 DNS 전파를 자동으로 확인합니다."
echo ""

# Certbot 실행 (기본 manual 모드 사용)
# --manual-auth-hook은 환경 변수를 제대로 전달하지 않으므로
# Certbot의 기본 출력을 사용하고, 사용자가 TXT 레코드를 추가한 후
# DNS 전파 확인은 별도로 진행
echo "SSL 인증서 발급 진행..."
echo ""
echo "⚠️  Certbot이 TXT 레코드 정보를 표시하면,"
echo "   가비아 DNS 관리 페이지에서 TXT 레코드를 추가하세요."
echo "   추가 후 DNS 전파가 확인되면 Enter를 눌러 진행하세요."
echo ""

sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d "$WILDCARD_DOMAIN" \
    -d "$DOMAIN" \
    --email admin@e-trinity.co.kr \
    --agree-tos \
    --manual-public-ip-logging-ok

echo ""
echo "=========================================="
echo "✅ 와일드카드 SSL 인증서 발급 완료!"
echo "=========================================="
echo ""
echo "인증서 위치:"
echo "  /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo "  /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
echo ""

