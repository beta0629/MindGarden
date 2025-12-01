-- ============================================
-- Fix onboarding_request id column type
-- ============================================
-- 목적: onboarding_request 테이블의 id 컬럼을 binary(16)에서 BIGINT로 변경
-- 작성일: 2025-11-30
-- 수정일: 2025-12-01 (안전한 마이그레이션으로 변경)
-- ============================================

-- Step 1: 임시 BIGINT 컬럼 추가
ALTER TABLE onboarding_request 
ADD COLUMN id_new BIGINT AUTO_INCREMENT UNIQUE FIRST;

-- Step 2: 기존 id 컬럼의 PRIMARY KEY 제거
ALTER TABLE onboarding_request 
DROP PRIMARY KEY;

-- Step 3: 기존 binary id 컬럼 삭제
ALTER TABLE onboarding_request 
DROP COLUMN id;

-- Step 4: 새 컬럼을 id로 이름 변경하고 PRIMARY KEY 설정
ALTER TABLE onboarding_request 
CHANGE COLUMN id_new id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST;

