-- 메뉴 경로 검증 및 수정
-- 실제 프론트엔드 라우트와 일치하도록 메뉴 경로 업데이트

-- 1. 공통 메뉴 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/dashboard')
WHERE code_group = 'COMMON_MENU' AND code_value = 'DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/mypage')
WHERE code_group = 'COMMON_MENU' AND code_value = 'MYPAGE';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultation-history')
WHERE code_group = 'COMMON_MENU' AND code_value = 'CONSULTATION_HISTORY';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultation-report')
WHERE code_group = 'COMMON_MENU' AND code_value = 'CONSULTATION_REPORT';

-- 2. 관리자 메뉴 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/dashboard')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/statistics')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_STATISTICS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/statistics-dashboard')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_STATISTICS_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/schedules')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SCHEDULES';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/settings')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SETTINGS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/consultant-comprehensive')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_CONSULTANTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/client-comprehensive')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_CLIENTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/accounts')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_ACCOUNTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/mapping-management')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_MAPPING';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/common-codes')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_CODES';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/system')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_SYSTEM';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/logs')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_LOGS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/test/integration')
WHERE code_group = 'ADMIN_MENU' AND code_value = 'ADMIN_INTEGRATION_TEST';

-- 3. 본사 관리자 메뉴 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/super_admin/dashboard')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/statistics')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_STATISTICS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/schedules')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_SCHEDULES';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/consultant-comprehensive')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_CONSULTANTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/client-comprehensive')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_CLIENTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/accounts')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_ACCOUNTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/common-codes')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_CODES';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/system')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_SYSTEM';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/logs')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_LOGS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/branches')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_BRANCH_LIST';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/branches/create')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_BRANCH_CREATE';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/branch-managers')
WHERE code_group = 'HQ_ADMIN_MENU' AND code_value = 'HQ_BRANCH_MANAGERS';

-- 4. 상담사 메뉴 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultant/schedule')
WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_SCHEDULE';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultant/clients')
WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_CLIENTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultant/reports')
WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_REPORTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultant/messages')
WHERE code_group = 'CONSULTANT_MENU' AND code_value = 'CONSULTANT_MESSAGES';

-- 5. 내담자 메뉴 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/client/consultation')
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_CONSULTATION';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultation-history')
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_HISTORY';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/client/settings')
WHERE code_group = 'CLIENT_MENU' AND code_value = 'CLIENT_SETTINGS';

-- 6. 지점 수퍼 관리자 메뉴 경로 수정 (새로 추가된 메뉴)
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/super_admin/dashboard')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'BRANCH_SUPER_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/settings')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'BRANCH_SUPER_SETTINGS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/erp/dashboard')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'ERP_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/erp/financial')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'ERP_FINANCIAL';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/erp/purchase')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'ERP_PURCHASE';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/erp/budget')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'ERP_BUDGET';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/erp/inventory')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'ERP_INVENTORY';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/finance/dashboard')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'FINANCE_DASHBOARD';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/finance/reports')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'FINANCE_REPORTS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/finance/transactions')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'FINANCE_TRANSACTIONS';

UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/admin/accounts')
WHERE code_group = 'BRANCH_SUPER_ADMIN_MENU' AND code_value = 'FINANCE_ACCOUNTS';
