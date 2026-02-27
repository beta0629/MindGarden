#!/usr/bin/env bash
# 심리검사 최근 업로드 목록이 psych_assessment_documents 테이블에 실제 적재되었는지 확인
# 사용법:
#   로컬: DB_HOST=localhost DB_USER=root DB_NAME=core_solution ./scripts/verify_psych_documents_in_db.sh
#   SSH 서버에서: DB_USER=root DB_NAME=core_solution ./scripts/verify_psych_documents_in_db.sh
#   비밀번호는 실행 시 -p 입력하거나 MYSQL_PWD(비권장) 사용

set -e
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-core_solution}"
export MYSQL_PWD="${DB_PASSWORD:-}"

echo "=== psych_assessment_documents 최근 25건 (DB: $DB_NAME @ $DB_HOST:$DB_PORT) ==="
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "
SELECT
  id,
  tenant_id,
  assessment_type,
  status,
  original_filename,
  created_at,
  is_deleted
FROM psych_assessment_documents
ORDER BY created_at DESC
LIMIT 25;
"

unset MYSQL_PWD
