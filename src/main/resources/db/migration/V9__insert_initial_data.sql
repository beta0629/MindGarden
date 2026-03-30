-- ============================================
-- Week 0.5 Day 5: 초기 데이터 삽입
-- ============================================
-- 목적: 온보딩 시스템이 사용하는 기본 데이터 삽입
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

-- ============================================
-- 1. 카테고리 시스템 초기 데이터
-- ============================================

-- 1.1 대분류 카테고리 (중복 키 무시)
INSERT IGNORE INTO business_categories (category_id, category_code, name_ko, name_en, description_ko, level, display_order, is_active, created_by, updated_by) VALUES
(UUID(), 'EDUCATION', '교육', 'Education', '교육 관련 업종', 1, 1, TRUE, 'system', 'system'),
(UUID(), 'FOOD_SERVICE', '요식', 'Food Service', '요식업 관련 업종', 1, 2, TRUE, 'system', 'system'),
(UUID(), 'SERVICE', '서비스', 'Service', '서비스업 관련 업종', 1, 3, TRUE, 'system', 'system'),
(UUID(), 'RETAIL', '소매', 'Retail', '소매업 관련 업종', 1, 4, TRUE, 'system', 'system'),
(UUID(), 'BEAUTY', '미용', 'Beauty', '미용업 관련 업종', 1, 5, TRUE, 'system', 'system'),
(UUID(), 'HEALTH', '건강', 'Health', '건강 관련 업종', 1, 6, TRUE, 'system', 'system'),
(UUID(), 'CONSULTATION', '상담', 'Consultation', '상담 관련 업종', 1, 7, TRUE, 'system', 'system');

-- 1.2 소분류 카테고리 아이템
-- 교육 카테고리 (중복 키 무시)
INSERT IGNORE INTO business_category_items (
    item_id, category_id, item_code, name_ko, name_en, business_type, 
    display_order, is_active, default_components_json, recommended_plan_ids_json, 
    created_by, updated_by
)
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'),
    'ACADEMY',
    '학원',
    'Academy',
    'ACADEMY',
    1,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION"]',
    '[]',
    'system',
    'system'
UNION ALL
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'),
    'TUTORING',
    '과외',
    'Tutoring',
    'TUTORING',
    2,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
    '[]',
    'system',
    'system'
UNION ALL
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'EDUCATION'),
    'TAEKWONDO',
    '태권도장',
    'Taekwondo',
    'TAEKWONDO',
    3,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION"]',
    '[]',
    'system',
    'system';

-- 요식 카테고리 (중복 키 무시)
INSERT IGNORE INTO business_category_items (
    item_id, category_id, item_code, name_ko, name_en, business_type, 
    display_order, is_active, default_components_json, recommended_plan_ids_json, 
    created_by, updated_by
)
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'),
    'KOREAN_FOOD',
    '한식',
    'Korean Food',
    'FOOD_SERVICE',
    1,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
    '[]',
    'system',
    'system'
UNION ALL
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'),
    'CHINESE_FOOD',
    '중식',
    'Chinese Food',
    'FOOD_SERVICE',
    2,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
    '[]',
    'system',
    'system'
UNION ALL
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'FOOD_SERVICE'),
    'WESTERN_FOOD',
    '양식',
    'Western Food',
    'FOOD_SERVICE',
    3,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ORDER_MANAGEMENT", "NOTIFICATION"]',
    '[]',
    'system',
    'system';

-- 상담 카테고리 (중복 키 무시)
INSERT IGNORE INTO business_category_items (
    item_id, category_id, item_code, name_ko, name_en, business_type, 
    display_order, is_active, default_components_json, recommended_plan_ids_json, 
    created_by, updated_by
)
SELECT 
    UUID(),
    (SELECT category_id FROM business_categories WHERE category_code = 'CONSULTATION'),
    'COUNSELING',
    '상담소',
    'Counseling',
    'CONSULTATION',
    1,
    TRUE,
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
    '[]',
    'system',
    'system';

-- ============================================
-- 2. 컴포넌트 카탈로그 초기 데이터
-- ============================================

-- 2.1 핵심 컴포넌트 (중복 키 무시)
INSERT IGNORE INTO component_catalog (
    component_id, component_code, name, name_ko, name_en,
    category, description, description_ko, description_en,
    is_core, is_active, component_version, display_order,
    created_by, updated_by
) VALUES
(UUID(), 'CONSULTATION', '상담 관리', '상담 관리', 'Consultation Management', 
 'CORE', '상담 예약 및 관리 시스템', '상담 예약 및 관리 시스템', 'Consultation booking and management system',
 TRUE, TRUE, '1.0.0', 1, 'system', 'system'),
(UUID(), 'APPOINTMENT', '예약 관리', '예약 관리', 'Appointment Management', 
 'CORE', '예약 스케줄 관리 시스템', '예약 스케줄 관리 시스템', 'Appointment schedule management system',
 TRUE, TRUE, '1.0.0', 2, 'system', 'system'),
