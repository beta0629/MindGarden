#!/bin/bash

# SSL 인증서 자동 갱신 설정 점검 스크립트 (오리진 서버용)
# 사용법: sudo ./ensure-auto-renewal.sh [dev|prod] [--dry-run]
#
# 전제 (2026-09-22):
#   NS는 Cloudflare로 이전 완료. 엣지 인증서는 CF Universal/ACM 자동갱신이 기본.
#   이 스크립트는 오리진 서버의 certbot 상태 + 인증서 만료/SAN/issuer를 관측한다.
#   강제 renew를 수행하지 않으며, 시크릿·자격증명을 로그에 출력하지 않는다.
#
# 분기 (SSOT: docs/runbooks/SSL_CERTIFICATE_MANAGEMENT.md):
#   A) CF Universal/ACM 자동갱신 → 오리진 점검은 참고용
#   B) CF Custom LE 업로드 → 만료 전 LE 재발급+재업로드 필요 (별도 파이프라인)
#   C) DNS-Only/오리진 직접 → certbot 자동갱신 필수
#
# [Obsolete] acme-dns 의존성 점검 (§5): NS가 가비아였을 때 사용.
#   --check-acmedns 플래그로 명시적으로 활성화할 때만 실행된다.

set -e

MODE="dev"
DRY_RUN=0
CHECK_ACMEDNS=0
for arg in "$@"; do
    case "$arg" in
        dev|prod) MODE="$arg" ;;
        --dry-run) DRY_RUN=1 ;;
        --check-acmedns) CHECK_ACMEDNS=1 ;;
        -h|--help) grep '^#' "$0" | head -17; exit 0 ;;
        *) echo "알 수 없는 옵션: $arg" >&2; exit 2 ;;
    esac
done

echo "=========================================="
echo "SSL 인증서 점검 ($MODE) — Cloudflare 전제"
echo "=========================================="
echo ""
echo "ℹ️  NS는 Cloudflare. 엣지 인증서는 CF 자동갱신이 기본."
echo "   이 점검은 오리진 서버의 certbot/인증서 상태를 관측합니다."
echo ""

# 1. certbot.timer 확인
echo "1. certbot.timer 상태"
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet certbot.timer 2>/dev/null; then
        echo "   ✅ certbot.timer 활성화됨"
        systemctl list-timers certbot.timer --no-pager 2>/dev/null || true
    else
        echo "   ⚠️  certbot.timer 비활성화됨"
        echo "   → DNS-Only 도메인이 있으면: systemctl enable --now certbot.timer"
    fi
else
    echo "   (skip: systemctl 미지원 환경)"
fi
echo ""

