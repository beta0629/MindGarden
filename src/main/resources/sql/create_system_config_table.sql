-- 시스템 설정 테이블 생성
CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
    config_value TEXT COMMENT '설정 값',
    description VARCHAR(500) COMMENT '설정 설명',
    category VARCHAR(50) DEFAULT 'GENERAL' COMMENT '설정 카테고리',
    is_encrypted BOOLEAN DEFAULT FALSE COMMENT '암호화 여부',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 설정 테이블';

-- 기본 설정 데이터 삽입
INSERT INTO system_config (config_key, config_value, description, category, is_encrypted, created_by) VALUES
('OPENAI_API_KEY', '', 'OpenAI API 키', 'AI', TRUE, 'SYSTEM'),
('OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions', 'OpenAI API URL', 'AI', FALSE, 'SYSTEM'),
('OPENAI_MODEL', 'gpt-3.5-turbo', 'OpenAI 모델명', 'AI', FALSE, 'SYSTEM'),
('OPENAI_MAX_TOKENS', '1000', 'OpenAI 최대 토큰 수', 'AI', FALSE, 'SYSTEM'),
('OPENAI_TEMPERATURE', '0.7', 'OpenAI 창의성 설정', 'AI', FALSE, 'SYSTEM'),
('WELLNESS_AUTO_SEND_ENABLED', 'true', '웰니스 자동 발송 활성화', 'WELLNESS', FALSE, 'SYSTEM'),
('WELLNESS_SEND_TIME', '09:00', '웰니스 발송 시간', 'WELLNESS', FALSE, 'SYSTEM'),
('WELLNESS_TARGET_ROLES', 'CLIENT,ROLE_CLIENT', '웰니스 발송 대상 역할', 'WELLNESS', FALSE, 'SYSTEM')
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'SYSTEM';
