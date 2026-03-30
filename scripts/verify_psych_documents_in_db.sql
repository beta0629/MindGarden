-- 심리검사 최근 업로드 목록 DB 적재 확인
-- 테이블: psych_assessment_documents (Flyway V20251217_001)
-- 실행: mysql -h <host> -u <user> -p<password> <DB_NAME> < scripts/verify_psych_documents_in_db.sql
-- 또는 SSH 접속 후: mysql -u root -p core_solution < scripts/verify_psych_documents_in_db.sql

SELECT
  id,
  tenant_id,
  assessment_type,
  status,
  original_filename,
  file_size,
  created_at,
  is_deleted
FROM psych_assessment_documents
ORDER BY created_at DESC
LIMIT 25;
