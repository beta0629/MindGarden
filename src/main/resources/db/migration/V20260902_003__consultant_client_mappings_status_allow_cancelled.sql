-- =============================================================================
-- V20260902_003 — consultant_client_mappings.status / payment_status VARCHAR(50)
--
-- 배경:
--   • AdminServiceImpl.terminateMapping / terminatePendingPaymentMapping 이
--     status=CANCELLED, payment_status=REJECTED|REFUNDED 를 persist 한다.
--   • 레거시 운영 DB 의 consultant_client_mappings.status 는 MySQL ENUM
--     (PENDING_PAYMENT … TERMINATED, SESSIONS_EXHAUSTED) — CANCELLED 미포함.
--     terminate 시 "Data truncated for column 'status'" (Hibernate batch UPDATE).
--   • V20260829_006 은 common_codes MAPPING_STATUS.CANCELLED 시드만 추가했고
--     테이블 status ENUM ALTER 는 수행하지 않았다.
--
-- 정책:
--   • status → VARCHAR(50) NOT NULL (엔티티 @Column length=50, schedules V20260506_001 패턴).
--     ENUM 에 CANCELLED 만 추가하는 방식보다 VARCHAR 전환(향후 상태 확장).
--   • payment_status → ENUM 이거나 VARCHAR(50) 미만이면 VARCHAR(50) NOT NULL
--     (DEFAULT 'PENDING' 유지).
--   • approved_by / assigned_by 가 VARCHAR 이며 length < 100 이면 VARCHAR(100) 확장
--     (엔티티 length=100). admin_approval_date / assigned_at (DATETIME) 은 변경 없음.
--
-- 멱등성: INFORMATION_SCHEMA 로 DATA_TYPE / CHARACTER_MAXIMUM_LENGTH 확인 후 ALTER.
-- =============================================================================

SET @dbname = DATABASE();

-- ---------------------------------------------------------------------------
-- 1. status: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'consultant_client_mappings'
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
               AND TABLE_NAME = 'consultant_client_mappings'
               AND COLUMN_NAME = 'status') = 1,
            'SELECT ''status already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE consultant_client_mappings MODIFY COLUMN status VARCHAR(50) NOT NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. payment_status: ENUM 또는 VARCHAR(50) 미만 → VARCHAR(50) NOT NULL DEFAULT ''PENDING''
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'consultant_client_mappings'
           AND COLUMN_NAME = 'payment_status') = 0,
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
               AND TABLE_NAME = 'consultant_client_mappings'
               AND COLUMN_NAME = 'payment_status') = 1,
            'SELECT ''payment_status already VARCHAR(50+) — no change'' AS info',
            'ALTER TABLE consultant_client_mappings MODIFY COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT ''PENDING'''
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 3. approved_by: VARCHAR 이며 length < 100 → VARCHAR(100)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'consultant_client_mappings'
           AND COLUMN_NAME = 'approved_by') = 0,
        'SELECT 1',
        IF(
            (SELECT CASE
                WHEN LOWER(DATA_TYPE) != 'varchar' THEN 1
                WHEN IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) >= 100 THEN 1
                ELSE 0
             END
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = @dbname
               AND TABLE_NAME = 'consultant_client_mappings'
               AND COLUMN_NAME = 'approved_by') = 1,
            'SELECT ''approved_by already VARCHAR(100+) or non-varchar — no change'' AS info',
            'ALTER TABLE consultant_client_mappings MODIFY COLUMN approved_by VARCHAR(100) NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 4. assigned_by: VARCHAR 이며 length < 100 → VARCHAR(100)
-- ---------------------------------------------------------------------------
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname
           AND TABLE_NAME = 'consultant_client_mappings'
           AND COLUMN_NAME = 'assigned_by') = 0,
        'SELECT 1',
        IF(
            (SELECT CASE
                WHEN LOWER(DATA_TYPE) != 'varchar' THEN 1
                WHEN IFNULL(CHARACTER_MAXIMUM_LENGTH, 0) >= 100 THEN 1
                ELSE 0
             END
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = @dbname
               AND TABLE_NAME = 'consultant_client_mappings'
               AND COLUMN_NAME = 'assigned_by') = 1,
            'SELECT ''assigned_by already VARCHAR(100+) or non-varchar — no change'' AS info',
            'ALTER TABLE consultant_client_mappings MODIFY COLUMN assigned_by VARCHAR(100) NULL'
        )
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5. Fallback: direct MODIFY (멱등) — H2(MODE=MySQL) 회귀 테스트·PREPARE 미지원 환경
--    §1–4 PREPARE 가 이미 적용한 MySQL 운영에서도 동일 정의 MODIFY 는 NO-OP.
-- ---------------------------------------------------------------------------
ALTER TABLE consultant_client_mappings
    MODIFY COLUMN status VARCHAR(50) NOT NULL;

ALTER TABLE consultant_client_mappings
    MODIFY COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';

ALTER TABLE consultant_client_mappings
    MODIFY COLUMN approved_by VARCHAR(100) NULL;

ALTER TABLE consultant_client_mappings
    MODIFY COLUMN assigned_by VARCHAR(100) NULL;