# 2. renewal conf 관측 (authenticator / issuer 확인, 시크릿 출력 없음)
echo "2. renewal conf 관측 (authenticator 확인)"
CERT_COUNT=0
for f in /etc/letsencrypt/renewal/*.conf; do
    [ -f "$f" ] || continue
    CERT_COUNT=$((CERT_COUNT + 1))
    AUTH=$(grep "^authenticator" "$f" 2>/dev/null | cut -d= -f2 | tr -d ' ')
    NAME=$(basename "$f" .conf)
    case "$AUTH" in
        standalone)
            echo "   ⚠️  $NAME: authenticator=standalone (포트 80 충돌 가능)"
            ;;
        manual)
            echo "   ℹ️  $NAME: authenticator=manual (와일드카드, 수동/CF 전환 검토)"
            ;;
        nginx)
            echo "   ✅ $NAME: authenticator=nginx"
            ;;
        dns-acmedns)
            echo "   ℹ️  $NAME: authenticator=dns-acmedns (Obsolete — CF 전환 검토)"
            ;;
        *)
            echo "   ℹ️  $NAME: authenticator=$AUTH"
            ;;
    esac
done
[ "$CERT_COUNT" -eq 0 ] && echo "   (renewal conf 없음)" || true
echo ""

# 3. 인증서 만료일·SAN·issuer 관측
echo "3. 인증서 만료일 / SAN / issuer 관측"
LIVE_DIR="/etc/letsencrypt/live"
if [ -d "$LIVE_DIR" ]; then
    for cert_dir in "$LIVE_DIR"/*/; do
        [ -d "$cert_dir" ] || continue
        CERT_FILE="${cert_dir}cert.pem"
        [ -f "$CERT_FILE" ] || [ -L "$CERT_FILE" ] || continue
        NAME=$(basename "$cert_dir")

        ISSUER=$(openssl x509 -in "$CERT_FILE" -noout -issuer 2>/dev/null | sed 's/^issuer=//' || echo "?")
        DATES=$(openssl x509 -in "$CERT_FILE" -noout -dates 2>/dev/null || echo "?")
        SAN=$(openssl x509 -in "$CERT_FILE" -noout -ext subjectAltName 2>/dev/null \
            | grep -oP 'DNS:[^,]+' | paste -sd', ' || echo "?")
        END_DATE=$(echo "$DATES" | grep 'notAfter' | cut -d= -f2-)

        echo "   [$NAME]"
        echo "     issuer : $ISSUER"
        echo "     만료   : $END_DATE"
        echo "     SAN    : $SAN"

        if [ -n "$END_DATE" ]; then
            END_EPOCH=$(date -d "$END_DATE" +%s 2>/dev/null || echo 0)
            NOW_EPOCH=$(date +%s)
            DAYS_LEFT=$(( (END_EPOCH - NOW_EPOCH) / 86400 ))
            if [ "$DAYS_LEFT" -lt 0 ]; then
                echo "     ❌ 만료됨 (${DAYS_LEFT}일 전)"
            elif [ "$DAYS_LEFT" -lt 14 ]; then
                echo "     ❌ CRITICAL: ${DAYS_LEFT}일 남음"
            elif [ "$DAYS_LEFT" -lt 30 ]; then
                echo "     ⚠️  ${DAYS_LEFT}일 남음"
            else
                echo "     ✅ ${DAYS_LEFT}일 남음"
            fi
        fi
        echo ""
    done
else
    echo "   ($LIVE_DIR 없음)"
fi
echo ""

# 4. dry-run 갱신 시뮬레이션 (강제 renew 아님, 시뮬레이션만)
echo "4. certbot renew --dry-run (시뮬레이션만, 실제 갱신 없음)"
if [ "$DRY_RUN" -eq 1 ]; then
    echo "   [--dry-run 플래그] certbot 시뮬레이션 생략"
elif ! command -v certbot >/dev/null 2>&1; then
    echo "   (skip: certbot 미설치)"
elif certbot renew --dry-run 2>&1 | tee /tmp/certbot-dryrun.log | tail -5; then
    echo ""
    echo "   ✅ 갱신 시뮬레이션 성공"
else
    echo ""
    echo "   ⚠️  갱신 시뮬레이션 실패. /tmp/certbot-dryrun.log 확인"
    echo "   → CF 프록시 도메인이면 오리진 certbot 실패는 정상일 수 있음"
fi
echo ""

# 5. [Obsolete] acme-dns 의존성 점검 (--check-acmedns 명시 시에만)
if [ "$CHECK_ACMEDNS" -eq 1 ]; then
    echo "5. [Obsolete] acme-dns 의존성 점검"
    echo "   ⚠️  NS가 Cloudflare로 이전되어 acme-dns는 Obsolete 경로입니다."
    echo "   → SSOT: docs/runbooks/SSL_CERTIFICATE_MANAGEMENT.md §5 참고"
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active --quiet acme-dns.service 2>/dev/null; then
            echo "   ✅ acme-dns systemd active (Obsolete — 제거 검토)"
        else
            echo "   ℹ️  acme-dns systemd 비활성 (정상: CF 전환 후 불필요)"
        fi
    fi
    echo ""
fi

echo "=========================================="
echo "점검 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "  - CF Universal/ACM 도메인 → 추가 조치 불필요"
echo "  - CF Custom LE 업로드 → LE 재발급 + CF Dashboard 재업로드"
echo "  - DNS-Only 오리진 직접 → certbot 자동갱신 확인"
echo "  - SSOT: docs/runbooks/SSL_CERTIFICATE_MANAGEMENT.md"
echo ""
