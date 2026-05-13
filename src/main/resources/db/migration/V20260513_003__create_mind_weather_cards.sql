-- Phase 4-A 마음 날씨 카드 (Expo MIND_WEATHER_API 정합)
-- @author MindGarden
-- @since 2026-05-13

CREATE TABLE IF NOT EXISTS mind_weather_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 users.id',
    source VARCHAR(32) NOT NULL COMMENT 'memo | mood-journal | voice',
    source_ref_id VARCHAR(128) NULL COMMENT '원본 일기/메모 참조(선택)',
    body_text TEXT NOT NULL COMMENT '분석 대상 원문',
    summary VARCHAR(2000) NOT NULL COMMENT '한 줄 요약',
    tone VARCHAR(16) NOT NULL COMMENT 'positive | negative | mixed | empty',
    keywords_json JSON NOT NULL COMMENT '키워드 배열 [{key,label,weight,polarity}]',
    share_summary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '요약·키워드 상담사 공유 동의',
    share_original TINYINT(1) NOT NULL DEFAULT 0 COMMENT '원문 공유 동의',
    share_consultant_id BIGINT NULL COMMENT '공유 대상 상담사 users.id',
    consent_updated_at DATETIME(6) NULL COMMENT '공유 동의·철회 시각',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_mwc_tenant_client_created (tenant_id, client_id, created_at DESC),
    INDEX idx_mwc_inbox (tenant_id, share_summary, share_consultant_id, created_at DESC),
    CONSTRAINT fk_mwc_client FOREIGN KEY (client_id) REFERENCES users (id),
    CONSTRAINT fk_mwc_share_consultant FOREIGN KEY (share_consultant_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='마음 날씨 분석 카드(내담자 작성·상담사 옵트인 공유)';
