-- ============================================================
-- V32: 사용자 역할 할당 테이블 생성
-- 브랜치별 권한 지원을 위한 사용자-역할 매핑 테이블
-- ============================================================

-- user_role_assignments 테이블 생성
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id VARCHAR(36) NOT NULL UNIQUE COMMENT '할당 UUID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID',
    branch_id BIGINT NULL COMMENT '브랜치 ID (NULL = 전체 브랜치)',
    effective_from DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '역할 시작일',
    effective_to DATE NULL COMMENT '역할 종료일 (NULL = 무기한)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 여부',
    assigned_by VARCHAR(100) NULL COMMENT '할당한 사용자 ID',
    assignment_reason TEXT NULL COMMENT '할당 사유',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    version BIGINT NOT NULL DEFAULT 0 COMMENT '버전 (낙관적 잠금)',
    
    -- 인덱스
    INDEX idx_user_role_user_id (user_id),
    INDEX idx_user_role_tenant_id (tenant_id),
    INDEX idx_user_role_tenant_role_id (tenant_role_id),
    INDEX idx_user_role_branch_id (branch_id),
    INDEX idx_user_role_active (is_active),
    INDEX idx_user_role_effective (effective_from, effective_to),
    
    -- 외래 키 (참조 무결성)
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_tenant_role FOREIGN KEY (tenant_role_id) 
        REFERENCES tenant_roles(tenant_role_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_branch FOREIGN KEY (branch_id) 
        REFERENCES branches(id) ON DELETE SET NULL,
    
    -- 복합 유니크 제약 조건
    -- 같은 사용자, 테넌트, 역할, 브랜치 조합은 중복 불가
    UNIQUE KEY uk_user_role_tenant_branch (user_id, tenant_id, tenant_role_id, branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 역할 할당 테이블 (브랜치별 권한 지원)';

