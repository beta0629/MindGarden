#!/usr/bin/env bash
# 운영 서버(beta74 등)에서 홈페이지 배포
#
# 전제: /var/www/homepage 에 .env 또는 .env.production 이 있고,
#      DB_HOST 는 운영 DB(개발과 동일 계정·비밀번호, 호스트만 다를 수 있음)를 가리킨다.
#
# 사용 예 (서버에서):
#   cd /var/www/homepage && bash scripts/deploy-production.sh
#
# 브랜치·경로·PM2 이름만 바꿀 때:
#   HOMEPAGE_DEPLOY_BRANCH=homepage/develop HOMEPAGE_PM2_APP=homepage bash scripts/deploy-production.sh
set -euo pipefail

APP_ROOT="${HOMEPAGE_APP_ROOT:-/var/www/homepage}"
BRANCH="${HOMEPAGE_DEPLOY_BRANCH:-homepage/develop}"
PM2_APP="${HOMEPAGE_PM2_APP:-homepage}"

cd "$APP_ROOT"

if [[ ! -f .env && ! -f .env.production && ! -f .env.local ]]; then
  echo "deploy-production: ERROR — .env / .env.production / .env.local 중 하나가 필요합니다." >&2
  echo "  예: cp .env.production.example .env.production 후 DB_HOST 등을 채웁니다." >&2
  exit 1
fi

git fetch origin "$BRANCH"
git reset --hard "origin/${BRANCH}"

npm ci
npm run build

pm2 restart "$PM2_APP" --update-env

echo "deploy-production: OK $(git rev-parse --short HEAD) branch=${BRANCH} pm2=${PM2_APP}"
