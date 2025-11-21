-- Phase 3: Refresh Token 저장소 테이블 생성
-- Refresh Token을 데이터베이스에 저장하여 관리
-- 테넌트별, 기기별 Refresh Token 관리 지원

CREATE TABLE IF NOT EXISTS refresh_token_store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'Refresh Token 고유 ID (UUID)',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    branch_id BIGINT COMMENT '지점 ID',
    device_id VARCHAR(100) COMMENT '기기 ID (모바일 앱 등)',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    user_agent TEXT COMMENT 'User-Agent',
    refresh_token_hash VARCHAR(255) NOT NULL COMMENT 'Refresh Token 해시값 (보안)',
    expires_at TIMESTAMP NOT NULL COMMENT '만료 시간',
    revoked BOOLEAN DEFAULT FALSE COMMENT '무효화 여부',
    revoked_at TIMESTAMP NULL COMMENT '무효화 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    
    INDEX idx_user_id (user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_token_id (token_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked (revoked),
    INDEX idx_user_tenant (user_id, tenant_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refresh Token 저장소';

-- 만료된 Refresh Token 자동 정리 (옵션)
-- 주기적으로 실행할 배치 작업에서 처리

