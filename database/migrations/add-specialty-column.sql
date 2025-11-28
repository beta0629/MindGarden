-- User 테이블에 specialty 컬럼 추가
ALTER TABLE users ADD COLUMN specialty VARCHAR(100) NULL COMMENT '상담사 전문분야';

-- 인덱스 추가 (전문분야 검색용)
CREATE INDEX idx_users_specialty ON users(specialty);

-- 기존 상담사들에게 기본 전문분야 설정 (선택사항)
-- UPDATE users 
-- SET specialty = '개인상담' 
-- WHERE role = 'CONSULTANT' AND specialty IS NULL;
