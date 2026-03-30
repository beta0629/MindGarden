-- =====================================================
-- 기존 내담자/상담사 대시보드 위젯 정의 추가
-- =====================================================
-- 목적: 기존 마인드가든 대시보드의 위젯들을 위젯 그룹 시스템에 추가
-- 작성일: 2025-12-03
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- =====================================================

-- =====================================================
-- 상담소 - CLIENT (내담자) 위젯 정의
-- =====================================================

INSERT INTO widget_definitions (
    widget_id, tenant_id, widget_type, widget_name, widget_name_ko, widget_name_en,
    group_id, business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹 (consultation-client-core)
('consultation-client-welcome', NULL, 'welcome', '환영 위젯', '환영 위젯', 'Welcome Widget',
 'consultation-client-core', 'CONSULTATION', 'CLIENT',
 '{"refreshInterval": 30000, "showGreeting": true}', 1,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-stats', NULL, 'summary-statistics', '상담 통계', '상담 통계', 'Consultation Statistics',
 'consultation-client-core', 'CONSULTATION', 'CLIENT',
 '{"showToday": true, "showCompleted": true, "showWeekly": true, "showRemaining": true, "refreshInterval": 60000}', 2,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 상담 위젯 그룹 (consultation-client-session)
('consultation-client-upcoming', NULL, 'schedule', '다가오는 상담', '다가오는 상담', 'Upcoming Consultations',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"limit": 3, "showStatus": true, "refreshInterval": 300000}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-personalized', NULL, 'personalized-message', '맞춤형 메시지', '맞춤형 메시지', 'Personalized Messages',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"showEncouragement": true, "refreshInterval": 300000}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-payment', NULL, 'payment-sessions', '결제 및 회기 현황', '결제 및 회기 현황', 'Payment & Sessions',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"showPaymentHistory": true, "showSessionProgress": true, "refreshInterval": 300000}', 3,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-rating', NULL, 'ratable-consultations', '상담사 평가', '상담사 평가', 'Consultant Rating',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"showPendingRatings": true, "refreshInterval": 300000}', 4,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-healing', NULL, 'healing-card', '오늘의 힐링 카드', '오늘의 힐링 카드', 'Healing Card',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"showDailyMessage": true, "refreshInterval": 86400000}', 5,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-quick-actions', NULL, 'quick-actions', '빠른 메뉴', '빠른 메뉴', 'Quick Actions',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"actions": ["schedule", "messages", "payment", "settings"]}', 6,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-client-messages', NULL, 'client-message', '메시지', '메시지', 'Messages',
 'consultation-client-session', 'CONSULTATION', 'CLIENT',
 '{"showUnread": true, "refreshInterval": 30000}', 7,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM');

-- =====================================================
-- 상담소 - CONSULTANT (상담사) 위젯 정의
-- =====================================================

