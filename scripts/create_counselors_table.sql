-- 상담사/치료사 프로필 테이블 생성
-- 실행 방법: mysql -u mindgarden_dev -p core_solution < scripts/create_counselors_table.sql

USE core_solution;

CREATE TABLE IF NOT EXISTS counselors (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '이름',
  title VARCHAR(200) COMMENT '직함/직책 (예: 원장, 수석상담사 등)',
  profile_image_url VARCHAR(1000) COMMENT '프로필 이미지 URL',
  bio MEDIUMTEXT COMMENT '약력/소개',
  specialties TEXT COMMENT '전문 분야 (쉼표로 구분)',
  education TEXT COMMENT '학력',
  certifications TEXT COMMENT '자격증',
  experience TEXT COMMENT '경력',
  display_order INT DEFAULT 0 COMMENT '표시 순서',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상담사/치료사 프로필';
