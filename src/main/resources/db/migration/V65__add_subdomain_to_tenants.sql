-- ============================================
-- 테넌트 테이블에 서브도메인 필드 추가
-- 목적: 와일드카드 도메인 테스트를 위한 서브도메인 저장
-- 작성일: 2025-12-11
-- ============================================

-- tenants 테이블에 subdomain 필드 추가
ALTER TABLE tenants 
ADD COLUMN subdomain VARCHAR(100) NULL COMMENT '서브도메인 (예: mycompany.dev.core-solution.co.kr의 mycompany 부분)' AFTER tenant_id;

-- 서브도메인 유니크 인덱스 추가 (중복 방지)
CREATE UNIQUE INDEX idx_subdomain ON tenants(subdomain) WHERE subdomain IS NOT NULL AND (is_deleted IS NULL OR is_deleted = FALSE);

-- 서브도메인 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_subdomain_lookup ON tenants(subdomain) WHERE subdomain IS NOT NULL;

