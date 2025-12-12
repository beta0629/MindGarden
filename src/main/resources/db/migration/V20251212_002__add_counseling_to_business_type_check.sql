-- V20251212_002: tenants 테이블 business_type 체크 제약 조건에 COUNSELING 추가
-- 목적: COUNSELING 업종 지원을 위한 체크 제약 조건 수정

ALTER TABLE tenants
DROP CHECK chk_business_type;

ALTER TABLE tenants
ADD CONSTRAINT chk_business_type CHECK (business_type IN ('CONSULTATION', 'ACADEMY', 'FOOD_SERVICE', 'RETAIL', 'SERVICE', 'COUNSELING'));

