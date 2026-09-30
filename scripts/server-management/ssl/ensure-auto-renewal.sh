#!/bin/bash

# SSL 인증서 자동 갱신 설정 점검 스크립트
# 개발/운영 서버에서 실행
# 사용법: sudo ./ensure-auto-renewal.sh [dev|prod] [--check-acmedns] [--dry-run]
#
# SSOT: docs/runbooks/SSL_CERTIFICATE_STATUS.md
# acme-dns 섹션은 legacy (구 가비아 경로). --check-acmedns 명시 시에만 실행.

set -e

MODE="dev"
CHECK_ACMEDNS=0
DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        dev|prod) MODE="$arg" ;;
        --check-acmedns) CHECK_ACMEDNS=1 ;;
        --dry-run) DRY_RUN=1 ;;
        -h|--help) grep '^#' "$0" | head -10; exit 0 ;;
        *) echo "알 수 없는 옵션: $arg" >&2; exit 2 ;;
    esac
done

echo "=========================================="
echo "SSL 자동 갱신 설정 점검 ($MODE)"
echo "=========================================="
echo ""

# 1. certbot.timer 확인
echo "1. certbot.timer 상태"
if systemctl is-active --quiet certbot.timer; then
    echo "   ✅ certbot.timer 활성화됨"
    systemctl list-timers certbot.timer --no-pager 2>/dev/null || true
else
    echo "   ❌ certbot.timer 비활성화됨. 활성화: systemctl enable --now certbot.timer"
fi
echo ""

# 2. 갱신 설정에서 authenticator 확인
echo "2. authenticator 확인"
STANDALONE_FOUND=0
for f in /etc/letsencrypt/renewal/*.conf; do
    [ -f "$f" ] || continue
    AUTH=$(grep "^authenticator" "$f" 2>/dev/null | cut -d= -f2 | tr -d ' ')
    NAME=$(basename "$f" .conf)
    if [ "$AUTH" = "standalone" ]; then
        echo "   ⚠️  $NAME: authenticator=standalone (포트 80 충돌 가능)"
        STANDALONE_FOUND=1
    elif [ "$AUTH" = "manual" ]; then
        echo "   ℹ️  $NAME: authenticator=manual (와일드카드, 수동 갱신)"
    elif [ "$AUTH" = "nginx" ]; then
        echo "   ✅ $NAME: authenticator=nginx"
    fi
done
[ $STANDALONE_FOUND -eq 0 ] && echo "   (standalone 없음)" || true
echo ""

# 3. Dry-run 갱신 테스트
echo "3. 갱신 시뮬레이션 (certbot renew --dry-run)"
if [ "$DRY_RUN" -eq 1 ]; then
    echo "   [dry-run] certbot renew --dry-run 실행 생략"
elif sudo certbot renew --dry-run 2>&1 | tee /tmp/certbot-dryrun.log; then
    echo ""
    echo "   ✅ 모든 인증서 갱신 시뮬레이션 성공"
else
    echo ""
    echo "   ❌ 갱신 시뮬레이션 실패. /tmp/certbot-dryrun.log 확인"
fi
echo ""

# 4. 만료 예정 인증서
echo "4. 만료 30일 이내 인증서"
sudo certbot certificates 2>/dev/null | grep -A 2 "EXPIRED\|INVALID\|VALID" || echo "   (확인 완료)"
echo ""

# 5. acme-dns 의존성 점검 (legacy — 구 가비아+acme-dns 경로)
if [ "$CHECK_ACMEDNS" -eq 1 ]; then
    echo "5. [legacy] acme-dns 의존성 점검"
    if ! command -v systemctl >/dev/null 2>&1; then
        echo "   (skip: systemctl 미지원 환경)"
    else
        ACMEDNS_OK=1
        ACMEDNS_API_BIND="${ACMEDNS_API_BIND:-127.0.0.1:8053}"
        ACMEDNS_CREDENTIALS="${ACMEDNS_CREDENTIALS:-/etc/letsencrypt/acmedns.json}"

        if systemctl is-active --quiet acme-dns.service 2>/dev/null; then
            echo "   ✅ acme-dns systemd active"
        else
            echo "   ❌ acme-dns systemd 비활성"
            ACMEDNS_OK=0
        fi
        if command -v ss >/dev/null 2>&1; then
            if ss -ulnp 2>/dev/null | grep -q ':53 '; then
                echo "   ✅ 53/UDP listen 확인"
            else
                echo "   ❌ 53/UDP listen 미확인"
                ACMEDNS_OK=0
            fi
        fi
        if command -v curl >/dev/null 2>&1; then
            if curl -fsS --max-time 5 "http://${ACMEDNS_API_BIND}/health" >/dev/null 2>&1; then
                echo "   ✅ HTTP API /health 200 OK"
            else
                echo "   ❌ HTTP API /health 실패"
                ACMEDNS_OK=0
            fi
        fi
        if [ -f "${ACMEDNS_CREDENTIALS}" ]; then
            echo "   ✅ ${ACMEDNS_CREDENTIALS} 존재"
        else
            echo "   ⚠️  ${ACMEDNS_CREDENTIALS} 미존재"
            ACMEDNS_OK=0
        fi
        if [ "$ACMEDNS_OK" -eq 1 ]; then
            echo "   ✅ acme-dns 점검 PASS"
        else
            echo "   ❌ acme-dns 점검 FAIL"
        fi
    fi
    echo ""
else
    echo "5. acme-dns 점검 생략 (legacy, --check-acmedns 로 활성화)"
    echo ""
fi

echo "=========================================="
echo "점검 완료"
echo "=========================================="
