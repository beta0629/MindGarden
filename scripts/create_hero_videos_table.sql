-- 히어로 비디오 테이블 생성
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/create_hero_videos_table.sql

USE core_solution;

-- 히어로 비디오 테이블
CREATE TABLE IF NOT EXISTS hero_videos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  video_url VARCHAR(1000) NOT NULL,
  poster_url VARCHAR(1000),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
