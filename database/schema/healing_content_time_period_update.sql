-- 힐링 컨텐츠 테이블에 시간대 컬럼 추가
-- 실행 날짜: 2025-01-22
-- 목적: 힐링 컨텐츠를 오전/오후로 구분하여 저장

-- time_period 컬럼 추가
ALTER TABLE daily_healing_content 
ADD COLUMN time_period VARCHAR(20) DEFAULT 'MORNING' COMMENT '시간대: MORNING, AFTERNOON';

-- 기존 데이터에 MORNING 시간대 설정
UPDATE daily_healing_content 
SET time_period = 'MORNING' 
WHERE time_period IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_daily_healing_content_time_period 
ON daily_healing_content(content_date, user_role, category, time_period);

-- 복합 인덱스 추가 (시간대별 조회 최적화)
CREATE INDEX idx_daily_healing_content_composite 
ON daily_healing_content(content_date, user_role, category, time_period, is_active);

-- 테이블 구조 확인
DESCRIBE daily_healing_content;

-- 기존 데이터 확인
SELECT 
    content_date,
    user_role,
    category,
    time_period,
    title,
    created_at
FROM daily_healing_content 
ORDER BY content_date DESC, user_role, category, time_period
LIMIT 20;
