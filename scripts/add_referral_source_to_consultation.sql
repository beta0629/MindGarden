-- consultation_inquiries 테이블에 referral_source 컬럼 추가
USE core_solution;

-- referral_source 컬럼이 없으면 추가
ALTER TABLE consultation_inquiries
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50) DEFAULT NULL AFTER inquiry_type;

-- 인덱스 추가 (유입경로별 통계 조회 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_referral_source ON consultation_inquiries(referral_source);
