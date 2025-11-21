-- V27: onboarding_request 테이블의 tenant_id 컬럼을 nullable로 변경
-- 온보딩 과정에서 테넌트가 아직 생성되지 않았으므로,
-- 초기에는 tenant_id가 null일 수 있도록 허용합니다.

-- 기존 인덱스 확인 및 재생성 (필요시)
-- tenant_id가 nullable이 되면 인덱스도 재생성 필요

-- tenant_id 컬럼을 NULL 허용으로 변경
ALTER TABLE onboarding_request MODIFY COLUMN tenant_id VARCHAR(64) NULL COMMENT '테넌트 ID (온보딩 중이면 NULL, 승인 후 업데이트)';

-- 인덱스 재생성 (필요시)
-- 기존 인덱스가 있다면 DROP 후 CREATE
-- ALTER TABLE onboarding_request DROP INDEX idx_onboarding_tenant_id;
-- CREATE INDEX idx_onboarding_tenant_id ON onboarding_request (tenant_id);

