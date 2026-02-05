-- consultation_inquiries 테이블에 tags 컬럼 추가
USE core_solution;

-- tags 컬럼 추가 (JSON 형태로 저장)
ALTER TABLE consultation_inquiries
ADD COLUMN tags TEXT DEFAULT NULL AFTER preferred_time;