(UUID(), 'PAYMENT', '결제 관리', '결제 관리', 'Payment Management', 
 'CORE', '결제 및 청구 관리 시스템', '결제 및 청구 관리 시스템', 'Payment and billing management system',
 TRUE, TRUE, '1.0.0', 3, 'system', 'system'),
(UUID(), 'ATTENDANCE', '출결 관리', '출결 관리', 'Attendance Management', 
 'ADDON', '출결 체크 및 관리 시스템', '출결 체크 및 관리 시스템', 'Attendance check and management system',
 FALSE, TRUE, '1.0.0', 4, 'system', 'system'),
(UUID(), 'NOTIFICATION', '알림 관리', '알림 관리', 'Notification Management', 
 'CORE', '알림 발송 및 관리 시스템', '알림 발송 및 관리 시스템', 'Notification delivery and management system',
 TRUE, TRUE, '1.0.0', 5, 'system', 'system'),
(UUID(), 'ORDER_MANAGEMENT', '주문 관리', '주문 관리', 'Order Management', 
 'ADDON', '주문 관리 시스템', '주문 관리 시스템', 'Order management system',
 FALSE, TRUE, '1.0.0', 6, 'system', 'system'),
(UUID(), 'CRM', 'CRM', 'CRM', 'CRM', 
 'ADDON', '고객 관계 관리 시스템', '고객 관계 관리 시스템', 'Customer relationship management system',
 FALSE, TRUE, '1.0.0', 7, 'system', 'system'),
(UUID(), 'STATISTICS', '통계 분석', '통계 분석', 'Statistics & Analytics', 
 'ADDON', '통계 및 분석 시스템', '통계 및 분석 시스템', 'Statistics and analytics system',
 FALSE, TRUE, '1.0.0', 8, 'system', 'system');

-- ============================================
-- 3. 요금제 시스템 초기 데이터
-- ============================================

-- 3.1 기본 요금제 (중복 키 무시)
INSERT IGNORE INTO pricing_plans (
    plan_id, plan_code, name, name_ko, name_en,
    base_fee, currency, billing_cycle,
    limits_json, features_json,
    is_active, display_order, description, description_ko, description_en,
    created_by, updated_by
) VALUES
(UUID(), 'STARTER', '스타터', '스타터', 'Starter',
 50000.00, 'KRW', 'MONTHLY',
 '{"users": 10, "branches": 1, "storage_gb": 5, "api_calls_per_month": 1000}',
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
 TRUE, 1, '소규모 사업장을 위한 기본 요금제', '소규모 사업장을 위한 기본 요금제', 'Basic plan for small businesses',
 'system', 'system'),
(UUID(), 'STANDARD', '스탠다드', '스탠다드', 'Standard',
 100000.00, 'KRW', 'MONTHLY',
 '{"users": 50, "branches": 5, "storage_gb": 20, "api_calls_per_month": 5000}',
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION", "CRM"]',
 TRUE, 2, '중규모 사업장을 위한 표준 요금제', '중규모 사업장을 위한 표준 요금제', 'Standard plan for medium businesses',
 'system', 'system'),
(UUID(), 'PREMIUM', '프리미엄', '프리미엄', 'Premium',
 200000.00, 'KRW', 'MONTHLY',
 '{"users": 200, "branches": 20, "storage_gb": 100, "api_calls_per_month": 20000}',
 '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION", "CRM", "STATISTICS", "ORDER_MANAGEMENT"]',
 TRUE, 3, '대규모 사업장을 위한 프리미엄 요금제', '대규모 사업장을 위한 프리미엄 요금제', 'Premium plan for large businesses',
 'system', 'system');

-- 3.2 요금제별 기능/한도
-- STARTER 요금제 기능 (중복 키 무시)
INSERT IGNORE INTO pricing_plan_features (
    plan_id, feature_code, feature_name, feature_name_ko, feature_name_en,
    feature_level, included_flag, limit_value, limit_unit,
    created_at, updated_at
)
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STARTER'),
    'USERS',
    '사용자 수',
    '사용자 수',
    'User Count',
    'BASIC',
    TRUE,
    10,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STARTER'),
    'BRANCHES',
    '지점 수',
    '지점 수',
    'Branch Count',
    'BASIC',
    TRUE,
    1,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STARTER'),
    'STORAGE',
    '저장 공간',
    '저장 공간',
    'Storage',
    'BASIC',
    TRUE,
    5,
    'GB',
    NOW(),
    NOW();

-- STANDARD 요금제 기능 (중복 키 무시)
INSERT IGNORE INTO pricing_plan_features (
    plan_id, feature_code, feature_name, feature_name_ko, feature_name_en,
    feature_level, included_flag, limit_value, limit_unit,
    created_at, updated_at
)
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STANDARD'),
    'USERS',
    '사용자 수',
    '사용자 수',
    'User Count',
    'STANDARD',
    TRUE,
    50,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STANDARD'),
    'BRANCHES',
    '지점 수',
    '지점 수',
    'Branch Count',
    'STANDARD',
    TRUE,
    5,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'STANDARD'),
    'STORAGE',
    '저장 공간',
    '저장 공간',
    'Storage',
    'STANDARD',
    TRUE,
    20,
    'GB',
    NOW(),
    NOW();

