#!/bin/bash

# Wildcard SSL 인증서 자동 발급 스크립트
# DNS TXT 레코드 확인 후 자동 진행
# 사용법: sudo ./issue-wildcard-ssl-auto.sh

set -e

DOMAIN="*.dev.core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.dev.core-solution.co.kr"

echo "=========================================="
echo "Wildcard SSL 인증서 자동 발급"
echo "도메인: $DOMAIN"
echo "=========================================="
echo ""

# Certbot 실행 (대화형)
echo "Certbot 실행 중..."
echo "⚠️  DNS TXT 레코드를 추가한 후 Enter 키를 눌러주세요."
echo ""

# expect를 사용하여 자동화 (설치 확인)
if command -v expect &> /dev/null; then
    echo "expect 설치 확인 완료"
else
    echo "expect 설치 중..."
    sudo apt-get update -qq
    sudo apt-get install -y expect
fi

# Certbot 실행 및 자동 입력
expect <<EOF
spawn sudo certbot certonly --manual --preferred-challenges dns -d "$DOMAIN" --email admin@e-trinity.co.kr --agree-tos --no-eff-email

expect {
    "Please deploy a DNS TXT record" {
        send_user "\n==========================================\n"
        send_user "DNS TXT 레코드 정보:\n"
        send_user "==========================================\n\n"
        
        expect -re "under the name:\n\n(.*)\n\nwith the following value:\n\n(.*)\n\n"
        set challenge_name \$expect_out(1,string)
        set challenge_value \$expect_out(2,string)
        
        send_user "호스트: _acme-challenge.dev\n"
        send_user "타입: TXT\n"
        send_user "값: \$challenge_value\n"
        send_user "전체 도메인: \$challenge_name\n\n"
        send_user "DNS에 추가한 후 Enter 키를 눌러주세요.\n"
        send_user "==========================================\n\n"
        
        # DNS 확인 대기
        send_user "DNS 전파 확인 중...\n"
        set timeout 300
        set retry_count 0
        set max_retries 30
        
        while {\$retry_count < \$max_retries} {
            set result [exec dig +short TXT \$challenge_name 2>/dev/null]
            if {[string match "*\$challenge_value*" \$result]} {
                send_user "✅ DNS TXT 레코드 확인 완료!\n\n"
                break
            }
            incr retry_count
            send_user "대기 중... (\$retry_count/\$max_retries)\n"
            sleep 10
        }
        
        if {\$retry_count >= \$max_retries} {
            send_user "⚠️  DNS 전파 확인 실패. 수동으로 확인 후 Enter 키를 눌러주세요.\n"
        }
        
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
    timeout {
        send_user "\n❌ 타임아웃 발생\n"
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

