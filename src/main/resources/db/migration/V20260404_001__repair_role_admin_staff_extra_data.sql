-- ====================================================================
-- ROLE 그룹 ADMIN·STAFF extra_data 보정 (Java 문자열 매칭 토큰 누락 복구)
-- ====================================================================
-- 배경: ROLE 목록이 비어 있지 않을 때 컨트롤러는 공통코드 extra_data에
--       "isAdmin":true / "roleType":"ADMIN" 등이 없으면 enum 폴백이 스킵되던
--       경로가 있었음. 애플리케이션 폴백과 병행해 DB를 표준 JSON으로 맞춘다.
-- 표준: V20260331_002__ensure_global_four_role_common_codes.sql 와 동일.
-- 대상: 모든 tenant_id (NULL 포함), 소프트삭제되지 않은 행만.
-- ====================================================================

UPDATE common_codes
SET
    extra_data = '{"isAdmin":true,"roleType":"ADMIN","isDefault":true}',
    updated_at = NOW()
WHERE code_group = 'ROLE'
  AND code_value = 'ADMIN'
  AND (is_deleted = FALSE OR is_deleted IS NULL)
  AND (
    extra_data IS NULL
    OR (
      extra_data NOT LIKE '%"isAdmin":true%'
      AND extra_data NOT LIKE '%"roleType":"ADMIN"%'
    )
  );

UPDATE common_codes
SET
    extra_data = '{"isAdmin":false,"isStaff":true,"roleType":"STAFF","isDefault":true}',
    updated_at = NOW()
WHERE code_group = 'ROLE'
  AND code_value = 'STAFF'
  AND (is_deleted = FALSE OR is_deleted IS NULL)
  AND (
    extra_data IS NULL
    OR (
      extra_data NOT LIKE '%"isStaff":true%'
      AND extra_data NOT LIKE '%"roleType":"STAFF"%'
    )
  );
