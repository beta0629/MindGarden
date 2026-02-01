-- consultation_inquiries 테이블에 referral_source 컬럼 추가
USE core_solution;

-- referral_source 컬럼 추가 (이미 존재하면 에러 발생하지만 무시 가능)
ALTER TABLE consultation_inquiries
ADD COLUMN referral_source VARCHAR(50) DEFAULT NULL AFTER inquiry_type;

-- 인덱스 추가 (유입경로별 통계 조회 시 성능 향상)
CREATE INDEX idx_referral_source ON consultation_inquiries(referral_source);
