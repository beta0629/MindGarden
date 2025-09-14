-- 공통코드에 표시 옵션 (아이콘, 색상) 추가
-- 하드코딩된 상태별 색상/아이콘을 데이터베이스로 이관

-- SCHEDULE_STATUS 그룹 코드들 업데이트
UPDATE common_codes SET 
    icon = '⚪', 
    color_code = '#e5e7eb' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'AVAILABLE';

UPDATE common_codes SET 
    icon = '📅', 
    color_code = '#3b82f6' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'BOOKED';

UPDATE common_codes SET 
    icon = '✅', 
    color_code = '#8b5cf6' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'CONFIRMED';

UPDATE common_codes SET 
    icon = '🔄', 
    color_code = '#f59e0b' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'IN_PROGRESS';

UPDATE common_codes SET 
    icon = '🎉', 
    color_code = '#10b981' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'COMPLETED';

UPDATE common_codes SET 
    icon = '❌', 
    color_code = '#ef4444' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'CANCELLED';

UPDATE common_codes SET 
    icon = '🚫', 
    color_code = '#6b7280' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'BLOCKED';

UPDATE common_codes SET 
    icon = '🔍', 
    color_code = '#f97316' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'UNDER_REVIEW';

UPDATE common_codes SET 
    icon = '🏖️', 
    color_code = '#06b6d4' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'VACATION';

UPDATE common_codes SET 
    icon = '👻', 
    color_code = '#dc2626' 
WHERE code_group = 'SCHEDULE_STATUS' AND code_value = 'NO_SHOW';

-- USER_STATUS 그룹 코드들 업데이트
UPDATE common_codes SET 
    icon = '🟢', 
    color_code = '#10b981' 
WHERE code_group = 'USER_STATUS' AND code_value = 'ACTIVE';

UPDATE common_codes SET 
    icon = '🔴', 
    color_code = '#6b7280' 
WHERE code_group = 'USER_STATUS' AND code_value = 'INACTIVE';

UPDATE common_codes SET 
    icon = '⏸️', 
    color_code = '#f59e0b' 
WHERE code_group = 'USER_STATUS' AND code_value = 'SUSPENDED';

UPDATE common_codes SET 
    icon = '✅', 
    color_code = '#8b5cf6' 
WHERE code_group = 'USER_STATUS' AND code_value = 'COMPLETED';

-- PAYMENT_STATUS 그룹 코드들 업데이트
UPDATE common_codes SET 
    icon = '⏳', 
    color_code = '#f59e0b' 
WHERE code_group = 'PAYMENT_STATUS' AND code_value = 'PENDING';

UPDATE common_codes SET 
    icon = '🔄', 
    color_code = '#06b6d4' 
WHERE code_group = 'PAYMENT_STATUS' AND code_value = 'PROCESSING';

UPDATE common_codes SET 
    icon = '✅', 
    color_code = '#10b981' 
WHERE code_group = 'PAYMENT_STATUS' AND code_value = 'APPROVED';

UPDATE common_codes SET 
    icon = '❌', 
    color_code = '#ef4444' 
WHERE code_group = 'PAYMENT_STATUS' AND code_value = 'FAILED';

-- CONSULTATION_STATUS 그룹 코드들 업데이트
UPDATE common_codes SET 
    icon = '📋', 
    color_code = '#6b7280' 
WHERE code_group = 'CONSULTATION_STATUS' AND code_value = 'SCHEDULED';

UPDATE common_codes SET 
    icon = '✅', 
    color_code = '#10b981' 
WHERE code_group = 'CONSULTATION_STATUS' AND code_value = 'CONFIRMED';

UPDATE common_codes SET 
    icon = '🔄', 
    color_code = '#f59e0b' 
WHERE code_group = 'CONSULTATION_STATUS' AND code_value = 'IN_PROGRESS';

UPDATE common_codes SET 
    icon = '🎉', 
    color_code = '#10b981' 
WHERE code_group = 'CONSULTATION_STATUS' AND code_value = 'COMPLETED';

UPDATE common_codes SET 
    icon = '❌', 
    color_code = '#ef4444' 
WHERE code_group = 'CONSULTATION_STATUS' AND code_value = 'CANCELLED';

-- PRIORITY 그룹 코드들 업데이트
UPDATE common_codes SET 
    icon = '🔴', 
    color_code = '#dc2626' 
WHERE code_group = 'PRIORITY' AND code_value = 'HIGH';

UPDATE common_codes SET 
    icon = '🟡', 
    color_code = '#f59e0b' 
WHERE code_group = 'PRIORITY' AND code_value = 'MEDIUM';

UPDATE common_codes SET 
    icon = '🟢', 
    color_code = '#10b981' 
WHERE code_group = 'PRIORITY' AND code_value = 'LOW';

UPDATE common_codes SET 
    icon = '⚡', 
    color_code = '#dc2626' 
WHERE code_group = 'PRIORITY' AND code_value = 'URGENT';
