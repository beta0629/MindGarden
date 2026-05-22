-- =====================================================
-- V73: ROLE 공통코드(CONSULTANT/CLIENT) 중복 row 정리
-- =====================================================
-- 배경 (SOLAPI_NOTIFICATION_MISS_DEBUG.md 결함 #4):
--   dev 로그에서 "Query did not return a unique result: 2 results were returned"
--   for (code_group='ROLE', code_value IN ('CONSULTANT','CLIENT'))가 다수 발생.
--   common_codes.uk_tenant_code_group_value(tenant_id, code_group, code_value)
--   unique constraint 가 NULL-aware 가 아니거나, 과거 데이터가 constraint 적용 이전에
--   삽입되어 같은 키에 여러 row 가 남아 있다.
--
-- 전략:
--   1) 같은 (tenant_id, code_group, code_value) 조합 중복: 최소 id 한 건만 active 유지,
--      나머지 row 는 is_active=FALSE 로 비활성화 (감사 추적용으로 row 자체는 보존).
--   2) tenant_id IS NULL(core 폴백) 과 동일 (code_group, code_value)에 tenant row 가
--      이미 존재하면, NULL row 도 비활성화하여 핫스팟 그룹 ROLE 의 중복을 제거.
--   3) 본 마이그레이션은 멱등(idempotent)하다: 재실행해도 추가 부작용 없음.
--
-- 적용 범위: ROLE 그룹 + CONSULTANT/CLIENT 값으로 한정. (다른 그룹 영향 없음)
-- =====================================================

-- 1) (tenant_id, code_group, code_value) 동일 조합 중복 정리
UPDATE common_codes c1
INNER JOIN (
    SELECT
        tenant_id,
        code_group,
        code_value,
        MIN(id) AS keep_id
    FROM common_codes
    WHERE code_group = 'ROLE'
      AND code_value IN ('CONSULTANT', 'CLIENT')
      AND is_deleted = FALSE
      AND is_active = TRUE
    GROUP BY tenant_id, code_group, code_value
    HAVING COUNT(*) > 1
) dup
   ON (c1.tenant_id <=> dup.tenant_id)
  AND c1.code_group = dup.code_group
  AND c1.code_value = dup.code_value
  AND c1.id <> dup.keep_id
SET
    c1.is_active = FALSE,
    c1.updated_at = NOW();

-- 2) core 폴백(tenant_id IS NULL) 과 tenant row 동시 존재 시: NULL row 비활성화
UPDATE common_codes c1
INNER JOIN (
    SELECT DISTINCT code_group, code_value
    FROM common_codes
    WHERE code_group = 'ROLE'
      AND code_value IN ('CONSULTANT', 'CLIENT')
      AND is_deleted = FALSE
      AND is_active = TRUE
      AND tenant_id IS NOT NULL
) tenant_row
   ON c1.code_group = tenant_row.code_group
  AND c1.code_value = tenant_row.code_value
SET
    c1.is_active = FALSE,
    c1.updated_at = NOW()
WHERE c1.tenant_id IS NULL
  AND c1.code_group = 'ROLE'
  AND c1.code_value IN ('CONSULTANT', 'CLIENT')
  AND c1.is_active = TRUE
  AND c1.is_deleted = FALSE;

-- 3) 검증용 주석: 마이그레이션 후 다음 쿼리는 모든 row count <=1 이어야 한다.
--    SELECT tenant_id, code_group, code_value, COUNT(*)
--      FROM common_codes
--     WHERE code_group='ROLE' AND code_value IN ('CONSULTANT','CLIENT')
--       AND is_deleted=FALSE AND is_active=TRUE
--     GROUP BY tenant_id, code_group, code_value
--    HAVING COUNT(*) > 1;
