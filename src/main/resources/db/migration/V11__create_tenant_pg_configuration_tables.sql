-- ============================================
-- Week 1 Day 1: 테넌트 PG 승인 시스템 테이블 생성
-- ============================================
-- 목적: 테넌트별 PG 설정 입력 및 승인 관리 시스템 구축
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

-- 1. tenant_pg_configurations 테이블 (테넌트별 PG 설정)
CREATE TABLE IF NOT EXISTS tenant_pg_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'PG 설정 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    
    -- PG사 정보
    pg_provider VARCHAR(50) NOT NULL COMMENT 'PG사: TOSS, IAMPORT, KAKAO, NAVER, PAYPAL, STRIPE',
    pg_name VARCHAR(255) COMMENT 'PG사 명칭 (커스텀)',
    
    -- PG 인증 정보 (암호화 저장)
    api_key_encrypted TEXT NOT NULL COMMENT 'API Key (암호화)',
    secret_key_encrypted TEXT NOT NULL COMMENT 'Secret Key (암호화)',
    merchant_id VARCHAR(255) COMMENT 'Merchant ID',
    store_id VARCHAR(255) COMMENT 'Store ID',
    
    -- PG 설정 정보
    webhook_url VARCHAR(500) COMMENT 'Webhook URL',
    return_url VARCHAR(500) COMMENT 'Return URL',
    cancel_url VARCHAR(500) COMMENT 'Cancel URL',
    test_mode BOOLEAN DEFAULT FALSE COMMENT '테스트 모드 여부',
    
    -- 상태 관리
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE',
    approval_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '승인 상태: PENDING, APPROVED, REJECTED',
    
    -- 승인 정보
    requested_by VARCHAR(100) COMMENT '요청자',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '요청 시각',
    approved_by VARCHAR(100) COMMENT '승인자',
    approved_at TIMESTAMP NULL COMMENT '승인 시각',
    rejection_reason TEXT COMMENT '거부 사유',
    
    -- 검증 정보
    last_connection_test_at TIMESTAMP NULL COMMENT '마지막 연결 테스트 시각',
    connection_test_result VARCHAR(20) COMMENT '연결 테스트 결과: SUCCESS, FAILED',
    connection_test_message TEXT COMMENT '연결 테스트 메시지',
    connection_test_details JSON COMMENT '연결 테스트 상세 정보 (JSON)',
    
    -- 메타데이터
    settings_json JSON COMMENT 'PG별 추가 설정 (JSON)',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_config_id (config_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_pg_provider (pg_provider),
    INDEX idx_status (status),
    INDEX idx_approval_status (approval_status),
    INDEX idx_requested_at (requested_at),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_tenant_status (tenant_id, status),
    
    -- 제약조건
    CONSTRAINT chk_tenant_pg_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_tenant_pg_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_tenant_pg_provider CHECK (pg_provider IN ('TOSS', 'IAMPORT', 'KAKAO', 'NAVER', 'PAYPAL', 'STRIPE')),
    
    -- 외래키
    CONSTRAINT fk_tenant_pg_configurations_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 PG 설정 테이블';

-- 2. tenant_pg_configuration_history 테이블 (PG 설정 변경 이력)
CREATE TABLE IF NOT EXISTS tenant_pg_configuration_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id VARCHAR(36) NOT NULL COMMENT 'PG 설정 UUID',
    
    -- 변경 정보
    change_type VARCHAR(50) NOT NULL COMMENT '변경 유형: CREATED, UPDATED, STATUS_CHANGED, APPROVED, REJECTED, ACTIVATED, DEACTIVATED',
    old_status VARCHAR(20) COMMENT '변경 전 상태',
    new_status VARCHAR(20) COMMENT '변경 후 상태',
    
    -- 변경자 정보
    changed_by VARCHAR(100) COMMENT '변경자',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '변경 시각',
    
    -- 변경 상세 정보
    change_details_json JSON COMMENT '변경 상세 정보 (JSON)',
    notes TEXT COMMENT '비고',
    
    -- 인덱스
    INDEX idx_config_id (config_id),
    INDEX idx_change_type (change_type),
    INDEX idx_changed_at (changed_at),
    INDEX idx_config_changed (config_id, changed_at),
    
    -- 외래키
    CONSTRAINT fk_tenant_pg_configuration_history_configs 
    FOREIGN KEY (config_id) REFERENCES tenant_pg_configurations(config_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 PG 설정 변경 이력 테이블';

