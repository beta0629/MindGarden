-- ============================================
-- V4: onboarding_request 테이블에 brand_name 컬럼 추가
-- ============================================
-- 목적: 브랜드명을 별도 필드로 저장하여 나중에 수정 가능하도록 함
-- 작성일: 2025-12-09
-- ============================================

ALTER TABLE onboarding_request
ADD COLUMN brand_name VARCHAR(255) NULL AFTER tenant_name;

-- 기존 데이터의 checklistJson에서 brandName 추출하여 brand_name 필드에 저장
UPDATE onboarding_request
SET brand_name = JSON_UNQUOTE(JSON_EXTRACT(checklist_json, '$.brandName'))
WHERE checklist_json IS NOT NULL
  AND JSON_EXTRACT(checklist_json, '$.brandName') IS NOT NULL
  AND brand_name IS NULL;

-- brand_name이 없으면 tenant_name 사용
UPDATE onboarding_request
SET brand_name = tenant_name
WHERE brand_name IS NULL OR brand_name = '';

