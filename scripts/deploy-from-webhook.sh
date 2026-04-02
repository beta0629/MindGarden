#!/usr/bin/env bash
# 개발 서버 자동 배포 (GitHub Webhook 또는 CI SSH에서 동일 스크립트 사용)
#
# 기본 경로·브랜치는 마인드가든 개발 서버 기준. 로컬 테스트 시:
#   HOMEPAGE_APP_ROOT=/path/to/repo HOMEPAGE_DEPLOY_BRANCH=homepage/develop bash scripts/deploy-from-webhook.sh
#
# 서버 설치: 레포 루트에 두고 심볼릭 연결하거나, 내용을 복사해
#   /var/www/homepage/deploy-from-webhook.sh 로 맞춘다.
set -euo pipefail

APP_ROOT="${HOMEPAGE_APP_ROOT:-/var/www/homepage}"
BRANCH="${HOMEPAGE_DEPLOY_BRANCH:-homepage/develop}"
PM2_APP="${HOMEPAGE_PM2_APP:-homepage-dev}"

cd "$APP_ROOT"

git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"

npm ci
npm run build

pm2 restart "$PM2_APP"

echo "deploy-from-webhook: OK $(git rev-parse --short HEAD) branch=${BRANCH} pm2=${PM2_APP}"
