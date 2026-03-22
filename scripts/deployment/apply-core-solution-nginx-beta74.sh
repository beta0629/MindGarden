#!/usr/bin/env bash
# beta74 등 운영 서버에 core-solution nginx 반영 (로컬에서 실행)
# 사용 전: SSH 키로 root@beta74.cafe24.com 접속 가능해야 함
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONF="${REPO_ROOT}/config/nginx/core-solution-prod.conf"
REMOTE_HOST="${REMOTE_HOST:-root@beta74.cafe24.com}"
REMOTE_PATH="${REMOTE_PATH:-/etc/nginx/sites-available/core-solution}"

if [[ ! -f "$CONF" ]]; then
  echo "설정 파일 없음: $CONF" >&2
  exit 1
fi

echo "=== 로컬 템플릿 === $CONF"
echo "=== 대상 === $REMOTE_HOST:$REMOTE_PATH"
echo ""
echo "주의: sites-available/core-solution 이 다른 도메인과 합쳐진 파일이면,"
echo "      전체 덮어쓰기 전에 서버에서 백업하세요."
echo ""
read -r -p "scp 로 업로드 후 서버에서 nginx -t 할까요? (y/N) " ok
if [[ "${ok,,}" != "y" ]]; then
  echo "취소됨. 수동 명령:"
  echo "  scp \"$CONF\" ${REMOTE_HOST}:/tmp/core-solution-prod.conf"
  echo "  ssh $REMOTE_HOST 'sudo cp -a $REMOTE_PATH ${REMOTE_PATH}.bak.\$(date +%Y%m%d%H%M) && sudo cp /tmp/core-solution-prod.conf $REMOTE_PATH && sudo nginx -t && sudo systemctl reload nginx'"
  exit 0
fi

scp "$CONF" "${REMOTE_HOST}:/tmp/core-solution-prod.conf"
ssh -o BatchMode=yes "$REMOTE_HOST" "sudo cp -a $REMOTE_PATH ${REMOTE_PATH}.bak.\$(date +%Y%m%d%H%M) && sudo cp /tmp/core-solution-prod.conf $REMOTE_PATH && sudo nginx -t && sudo systemctl reload nginx"

echo "=== 완료 ==="
