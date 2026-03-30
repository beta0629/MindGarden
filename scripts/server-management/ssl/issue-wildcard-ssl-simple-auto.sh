#!/bin/bash

# Wildcard SSL 인증서 자동 발급 (간단 버전)
# DNS TXT 레코드 확인 후 자동으로 Enter 입력

set -e

DOMAIN="*.dev.core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.dev.core-solution.co.kr"
EXPECTED_VALUE="BE1YFRe-tXUOry088u-vpSbeIkXlNmqrStCTJqQTGNY"

echo "=========================================="
echo "Wildcard SSL 인증서 자동 발급"
echo "도메인: $DOMAIN"
echo "=========================================="
echo ""

# DNS TXT 레코드 확인
echo "DNS TXT 레코드 확인 중..."
RESULT=$(dig +short TXT "$CHALLENGE_DOMAIN" 2>&1)

if [ -z "$RESULT" ] || ! echo "$RESULT" | grep -q "$EXPECTED_VALUE"; then
    echo "❌ DNS TXT 레코드가 확인되지 않았습니다."
    echo "DNS 관리자 페이지에서 TXT 레코드를 추가하세요."
    exit 1
fi

echo "✅ DNS TXT 레코드 확인 완료!"
echo ""

# expect 설치 확인
if ! command -v expect &> /dev/null; then
    echo "expect 설치 중..."
    sudo apt-get update -qq
    sudo apt-get install -y expect > /dev/null 2>&1
fi

echo "SSL 인증서 발급 진행..."
echo ""

# expect를 사용하여 자동으로 Enter 입력
expect <<'EXPECT_SCRIPT'
set timeout 300

spawn sudo certbot certonly --manual --preferred-challenges dns -d "*.dev.core-solution.co.kr" --email admin@e-trinity.co.kr --agree-tos --no-eff-email

expect {
    "Please deploy a DNS TXT record" {
        # DNS TXT 레코드 안내 메시지 건너뛰기
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
EXPECT_SCRIPT

echo ""
echo "=========================================="
echo "Wildcard SSL 인증서 발급 완료"
echo "=========================================="
echo ""

# 인증서 확인
if [ -f "/etc/letsencrypt/live/*.dev.core-solution.co.kr/fullchain.pem" ]; then
    echo "✅ 인증서 파일 확인:"
    echo "  Certificate: /etc/letsencrypt/live/*.dev.core-solution.co.kr/fullchain.pem"
    echo "  Private Key: /etc/letsencrypt/live/*.dev.core-solution.co.kr/privkey.pem"
else
    # 실제 경로 확인 (와일드카드가 파일명에 포함될 수 있음)
    CERT_PATH=$(sudo ls -d /etc/letsencrypt/live/*.dev.core-solution.co.kr 2>/dev/null | head -n 1)
    if [ -n "$CERT_PATH" ]; then
        echo "✅ 인증서 파일 확인:"
        echo "  Certificate: $CERT_PATH/fullchain.pem"
        echo "  Private Key: $CERT_PATH/privkey.pem"
    else
        echo "⚠️  인증서 파일 경로를 확인할 수 없습니다."
        echo "다음 명령어로 확인하세요:"
        echo "  sudo ls -la /etc/letsencrypt/live/"
    fi
fi

echo ""

