#!/bin/bash

# Wildcard SSL 인증서 자동 발급 (expect 사용)
# 사용법: sudo ./issue-wildcard-ssl-auto-expect.sh

set -e

DOMAIN="*.dev.core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.dev.core-solution.co.kr"
EXPECTED_VALUE="BE1YFRe-tXUOry088u-vpSbeIkXlNmqrStCTJqQTGNY"

echo "=========================================="
echo "Wildcard SSL 인증서 자동 발급"
echo "도메인: $DOMAIN"
echo "=========================================="
echo ""

# expect 설치 확인
if ! command -v expect &> /dev/null; then
    echo "expect 설치 중..."
    sudo apt-get update -qq
    sudo apt-get install -y expect
fi

# DNS TXT 레코드 확인
echo "DNS TXT 레코드 확인 중..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RESULT=$(dig +short TXT "$CHALLENGE_DOMAIN" 2>&1)
    
    if [ -n "$RESULT" ] && echo "$RESULT" | grep -q "$EXPECTED_VALUE"; then
        echo "✅ DNS TXT 레코드 확인 완료!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "대기 중... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ DNS TXT 레코드가 확인되지 않았습니다."
    exit 1
fi

echo ""
echo "SSL 인증서 발급 진행..."
echo ""

# expect를 사용하여 Certbot 자동화
expect <<'EOF'
set timeout 300

spawn sudo certbot certonly --manual --preferred-challenges dns -d "*.dev.core-solution.co.kr" --email admin@e-trinity.co.kr --agree-tos --no-eff-email

expect {
    "Please deploy a DNS TXT record" {
        expect -re "with the following value:\n\n(.*)\n\n"
        set challenge_value $expect_out(1,string)
        
        send_user "\n✅ DNS TXT 레코드 확인 완료!\n"
        send_user "값: $challenge_value\n\n"
        
        # DNS 확인 대기 (이미 확인했지만 Certbot이 다시 확인)
        sleep 5
        
        expect "Press Enter to Continue"
        send "\r"
        
        expect {
            "Congratulations" {
                send_user "\n✅ SSL 인증서 발급 완료!\n"
            }
            "An unexpected error occurred" {
                send_user "\n❌ SSL 인증서 발급 실패\n"
                exit 1
            }
            timeout {
                send_user "\n⚠️  타임아웃 발생\n"
                exit 1
            }
        }
    }
    "Congratulations" {
        send_user "\n✅ SSL 인증서 발급 완료!\n"
    }
    timeout {
        send_user "\n⚠️  타임아웃 발생\n"
        exit 1
    }
    eof {
        send_user "\n✅ SSL 인증서 발급 완료!\n"
    }
}

expect eof
EOF

echo ""
echo "=========================================="
echo "Wildcard SSL 인증서 발급 완료"
echo "=========================================="
echo ""
echo "인증서 위치:"
echo "  Certificate: /etc/letsencrypt/live/*.dev.core-solution.co.kr/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/*.dev.core-solution.co.kr/privkey.pem"
echo ""

