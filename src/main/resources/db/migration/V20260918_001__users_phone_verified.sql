-- =============================================================================
-- V20260918_001 — users 휴대폰 소유 확인(SSOT) 컬럼
--
-- 목적:
--   결제(PortOne) 게이트는 "번호 문자열 존재"가 아니라 OTP 소유 확인 완료
--   (is_phone_verified) 를 요구한다. SNS OAuth 휴대폰 claim ≠ 검증으로 취급하지 않음.
--
-- 정책: DELETE 금지. 멱등(INFORMATION_SCHEMA).
-- =============================================================================

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_phone_verified');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT ''휴대폰 OTP 소유 확인 여부''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_verified_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN phone_verified_at DATETIME NULL COMMENT ''휴대폰 OTP 소유 확인 시각''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
