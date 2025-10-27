-- 전체 역할 메뉴 업데이트
-- 실제 라우트와 일치하도록 모든 역할의 메뉴 경로 수정

-- ==========================================
-- 1. CLIENT MENU (내담자 메뉴)
-- ==========================================

-- 대시보드 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_DASHBOARD', '대시보드', '내담자 대시보드', 1, true, '{"icon": "bi-house", "path": "/client/dashboard", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_DASHBOARD');

-- 스케줄 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_SCHEDULE', '나의 일정', '나의 상담 일정', 2, true, '{"icon": "bi-calendar-week", "path": "/client/schedule", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SCHEDULE');

-- 메시지 메뉴 수정
UPDATE common_codes 
SET code_label = '메시지',
    code_description = '상담사 메시지',
    extra_data = '{"icon": "bi-chat-dots", "path": "/client/messages", "type": "main"}',
    sort_order = 3,
    is_active = true,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_MESSAGES';

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_MESSAGES', '메시지', '상담사 메시지', 3, true, '{"icon": "bi-chat-dots", "path": "/client/messages", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_MESSAGES');

-- 결제 내역 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_PAYMENT_HISTORY', '결제 내역', '내 결제 내역 확인', 4, true, '{"icon": "bi-credit-card", "path": "/client/payment-history", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_PAYMENT_HISTORY');

-- 상담 내역 메뉴 수정
UPDATE common_codes 
SET code_label = '상담 내역',
    code_description = '나의 상담 내역',
    extra_data = '{"icon": "bi-clock-history", "path": "/consultation-history", "type": "main"}',
    sort_order = 5,
    is_active = true,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_HISTORY';

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_HISTORY', '상담 내역', '나의 상담 내역', 5, true, '{"icon": "bi-clock-history", "path": "/consultation-history", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_HISTORY');

-- 웰니스 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_WELLNESS', '웰니스', '웰니스 알림', 6, true, '{"icon": "bi-heart-pulse", "path": "/client/wellness", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_WELLNESS');

-- 설정 메뉴 수정
UPDATE common_codes 
SET code_label = '설정',
    code_description = '개인 설정',
    extra_data = '{"icon": "bi-gear", "path": "/client/settings", "type": "main"}',
    sort_order = 7,
    is_active = true,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SETTINGS';

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CLIENT_MENU', 'CLIENT_SETTINGS', '설정', '개인 설정', 7, true, '{"icon": "bi-gear", "path": "/client/settings", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SETTINGS');

-- 사용하지 않는 메뉴 비활성화
UPDATE common_codes 
SET is_active = false,
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' AND code_value IN ('CLIENT_CONSULTATION', 'CLIENT_MAIN');

-- ==========================================
-- 2. CONSULTANT MENU (상담사 메뉴)
-- ==========================================

-- 대시보드 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CONSULTANT_MENU', 'CONSULTANT_DASHBOARD', '대시보드', '상담사 대시보드', 1, true, '{"icon": "bi-house", "path": "/consultant/dashboard", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_DASHBOARD');

-- 스케줄 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CONSULTANT_MENU', 'CONSULTANT_SCHEDULE', '일정 관리', '내 상담 일정', 2, true, '{"icon": "bi-calendar-week", "path": "/consultant/schedule", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_SCHEDULE');

-- 내담자 관리 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CONSULTANT_MENU', 'CONSULTANT_CLIENTS', '내담자 관리', '내담자 목록', 3, true, '{"icon": "bi-people", "path": "/consultant/clients", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_CLIENTS');

-- 상담 일지 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CONSULTANT_MENU', 'CONSULTANT_RECORDS', '상담 일지', '상담 일지 관리', 4, true, '{"icon": "bi-journal-text", "path": "/consultant/consultation-records", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_RECORDS');

-- 메시지 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'CONSULTANT_MENU', 'CONSULTANT_MESSAGES', '메시지', '메시지 관리', 5, true, '{"icon": "bi-chat-dots", "path": "/consultant/messages", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_MESSAGES');

-- ==========================================
-- 3. ADMIN MENU (관리자 메뉴)
-- ==========================================

-- 대시보드 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_DASHBOARD', '대시보드', '관리자 대시보드', 1, true, '{"icon": "bi-house", "path": "/admin/dashboard", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_DASHBOARD');

-- 사용자 관리 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_USER_MANAGEMENT', '사용자 관리', '사용자 관리', 2, true, '{"icon": "bi-people", "path": "/admin/user-management", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_USER_MANAGEMENT');

-- 상담사 관리 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_CONSULTANT_MANAGEMENT', '상담사 관리', '상담사 관리', 3, true, '{"icon": "bi-person-badge", "path": "/admin/consultant-comprehensive", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_CONSULTANT_MANAGEMENT');

-- 내담자 관리 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_CLIENT_MANAGEMENT', '내담자 관리', '내담자 관리', 4, true, '{"icon": "bi-people-fill", "path": "/admin/client-comprehensive", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_CLIENT_MANAGEMENT');

-- 일정 관리 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_SCHEDULE_MANAGEMENT', '일정 관리', '일정 관리', 5, true, '{"icon": "bi-calendar-week", "path": "/admin/schedules", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SCHEDULE_MANAGEMENT');

-- 시스템 알림 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_SYSTEM_NOTIFICATIONS', '시스템 알림', '시스템 공지 관리', 6, true, '{"icon": "bi-bell", "path": "/admin/system-notifications", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SYSTEM_NOTIFICATIONS');

-- 시스템 설정 메뉴 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) 
SELECT 'ADMIN_MENU', 'ADMIN_SYSTEM_CONFIG', '시스템 설정', '시스템 설정', 7, true, '{"icon": "bi-gear", "path": "/admin/system-config", "type": "main"}', NOW(), NOW(), false, 1
WHERE NOT EXISTS (SELECT 1 FROM common_codes WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SYSTEM_CONFIG');

-- ==========================================
-- 변경사항 확인
-- ==========================================
SELECT 
    code_group,
    code_value,
    code_label,
    is_active,
    extra_data,
    sort_order
FROM common_codes 
WHERE code_group IN ('CLIENT_MENU', 'CONSULTANT_MENU', 'ADMIN_MENU')
ORDER BY code_group, sort_order;
