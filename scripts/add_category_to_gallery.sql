-- gallery_images 테이블에 category 컬럼 추가
USE core_solution;

-- category 컬럼 추가
ALTER TABLE gallery_images
ADD COLUMN category VARCHAR(50) DEFAULT NULL AFTER alt_text;

-- category 인덱스 추가
ALTER TABLE gallery_images
ADD INDEX idx_category (category);

-- 카테고리 목록:
-- 모래놀이실, 미술치료, 놀이치료, 언어치료, 가족상담실, 상담실, 대기실
