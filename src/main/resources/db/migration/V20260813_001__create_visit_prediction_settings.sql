-- =============================================================================
-- V20260813_001__create_visit_prediction_settings.sql
-- 방문 예측 설정 테이블
--
-- 내담자-상담사 매핑별 예측 ON/OFF 및 일시 무시(dismiss) 설정을 저장한다.
-- 메타 테이블 없이 실시간 계산 + 이 설정 테이블만으로 운영한다.
-- 운영 영향: 신규 테이블 1건. CREATE TABLE IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS visit_prediction_settings (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id             VARCHAR(36)  NOT NULL,
    mapping_id            BIGINT       NOT NULL COMMENT 'consultant_client_mappings.id 참조',
    prediction_enabled    BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '예측 활성화 여부 (false면 해당 매핑 예측 OFF)',
    dismissed_until_date  DATE         NULL     COMMENT '이 날짜(포함)까지 예상 방문 알림 무시. NULL이면 무시 없음',
    created_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at            DATETIME(6)  NULL,
    is_deleted            BOOLEAN      NOT NULL DEFAULT FALSE,
    version               BIGINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_vps_tenant_id (tenant_id),
    KEY idx_vps_tenant_mapping (tenant_id, mapping_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='방문 예측 설정 (매핑별 ON/OFF·dismiss)';
