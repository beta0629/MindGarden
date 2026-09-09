-- =============================================================================
-- V20260909_001 — 테넌트·온보딩 사업자·약관(merchant legal) SSOT 컬럼
--
-- 목적:
--   센터 설정「사업자·약관」·온보딩「사업자·약관」·테넌트 홈/로그인 푸터가
--   동일 레코드를 읽도록 tenants / onboarding_request 에 최소 7필드 추가.
--   LNB ADM_SETTINGS_MERCHANT_LEGAL 추가 (결제 연결 이웃).
--
-- 정책: DELETE 금지. 멱등(INFORMATION_SCHEMA + INSERT … WHERE NOT EXISTS).
-- =============================================================================

-- tenants.business_registration_number
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'business_registration_number');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_registration_number VARCHAR(20) NULL COMMENT ''사업자등록번호''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'representative_name');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN representative_name VARCHAR(100) NULL COMMENT ''대표자명''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'business_landline');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_landline VARCHAR(30) NULL COMMENT ''유선전화''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'business_address');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN business_address VARCHAR(500) NULL COMMENT ''사업장 주소''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'mail_order_report_number');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN mail_order_report_number VARCHAR(100) NULL COMMENT ''통신판매업 신고번호''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'refund_policy_text');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN refund_policy_text TEXT NULL COMMENT ''환불·취소·청약철회 안내''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'product_price_guide_text');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tenants ADD COLUMN product_price_guide_text TEXT NULL COMMENT ''상품·가격 안내''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- onboarding_request (동일 7필드)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'business_registration_number');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_registration_number VARCHAR(20) NULL COMMENT ''사업자등록번호''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'representative_name');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN representative_name VARCHAR(100) NULL COMMENT ''대표자명''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'business_landline');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_landline VARCHAR(30) NULL COMMENT ''유선전화''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'business_address');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN business_address VARCHAR(500) NULL COMMENT ''사업장 주소''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'mail_order_report_number');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN mail_order_report_number VARCHAR(100) NULL COMMENT ''통신판매업 신고번호''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'refund_policy_text');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN refund_policy_text TEXT NULL COMMENT ''환불·취소·청약철회 안내''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'onboarding_request' AND COLUMN_NAME = 'product_price_guide_text');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE onboarding_request ADD COLUMN product_price_guide_text TEXT NULL COMMENT ''상품·가격 안내''',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- LNB: 시스템·설정 하위 「사업자·약관」 (결제 연결 바로 앞)
INSERT INTO menus (
    menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
    required_role, min_required_role, is_admin_only, menu_location, icon,
    sort_order, is_active, description, created_at, updated_at
)
SELECT
    'ADM_SETTINGS_MERCHANT_LEGAL',
    '사업자·약관',
    'Merchant Legal',
    '/tenant/merchant-legal',
    (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
    1,
    'STAFF',
    'STAFF',
    1,
    'ADMIN_ONLY',
    'FileText',
    6,
    1,
    '사업자·약관 (센터 공개 푸터·PG 전 보완)',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_MERCHANT_LEGAL');

UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_MERCHANT_LEGAL';
UPDATE menus SET sort_order = 7, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
UPDATE menus SET sort_order = 8, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_AI_PROVIDER';
UPDATE menus SET sort_order = 9, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_KAKAO_ALIMTALK';
UPDATE menus SET sort_order = 10, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_SMS';
UPDATE menus SET sort_order = 11, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TEST_NOTIFICATION';
