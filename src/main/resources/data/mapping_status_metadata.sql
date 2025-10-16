-- 매칭 상태 메타데이터 추가
-- mapping.js의 하드코딩된 색상/아이콘을 동적 처리로 변경

-- 1. 매칭 상태 코드그룹 메타데이터 추가
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
('MAPPING_STATUS', '매칭 상태', '상담사-내담자 매칭 상태', '🔗', '#8b5cf6', 32, true);

-- 2. 매칭 상태별 색상/아이콘 정보를 common_codes에 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, icon, color_code, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('MAPPING_STATUS', 'PENDING_PAYMENT', '결제 대기', '결제 대기 중인 매칭', '⏳', '#ffc107', true, 1, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'PAYMENT_CONFIRMED', '결제 확인', '결제가 확인된 매칭', '💰', '#17a2b8', true, 2, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'ACTIVE', '활성', '활성 상태의 매칭', '✅', '#28a745', true, 3, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'INACTIVE', '비활성', '비활성 상태의 매칭', '⏸️', '#6c757d', true, 4, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'SUSPENDED', '일시정지', '일시정지된 매칭', '⏸️', '#fd7e14', true, 5, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'TERMINATED', '종료됨', '종료된 매칭', '❌', '#dc3545', true, 6, false, 0, NOW(), NOW()),
('MAPPING_STATUS', 'SESSIONS_EXHAUSTED', '회기 소진', '회기가 모두 소진된 매칭', '🔚', '#6f42c1', true, 7, false, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    updated_at = NOW();
