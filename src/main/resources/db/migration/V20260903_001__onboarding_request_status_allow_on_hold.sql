-- =============================================================================
-- V20260903_001 — onboarding_request.status VARCHAR(50), drop chk_onboarding_status
--
-- 배경:
--   • OnboardingServiceImpl 이 status=ON_HOLD / IN_REVIEW 를 persist 한다.
--   • V47 onboarding_request.status 는 VARCHAR(20) +
--     CONSTRAINT chk_onboarding_status CHECK (PENDING, APPROVED, REJECTED, CANCELLED)
--     — ON_HOLD / IN_REVIEW 미포함. persist 시 CHECK 위반 또는 truncation.
--   • Java OnboardingStatus / common_codes ONBOARDING_STATUS (V35, V20260331_003) 는
--     IN_REVIEW, ON_HOLD 를 포함한다. 이후 DROP CHECK 마이그레이션 없음.
--
-- 정책:
--   • chk_onboarding_status 존재 시 DROP (INFORMATION_SCHEMA 멱등). CHECK 재생성 금지
--     (상태 확장은 common_codes / VARCHAR SSOT).
--   • status → VARCHAR(50) NOT NULL DEFAULT 'PENDING' (V47 DEFAULT 유지, 엔티티 length=50).
--   • risk_level CHECK(chk_onboarding_risk_level) 는 정렬되어 있으므로 유지.
--
-- 멱등성: INFORMATION_SCHEMA 로 CONSTRAINT / DATA_TYPE / CHARACTER_MAXIMUM_LENGTH 확인 후 ALTER.
--
-- ※ H2(MODE=MySQL) 회귀 테스트는 PREPARE 미지원 → 테스트 헬퍼
--   applyH2FallbackIfNeeded() 가 DROP CONSTRAINT / MODIFY 를 직접 실행한다.
--   (MySQL 은 DROP CONSTRAINT IF EXISTS 미지원 — 마이그레이션 JAR 에 H2 fallback 금지)
-- =============================================================================

SET @dbname = DATABASE();

-- ---------------------------------------------------------------------------
-- 1. chk_onboarding_status: 존재 시 DROP CHECK (재생성하지 않음)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'onboarding_request') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'onboarding_request'
           AND CONSTRAINT_NAME = 'chk_onboarding_status'
           AND CONSTRAINT_TYPE = 'CHECK') = 0,
        'SELECT ''chk_onboarding_status absent — no change'' AS info',
        'ALTER TABLE onboarding_request DROP CHECK chk_onboarding_status'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. status: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL DEFAULT ''PENDING''
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'onboarding_request') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'onboarding_request'
           AND COLUMN_NAME = 'status') = 0,
        'SELECT 1',
        IF(
            (SELECT CASE
                WHEN LOWER(DATA_TYPE) = 'enum' THEN 0
                WHEN LOWER(DATA_TYPE) = 'varchar'
                     AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) >= 50 THEN 1
                ELSE 0
             END
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = @dbname
               AND TABLE_NAME = 'onboarding_request'
               AND COLUMN_NAME = 'status') = 1,
            'SELECT ''status already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE onboarding_request MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT ''PENDING'''
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
