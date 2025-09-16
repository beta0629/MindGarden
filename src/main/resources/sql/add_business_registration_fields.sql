-- 사업자 등록 관련 필드 추가
-- ConsultantSalaryProfile 테이블에 사업자 등록번호와 사업자명 필드 추가

ALTER TABLE consultant_salary_profiles 
ADD COLUMN business_registration_number VARCHAR(20) COMMENT '사업자 등록번호 (예: 123-45-67890)',
ADD COLUMN business_name VARCHAR(100) COMMENT '사업자명';

-- 인덱스 추가
CREATE INDEX idx_consultant_salary_business_registered ON consultant_salary_profiles(is_business_registered);
CREATE INDEX idx_consultant_salary_business_number ON consultant_salary_profiles(business_registration_number);
