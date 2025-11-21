#!/bin/bash

# 운영 서버 Wildcard SSL 인증서 자동 발급 (expect 사용)
# 사용법: ./scripts/issue-wildcard-ssl-prod.sh

set -e

DOMAIN="*.core-solution.co.kr"
ROOT_DOMAIN="core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.core-solution.co.kr"

echo "=========================================="
echo "운영 서버 Wildcard SSL 인증서 자동 발급"
echo "도메인: $DOMAIN, $ROOT_DOMAIN"
echo "=========================================="
echo ""

# 운영 서버에 스크립트 전송 및 실행
ssh -t root@beta74.cafe24.com << 'SSH_EOF'
set -e

DOMAIN="*.core-solution.co.kr"
ROOT_DOMAIN="core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.core-solution.co.kr"

# expect 설치 확인
if ! command -v expect &> /dev/null; then
    echo "expect 설치 중..."
    apt-get update -qq > /dev/null 2>&1
    apt-get install -y expect > /dev/null 2>&1
fi

echo "SSL 인증서 발급 진행..."
echo ""

# expect를 사용하여 Certbot 자동화
expect <<'EXPECT_SCRIPT'
set timeout 600

spawn sudo certbot certonly --manual --preferred-challenges dns -d "*.core-solution.co.kr" -d "core-solution.co.kr" --email admin@e-trinity.co.kr --agree-tos --manual-public-ip-logging-ok

expect {
    -re "Please deploy a DNS TXT record.*?with the following value:\n\n(.*)\n\n" {
        set txt1 [string trim $expect_out(1,string)]
        send_user "\n========================================\n"
        send_user "첫 번째 TXT 값: $txt1\n"
        send_user "========================================\n"
        send_user "\nDNS 관리 페이지에서 이 값을 추가하세요:\n"
        send_user "  레코드 타입: TXT\n"
        send_user "  호스트: _acme-challenge.core-solution.co.kr\n"
        send_user "  값: $txt1\n"
        send_user "\nDNS 전파 확인 후 Enter를 누르세요...\n"
        send_user "(다른 터미널에서: dig TXT _acme-challenge.core-solution.co.kr)\n\n"
        
        expect "Press Enter to Continue"
        send "\r"
        send_user "\n✅ Enter 키 입력 완료!\n\n"
        
        expect {
            -re "Please deploy a DNS TXT record.*?with the following value:\n\n(.*)\n\n" {
                set txt2 [string trim $expect_out(1,string)]
                send_user "\n========================================\n"
                send_user "두 번째 TXT 값: $txt2\n"
                send_user "========================================\n"
                send_user "\nDNS 관리 페이지에서 이 값도 추가하세요:\n"
                send_user "  레코드 타입: TXT\n"
                send_user "  호스트: _acme-challenge.core-solution.co.kr\n"
                send_user "  값: $txt2\n"
                send_user "\nDNS 전파 확인 후 Enter를 누르세요...\n\n"
                
                expect "Press Enter to Continue"
                send "\r"
                send_user "\n✅ Enter 키 입력 완료!\n\n"
                
                expect {
                    "Successfully received certificate" {
                        send_user "\n✅ SSL 인증서 발급 완료!\n"
                    }
                    "Congratulations" {
                        send_user "\n✅ SSL 인증서 발급 완료!\n"
                    }
                    timeout {
                        send_user "\n⚠️  타임아웃 발생\n"
                        exit 1
                    }
                    eof
                }
            }
            "Successfully received certificate" {
                send_user "\n✅ SSL 인증서 발급 완료!\n"
            }
            "Congratulations" {
                send_user "\n✅ SSL 인증서 발급 완료!\n"
            }
            timeout {
                send_user "\n⚠️  타임아웃 발생\n"
                exit 1
            }
            eof
        }
    }
    "Successfully received certificate" {
        send_user "\n✅ SSL 인증서 발급 완료!\n"
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
echo "인증서 위치 확인:"
sudo ls -la /etc/letsencrypt/live/ | grep -E "core-solution|CORE" || echo "인증서 경로 확인 중..."

SSH_EOF

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
