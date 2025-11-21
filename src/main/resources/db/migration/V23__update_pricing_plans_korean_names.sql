-- ============================================
-- 요금제 한글명 업데이트
-- ============================================
-- 목적: 기존 요금제 데이터의 name 필드를 한글로 업데이트
-- 작성일: 2025-01-XX
-- ============================================

-- STARTER 요금제 한글명 및 설명 업데이트
UPDATE pricing_plans
SET 
    name = '스타터 플랜',
    name_ko = '스타터',
    description = '소규모 사업장을 위한 기본 요금제입니다. 최대 10명의 사용자와 1개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 알림 기능을 포함합니다.',
    description_ko = '소규모 사업장을 위한 기본 요금제입니다. 최대 10명의 사용자와 1개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 알림 기능을 포함합니다.',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system'
WHERE plan_code = 'STARTER' 
  AND is_deleted = FALSE
  AND (name != '스타터 플랜' OR name_ko != '스타터');

-- STANDARD 요금제 한글명 및 설명 업데이트
UPDATE pricing_plans
SET 
    name = '스탠다드 플랜',
    name_ko = '스탠다드',
    description = '중규모 사업장을 위한 표준 요금제입니다. 최대 50명의 사용자와 5개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능을 포함합니다.',
    description_ko = '중규모 사업장을 위한 표준 요금제입니다. 최대 50명의 사용자와 5개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능을 포함합니다.',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system'
WHERE plan_code = 'STANDARD' 
  AND is_deleted = FALSE
  AND (name != '스탠다드 플랜' OR name_ko != '스탠다드');

-- PREMIUM 요금제 한글명 및 설명 업데이트
UPDATE pricing_plans
SET 
    name = '프리미엄 플랜',
    name_ko = '프리미엄',
    description = '대규모 사업장을 위한 프리미엄 요금제입니다. 최대 200명의 사용자와 20개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능, 통계 분석, 주문 관리 기능을 모두 포함합니다.',
    description_ko = '대규모 사업장을 위한 프리미엄 요금제입니다. 최대 200명의 사용자와 20개 지점을 지원하며, 상담 관리, 예약 관리, 결제 관리, 출결 관리, 알림 기능, CRM 기능, 통계 분석, 주문 관리 기능을 모두 포함합니다.',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'system'
WHERE plan_code = 'PREMIUM' 
  AND is_deleted = FALSE
  AND (name != '프리미엄 플랜' OR name_ko != '프리미엄');

