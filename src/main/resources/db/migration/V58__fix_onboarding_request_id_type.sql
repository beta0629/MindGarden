-- ============================================
-- Fix onboarding_request id column type
-- ============================================
-- 목적: onboarding_request 테이블의 id 컬럼을 binary(16)에서 BIGINT로 변경
-- 작성일: 2025-11-30
-- ============================================

-- 기존 데이터 백업 (필요시)
-- CREATE TABLE onboarding_request_backup AS SELECT * FROM onboarding_request;

-- id 컬럼 타입 변경
ALTER TABLE onboarding_request 
MODIFY COLUMN id BIGINT AUTO_INCREMENT;

