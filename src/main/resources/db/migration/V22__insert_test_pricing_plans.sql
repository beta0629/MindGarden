-- ============================================
-- 테스트 요금제 데이터 삽입
-- ============================================
-- 목적: 프론트엔드 테스트를 위한 요금제 데이터
-- 작성일: 2025-01-XX
-- ============================================

-- STARTER 요금제 (기존 데이터가 없을 경우에만 삽입)
INSERT INTO pricing_plans (
    plan_id, plan_code, name, name_ko, name_en,
    base_fee, currency, billing_cycle,
    limits_json, features_json,
    is_active, display_order, description, description_ko, description_en,
    created_by, updated_by
)
SELECT 
    UUID(),
    'STARTER',
    '스타터 플랜',
    '스타터',
    'Starter',
    50000.00,
    'KRW',
    'MONTHLY',
    '{"users": 10, "branches": 1, "storage_gb": 5, "api_calls_per_month": 1000}',
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "NOTIFICATION"]',
    TRUE,
    1,
    '소규모 사업장을 위한 기본 요금제입니다. 최대 10명의 사용자와 1개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 알림 기능을 포함합니다.',
    '소규모 사업장을 위한 기본 요금제입니다. 최대 10명의 사용자와 1개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 알림 기능을 포함합니다.',
    'Basic plan for small businesses. Supports up to 10 users and 1 branch, including consultation management, appointment management, payment management, and notification features.',
    'system',
    'system'
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE plan_code = 'STARTER' AND is_deleted = FALSE);

-- STANDARD 요금제 (기존 데이터가 없을 경우에만 삽입)
INSERT INTO pricing_plans (
    plan_id, plan_code, name, name_ko, name_en,
    base_fee, currency, billing_cycle,
    limits_json, features_json,
    is_active, display_order, description, description_ko, description_en,
    created_by, updated_by
)
SELECT 
    UUID(),
    'STANDARD',
    '스탠다드 플랜',
    '스탠다드',
    'Standard',
    100000.00,
    'KRW',
    'MONTHLY',
    '{"users": 50, "branches": 5, "storage_gb": 20, "api_calls_per_month": 5000}',
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION", "CRM"]',
    TRUE,
    2,
    '중규모 사업장을 위한 표준 요금제입니다. 최대 50명의 사용자와 5개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능을 포함합니다.',
    '중규모 사업장을 위한 표준 요금제입니다. 최대 50명의 사용자와 5개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능을 포함합니다.',
    'Standard plan for medium businesses. Supports up to 50 users and 5 branches, including consultation management, appointment management, payment management, attendance management, notification features, and CRM features.',
    'system',
    'system'
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE plan_code = 'STANDARD' AND is_deleted = FALSE);

-- PREMIUM 요금제 (기존 데이터가 없을 경우에만 삽입)
INSERT INTO pricing_plans (
    plan_id, plan_code, name, name_ko, name_en,
    base_fee, currency, billing_cycle,
    limits_json, features_json,
    is_active, display_order, description, description_ko, description_en,
    created_by, updated_by
)
SELECT 
    UUID(),
    'PREMIUM',
    '프리미엄 플랜',
    '프리미엄',
    'Premium',
    200000.00,
    'KRW',
    'MONTHLY',
    '{"users": 200, "branches": 20, "storage_gb": 100, "api_calls_per_month": 20000}',
    '["CONSULTATION", "APPOINTMENT", "PAYMENT", "ATTENDANCE", "NOTIFICATION", "CRM", "STATISTICS", "ORDER_MANAGEMENT"]',
    TRUE,
    3,
    '대규모 사업장을 위한 프리미엄 요금제입니다. 최대 200명의 사용자와 20개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능, 통계 분석, 주문 관리 기능을 모두 포함합니다.',
    '대규모 사업장을 위한 프리미엄 요금제입니다. 최대 200명의 사용자와 20개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능, 통계 분석, 주문 관리 기능을 모두 포함합니다.',
    'Premium plan for large businesses. Supports up to 200 users and 20 branches, including all features: consultation management, appointment management, payment management, attendance management, notification features, CRM features, statistics analysis, and order management.',
    'system',
    'system'
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE plan_code = 'PREMIUM' AND is_deleted = FALSE);

