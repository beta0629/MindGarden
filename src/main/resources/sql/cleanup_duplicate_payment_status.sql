-- 결제 상태 코드 중복 데이터 정리
-- 2025-09-14에 추가된 새로운 데이터를 유지하고 기존 데이터를 삭제

-- 중복된 결제 상태 코드 삭제 (기존 데이터)
DELETE FROM common_codes 
WHERE code_group = 'PAYMENT_STATUS' 
AND id IN (156, 157, 158, 159, 160, 161, 162);

-- 남은 데이터 확인
SELECT 
    code_value,
    code_label,
    code_description,
    sort_order,
    is_active,
    created_at
FROM common_codes 
WHERE code_group = 'PAYMENT_STATUS' 
ORDER BY code_value, sort_order;
