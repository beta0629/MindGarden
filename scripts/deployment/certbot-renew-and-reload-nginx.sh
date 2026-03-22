#!/usr/bin/env bash
# Let's Encrypt 갱신 후 nginx reload (개발/운영 공통)
# root cron 또는 systemd timer 보조용
#
# 사용 예 (crontab):
#   0 3,15 * * * /root/scripts/certbot-renew-and-reload-nginx.sh >> /var/log/certbot-renew.log 2>&1
#
# 주의: --manual-auth-hook + 가비아 수동 DNS 로 발급한 인증서(와일드카드 등)는
#       renew 시에도 TXT 챌린지가 필요해 자동 갱신이 실패할 수 있음.
#       그 경우 DNS API 전환 또는 갱신 시 수동 개입 필요.

set -euo pipefail

LOG_TAG="[certbot-renew]"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "$LOG_TAG root 로 실행하세요." >&2
  exit 1
fi

# certbot renew: 만료 30일 전부터 갱신 시도
# --deploy-hook: 실제로 갱신된 경우에만 실행됨
if certbot renew \
  --quiet \
  --no-random-sleep-on-renew \
  --deploy-hook "systemctl reload nginx"; then
  echo "$(date -Is) $LOG_TAG renew 완료 (또는 갱신 대상 없음)"
else
  echo "$(date -Is) $LOG_TAG renew 실패 — 로그: /var/log/letsencrypt/letsencrypt.log" >&2
  exit 1
fi
