#!/bin/bash
# Prune nginx rotated logs only (mtime >7d). Never deletes active single *.log.
# Deploy: /root/scripts/ops/prune-old-logs.sh — cron: /etc/cron.d/mg-prune-nginx-logs
set -u
find /var/log/nginx -type f \( -name '*.gz' -o -name '*.log.*' \) -mtime +7 -delete 2>/dev/null || true
