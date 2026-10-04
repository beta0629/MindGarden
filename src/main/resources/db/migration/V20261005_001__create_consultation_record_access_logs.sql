-- 상담일지 열람 감사 로그 (append-only, INSERT 전용).
-- personal_data_access_logs 는 개인정보 요청·파기 흐름 전용이라 역할(actor_role)·본문/메타 구분 컬럼이 없어
-- 상담일지 열람 감사는 형제 테이블로 분리한다. 기존 테이블·행은 건드리지 않는다.
-- 재실행 안전: CREATE TABLE IF NOT EXISTS 만 사용하며 데이터 UPDATE/DELETE 없음.
-- @author CoreSolution
-- @since 2026-10-05

CREATE TABLE IF NOT EXISTS consultation_record_access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    record_id BIGINT NULL COMMENT '대상 상담일지 ID(목록 조회 등 단건이 아니면 NULL)',
    record_kind VARCHAR(40) NOT NULL DEFAULT 'CONSULTATION_RECORD' COMMENT '대상 종류(CONSULTATION_RECORD/INSTITUTION_LINK_LOG/CLINICAL_REPORT)',
    client_id BIGINT NULL COMMENT '대상 내담자 users.id',
    author_consultant_id BIGINT NULL COMMENT '일지 작성 상담사 users.id',
    actor_id BIGINT NULL COMMENT '열람 시도자 users.id',
    actor_role VARCHAR(40) NULL COMMENT '열람 시도자 역할',
    action VARCHAR(20) NOT NULL COMMENT 'VIEW/LIST/AI_GENERATE/EXPORT',
    result VARCHAR(20) NOT NULL COMMENT 'ALLOWED/DENIED',
    denial_reason VARCHAR(255) NULL COMMENT '거부 사유(본문 미포함)',
    ip_hash VARCHAR(64) NULL COMMENT 'IP SHA-256 해시(원본 미저장)',
    user_agent_hash VARCHAR(64) NULL COMMENT 'User-Agent SHA-256 해시(원본 미저장)',
    accessed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '열람 시각',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    KEY idx_cral_tenant_accessed (tenant_id, accessed_at),
    KEY idx_cral_tenant_record (tenant_id, record_id, accessed_at),
    KEY idx_cral_tenant_actor (tenant_id, actor_id, accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담일지 열람 감사 로그(append-only)';
