#!/bin/bash

# SSL 인증서 자동 갱신 설정 점검 및 수정 스크립트
# 개발/운영 서버에서 실행
# 사용법: sudo ./ensure-auto-renewal.sh [dev|prod] [--skip-acmedns] [--dry-run]
#
# Phase A (2026-05-28) 추가: acme-dns 의존성 점검 섹션 (#5)
#   설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
#   - acme-dns systemd active
#   - 53/UDP listen
#   - HTTP API /health 200
#   - /etc/letsencrypt/acmedns.json 존재 + 권한

set -e

MODE="dev"
SKIP_ACMEDNS=0
DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        dev|prod) MODE="$arg" ;;
        --skip-acmedns) SKIP_ACMEDNS=1 ;;
        --dry-run) DRY_RUN=1 ;;
        -h|--help) grep '^#' "$0" | head -15; exit 0 ;;
        *) echo "알 수 없는 옵션: $arg" >&2; exit 2 ;;
    esac
done

ACMEDNS_API_BIND="${ACMEDNS_API_BIND:-127.0.0.1:8053}"
ACMEDNS_CREDENTIALS="${ACMEDNS_CREDENTIALS:-/etc/letsencrypt/acmedns.json}"

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

# 2. 갱신 설정에서 standalone 확인 (수정 필요)
echo "2. authenticator 확인 (standalone이면 nginx로 수정 필요)"
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
    echo "   - standalone 오류 시: certbot certonly --nginx -d <도메인> --force-renewal ... 로 재발급"
fi
echo ""

# 4. 만료 예정 인증서
echo "4. 만료 30일 이내 인증서"
sudo certbot certificates 2>/dev/null | grep -A 2 "EXPIRED\|INVALID\|VALID" || echo "   (확인 완료)"
echo ""

# 5. acme-dns 의존성 점검 (Phase A 2026-05-28 추가)
echo "5. acme-dns 의존성 점검"
if [ "$SKIP_ACMEDNS" -eq 1 ]; then
    echo "   (skip: --skip-acmedns)"
elif ! command -v systemctl >/dev/null 2>&1; then
    echo "   (skip: systemctl 미지원 환경)"
else
    ACMEDNS_OK=1
    # 5a) systemd active
    if systemctl is-active --quiet acme-dns.service 2>/dev/null; then
        echo "   ✅ acme-dns systemd active"
    else
        echo "   ❌ acme-dns systemd 비활성. journalctl -u acme-dns -n 50"
        ACMEDNS_OK=0
    fi
    # 5b) 53/UDP listen
    if command -v ss >/dev/null 2>&1; then
        if ss -ulnp 2>/dev/null | grep -q ':53 '; then
            echo "   ✅ 53/UDP listen 확인"
        else
            echo "   ❌ 53/UDP listen 미확인. ss -ulnp | grep :53"
            ACMEDNS_OK=0
        fi
    else
        echo "   (skip: ss 미설치)"
    fi
    # 5c) HTTP API /health
    if command -v curl >/dev/null 2>&1; then
        if curl -fsS --max-time 5 "http://${ACMEDNS_API_BIND}/health" >/dev/null 2>&1; then
            echo "   ✅ HTTP API /health 200 OK (http://${ACMEDNS_API_BIND}/health)"
        else
            echo "   ❌ HTTP API /health 실패. curl http://${ACMEDNS_API_BIND}/health"
            ACMEDNS_OK=0
        fi
    fi
    # 5d) acmedns.json
    if [ -f "${ACMEDNS_CREDENTIALS}" ]; then
        PERM=$(stat -c '%a' "${ACMEDNS_CREDENTIALS}" 2>/dev/null || stat -f '%Lp' "${ACMEDNS_CREDENTIALS}" 2>/dev/null || echo "?")
        OWNER=$(stat -c '%U' "${ACMEDNS_CREDENTIALS}" 2>/dev/null || stat -f '%Su' "${ACMEDNS_CREDENTIALS}" 2>/dev/null || echo "?")
        if [ "$PERM" = "600" ] && [ "$OWNER" = "root" ]; then
            echo "   ✅ ${ACMEDNS_CREDENTIALS} 존재 (perm=${PERM}, owner=${OWNER})"
        else
            echo "   ⚠️  ${ACMEDNS_CREDENTIALS} 권한/소유자 비정상 (perm=${PERM}, owner=${OWNER}). 권장: 600/root"
            ACMEDNS_OK=0
        fi
    else
        echo "   ⚠️  ${ACMEDNS_CREDENTIALS} 미존재. register-acme-dns-domain.sh <domain> 으로 생성"
        ACMEDNS_OK=0
    fi
    # 5e) acme-dns-backup.timer
    if systemctl list-unit-files 2>/dev/null | grep -q 'acme-dns-backup.timer'; then
        if systemctl is-active --quiet acme-dns-backup.timer 2>/dev/null; then
            echo "   ✅ acme-dns-backup.timer active"
        else
            echo "   ⚠️  acme-dns-backup.timer 비활성. systemctl enable --now acme-dns-backup.timer"
        fi
    else
        echo "   ⚠️  acme-dns-backup.timer 미등록. config/systemd/acme-dns-backup.{service,timer} 설치 필요"
    fi
    if [ "$ACMEDNS_OK" -eq 1 ]; then
        echo "   ✅ acme-dns 의존성 점검 PASS"
    else
        echo "   ❌ acme-dns 의존성 점검 FAIL → 위 항목 조치 필요"
    fi
fi
echo ""

echo "=========================================="
echo "점검 완료"
echo "=========================================="
echo ""
echo "standalone인 도메인은 다음으로 nginx 플러그인으로 재발급:"
echo "  sudo certbot certonly --nginx -d <도메인> --force-renewal --non-interactive --agree-tos -m admin@core-solution.co.kr"
echo "  sudo systemctl reload nginx"
echo ""
