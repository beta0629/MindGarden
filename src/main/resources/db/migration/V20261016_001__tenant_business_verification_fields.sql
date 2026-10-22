-- =============================================================================
-- tenants / onboarding_request — 국세청 사업자 진위·상태 확인 결과 컬럼
--
-- 배경: checklist_json·settings_json 에만 있던 확인 결과를 컬럼으로 기록해
--   관리자 재확인·온보딩 게이트·승인 시 테넌트 복사를 안정화한다.
-- 호환성:
--   - ADD COLUMN NULL — 기존 행은 NULL. 데이터 UPDATE/DELETE·백필 없음.
--   - opening_date 는 신규 신청에만 애플리케이션이 채운다.
-- 멱등 패턴: INFORMATION_SCHEMA 가드 (V20260930_002 동일). 재실행 NO-OP.
-- @author MindGarden
-- @since 2026-10-14
-- =============================================================================

SET @dbname = DATABASE();

-- ---------- tenants ----------
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'tenants'
       AND COLUMN_NAME = 'business_verification_status'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_verification_status VARCHAR(32) NULL COMMENT ''국세청 진위·상태 종합(MATCH/MISMATCH/UNCONFIRMED/UNREGISTERED/CLOSED/SUSPENDED)''',
    'SELECT ''tenants.business_verification_status already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'tenants'
       AND COLUMN_NAME = 'business_verified_at'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_verified_at DATETIME(6) NULL COMMENT ''국세청 사업자 확인 시각''',
    'SELECT ''tenants.business_verified_at already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'tenants'
       AND COLUMN_NAME = 'business_verification_result_code'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_verification_result_code VARCHAR(64) NULL COMMENT ''국세청 b_stt_cd·valid 등 결과 코드''',
    'SELECT ''tenants.business_verification_result_code already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'tenants'
       AND COLUMN_NAME = 'opening_date'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN opening_date DATE NULL COMMENT ''사업자 개업일자(신규 저장만)''',
    'SELECT ''tenants.opening_date already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

-- ---------- onboarding_request ----------
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'onboarding_request'
       AND COLUMN_NAME = 'business_verification_status'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_verification_status VARCHAR(32) NULL COMMENT ''국세청 진위·상태 종합(MATCH/MISMATCH/UNCONFIRMED/UNREGISTERED/CLOSED/SUSPENDED)''',
    'SELECT ''onboarding_request.business_verification_status already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'onboarding_request'
       AND COLUMN_NAME = 'business_verified_at'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_verified_at DATETIME(6) NULL COMMENT ''국세청 사업자 확인 시각''',
    'SELECT ''onboarding_request.business_verified_at already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'onboarding_request'
       AND COLUMN_NAME = 'business_verification_result_code'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_verification_result_code VARCHAR(64) NULL COMMENT ''국세청 b_stt_cd·valid 등 결과 코드''',
    'SELECT ''onboarding_request.business_verification_result_code already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'onboarding_request'
       AND COLUMN_NAME = 'opening_date'
);
SET @col_sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN opening_date DATE NULL COMMENT ''사업자 개업일자(신규 신청만)''',
    'SELECT ''onboarding_request.opening_date already exists'''
);
PREPARE stmt_col FROM @col_sql; EXECUTE stmt_col; DEALLOCATE PREPARE stmt_col;
