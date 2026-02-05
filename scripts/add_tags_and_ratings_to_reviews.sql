-- 후기 테이블에 tags와 ratings 컬럼 추가
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/add_tags_and_ratings_to_reviews.sql

USE core_solution;

-- tags 컬럼 추가 (JSON 형태로 저장)
ALTER TABLE homepage_reviews
ADD COLUMN tags TEXT DEFAULT NULL AFTER content;

-- ratings 컬럼 추가 (JSON 형태로 저장: 전문성, 친절도, 효과, 시설, 전반적 만족도)
ALTER TABLE homepage_reviews
ADD COLUMN ratings TEXT DEFAULT NULL AFTER tags;

-- 인덱스 추가 (통계 조회 최적화)
CREATE INDEX idx_tags ON homepage_reviews(tags(100));
CREATE INDEX idx_ratings ON homepage_reviews(ratings(100));
