#!/usr/bin/env bash
# Webhook·서버 cron이 관례적으로 호출하는 루트 엔트리포인트.
# 실제 배포 로직은 scripts/deploy-from-webhook.sh 에 단일화되어 있다.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
exec bash "$ROOT/scripts/deploy-from-webhook.sh"
