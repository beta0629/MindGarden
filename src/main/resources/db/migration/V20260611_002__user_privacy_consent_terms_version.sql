-- =============================================================================
-- Apple G1.2 UGC (P2-C) — user_privacy_consent 에 terms_version 컬럼 추가
--
-- 시점: 신규 EULA(v1.0.0) 시행. 기존 row 는 NULL 로 백필되며,
--      FE 가 부팅 시 NULL/미일치 시 재동의 게이트를 띄운다.
--
-- 컬럼:
--   * terms_version VARCHAR(32) NULL — 동의 시점의 EULA 버전 (예: '1.0.0')
--
-- 멱등성:
--   * INFORMATION_SCHEMA 가드 — 컬럼 미존재 시에만 ADD
--
-- @author MindGarden
-- @since 2026-06-11
-- =============================================================================

SET @dbname = (SELECT DATABASE());

SET @add_terms_version = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'user_privacy_consent'
         AND COLUMN_NAME  = 'terms_version') = 0,
    'ALTER TABLE user_privacy_consent ADD COLUMN terms_version VARCHAR(32) NULL COMMENT ''Apple G1.2 UGC P2-C: 동의 시점 EULA 버전''',
    'SELECT ''user_privacy_consent.terms_version already present — no add'' AS info'
));
PREPARE st_terms FROM @add_terms_version;
EXECUTE st_terms;
DEALLOCATE PREPARE st_terms;

SET @add_terms_index = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = @dbname
         AND TABLE_NAME   = 'user_privacy_consent'
         AND INDEX_NAME   = 'idx_upc_user_terms_version') = 0,
    'ALTER TABLE user_privacy_consent ADD INDEX idx_upc_user_terms_version (user_id, terms_version)',
    'SELECT ''idx_upc_user_terms_version already present — no add'' AS info'
));
PREPARE st_idx FROM @add_terms_index;
EXECUTE st_idx;
DEALLOCATE PREPARE st_idx;
