-- 전역(tenant_id IS NULL) common_codes 중 code_group='ROLE'이고
-- code_value가 ADMIN, STAFF, CONSULTANT, CLIENT가 아닌 행만 삭제.
-- 테넌트별 common_codes(ROLE)는 업종별 PARENT 등이 있을 수 있으므로 유지.
-- ====================================================================

DELETE FROM common_codes
WHERE tenant_id IS NULL
  AND code_group = 'ROLE'
  AND code_value NOT IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT');
