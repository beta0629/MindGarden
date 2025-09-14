-- 내담자 메뉴 수정 스크립트
-- 1. 상담 예약 기능 비활성화
-- 2. 상담 내역 링크 경로 수정

-- 상담 예약 메뉴 비활성화
UPDATE common_codes 
SET is_active = false, 
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' 
  AND code_value = 'CLIENT_CONSULTATION';

-- 상담 내역 링크 경로 수정
UPDATE common_codes 
SET extra_data = JSON_SET(extra_data, '$.path', '/consultation-history'),
    updated_at = NOW()
WHERE code_group = 'CLIENT_MENU' 
  AND code_value = 'CLIENT_HISTORY';

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
