-- ============================================
-- 온보딩 요청 테이블에 서브도메인 필드 추가
-- 목적: 와일드카드 도메인 테스트를 위한 서브도메인 저장
-- 작성일: 2025-12-11
-- ============================================

-- onboarding_request 테이블에 subdomain 필드 추가
ALTER TABLE onboarding_request 
ADD COLUMN subdomain VARCHAR(100) NULL COMMENT '서브도메인 (예: mycompany.dev.core-solution.co.kr의 mycompany 부분)' AFTER tenant_id;

