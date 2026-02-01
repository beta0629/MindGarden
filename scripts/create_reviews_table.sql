-- 후기 테이블 생성
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/create_reviews_table.sql

USE core_solution;

-- 후기 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL DEFAULT '익명',
  content MEDIUMTEXT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_approved (is_approved),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
