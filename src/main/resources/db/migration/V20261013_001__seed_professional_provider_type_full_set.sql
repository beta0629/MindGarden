-- ====================================================================
-- 전문가 유형(PROFESSIONAL_PROVIDER_TYPE) 기본 시드 10종 + 그룹 메타데이터 upsert
-- ====================================================================
-- 목적: 신규·기존 테넌트에 상담센터 선생님 유형 10종을 없을 때만 넣는다.
--       V20261012_001 이 이미 넣은 DEFAULT_COUNSELOR·PLAY_THERAPY·SPEECH_THERAPY 는
--       NOT EXISTS 로 중복 삽입하지 않는다.
-- 코드: DEFAULT_COUNSELOR(상담사,0,isDefault)
--       PLAY_THERAPY(놀이치료,10) SPEECH_THERAPY(언어치료,20) ABA_THERAPY(ABA,30)
--       ART_THERAPY(미술치료,40) MUSIC_THERAPY(음악치료,50)
--       OCCUPATIONAL_THERAPY(작업치료,60) SENSORY_INTEGRATION(감각통합치료,70)
--       COGNITIVE_THERAPY(인지학습치료,80) CLINICAL_PSYCHOLOGIST(임상심리사(심리검사),90)
--       extra_data.systemAuthorityRole = CONSULTANT. isDefault 는 상담사만 true.
-- 그룹 노출: GET /api/v1/tenant/common-codes/groups 는
--       code_group_metadata.code_type='TENANT' AND is_active=true 만 반환한다.
--       /api/v1/common-codes/groups/list 는 common_codes 의 distinct code_group 이라
--       메타데이터가 없거나 TENANT 가 아니면 코드 행만 있고 테넌트 그룹 목록에서는 빠진다.
--       5월 시드는 common_codes 만 넣었고, V20261012 가 flyway_schema_history 에
--       기록된 채 행이 없으면 재실행되지 않는다. 이 파일은 PK(group_name) 기준
--       INSERT … ON DUPLICATE KEY UPDATE 로 code_type·is_active·korean_name·설명을 맞춘다.
-- 캐시: 그룹 목록 조회는 캐시하지 않는다. tenantCodes·coreCodes 는 코드 행 캐시이며
--       온보딩 시드와 관리자 쓰기가 evict 한다. 이 SQL 은 캐시를 지우지 않는다.
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- @author CoreSolution
-- @since 2026-10-06
-- ====================================================================

INSERT INTO code_group_metadata (
    group_name, korean_name, code_type, category, description, icon, is_active, display_order
)
VALUES (
    'PROFESSIONAL_PROVIDER_TYPE',
    '전문가유형',
    'TENANT',
    'CONSULT',
    '테넌트별 전문가 유형 기본 시드(상담사·놀이치료·언어치료·ABA·미술치료·음악치료·작업치료·감각통합치료·인지학습치료·임상심리사(심리검사)). 시스템 권한은 CONSULTANT',
    'badge',
    1,
    180
)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    description = VALUES(description),
    is_active = VALUES(is_active);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'DEFAULT_COUNSELOR', '상담사', '상담사',
    '테넌트 기본 전문가 유형(상담)',
    0, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":true,"sortOrder":0}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'DEFAULT_COUNSELOR'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'PLAY_THERAPY', '놀이치료', '놀이치료',
    '전문가 유형(놀이치료) — 테넌트 공통 선택지',
    10, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":10}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'PLAY_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'SPEECH_THERAPY', '언어치료', '언어치료',
    '전문가 유형(언어치료) — 테넌트 공통 선택지',
    20, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":20}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'SPEECH_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'ABA_THERAPY', 'ABA', 'ABA',
    '전문가 유형(ABA) — 테넌트 공통 선택지',
    30, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":30}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'ABA_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'ART_THERAPY', '미술치료', '미술치료',
    '전문가 유형(미술치료) — 테넌트 공통 선택지',
    40, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":40}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'ART_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'MUSIC_THERAPY', '음악치료', '음악치료',
    '전문가 유형(음악치료) — 테넌트 공통 선택지',
    50, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":50}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'MUSIC_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'OCCUPATIONAL_THERAPY', '작업치료', '작업치료',
    '전문가 유형(작업치료) — 테넌트 공통 선택지',
    60, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":60}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'OCCUPATIONAL_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'SENSORY_INTEGRATION', '감각통합치료', '감각통합치료',
    '전문가 유형(감각통합치료) — 테넌트 공통 선택지',
    70, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":70}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'SENSORY_INTEGRATION'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'COGNITIVE_THERAPY', '인지학습치료', '인지학습치료',
    '전문가 유형(인지학습치료) — 테넌트 공통 선택지',
    80, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":80}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'COGNITIVE_THERAPY'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    sort_order, is_active, is_deleted, version, created_at, updated_at, extra_data
)
SELECT
    t.tenant_id, 'PROFESSIONAL_PROVIDER_TYPE', 'CLINICAL_PSYCHOLOGIST', '임상심리사(심리검사)', '임상심리사(심리검사)',
    '전문가 유형(임상심리사(심리검사)) — 테넌트 공통 선택지',
    90, TRUE, FALSE, 0, NOW(), NOW(),
    '{"systemAuthorityRole":"CONSULTANT","isDefault":false,"sortOrder":90}'
FROM tenants t
WHERE (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id = t.tenant_id
      AND c.code_group = 'PROFESSIONAL_PROVIDER_TYPE'
      AND c.code_value = 'CLINICAL_PSYCHOLOGIST'
      AND (c.is_deleted = 0 OR c.is_deleted IS NULL OR c.is_deleted = FALSE)
  );
