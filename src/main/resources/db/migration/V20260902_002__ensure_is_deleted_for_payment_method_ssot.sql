-- =============================================================================
-- V20260902_002 — Ensure is_deleted + re-apply section C payment_method UPDATEs
--
-- Covers envs where V20260902_001 was marked applied but section C never
-- completed (missing is_deleted), and envs that applied V001 before the
-- multi-table is_deleted guards were added.
-- Idempotent: ADD COLUMN no-ops if column/table already present; UPDATEs only
-- touch remaining legacy CARD/TRANSFER values.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Conditionally ADD COLUMN is_deleted (same tables as V20260902_001)
-- ---------------------------------------------------------------------------
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'common_codes') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'common_codes' AND COLUMN_NAME = 'is_deleted') > 0,
        'SELECT 1',
        'ALTER TABLE common_codes ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultant_client_mappings' AND COLUMN_NAME = 'is_deleted') > 0,
        'SELECT 1',
        'ALTER TABLE consultant_client_mappings ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'session_extension_requests') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'session_extension_requests' AND COLUMN_NAME = 'is_deleted') > 0,
        'SELECT 1',
        'ALTER TABLE session_extension_requests ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recurring_expenses') = 0,
    'SELECT 1',
    IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recurring_expenses' AND COLUMN_NAME = 'is_deleted') > 0,
        'SELECT 1',
        'ALTER TABLE recurring_expenses ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE'
    )
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. Re-run section C payment_method UPDATEs (idempotent)
-- ---------------------------------------------------------------------------
UPDATE consultant_client_mappings
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE consultant_client_mappings
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;

UPDATE session_extension_requests
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE session_extension_requests
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;

UPDATE recurring_expenses
SET payment_method = 'CREDIT_CARD',
    updated_at = NOW()
WHERE payment_method IN ('CARD', '카드', 'card', 'Card')
  AND is_deleted = FALSE;

UPDATE recurring_expenses
SET payment_method = 'BANK_TRANSFER',
    updated_at = NOW()
WHERE payment_method IN ('TRANSFER', 'transfer')
  AND is_deleted = FALSE;
