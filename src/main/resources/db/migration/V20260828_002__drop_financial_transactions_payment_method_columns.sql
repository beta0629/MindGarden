-- =============================================================================
-- V20260828_002__drop_financial_transactions_payment_method_columns.sql
-- cardMerchantFeeAmount(D5) SSOT: 결제 수단은 Payment·Mapping에만 존재.
-- V20260828_001 초안에서 추가됐을 수 있는 payment_method/card_issuer 제거 (MySQL 동적 SQL).
-- =============================================================================

SET @dbname = DATABASE();
SET @tablename = 'financial_transactions';

SET @columnname = 'payment_method';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = @tablename
          AND COLUMN_NAME = @columnname
    ) > 0,
    CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN ', @columnname),
    'SELECT 1'
));
PREPARE dropIfExists FROM @preparedStatement;
EXECUTE dropIfExists;
DEALLOCATE PREPARE dropIfExists;

SET @columnname = 'card_issuer';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = @tablename
          AND COLUMN_NAME = @columnname
    ) > 0,
    CONCAT('ALTER TABLE ', @tablename, ' DROP COLUMN ', @columnname),
    'SELECT 1'
));
PREPARE dropIfExists FROM @preparedStatement;
EXECUTE dropIfExists;
DEALLOCATE PREPARE dropIfExists;
