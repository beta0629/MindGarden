-- Expo MOOD_JOURNAL_API / SELF_ASSESSMENT_API — 내담자 웰니스 Phase 3-B
-- @author MindGarden
-- @since 2026-05-14

CREATE TABLE IF NOT EXISTS mood_journal_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 users.id',
    journal_date DATE NOT NULL COMMENT '일기 기준일(로컬)',
    mood_value TINYINT NOT NULL COMMENT '1~5 척도',
    emoji VARCHAR(16) NULL COMMENT '표시용 이모지(선택)',
    tags_json JSON NOT NULL COMMENT '감정 태그 문자열 배열',
    memo TEXT NOT NULL COMMENT '메모(길이는 애플리케이션에서 제한)',
    shared_with_consultant TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_mje_tenant_client_date (tenant_id, client_id, journal_date),
    INDEX idx_mje_tenant_client_month (tenant_id, client_id, journal_date),
    CONSTRAINT fk_mje_client FOREIGN KEY (client_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='감정 일기(테넌트·내담자별 일자 유니크)';

CREATE TABLE IF NOT EXISTS self_assessment_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    assessment_type VARCHAR(16) NOT NULL COMMENT 'PHQ9 | GAD7 | PSS',
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    template_version INT NOT NULL DEFAULT 1,
    meta_json JSON NULL COMMENT '관리자용 메타(문항 수 등, 선택)',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_sat_tenant_type_version (tenant_id, assessment_type, template_version),
    INDEX idx_sat_tenant_active (tenant_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='자가검사 템플릿(관리자 CRUD 예정, WA-3)';

CREATE TABLE IF NOT EXISTS self_assessment_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 users.id',
    assessment_type VARCHAR(16) NOT NULL COMMENT 'PHQ9 | GAD7 | PSS',
    answers_json JSON NOT NULL COMMENT '응답 배열(길이·값 범위는 서비스 검증)',
    total_score INT NOT NULL,
    interpretation_json JSON NOT NULL COMMENT '{level,severity,description}',
    shared_with_consultant TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_sas_tenant_client_created (tenant_id, client_id, created_at DESC),
    CONSTRAINT fk_sas_client FOREIGN KEY (client_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='자가검사 제출(응답은 JSON 단일 컬럼, 해석은 집계 필드+JSON)';
