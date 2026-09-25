#!/bin/bash
# 운영 배포 슬롯 위치의 기본값이 현재 단일 서버 값과 같은지 확인한다.
set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORKFLOW="$ROOT/.github/workflows/deploy-production.yml"

required='
MG_BACKEND_BIND_HOST="${MG_BACKEND_BIND_HOST:-127.0.0.1}"
MG_BLUE_PORT="${MG_BLUE_PORT:-8080}"
MG_GREEN_PORT="${MG_GREEN_PORT:-8081}"
MG_ACTIVE_BACKEND_FILE="${MG_ACTIVE_BACKEND_FILE:-/etc/mindgarden/active-backend}"
MG_LOCAL_DB_HOST="${MG_LOCAL_DB_HOST:-localhost}"
'

while IFS= read -r line; do
  [ -z "$line" ] && continue
  count=$(grep -F -c "$line" "$WORKFLOW")
  if [ "$count" -lt 3 ]; then
    echo "기본값 줄이 배포 스크립트 3곳에 없습니다: $line (count=$count)" >&2
    exit 1
  fi
done <<EOF
$required
EOF

unset MG_BACKEND_BIND_HOST MG_BLUE_PORT MG_GREEN_PORT MG_ACTIVE_BACKEND_FILE MG_LOCAL_DB_HOST
eval "$required"
[ "$MG_BACKEND_BIND_HOST" = "127.0.0.1" ]
[ "$MG_BLUE_PORT" = "8080" ]
[ "$MG_GREEN_PORT" = "8081" ]
[ "$MG_ACTIVE_BACKEND_FILE" = "/etc/mindgarden/active-backend" ]
[ "$MG_LOCAL_DB_HOST" = "localhost" ]

MG_BLUE_PORT=9090
MG_BACKEND_BIND_HOST=10.0.0.8
eval "$required"
[ "$MG_BLUE_PORT" = "9090" ]
[ "$MG_BACKEND_BIND_HOST" = "10.0.0.8" ]
[ "$MG_GREEN_PORT" = "8081" ]

echo "prod slot host defaults ok"
