-- Week 15-16: Passkey 인증 테이블 생성
-- Passkey 등록 및 인증을 위한 테이블

CREATE TABLE IF NOT EXISTS user_passkey (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    credential_id VARCHAR(255) NOT NULL UNIQUE COMMENT 'WebAuthn Credential ID (Base64 인코딩)',
    public_key TEXT NOT NULL COMMENT '공개 키 (Base64 인코딩)',
    counter BIGINT DEFAULT 0 COMMENT '리플레이 공격 방지를 위한 카운터',
    device_name VARCHAR(100) COMMENT '사용자가 지정한 기기 이름 (예: "내 iPhone", "내 노트북")',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    last_used_at TIMESTAMP NULL COMMENT '마지막 사용 일시',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'system',
    is_deleted BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_credential_id (credential_id),
    INDEX idx_user_active (user_id, is_active, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 Passkey 정보 테이블 (WebAuthn 기반)';

