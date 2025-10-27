-- 내담자 메뉴 경로 업데이트
-- 실제 라우트와 일치하도록 경로 수정

-- 1. 대시보드 메뉴 추가 (대시보드가 메뉴에 없음)
UPDATE common_codes 
SET 
    code_label = '대시보드',
    code_description = '내담자 대시보드',
    extra_data = '{"icon": "bi-house", "path": "/client/dashboard", "type": "main", "hasSubMenu": false}',
    sort_order = 1,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_DASHBOARD';

-- 대시보드 메뉴가 없으면 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_DASHBOARD', '대시보드', '내담자 대시보드', 1, true, '{"icon": "bi-house", "path": "/client/dashboard", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_DASHBOARD');

-- 2. 메인 메뉴 수정 (아이콘과 설명 개선)
UPDATE common_codes 
SET 
    code_label = '내담자 기능',
    code_description = '내담자 전용 기능',
    extra_data = '{"icon": "bi-menu-button", "type": "main", "hasSubMenu": true}',
    sort_order = 2,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_MAIN';

-- 3. 스케줄 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_SCHEDULE', '나의 일정', '나의 상담 일정', 3, true, '{"icon": "bi-calendar-week", "path": "/client/schedule", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SCHEDULE');

-- 4. 메시지 메뉴 수정
UPDATE common_codes 
SET 
    code_label = '메시지',
    code_description = '상담사 메시지',
    extra_data = '{"icon": "bi-chat-dots", "path": "/client/messages", "parent": "CLIENT_MAIN", "type": "sub"}',
    sort_order = 4,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_MESSAGES';

-- 5. 결제 내역 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_PAYMENT_HISTORY', '결제 내역', '내 결제 내역 확인', 5, true, '{"icon": "bi-credit-card", "path": "/client/payment-history", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_PAYMENT_HISTORY');

-- 6. 활동 내역 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_ACTIVITY_HISTORY', '활동 내역', '나의 활동 내역', 6, true, '{"icon": "bi-activity", "path": "/client/activity-history", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_ACTIVITY_HISTORY');

-- 7. 상담 내역 수정
UPDATE common_codes 
SET 
    code_label = '상담 내역',
    code_description = '나의 상담 내역',
    extra_data = '{"icon": "bi-clock-history", "path": "/consultation-history", "parent": "CLIENT_MAIN", "type": "sub"}',
    sort_order = 7,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_HISTORY';

-- 8. 웰니스 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_WELLNESS', '웰니스', '웰니스 알림', 8, true, '{"icon": "bi-heart-pulse", "path": "/client/wellness", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_WELLNESS');

-- 9. 설정 메뉴 수정
UPDATE common_codes 
SET 
    code_label = '설정',
    code_description = '개인 설정',
    extra_data = '{"icon": "bi-gear", "path": "/client/settings", "parent": "CLIENT_MAIN", "type": "sub"}',
    sort_order = 9,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SETTINGS';

-- 10. CLIENT_CONSULTATION 메뉴 비활성화 (실제 경로가 없음)
UPDATE common_codes 
SET 
    is_active = false,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_CONSULTATION';

-- 변경사항 확인
SELECT 
    code_group,
    code_value,
    code_label,
    code_description,
    is_active,
    extra_data,
    sort_order,
    updated_at
FROM common_codes 
WHERE code_group = 'CLIENT_MENU'
ORDER BY sort_order;
