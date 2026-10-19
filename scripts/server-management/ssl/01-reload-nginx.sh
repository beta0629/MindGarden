#!/bin/bash
# Let's Encrypt deploy hook: 갱신 성공 시 nginx reload
# 설치 경로: /etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx.sh
# ensure-auto-renewal.sh 가 서버에 설치함.
set -euo pipefail
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi
