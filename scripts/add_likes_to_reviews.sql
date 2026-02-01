-- 후기 테이블에 좋아요 수 컬럼 추가
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/add_likes_to_reviews.sql

USE core_solution;

-- 좋아요 수 컬럼 추가 (이미 있으면 에러 무시)
ALTER TABLE homepage_reviews 
ADD COLUMN like_count INT DEFAULT 0 AFTER is_approved;

-- 인덱스 추가 (인기 후기 조회 최적화) - 이미 있으면 에러 무시
CREATE INDEX idx_like_count ON homepage_reviews(like_count);
