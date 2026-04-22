-- 상담일지 서버 초안(자동저장) — 확정 consultation_records 와 분리
-- @author CoreSolution
-- @since 2026-04-22

CREATE TABLE IF NOT EXISTS consultation_record_drafts (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultation_id BIGINT NOT NULL COMMENT '스케줄(상담) ID — consultation_records.consultation_id 와 동일 스코프',
    consultant_id BIGINT NOT NULL COMMENT '초안 작성 상담사 ID',
    payload_json LONGTEXT NOT NULL COMMENT '초안 JSON 페이로드',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_crd_tenant_consult_sched (tenant_id, consultation_id, consultant_id),
    INDEX idx_crd_tenant_deleted (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담일지 서버 초안(자동저장)';
