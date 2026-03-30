#!/bin/bash
# 빠른 와일드카드 도메인 테스트
# 사용법: ./test-wildcard-quick.sh [서브도메인]

SUBDOMAIN="${1:-test1}"
DOMAIN="${SUBDOMAIN}.dev.core-solution.co.kr"
URL="https://${DOMAIN}"

echo "🔍 ${DOMAIN} 테스트 중..."

# DNS 확인
DNS=$(dig +short ${DOMAIN} 2>/dev/null | head -1)
[ -n "$DNS" ] && echo "✅ DNS: ${DNS}" || echo "❌ DNS 실패"

# SSL 확인
SSL=$(echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>&1 | grep -o "CN=[^,]*" | head -1)
[ -n "$SSL" ] && echo "✅ SSL: ${SSL}" || echo "❌ SSL 실패"

# HTTP 접근
HTTP=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 5 ${URL} 2>/dev/null)
[ "$HTTP" = "200" ] && echo "✅ HTTP: ${HTTP}" || echo "⚠️  HTTP: ${HTTP}"

echo "완료"

