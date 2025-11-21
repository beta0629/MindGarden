-- ============================================
-- V26: tenant_subscriptions 테이블 tenant_id nullable 변경
-- ============================================
-- 목적: 온보딩 중에는 테넌트가 없으므로 tenant_id를 nullable로 변경
-- 작성일: 2025-01-XX
-- ============================================

-- 1. 외래키 제약조건 삭제 (tenant_id를 nullable로 변경하기 전)
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tenant_subscriptions' 
    AND CONSTRAINT_NAME = 'fk_tenant_subscriptions_tenants'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @drop_fk = IF(
    @fk_exists > 0,
    'ALTER TABLE tenant_subscriptions DROP FOREIGN KEY fk_tenant_subscriptions_tenants',
    'SELECT 1'
);
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. tenant_id 컬럼을 nullable로 변경
ALTER TABLE tenant_subscriptions 
MODIFY COLUMN tenant_id VARCHAR(36) NULL 
COMMENT '테넌트 ID (온보딩 중이면 NULL, 승인 후 업데이트)';

-- 3. 외래키 제약조건 재생성 (ON DELETE SET NULL로 변경)
ALTER TABLE tenant_subscriptions 
ADD CONSTRAINT fk_tenant_subscriptions_tenants 
FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
ON DELETE SET NULL ON UPDATE CASCADE;

