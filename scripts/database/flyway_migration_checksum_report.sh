#!/bin/bash
#
# Flyway 9.x Community와 동일한 CRC32 체크섬으로 로컬 마이그레이션 목록을 출력하고,
# 선택 시 flyway_schema_history 정정용 UPDATE 제안 SQL을 출력합니다.
#
# 주의사항(필독):
# - 이력 테이블의 script/checksum만 소스 파일과 맞춘다고 해서 DB 실제 스키마가 자동으로
#   일치하지는 않습니다. 이미 적용된 마이그레이션 SQL 본문이 다르거나, 수동 변경이 있었다면
#   이력만 맞춘 뒤 validate는 통과해도 이후 Flyway·애플리케이션이 기대와 다른 스키마를
#   가정하게 되어 데이터 손상·장애가 발생할 수 있습니다.
# - 운영 반영 전: DB 전체 백업, flyway_schema_history 덤프, 스키마 diff·검증 후 신중히 적용하세요.
#
# 사용:
#   ./flyway_migration_checksum_report.sh
#   ./flyway_migration_checksum_report.sh --jar
#   ./flyway_migration_checksum_report.sh --dir /path/to/db/migration --sql-update
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${SCRIPT_DIR}/flyway_migration_checksum_lib.py"

if [[ ! -f "$PY" ]]; then
  echo "오류: ${PY} 가 없습니다." >&2
  exit 1
fi

exec python3 "$PY" "$@"
