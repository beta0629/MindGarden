-- 상담 알림 수신 이메일 등 키-값 설정 (어드민에서 저장)
-- 실행 예: mysql -u ... -p DB_NAME < scripts/create_homepage_settings_table.sql

CREATE TABLE IF NOT EXISTS homepage_settings (
  setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
  setting_value MEDIUMTEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
