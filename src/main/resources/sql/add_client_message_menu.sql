-- 내담자 메시지 메뉴 추가
-- CLIENT_MENU 그룹에 메시지 관련 메뉴 추가

-- 내담자 메시지 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('CLIENT_MENU', 'CLIENT_MESSAGES', '상담사 메시지', '상담사로부터 받은 메시지 확인', 14, true, '{"icon": "bi-chat-dots", "path": "/client/messages", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);

-- 변경사항 확인
SELECT 
    code_group,
    code_value,
    code_label,
    is_active,
    extra_data,
    updated_at
FROM common_codes 
WHERE code_group = 'CLIENT_MENU'
ORDER BY sort_order;