-- PREMIUM 요금제 기능 (중복 키 무시)
INSERT IGNORE INTO pricing_plan_features (
    plan_id, feature_code, feature_name, feature_name_ko, feature_name_en,
    feature_level, included_flag, limit_value, limit_unit,
    created_at, updated_at
)
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'PREMIUM'),
    'USERS',
    '사용자 수',
    '사용자 수',
    'User Count',
    'PREMIUM',
    TRUE,
    200,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'PREMIUM'),
    'BRANCHES',
    '지점 수',
    '지점 수',
    'Branch Count',
    'PREMIUM',
    TRUE,
    20,
    'COUNT',
    NOW(),
    NOW()
UNION ALL
SELECT 
    (SELECT plan_id FROM pricing_plans WHERE plan_code = 'PREMIUM'),
    'STORAGE',
    '저장 공간',
    '저장 공간',
    'Storage',
    'PREMIUM',
    TRUE,
    100,
    'GB',
    NOW(),
    NOW();

-- ============================================
-- 4. 역할 템플릿 시스템 초기 데이터
-- ============================================

-- 4.1 학원 업종 역할 템플릿 (중복 키 무시)
INSERT IGNORE INTO role_templates (
    role_template_id, template_code, name, name_ko, name_en,
    business_type, description, description_ko, description_en,
    is_active, display_order, is_system_template,
    created_by, updated_by
) VALUES
(UUID(), 'ACADEMY_DIRECTOR', '원장', '원장', 'Director',
 'ACADEMY', '학원 원장 역할', '학원 원장 역할', 'Academy director role',
 TRUE, 1, TRUE, 'system', 'system'),
(UUID(), 'ACADEMY_TEACHER', '교사', '교사', 'Teacher',
 'ACADEMY', '학원 교사 역할', '학원 교사 역할', 'Academy teacher role',
 TRUE, 2, TRUE, 'system', 'system'),
(UUID(), 'ACADEMY_STUDENT', '학생', '학생', 'Student',
 'ACADEMY', '학원 학생 역할', '학원 학생 역할', 'Academy student role',
 TRUE, 3, TRUE, 'system', 'system'),
(UUID(), 'ACADEMY_PARENT', '학부모', '학부모', 'Parent',
 'ACADEMY', '학원 학부모 역할', '학원 학부모 역할', 'Academy parent role',
 TRUE, 4, TRUE, 'system', 'system'),
(UUID(), 'ACADEMY_STAFF', '사무원', '사무원', 'Staff',
 'ACADEMY', '학원 사무원 역할', '학원 사무원 역할', 'Academy staff role',
 TRUE, 5, TRUE, 'system', 'system');

-- 4.2 상담 업종 역할 템플릿 (중복 키 무시)
INSERT IGNORE INTO role_templates (
    role_template_id, template_code, name, name_ko, name_en,
    business_type, description, description_ko, description_en,
    is_active, display_order, is_system_template,
    created_by, updated_by
) VALUES
(UUID(), 'CONSULTATION_DIRECTOR', '원장', '원장', 'Director',
 'CONSULTATION', '상담소 원장 역할', '상담소 원장 역할', 'Consultation center director role',
 TRUE, 1, TRUE, 'system', 'system'),
(UUID(), 'CONSULTATION_COUNSELOR', '상담사', '상담사', 'Counselor',
 'CONSULTATION', '상담소 상담사 역할', '상담소 상담사 역할', 'Consultation center counselor role',
 TRUE, 2, TRUE, 'system', 'system'),
(UUID(), 'CONSULTATION_CLIENT', '내담자', '내담자', 'Client',
 'CONSULTATION', '상담소 내담자 역할', '상담소 내담자 역할', 'Consultation center client role',
 TRUE, 3, TRUE, 'system', 'system'),
(UUID(), 'CONSULTATION_STAFF', '사무원', '사무원', 'Staff',
 'CONSULTATION', '상담소 사무원 역할', '상담소 사무원 역할', 'Consultation center staff role',
 TRUE, 4, TRUE, 'system', 'system');

-- 4.3 역할 템플릿 매핑 (업종별 자동 매핑)
-- 학원 업종 매핑 (중복 키 무시)
INSERT IGNORE INTO role_template_mappings (
    role_template_id, business_type, priority, is_default,
    created_at, updated_at
)
SELECT 
    role_template_id,
    'ACADEMY',
    1,
    TRUE,
    NOW(),
    NOW()
FROM role_templates
WHERE business_type = 'ACADEMY' AND is_active = TRUE;

-- 상담 업종 매핑 (중복 키 무시)
INSERT IGNORE INTO role_template_mappings (
    role_template_id, business_type, priority, is_default,
    created_at, updated_at
)
SELECT 
    role_template_id,
    'CONSULTATION',
    1,
    TRUE,
    NOW(),
    NOW()
FROM role_templates
WHERE business_type = 'CONSULTATION' AND is_active = TRUE;

