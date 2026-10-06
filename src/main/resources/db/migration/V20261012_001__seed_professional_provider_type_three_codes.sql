-- ====================================================================
-- 전문가 유형(PROFESSIONAL_PROVIDER_TYPE) 3종 멱등 백필 + 그룹 메타데이터
-- ====================================================================
-- 목적: 기존 테넌트에 DEFAULT_COUNSELOR, PLAY_THERAPY, SPEECH_THERAPY 를
--       없을 때만 넣는다. 신규 온보딩 시드와 같은 세 코드다.
-- ABA: 기본 시드에 넣지 않는다. 추가 유형은 코드 관리 UI 에서만 등록한다.
-- 메타데이터: code_group_metadata.code_type = 'TENANT' 이어야
--       TenantCommonCodeServiceImpl.validateTenantCodeGroup 과 getTenantCodeGroups 가
--       관리자 생성·목록을 허용한다. 프론트 TENANT_CODE_GROUPS 상수만으로는 부족하다.
-- 캐시: CacheConfig 의 CacheManager 빈은 프로세스 로컬 ConcurrentMapCacheManager 이다.
--       JVM 기동 시 맵이 비어 있고, 이 명시적 빈이 spring.cache.type=redis 를 덮어쓴다.
--       따라서 배포 재시작은 마이그레이션 이전의 tenantCodes 항목을 서빙하지 않는다.
--       ConcurrentMap 은 TTL 이 없으므로 온보딩 시드와 테넌트 관리자 쓰기
--       (생성·수정·삭제·활성 토글·정렬)에서는 애플리케이션이 tenantCodes·coreCodes 를
--       별도로 evict 한다. 이 SQL 은 캐시를 지우지 않는다.
-- 표준: DATABASE_MIGRATION_STANDARD.md
-- @author CoreSolution
-- @since 2026-10-05
-- ====================================================================

INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
SELECT 'PROFESSIONAL_PROVIDER_TYPE', '전문가유형', 'TENANT', 'CONSULT', '테넌트별 전문가 유형(상담사·놀이치료·언어치료 등). ABA 등 추가 유형은 코드 관리에서 추가', 'badge', 1, 180
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM code_group_metadata WHERE group_name = 'PROFESSIONAL_PROVIDER_TYPE'
);

UPDATE code_group_metadata
SET code_type = 'TENANT', is_active = 1
WHERE group_name = 'PROFESSIONAL_PROVIDER_TYPE'
  AND (code_type IS NULL OR code_type <> 'TENANT' OR is_active = 0 OR is_active = FALSE);

INSERT INTO common_codes (
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT
    t.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'DEFAULT_COUNSELOR',
    '상담사',
    '상담사',
    '테넌트 기본 전문가 유형(상담)',
    0,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
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
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT
    t.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'PLAY_THERAPY',
    '놀이치료',
    '놀이치료',
    '전문가 유형(놀이치료) — 테넌트 공통 선택지',
    10,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
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
    tenant_id,
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    is_deleted,
    version,
    created_at,
    updated_at,
    extra_data
)
SELECT
    t.tenant_id,
    'PROFESSIONAL_PROVIDER_TYPE',
    'SPEECH_THERAPY',
    '언어치료',
    '언어치료',
    '전문가 유형(언어치료) — 테넌트 공통 선택지',
    20,
    TRUE,
    FALSE,
    0,
    NOW(),
    NOW(),
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
