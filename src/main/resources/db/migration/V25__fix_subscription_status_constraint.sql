-- V25: tenant_subscriptions 테이블 status 제약조건 수정
-- DRAFT, PENDING_ACTIVATION, TERMINATED 상태 추가
-- 기존에 변경이 없으면 스킵

-- 제약조건 존재 여부 확인
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tenant_subscriptions' 
    AND CONSTRAINT_NAME = 'chk_subscription_status'
    AND CONSTRAINT_TYPE = 'CHECK'
);

-- 컬럼 기본값 변경 (이미 올바르면 변경 없음)
ALTER TABLE tenant_subscriptions 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' 
COMMENT '상태: DRAFT, PENDING_ACTIVATION, INACTIVE, ACTIVE, SUSPENDED, CANCELLED, TERMINATED';

-- 제약조건이 없는 경우에만 추가 (이미 있으면 스킵)
-- 제약조건 추가는 조건부로 실행
SET @add_constraint = IF(
    @constraint_exists = 0,
    'ALTER TABLE tenant_subscriptions ADD CONSTRAINT chk_subscription_status CHECK (status IN (''DRAFT'', ''PENDING_ACTIVATION'', ''INACTIVE'', ''ACTIVE'', ''SUSPENDED'', ''CANCELLED'', ''TERMINATED''))',
    'SELECT 1'
);
SET @stmt = @add_constraint;
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

