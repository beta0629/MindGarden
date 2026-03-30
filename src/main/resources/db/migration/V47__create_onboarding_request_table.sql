-- ============================================
-- Week 3 Day 1: 온보딩 요청 테이블 생성
-- ============================================
-- 목적: 온보딩 요청을 저장하는 테이블 생성
-- 작성일: 2025-01-XX
-- ============================================

-- onboarding_request 테이블 생성
CREATE TABLE IF NOT EXISTS onboarding_request (
    -- BaseEntity 필드
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '온보딩 요청 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT '수정일시',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시 (소프트 삭제)',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL COMMENT '삭제 여부',
    version BIGINT DEFAULT 0 NOT NULL COMMENT '낙관적 잠금 버전',
    
    -- OnboardingRequest 필드
    tenant_id VARCHAR(64) NULL COMMENT '테넌트 ID (온보딩 중이면 NULL, 승인 후 업데이트)',
    tenant_name VARCHAR(120) NOT NULL COMMENT '테넌트명',
    requested_by VARCHAR(64) NOT NULL COMMENT '요청자 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, REJECTED, CANCELLED',
    risk_level VARCHAR(16) NOT NULL DEFAULT 'LOW' COMMENT '위험도: LOW, MEDIUM, HIGH',
    checklist_json TEXT NULL COMMENT '체크리스트 JSON',
    decided_by VARCHAR(64) NULL COMMENT '결정자 ID',
    decision_at VARCHAR(30) NULL COMMENT '결정일시 (ISO-8601 string)',
    decision_note TEXT NULL COMMENT '결정 노트',
    business_type VARCHAR(50) NULL COMMENT '업종 타입 (동적 카테고리 시스템 사용)',
    
    -- 인덱스
    INDEX idx_onboarding_tenant_id (tenant_id),
    INDEX idx_onboarding_status (status),
    INDEX idx_onboarding_tenant_status (tenant_id, status),
    INDEX idx_onboarding_requested_by (requested_by),
    INDEX idx_onboarding_created_at (created_at),
    INDEX idx_onboarding_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT chk_onboarding_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_onboarding_risk_level CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='온보딩 요청 테이블 - 테넌트 온보딩 요청 정보';

