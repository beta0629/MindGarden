-- =============================================================================
-- V20260829_003 — salary preview/confirm parity (SEED ONLY)
--
-- 배경 (prod deploy run 2069):
--   • 원본 마이그에 DELIMITER + DROP/CREATE PROCEDURE (CalculateSalaryPreview L69,
--     ProcessIntegratedSalaryCalculation L425) 가 포함되어 있었음.
--   • 앱 Flyway 계정(mindgarden) 은 DEFINER/SYSTEM_USER 프로시저에 대해
--     DROP PROCEDURE 시 MySQL ERROR 1227 (SYSTEM_USER access denied) 발생.
--   • 동일 패턴 선례: V20260607_002__special_support_payout_lifetime_unique.sql
--     (2026-06-01 운영 1227 → DROP/CREATE 제거, ALTER/seed 만 유지).
--
-- 본 파일 범위:
--   • SALARY_TAX_RATE code_group_metadata + WITHHOLDING_NATIONAL(0.03) /
--     WITHHOLDING_LOCAL(0.003) common_codes 시드만 유지 (멱등 INSERT).
--   • 결합 세율 0.033 하드코딩 금지 — 국세·지방세 분리 코드만 시드.
--   • DROP/CREATE/DELIMITER 전부 제거. V20260511/V20260512 히스토리 마이그 수정 금지.
--
-- SP SSOT (프로시저 본문은 여기 두지 않음):
--   • database/schema/procedures_standardized/CalculateSalaryPreview_standardized.sql
--   • database/schema/procedures_standardized/ProcessIntegratedSalaryCalculation_standardized.sql
--   • 배포: deploy-production 프로시저 단계 / PRODUCTION_DB_PROCEDURE_USER
--     (run 2069 에서 이미 성공 적용됨).
--
-- 운영 repair (1회):
--   • flyway_schema_history 의 version `20260829.003` (또는 script LIKE '%V20260829_003%')
--     이고 success=0 인 실패 행만 DELETE 후, 본 seed-only 스크립트가 재적용되어야 함.
--   • success=1 행은 절대 삭제하지 않음. INSERT 는 멱등이므로 재적용 안전.
--   • 가드된 원샷: .github/workflows/deploy-production.yml 블루그린 비활성 슬롯
--     systemctl restart 직전 블록 참고.
-- =============================================================================

-- =====================================================
-- common_codes: SALARY_TAX_RATE (WITHHOLDING_NATIONAL 3% / WITHHOLDING_LOCAL 0.3%)
-- Runtime SSOT for Preview + Confirm; fail closed if missing/<=0
-- Minimal core seed only (원천 2코드). Coexists with later V005 via NOT EXISTS.
-- =====================================================
INSERT INTO code_group_metadata (
    group_name, korean_name, code_type, category, description, icon, is_active, display_order
)
VALUES (
    'SALARY_TAX_RATE',
    '급여 세율·보험요율',
    'SYSTEM',
    'FINANCE',
    '급여 Confirm/Preview SP 및 Java 원천세 계산 SSOT. extra_data.rate',
    'percent',
    1,
    160
)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    description = VALUES(description),
    is_active = TRUE;

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'WITHHOLDING_NATIONAL', '원천징수 국세', '원천징수 국세',
       '프리랜서 사업소득 원천징수 국세 3%', '{"rate": 0.03}', 1, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'WITHHOLDING_NATIONAL'
);

INSERT INTO common_codes (
    tenant_id, code_group, code_value, code_label, korean_name, code_description,
    extra_data, sort_order, is_active, created_at, updated_at, is_deleted, version
)
SELECT NULL, 'SALARY_TAX_RATE', 'WITHHOLDING_LOCAL', '원천징수 지방세', '원천징수 지방세',
       '프리랜서 사업소득 원천징수 지방세 0.3%', '{"rate": 0.003}', 2, TRUE, NOW(), NOW(), FALSE, 0
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes c
    WHERE c.tenant_id IS NULL AND c.code_group = 'SALARY_TAX_RATE' AND c.code_value = 'WITHHOLDING_LOCAL'
);
