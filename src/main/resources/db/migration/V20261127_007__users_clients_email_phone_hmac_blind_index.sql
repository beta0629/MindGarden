-- users / clients email·phone HMAC 블라인드 인덱스 (AES-GCM 랜덤 nonce 동등검색·UNIQUE 대체)
-- Schema-only. NO plaintext / encrypt backfill in SQL — runner backfills hashes.
-- Ciphertext UK (UK_users_email_tenant, clients.email UNIQUE) no longer enforces plaintext uniqueness;
-- hash UK does. Prefer drop ciphertext email unique and rely on email_hash unique.
-- @author CoreSolution
-- @since 2026-11-27

-- ========== users ==========
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_hash') = 0,
    'ALTER TABLE users ADD COLUMN email_hash VARCHAR(64) NULL',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_hash') = 0,
    'ALTER TABLE users ADD COLUMN phone_hash VARCHAR(64) NULL',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop ciphertext email unique (GCM random nonce makes it useless / harmful)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'UK_users_email_tenant') > 0,
    'ALTER TABLE users DROP INDEX UK_users_email_tenant',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_tenant_email_hash') = 0,
    'ALTER TABLE users ADD UNIQUE KEY uk_users_tenant_email_hash (tenant_id, email_hash)',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_tenant_phone_hash') = 0,
    'ALTER TABLE users ADD KEY idx_users_tenant_phone_hash (tenant_id, phone_hash)',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== clients ==========
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'email_hash') = 0,
    'ALTER TABLE clients ADD COLUMN email_hash VARCHAR(64) NULL',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'phone_hash') = 0,
    'ALTER TABLE clients ADD COLUMN phone_hash VARCHAR(64) NULL',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop clients.email UNIQUE (JPA unique=true / InnoDB auto name). Prefer tenant+email_hash.
SET @email_uk = (
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'email'
      AND NON_UNIQUE = 0
      AND INDEX_NAME <> 'PRIMARY'
    LIMIT 1
);
SET @preparedStatement = IF(@email_uk IS NOT NULL,
    CONCAT('ALTER TABLE clients DROP INDEX `', @email_uk, '`'),
    'SELECT 1');
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clients' AND INDEX_NAME = 'uk_clients_tenant_email_hash') = 0,
    'ALTER TABLE clients ADD UNIQUE KEY uk_clients_tenant_email_hash (tenant_id, email_hash)',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clients' AND INDEX_NAME = 'idx_clients_tenant_phone_hash') = 0,
    'ALTER TABLE clients ADD KEY idx_clients_tenant_phone_hash (tenant_id, phone_hash)',
    'SELECT 1'));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
