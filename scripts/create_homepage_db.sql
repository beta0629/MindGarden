-- 홈페이지 전용 데이터베이스 생성 스크립트
-- 데이터베이스: mindgarden_homepage
-- 사용자: homepage_user

USE mindgarden_homepage;

-- 블로그 포스트 테이블
CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  thumbnail_image_url VARCHAR(1000),
  status ENUM('draft', 'published') DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_homepage_only BOOLEAN DEFAULT TRUE,
  INDEX idx_status (status),
  INDEX idx_published_at (published_at),
  INDEX idx_created_at (created_at),
  INDEX idx_is_homepage_only (is_homepage_only)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 블로그 이미지 테이블 (블로그 포스트에 연결된 이미지)
CREATE TABLE IF NOT EXISTS blog_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 갤러리 이미지 테이블 (홈페이지 갤러리)
CREATE TABLE IF NOT EXISTS gallery_images (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 상담 문의 테이블
CREATE TABLE IF NOT EXISTS consultation_inquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  preferred_contact_method ENUM('phone', 'email', 'both') DEFAULT 'phone',
  inquiry_type VARCHAR(50) DEFAULT 'general',
  message TEXT,
  preferred_date DATE,
  preferred_time TIME,
  status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

