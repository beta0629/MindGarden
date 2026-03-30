-- =====================================================
-- 보안 감사 로그 테이블 생성
-- 작성일: 2025-12-02
-- 설명: 보안 표준화 - 보안 이벤트 감사 로그
-- =====================================================

-- 1. 보안 감사 로그 테이블
CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    event_type VARCHAR(50) NOT NULL COMMENT '이벤트 타입',
    user_id BIGINT COMMENT '사용자 ID',
    user_email VARCHAR(255) COMMENT '사용자 이메일',
    ip_address VARCHAR(50) COMMENT 'IP 주소',
    user_agent TEXT COMMENT 'User Agent',
    event_details JSON COMMENT '이벤트 상세 정보',
    result VARCHAR(20) NOT NULL COMMENT '결과: SUCCESS, FAILED',
    error_message TEXT COMMENT '오류 메시지',
    execution_time BIGINT COMMENT '실행 시간 (ms)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_result (result),
    INDEX idx_created_at (created_at),
    INDEX idx_tenant_event_date (tenant_id, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 감사 로그 테이블';

-- 2. 보안 키 메타데이터 테이블
CREATE TABLE IF NOT EXISTS security_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_type VARCHAR(50) NOT NULL COMMENT '키 타입: JWT_SECRET, ENCRYPTION_KEY, API_KEY',
    key_id VARCHAR(50) UNIQUE NOT NULL COMMENT '키 ID',
    key_version INT NOT NULL COMMENT '키 버전',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    last_rotation_date TIMESTAMP NOT NULL COMMENT '마지막 로테이션 날짜',
    next_rotation_date TIMESTAMP NOT NULL COMMENT '다음 로테이션 예정일',
    rotation_period_days INT NOT NULL COMMENT '로테이션 주기 (일)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    INDEX idx_key_type (key_type),
    INDEX idx_is_active (is_active),
    INDEX idx_next_rotation_date (next_rotation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 키 메타데이터 테이블';

-- 3. 초기 키 메타데이터 (JWT, 암호화 키)
INSERT INTO security_keys (key_type, key_id, key_version, is_active, last_rotation_date, next_rotation_date, rotation_period_days)
VALUES 
('JWT_SECRET', 'jwt-key-001', 1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 90),
('ENCRYPTION_KEY', 'enc-key-001', 1, TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 180 DAY), 180)
ON DUPLICATE KEY UPDATE key_id = key_id;