INSERT INTO widget_definitions (
    widget_id, tenant_id, widget_type, widget_name, widget_name_ko, widget_name_en,
    group_id, business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹 (consultation-consultant-core)
('consultation-consultant-welcome', NULL, 'welcome', '환영 위젯', '환영 위젯', 'Welcome Widget',
 'consultation-consultant-core', 'CONSULTATION', 'CONSULTANT',
 '{"refreshInterval": 30000, "showGreeting": true}', 1,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-stats', NULL, 'summary-statistics', '상담 통계', '상담 통계', 'Consultation Statistics',
 'consultation-consultant-core', 'CONSULTATION', 'CONSULTANT',
 '{"showToday": true, "showWeekly": true, "showMonthly": true, "refreshInterval": 60000}', 2,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 상담 위젯 그룹 (consultation-consultant-session)
('consultation-consultant-upcoming', NULL, 'schedule', '다가오는 상담', '다가오는 상담', 'Upcoming Consultations',
 'consultation-consultant-session', 'CONSULTATION', 'CONSULTANT',
 '{"limit": 5, "showStatus": true, "refreshInterval": 300000}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-rating', NULL, 'consultant-rating', '평점 현황', '평점 현황', 'Rating Status',
 'consultation-consultant-session', 'CONSULTATION', 'CONSULTANT',
 '{"showAverageRating": true, "showRecentRatings": true, "refreshInterval": 300000}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-record', NULL, 'consultation-record', '상담일지', '상담일지', 'Consultation Records',
 'consultation-consultant-session', 'CONSULTATION', 'CONSULTANT',
 '{"showRecentRecords": true, "pageSize": 10, "refreshInterval": 300000}', 3,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-activities', NULL, 'recent-activities', '최근 활동', '최근 활동', 'Recent Activities',
 'consultation-consultant-session', 'CONSULTATION', 'CONSULTANT',
 '{"limit": 10, "showTimestamp": true, "refreshInterval": 300000}', 4,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-notifications', NULL, 'system-notification', '시스템 알림', '시스템 알림', 'System Notifications',
 'consultation-consultant-session', 'CONSULTATION', 'CONSULTANT',
 '{"showUnread": true, "limit": 5, "refreshInterval": 30000}', 5,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 내담자 위젯 그룹 (consultation-consultant-client)
('consultation-consultant-clients', NULL, 'consultant-client', '내담자 관리', '내담자 관리', 'Client Management',
 'consultation-consultant-client', 'CONSULTATION', 'CONSULTANT',
 '{"showActiveClients": true, "showPendingMappings": true, "pageSize": 10, "refreshInterval": 300000}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-consultant-quick-actions', NULL, 'quick-actions', '빠른 액션', '빠른 액션', 'Quick Actions',
 'consultation-consultant-client', 'CONSULTATION', 'CONSULTANT',
 '{"actions": ["schedule", "records", "clients", "settings"]}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM');

-- =====================================================
-- 상담소 - STAFF (스텝) 위젯 그룹 추가
-- =====================================================

INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹
('consultation-staff-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CONSULTATION', 'STAFF', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

-- 관리 위젯 그룹
('consultation-staff-management', NULL, '관리 위젯', '관리 위젯', 'Management Widgets',
 'CONSULTATION', 'STAFF', 2, '상담사/내담자/회기 관리', 'users', TRUE, 'SYSTEM'),

-- 통계 위젯 그룹
('consultation-staff-statistics', NULL, '통계 위젯', '통계 위젯', 'Statistics Widgets',
 'CONSULTATION', 'STAFF', 3, '통계 및 분석', 'bar-chart', TRUE, 'SYSTEM'),

-- 시스템 위젯 그룹
('consultation-staff-system', NULL, '시스템 위젯', '시스템 위젯', 'System Widgets',
 'CONSULTATION', 'STAFF', 4, 'ERP 및 시스템 관리', 'settings', TRUE, 'SYSTEM');

-- =====================================================
-- 상담소 - STAFF (스텝) 위젯 정의 (관리자와 동일)
-- =====================================================

INSERT INTO widget_definitions (
    widget_id, tenant_id, widget_type, widget_name, widget_name_ko, widget_name_en,
    group_id, business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹 (consultation-staff-core) - ADMIN과 동일
('consultation-staff-welcome', NULL, 'welcome', '환영 위젯', '환영 위젯', 'Welcome Widget',
 'consultation-staff-core', 'CONSULTATION', 'STAFF', 
 '{"refreshInterval": 30000}', 1,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-staff-summary', NULL, 'summary-panels', '요약 패널', '요약 패널', 'Summary Panels',
 'consultation-staff-core', 'CONSULTATION', 'STAFF',
 '{"refreshInterval": 60000}', 2,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 관리 위젯 그룹 (consultation-staff-management) - ADMIN과 동일
('consultation-staff-consultant-mgmt', NULL, 'consultant-management', '상담사 관리', '상담사 관리', 'Consultant Management',
 'consultation-staff-management', 'CONSULTATION', 'STAFF',
 '{"pageSize": 10, "showQuickActions": true}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-staff-client-mgmt', NULL, 'client-management', '내담자 관리', '내담자 관리', 'Client Management',
 'consultation-staff-management', 'CONSULTATION', 'STAFF',
 '{"pageSize": 10, "showQuickActions": true}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-staff-session-mgmt', NULL, 'session-management', '회기 관리', '회기 관리', 'Session Management',
 'consultation-staff-management', 'CONSULTATION', 'STAFF',
 '{"pageSize": 10, "showProgress": true}', 3,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 통계 위젯 그룹 (consultation-staff-statistics) - ADMIN과 동일
('consultation-staff-statistics', NULL, 'statistics-grid', '통계 그리드', '통계 그리드', 'Statistics Grid',
 'consultation-staff-statistics', 'CONSULTATION', 'STAFF',
 '{"chartType": "bar", "refreshInterval": 300000}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-staff-consultation-summary', NULL, 'consultation-summary', '상담 요약', '상담 요약', 'Consultation Summary',
 'consultation-staff-statistics', 'CONSULTATION', 'STAFF',
 '{"period": "month", "showChart": true}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 시스템 위젯 그룹 (consultation-staff-system) - ADMIN과 동일
('consultation-staff-erp', NULL, 'erp-management', 'ERP 관리', 'ERP 관리', 'ERP Management',
 'consultation-staff-system', 'CONSULTATION', 'STAFF',
 '{"showBudget": true, "showExpenses": true}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-staff-activities', NULL, 'recent-activities', '최근 활동', '최근 활동', 'Recent Activities',
 'consultation-staff-system', 'CONSULTATION', 'STAFF',
 '{"limit": 10, "showTimestamp": true}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM');

