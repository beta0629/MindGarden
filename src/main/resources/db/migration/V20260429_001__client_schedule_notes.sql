-- 통합 스케줄 — 내담자 특이사항(지속 메모). SSOT: INTEGRATED_SCHEDULE_CLIENT_NOTES_ORCHESTRATION §3
-- adminNote(입금 확인)와 별도 테이블. 소프트 삭제: deleted_at + is_deleted
-- @author CoreSolution
-- @since 2026-04-29

CREATE TABLE IF NOT EXISTS client_schedule_notes (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NULL COMMENT '내담자 FK (nullable: 스케줄만으로 앵커)',
    mapping_id BIGINT NULL COMMENT 'consultant_client_mappings.id',
    schedule_id BIGINT NULL COMMENT 'schedules.id',
    occurrence_key VARCHAR(120) NULL COMMENT '반복 일정 확장용',
    note_type VARCHAR(64) NOT NULL COMMENT '공통코드 SCHEDULE_CLIENT_NOTE_TYPE 코드값',
    title VARCHAR(300) NOT NULL,
    body TEXT NULL,
    promise_date DATE NULL,
    amount DECIMAL(19, 4) NULL,
    currency VARCHAR(10) NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_csn_tenant_client_deleted (tenant_id, client_id, is_deleted),
    INDEX idx_csn_tenant_schedule_deleted (tenant_id, schedule_id, is_deleted),
    INDEX idx_csn_tenant_mapping_deleted (tenant_id, mapping_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='통합 스케줄 맥락 내담자 특이사항(지속 메모)';

-- P5: noteType 라벨 — 공통코드 그룹 SCHEDULE_CLIENT_NOTE_TYPE
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES (
    'SCHEDULE_CLIENT_NOTE_TYPE',
    '스케줄 특이사항 유형',
    'CORE',
    'CONSULT',
    '통합 스케줄 내담자 특이사항 분류',
    '📝',
    1,
    98
)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_type = VALUES(code_type),
    category = VALUES(category),
    description = VALUES(description),
    icon = VALUES(icon),
    is_active = VALUES(is_active),
    display_order = VALUES(display_order);

INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    color_code,
    icon,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES
('SCHEDULE_CLIENT_NOTE_TYPE', 'PAYMENT_PROMISE', 'Payment promise', '입금·비용 약속', '상담비 등 수납 약속', 1, TRUE, NULL, NULL, '💳', NOW(), NOW(), FALSE, 0),
('SCHEDULE_CLIENT_NOTE_TYPE', 'ATTENDANCE', 'Attendance', '출석·노쇼', '출석 관련 메모', 2, TRUE, NULL, NULL, '📅', NOW(), NOW(), FALSE, 0),
('SCHEDULE_CLIENT_NOTE_TYPE', 'RISK', 'Risk', '위험·주의', '위험 요인·주의 사항', 3, TRUE, NULL, NULL, '⚠️', NOW(), NOW(), FALSE, 0),
('SCHEDULE_CLIENT_NOTE_TYPE', 'OTHER', 'Other', '기타', '기타 특이사항', 4, TRUE, NULL, NULL, '📋', NOW(), NOW(), FALSE, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active),
    is_deleted = VALUES(is_deleted),
    updated_at = NOW();
