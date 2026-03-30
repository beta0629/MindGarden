-- 테넌트 ID 길이 확장 (36자 → 100자)
-- 표준 형식: tenant-{지역코드}-{업종코드}-{순번} (최대 100자)
-- 작성일: 2025-12-06
-- 목적: TENANT_ID_GENERATION_STANDARD.md 표준 준수

-- tenants 테이블의 tenant_id 컬럼 길이 확장
ALTER TABLE tenants 
MODIFY COLUMN tenant_id VARCHAR(100) UNIQUE NOT NULL COMMENT '테넌트 ID (표준 형식: tenant-{지역코드}-{업종코드}-{순번})';

