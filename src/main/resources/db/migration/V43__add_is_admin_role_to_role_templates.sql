-- ============================================
-- V43: role_templates에 is_admin_role 플래그 추가
-- ============================================
-- 목적: 관리자 역할을 메타데이터로 명시적으로 관리
-- 작성일: 2025-11-24
-- 재실행·부분 적용: INFORMATION_SCHEMA 기준 DDL/데이터 단계 스킵 (Flyway/MySQL 멱등)
-- ============================================

SET @dbname = DATABASE();

-- 1. is_admin_role 컬럼 추가 (없을 때만)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'role_templates' AND COLUMN_NAME = 'is_admin_role') > 0,
    'SELECT 1',
    'ALTER TABLE role_templates ADD COLUMN is_admin_role BOOLEAN DEFAULT FALSE COMMENT ''관리자 역할 여부 (온보딩 시 관리자 계정에 할당되는 역할)'' AFTER is_system_template'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 인덱스 추가 (없을 때만)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'role_templates' AND INDEX_NAME = 'idx_is_admin_role') > 0,
    'SELECT 1',
    'CREATE INDEX idx_is_admin_role ON role_templates(is_admin_role)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 기존 데이터 업데이트 (display_order=1인 역할을 관리자 역할로 설정, 컬럼 있을 때만)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'role_templates' AND COLUMN_NAME = 'is_admin_role') > 0,
    'UPDATE role_templates SET is_admin_role = TRUE WHERE display_order = 1 AND is_active = TRUE AND is_deleted = FALSE',
    'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 주석 추가 (컬럼 있을 때만)
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'role_templates' AND COLUMN_NAME = 'is_admin_role') > 0,
    'ALTER TABLE role_templates MODIFY COLUMN is_admin_role BOOLEAN DEFAULT FALSE COMMENT ''관리자 역할 여부 (온보딩 시 관리자 계정에 할당되는 역할). TRUE인 역할이 각 업종의 관리자 역할입니다.''',
    'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
