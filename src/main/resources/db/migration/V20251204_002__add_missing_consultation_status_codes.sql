-- V20251204_002: 상담 상태 공통코드 누락값 추가
-- ConsultationStatus.java에 정의된 NO_SHOW, RESCHEDULED 상태값 추가

-- CONSULTATION_STATUS에 누락된 상태값 추가
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'CONSULTATION_STATUS', 'NO_SHOW', '미참석', '미참석', '상담 미참석', 6, 1, 0, 0, NOW(), NOW()),
(NULL, 'CONSULTATION_STATUS', 'RESCHEDULED', '재일정', '재일정', '상담 재일정', 7, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    updated_at = NOW();

