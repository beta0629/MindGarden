#!/usr/bin/env bash
# Let's Encrypt 갱신 후 nginx reload (개발/운영 공통)
# root cron 또는 systemd timer 보조용
#
# 사용 예 (crontab):
#   0 3,15 * * * /root/scripts/certbot-renew-and-reload-nginx.sh >> /var/log/certbot-renew.log 2>&1
#
# 서버 측 스케줄(참고):
#   - systemd: certbot.timer (certbot -q renew, 하루 2회)
#   - cron: /etc/cron.d/mindgarden-ssl → 본 스크립트 (매일 04:15)
#   - 갱신 시 nginx: /etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx.sh
#     (타이머 경로에서도 deploy hook이 실행되도록 운영·개발에 배치)
#
# 와일드카드(DNS-01) + 가비아 훅:
#   renewal 설정에 manual_auth_hook 이 있으면, 갱신 시 훅이 TXT 등록 유예 시간을 둠.
#   유예 내 가비아에 _acme-challenge TXT 를 넣어야 renew 가 성공함(완전 무인은 아님).

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
