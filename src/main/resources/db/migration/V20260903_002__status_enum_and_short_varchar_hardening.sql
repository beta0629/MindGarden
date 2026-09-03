-- =============================================================================
-- V20260903_002 — ENUM / short VARCHAR hardening (css / accounting / extension / payments)
--
-- 배경 (PR #783 / V20260902_003 과 동일 계열 — Java persist 값이 컬럼에 못 들어감):
--   1) css_color_settings.color_type
--      • 비-Flyway DDL(css_theme_metadata.sql): ENUM('hex','rgb','rgba','gradient')
--      • JPA ColorType STRING → HEX/RGB/RGBA/GRADIENT (대문자) → ENUM case mismatch
--   2) accounting_entries.balance_sheet_category
--      • 엔티티 length=20 이지만 LIABILITIES_LONG_TERM = 21 chars
--      • Flyway CREATE 없음(Hibernate/레거시). VARCHAR(20) 이면 truncation
--   3) session_extension_requests.status
--      • 비-Flyway ENUM. 값은 ExtensionStatus 와 정렬되어 있으나 구조적으로 #783 동형
--   4) payments.status / method / provider
--      • Flyway CREATE 없음. 엔티티 length 미지정. ENUM 또는 짧은 VARCHAR 방어
--
-- 정책:
--   • WRITE SSOT = schema. ENUM/CHECK 확장보다 VARCHAR 전환 우선.
--   • color_type → VARCHAR(20) NOT NULL 후 UPPER(color_type) 로 기존 행 정규화.
--   • balance_sheet_category / session status / payments.* → VARCHAR(50) NOT NULL.
--
-- 멱등성: INFORMATION_SCHEMA 로 table/column/DATA_TYPE/length 확인 후 ALTER.
-- =============================================================================

SET @dbname = DATABASE();

-- ---------------------------------------------------------------------------
-- 1. css_color_settings.color_type: ENUM 또는 VARCHAR(20) 미만 → VARCHAR(20) NOT NULL
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'css_color_settings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'css_color_settings'
           AND COLUMN_NAME = 'color_type') = 0,
        'SELECT 1',
        IF(
            (SELECT CASE
                WHEN LOWER(DATA_TYPE) = 'enum' THEN 0
                WHEN LOWER(DATA_TYPE) = 'varchar'
                     AND IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) >= 20 THEN 1
                ELSE 0
             END
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = @dbname
               AND TABLE_NAME = 'css_color_settings'
               AND COLUMN_NAME = 'color_type') = 1,
            'SELECT ''color_type already VARCHAR(20+) — no change'' AS info',
            'ALTER TABLE css_color_settings MODIFY COLUMN color_type VARCHAR(20) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. css_color_settings: 기존 소문자 ENUM 값 → 대문자 (JPA STRING 정렬)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'css_color_settings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'css_color_settings'
           AND COLUMN_NAME = 'color_type') = 0,
        'SELECT 1',
        'UPDATE css_color_settings SET color_type = UPPER(color_type) WHERE color_type <> UPPER(color_type)'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 3. accounting_entries.balance_sheet_category: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'accounting_entries') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'accounting_entries'
           AND COLUMN_NAME = 'balance_sheet_category') = 0,
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
               AND TABLE_NAME = 'accounting_entries'
               AND COLUMN_NAME = 'balance_sheet_category') = 1,
            'SELECT ''balance_sheet_category already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE accounting_entries MODIFY COLUMN balance_sheet_category VARCHAR(50) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 4. session_extension_requests.status: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'session_extension_requests') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'session_extension_requests'
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
               AND TABLE_NAME = 'session_extension_requests'
               AND COLUMN_NAME = 'status') = 1,
            'SELECT ''session_extension status already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE session_extension_requests MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT ''PENDING'''
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5. payments.status: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
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
               AND TABLE_NAME = 'payments'
               AND COLUMN_NAME = 'status') = 1,
            'SELECT ''payments.status already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 6. payments.method: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'method') = 0,
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
               AND TABLE_NAME = 'payments'
               AND COLUMN_NAME = 'method') = 1,
            'SELECT ''payments.method already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 7. payments.provider: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'provider') = 0,
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
               AND TABLE_NAME = 'payments'
               AND COLUMN_NAME = 'provider') = 1,
            'SELECT ''payments.provider already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE payments MODIFY COLUMN provider VARCHAR(50) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 8. Fallback (멱등·테이블 부재 안전): §1–7 과 동일 ALTER/UPDATE 를
--    INFORMATION_SCHEMA 가드로 재적용. 테이블 없으면 SELECT 1 (no-op).
--    ※ H2(MODE=MySQL) 회귀 테스트는 PREPARE 미지원 → 테스트 헬퍼
--      applyH2FallbackIfNeeded() 가 MODIFY/UPPER 를 직접 실행한다.
-- ---------------------------------------------------------------------------

-- 8a. css_color_settings.color_type → VARCHAR(20) NOT NULL
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'css_color_settings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'css_color_settings'
           AND COLUMN_NAME = 'color_type') = 0,
        'SELECT 1',
        'ALTER TABLE css_color_settings MODIFY COLUMN color_type VARCHAR(20) NOT NULL'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8b. css_color_settings UPPER(color_type)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'css_color_settings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'css_color_settings'
           AND COLUMN_NAME = 'color_type') = 0,
        'SELECT 1',
        'UPDATE css_color_settings SET color_type = UPPER(color_type) WHERE color_type <> UPPER(color_type)'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8c. accounting_entries.balance_sheet_category → VARCHAR(50) NOT NULL
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'accounting_entries') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'accounting_entries'
           AND COLUMN_NAME = 'balance_sheet_category') = 0,
        'SELECT 1',
        'ALTER TABLE accounting_entries MODIFY COLUMN balance_sheet_category VARCHAR(50) NOT NULL'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8d. session_extension_requests.status → VARCHAR(50) NOT NULL DEFAULT ''PENDING''
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'session_extension_requests') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'session_extension_requests'
           AND COLUMN_NAME = 'status') = 0,
        'SELECT 1',
        'ALTER TABLE session_extension_requests MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT ''PENDING'''
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8e. payments.status → VARCHAR(50) NOT NULL
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'status') = 0,
        'SELECT 1',
        'ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8f. payments.method → VARCHAR(50) NOT NULL
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'method') = 0,
        'SELECT 1',
        'ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) NOT NULL'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8g. payments.provider → VARCHAR(50) NOT NULL
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'payments') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'payments'
           AND COLUMN_NAME = 'provider') = 0,
        'SELECT 1',
        'ALTER TABLE payments MODIFY COLUMN provider VARCHAR(50) NOT NULL'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
