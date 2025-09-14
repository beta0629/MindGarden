-- 결제 관련 공통코드 데이터
-- 하드코딩된 enum을 공통코드로 변경

-- 1. 결제 상태 (PAYMENT_STATUS)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('PAYMENT_STATUS', 'PENDING', '결제 대기', '결제가 요청되어 대기 중인 상태', 1, true, '{"icon": "bi-clock", "color": "warning", "priority": 3}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'PROCESSING', '결제 처리중', '결제가 처리되고 있는 상태', 2, true, '{"icon": "bi-arrow-repeat", "color": "info", "priority": 2}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'APPROVED', '결제 승인', '결제가 성공적으로 승인된 상태', 3, true, '{"icon": "bi-check-circle", "color": "success", "priority": 1}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'FAILED', '결제 실패', '결제 처리 중 오류가 발생한 상태', 4, true, '{"icon": "bi-x-circle", "color": "danger", "priority": 4}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'CANCELLED', '결제 취소', '결제가 취소된 상태', 5, true, '{"icon": "bi-dash-circle", "color": "secondary", "priority": 5}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'REFUNDED', '환불 완료', '결제 금액이 환불된 상태', 6, true, '{"icon": "bi-arrow-counterclockwise", "color": "primary", "priority": 3}', NOW(), NOW(), false, 1),
('PAYMENT_STATUS', 'EXPIRED', '결제 만료', '결제 시간이 만료된 상태', 7, true, '{"icon": "bi-clock-history", "color": "muted", "priority": 5}', NOW(), NOW(), false, 1);

-- 2. 결제 방법 (PAYMENT_METHOD)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('PAYMENT_METHOD', 'CARD', '신용카드', '신용카드 결제', 1, true, '{"icon": "bi-credit-card", "color": "primary"}', NOW(), NOW(), false, 1),
('PAYMENT_METHOD', 'BANK_TRANSFER', '계좌이체', '계좌이체 결제', 2, true, '{"icon": "bi-bank", "color": "info"}', NOW(), NOW(), false, 1),
('PAYMENT_METHOD', 'VIRTUAL_ACCOUNT', '가상계좌', '가상계좌 결제', 3, true, '{"icon": "bi-wallet", "color": "success"}', NOW(), NOW(), false, 1),
('PAYMENT_METHOD', 'MOBILE', '휴대폰', '휴대폰 결제', 4, true, '{"icon": "bi-phone", "color": "warning"}', NOW(), NOW(), false, 1),
('PAYMENT_METHOD', 'CASH', '현금', '현금 결제', 5, true, '{"icon": "bi-cash", "color": "secondary"}', NOW(), NOW(), false, 1);

-- 3. 결제 대행사 (PAYMENT_PROVIDER)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('PAYMENT_PROVIDER', 'TOSS', '토스페이먼츠', '토스페이먼츠 결제 대행사', 1, true, '{"icon": "bi-lightning", "color": "primary"}', NOW(), NOW(), false, 1),
('PAYMENT_PROVIDER', 'IAMPORT', '아임포트', '아임포트 결제 대행사', 2, true, '{"icon": "bi-credit-card-2-front", "color": "info"}', NOW(), NOW(), false, 1),
('PAYMENT_PROVIDER', 'KAKAO', '카카오페이', '카카오페이 결제', 3, true, '{"icon": "bi-chat-dots", "color": "warning"}', NOW(), NOW(), false, 1),
('PAYMENT_PROVIDER', 'NAVER', '네이버페이', '네이버페이 결제', 4, true, '{"icon": "bi-search", "color": "success"}', NOW(), NOW(), false, 1),
('PAYMENT_PROVIDER', 'PAYPAL', '페이팔', '페이팔 결제', 5, true, '{"icon": "bi-paypal", "color": "primary"}', NOW(), NOW(), false, 1);

-- 4. 알림 타입 (NOTIFICATION_TYPE)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('NOTIFICATION_TYPE', 'EMAIL', '이메일', '이메일 알림', 1, true, '{"icon": "bi-envelope", "color": "primary"}', NOW(), NOW(), false, 1),
('NOTIFICATION_TYPE', 'SMS', 'SMS', 'SMS 문자 알림', 2, true, '{"icon": "bi-chat-text", "color": "success"}', NOW(), NOW(), false, 1),
('NOTIFICATION_TYPE', 'PUSH', '푸시 알림', '앱 푸시 알림', 3, true, '{"icon": "bi-bell", "color": "warning"}', NOW(), NOW(), false, 1),
('NOTIFICATION_TYPE', 'WEBSOCKET', '실시간 알림', '웹소켓 실시간 알림', 4, true, '{"icon": "bi-broadcast", "color": "info"}', NOW(), NOW(), false, 1);

-- 5. 상담 상태 (CONSULTATION_STATUS)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('CONSULTATION_STATUS', 'REQUESTED', '상담 요청', '상담이 요청된 상태', 1, true, '{"icon": "bi-plus-circle", "color": "info"}', NOW(), NOW(), false, 1),
('CONSULTATION_STATUS', 'CONFIRMED', '상담 확정', '상담이 확정된 상태', 2, true, '{"icon": "bi-check-circle", "color": "primary"}', NOW(), NOW(), false, 1),
('CONSULTATION_STATUS', 'IN_PROGRESS', '상담 진행중', '상담이 진행 중인 상태', 3, true, '{"icon": "bi-arrow-right-circle", "color": "warning"}', NOW(), NOW(), false, 1),
('CONSULTATION_STATUS', 'COMPLETED', '상담 완료', '상담이 완료된 상태', 4, true, '{"icon": "bi-check-circle-fill", "color": "success"}', NOW(), NOW(), false, 1),
('CONSULTATION_STATUS', 'CANCELLED', '상담 취소', '상담이 취소된 상태', 5, true, '{"icon": "bi-x-circle", "color": "danger"}', NOW(), NOW(), false, 1);

-- 6. 재무 거래 카테고리 (FINANCIAL_CATEGORY)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('FINANCIAL_CATEGORY', 'SALARY', '급여', '급여 관련 거래', 1, true, '{"icon": "bi-person-badge", "color": "primary"}', NOW(), NOW(), false, 1),
('FINANCIAL_CATEGORY', 'TAX', '세금', '세금 관련 거래', 2, true, '{"icon": "bi-calculator", "color": "warning"}', NOW(), NOW(), false, 1),
('FINANCIAL_CATEGORY', 'PURCHASE', '구매', '구매 관련 거래', 3, true, '{"icon": "bi-cart", "color": "info"}', NOW(), NOW(), false, 1),
('FINANCIAL_CATEGORY', 'BUDGET', '예산', '예산 관련 거래', 4, true, '{"icon": "bi-pie-chart", "color": "success"}', NOW(), NOW(), false, 1),
('FINANCIAL_CATEGORY', 'PAYMENT', '결제', '결제 관련 거래', 5, true, '{"icon": "bi-credit-card", "color": "primary"}', NOW(), NOW(), false, 1);

-- 7. 사용자 역할 (USER_ROLE) - 시스템 enum의 한글명 매핑용
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('USER_ROLE', 'CLIENT', '내담자', '상담을 받는 고객', 1, true, '{"icon": "bi-person", "color": "primary"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'CONSULTANT', '상담사', '상담을 제공하는 전문가', 2, true, '{"icon": "bi-person-heart", "color": "success"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'ADMIN', '지점관리자', '지점 단위 관리자', 3, true, '{"icon": "bi-person-gear", "color": "warning"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'BRANCH_SUPER_ADMIN', '지점수퍼관리자', '지점 최고 관리자', 4, true, '{"icon": "bi-person-badge", "color": "danger"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'HQ_ADMIN', '헤드쿼터어드민', '본사 관리자', 5, true, '{"icon": "bi-building", "color": "info"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'SUPER_HQ_ADMIN', '본사고급관리자', '본사 고급 관리자', 6, true, '{"icon": "bi-buildings", "color": "secondary"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'HQ_MASTER', '본사총관리자', '시스템 최고 관리자 (최고 권한)', 7, true, '{"icon": "bi-crown", "color": "dark"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'HQ_SUPER_ADMIN', '본사최고관리자', '본사 최고 관리자 (기존 호환성)', 8, true, '{"icon": "bi-shield-check", "color": "info"}', NOW(), NOW(), false, 1),
('USER_ROLE', 'BRANCH_MANAGER', '지점장', '지점장 (기존 호환성)', 9, true, '{"icon": "bi-person-workspace", "color": "warning"}', NOW(), NOW(), false, 1);

-- 8. 메뉴 카테고리 (MENU_CATEGORY)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('MENU_CATEGORY', 'COMMON', '공통 메뉴', '모든 역할에서 공통으로 사용하는 메뉴', 1, true, '{"type": "common"}', NOW(), NOW(), false, 1),
('MENU_CATEGORY', 'ADMIN', '관리자 메뉴', '관리자 전용 메뉴', 2, true, '{"type": "admin"}', NOW(), NOW(), false, 1),
('MENU_CATEGORY', 'SYSTEM', '시스템 메뉴', '시스템 관리 메뉴', 3, true, '{"type": "system"}', NOW(), NOW(), false, 1),
('MENU_CATEGORY', 'USER', '사용자 메뉴', '일반 사용자 메뉴', 4, true, '{"type": "user"}', NOW(), NOW(), false, 1),
('MENU_CATEGORY', 'FINANCE', '재무 메뉴', '재무 관리 메뉴', 5, true, '{"type": "finance"}', NOW(), NOW(), false, 1),
('MENU_CATEGORY', 'ERP', 'ERP 메뉴', 'ERP 시스템 메뉴', 6, true, '{"type": "erp"}', NOW(), NOW(), false, 1);

-- 9. 공통 메뉴 (COMMON_MENU)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('COMMON_MENU', 'DASHBOARD', '대시보드', '메인 대시보드', 1, true, '{"icon": "bi-house", "path": "/dashboard", "category": "COMMON"}', NOW(), NOW(), false, 1),
('COMMON_MENU', 'MYPAGE', '마이페이지', '개인정보 관리', 2, true, '{"icon": "bi-person", "path": "/mypage", "category": "COMMON"}', NOW(), NOW(), false, 1),
('COMMON_MENU', 'CONSULTATION_HISTORY', '상담 내역', '상담 이력 조회', 3, true, '{"icon": "bi-clock-history", "path": "/consultation-history", "category": "COMMON"}', NOW(), NOW(), false, 1),
('COMMON_MENU', 'CONSULTATION_REPORT', '상담 리포트', '상담 결과 리포트', 4, true, '{"icon": "bi-file-text", "path": "/consultation-report", "category": "COMMON"}', NOW(), NOW(), false, 1);

-- 10. 관리자 메뉴 (ADMIN_MENU)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- 메인 메뉴
('ADMIN_MENU', 'ADMIN_MAIN', '관리자 기능', '관리자 메인 기능', 1, true, '{"icon": "bi-gear", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'USERS_MAIN', '사용자 관리', '사용자 관리 메인', 2, true, '{"icon": "bi-people", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'SYSTEM_MAIN', '시스템 관리', '시스템 관리 메인', 3, true, '{"icon": "bi-tools", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),

-- 관리자 서브 메뉴
('ADMIN_MENU', 'ADMIN_DASHBOARD', '관리자 대시보드', '관리자 전용 대시보드', 11, true, '{"icon": "bi-speedometer2", "path": "/admin/dashboard", "parent": "ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_STATISTICS', '통계 보기', '관리자 통계', 12, true, '{"icon": "bi-graph-up", "path": "/admin/statistics", "parent": "ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_STATISTICS_DASHBOARD', '통계 대시보드', '통계 전용 대시보드', 13, true, '{"icon": "bi-bar-chart", "path": "/admin/statistics-dashboard", "parent": "ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_SCHEDULES', '전체 스케줄', '모든 스케줄 관리', 14, true, '{"icon": "bi-calendar-check", "path": "/admin/schedules", "parent": "ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_SETTINGS', '관리자 설정', '관리자 환경설정', 15, true, '{"icon": "bi-gear-fill", "path": "/admin/settings", "parent": "ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

-- 사용자 관리 서브 메뉴
('ADMIN_MENU', 'ADMIN_CONSULTANTS', '상담사 관리', '상담사 종합 관리', 21, true, '{"icon": "bi-person-badge", "path": "/admin/consultant-comprehensive", "parent": "USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_CLIENTS', '내담자 관리', '내담자 종합 관리', 22, true, '{"icon": "bi-person-check", "path": "/admin/client-comprehensive", "parent": "USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_ACCOUNTS', '계좌 관리', '사용자 계좌 관리', 23, true, '{"icon": "bi-bank", "path": "/admin/accounts", "parent": "USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_MAPPING', '매핑 관리', '사용자 매핑 관리', 24, true, '{"icon": "bi-link", "path": "/admin/mapping-management", "parent": "USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

-- 시스템 관리 서브 메뉴
('ADMIN_MENU', 'ADMIN_CODES', '공통코드 관리', '시스템 공통코드 관리', 31, true, '{"icon": "bi-code", "path": "/admin/common-codes", "parent": "SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_SYSTEM', '시스템 도구', '시스템 관리 도구', 32, true, '{"icon": "bi-tools", "path": "/admin/system", "parent": "SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_LOGS', '시스템 로그', '시스템 로그 조회', 33, true, '{"icon": "bi-file-text", "path": "/admin/logs", "parent": "SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('ADMIN_MENU', 'ADMIN_INTEGRATION_TEST', '통합 테스트', '시스템 통합 테스트', 34, true, '{"icon": "bi-check-circle", "path": "/test/integration", "parent": "SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);

-- 11. 본사 관리자 메뉴 (HQ_ADMIN_MENU)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- 메인 메뉴
('HQ_ADMIN_MENU', 'HQ_ADMIN_MAIN', '본사 관리', '본사 관리 메인', 1, true, '{"icon": "bi-building", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_USERS_MAIN', '사용자 관리', '사용자 관리 메인', 2, true, '{"icon": "bi-people", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_SYSTEM_MAIN', '시스템 관리', '시스템 관리 메인', 3, true, '{"icon": "bi-tools", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_BRANCHES_MAIN', '지점 관리', '지점 관리 메인', 4, true, '{"icon": "bi-buildings", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),

-- 서브 메뉴들...
('HQ_ADMIN_MENU', 'HQ_DASHBOARD', '본사 대시보드', '본사 전용 대시보드', 11, true, '{"icon": "bi-speedometer2", "path": "/super_admin/dashboard", "parent": "HQ_ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_STATISTICS', '통계 보기', '본사 통계', 12, true, '{"icon": "bi-graph-up", "path": "/admin/statistics", "parent": "HQ_ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_SCHEDULES', '전체 스케줄', '전체 스케줄 관리', 13, true, '{"icon": "bi-calendar-check", "path": "/admin/schedules", "parent": "HQ_ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

('HQ_ADMIN_MENU', 'HQ_CONSULTANTS', '상담사 관리', '상담사 종합 관리', 21, true, '{"icon": "bi-person-badge", "path": "/admin/consultant-comprehensive", "parent": "HQ_USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_CLIENTS', '내담자 관리', '내담자 종합 관리', 22, true, '{"icon": "bi-person-check", "path": "/admin/client-comprehensive", "parent": "HQ_USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_ACCOUNTS', '계좌 관리', '사용자 계좌 관리', 23, true, '{"icon": "bi-bank", "path": "/admin/accounts", "parent": "HQ_USERS_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

('HQ_ADMIN_MENU', 'HQ_CODES', '공통코드 관리', '시스템 공통코드 관리', 31, true, '{"icon": "bi-code", "path": "/admin/common-codes", "parent": "HQ_SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_SYSTEM', '시스템 도구', '시스템 관리 도구', 32, true, '{"icon": "bi-tools", "path": "/admin/system", "parent": "HQ_SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_LOGS', '시스템 로그', '시스템 로그 조회', 33, true, '{"icon": "bi-file-text", "path": "/admin/logs", "parent": "HQ_SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

('HQ_ADMIN_MENU', 'HQ_BRANCH_LIST', '지점 목록', '지점 목록 조회', 41, true, '{"icon": "bi-list", "path": "/admin/branches", "parent": "HQ_BRANCHES_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_BRANCH_CREATE', '지점 등록', '새 지점 등록', 42, true, '{"icon": "bi-plus-circle", "path": "/admin/branches/create", "parent": "HQ_BRANCHES_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('HQ_ADMIN_MENU', 'HQ_BRANCH_MANAGERS', '지점장 관리', '지점장 관리', 43, true, '{"icon": "bi-person-badge", "path": "/admin/branch-managers", "parent": "HQ_BRANCHES_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);

-- 12. 상담사 메뉴 (CONSULTANT_MENU)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('CONSULTANT_MENU', 'CONSULTANT_MAIN', '상담사 기능', '상담사 전용 기능', 1, true, '{"icon": "bi-person-heart", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('CONSULTANT_MENU', 'CONSULTANT_SCHEDULE', '상담 스케줄', '상담 일정 관리', 11, true, '{"icon": "bi-calendar", "path": "/consultant/schedule", "parent": "CONSULTANT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('CONSULTANT_MENU', 'CONSULTANT_CLIENTS', '내담자 관리', '담당 내담자 관리', 12, true, '{"icon": "bi-people", "path": "/consultant/clients", "parent": "CONSULTANT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('CONSULTANT_MENU', 'CONSULTANT_REPORTS', '상담 기록', '상담 기록 작성', 13, true, '{"icon": "bi-file-text", "path": "/consultant/reports", "parent": "CONSULTANT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('CONSULTANT_MENU', 'CONSULTANT_MESSAGES', '메시지', '내담자와의 메시지', 14, true, '{"icon": "bi-chat-dots", "path": "/consultant/messages", "parent": "CONSULTANT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);

-- 13. 내담자 메뉴 (CLIENT_MENU)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('CLIENT_MENU', 'CLIENT_MAIN', '내담자 기능', '내담자 전용 기능', 1, true, '{"icon": "bi-person", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('CLIENT_MENU', 'CLIENT_CONSULTATION', '상담 예약', '상담 예약 및 관리', 11, true, '{"icon": "bi-calendar-plus", "path": "/client/consultation", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('CLIENT_MENU', 'CLIENT_HISTORY', '상담 내역', '나의 상담 내역', 12, true, '{"icon": "bi-clock-history", "path": "/client/history", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('CLIENT_MENU', 'CLIENT_SETTINGS', '설정', '개인 설정', 13, true, '{"icon": "bi-gear", "path": "/client/settings", "parent": "CLIENT_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);
