#!/bin/bash

# SSL 인증서 자동 갱신 설정 점검 및 수정 스크립트
# 개발/운영 서버에서 실행
# 사용법: sudo ./ensure-auto-renewal.sh [dev|prod]

set -e

MODE="${1:-dev}"

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
if sudo certbot renew --dry-run 2>&1 | tee /tmp/certbot-dryrun.log; then
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

echo "=========================================="
echo "점검 완료"
echo "=========================================="
echo ""
echo "standalone인 도메인은 다음으로 nginx 플러그인으로 재발급:"
echo "  sudo certbot certonly --nginx -d <도메인> --force-renewal --non-interactive --agree-tos -m admin@core-solution.co.kr"
echo "  sudo systemctl reload nginx"
echo ""
