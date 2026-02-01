-- 개발 서버 core_solution 데이터베이스에 팝업/배너 테이블 생성
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/create_popups_banners_tables.sql

USE core_solution;

-- 팝업 테이블
CREATE TABLE IF NOT EXISTS popups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  image_url VARCHAR(1000),
  link_url VARCHAR(1000),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_datetime_range (start_datetime, end_datetime),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 배너 테이블
CREATE TABLE IF NOT EXISTS banners (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  image_url VARCHAR(1000),
  link_url VARCHAR(1000),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_datetime_range (start_datetime, end_datetime),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
