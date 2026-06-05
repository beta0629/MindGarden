-- =============================================================================
-- V20260609_001__create_session_recovery_alerts.sql
-- 회기 차감 보정 알림 테이블 — 매핑 회기 차감 누락 P1
-- 합의서: SessionDeductionRecoveryBatch 산출물 (operation #93 운영 보정 후 영구 가드)
--
-- 본 테이블: SessionDeductionRecoveryBatch 가 회기 차감 보정을 시도했으나
-- 정상 처리할 수 없는 케이스를 어드민이 인지할 수 있도록 적재한다.
-- - ACTIVE_MAPPING_NOT_FOUND: 결제 승인된 활성/입금대기 매핑이 없음
-- - REMAINING_SESSIONS_ZERO : 매핑은 있으나 잔여 회기가 0 (추가 회기 필요)
-- - MAPPING_STATUS_INVALID  : 매핑 status 가 보정 허용 외 (TERMINATED 등)
-- - UNEXPECTED_ERROR        : 차감 시도 중 예외
--
-- 운영자 흐름: 어드민 UI 에서 resolved_at IS NULL 인 알림을 조회·조치 후 resolved_at 채워 종결.
-- 운영 영향: 신규 테이블 1건만 추가 (기존 데이터 무변경). 멱등 패턴: CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS session_recovery_alerts (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id     VARCHAR(36)  NULL,
    schedule_id   BIGINT       NOT NULL,
    mapping_id    BIGINT       NULL,
    reason        VARCHAR(64)  NOT NULL,
    resolved_at   DATETIME(6)  NULL,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at    DATETIME(6)  NULL,
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    version       BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_sra_tenant (tenant_id),
    KEY idx_sra_unresolved (tenant_id, resolved_at),
    KEY idx_sra_schedule (schedule_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='회기 차감 보정 알림 — SessionDeductionRecoveryBatch 처리 불가 케이스 (#93 P1)';
