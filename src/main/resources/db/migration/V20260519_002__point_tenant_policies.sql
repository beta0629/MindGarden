-- P2-admin: 테넌트별 포인트·리워드 정책 키-값 (MVP)
-- @author MindGarden
-- @since 2026-05-19

CREATE TABLE IF NOT EXISTS point_tenant_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    policy_key VARCHAR(64) NOT NULL COMMENT '정책 키(earn_rate 등)',
    value_json JSON NOT NULL COMMENT '정책 값 JSON',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_point_policy_tenant_key (tenant_id, policy_key),
    KEY idx_point_policy_tenant (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 포인트·리워드 정책(MVP)';
