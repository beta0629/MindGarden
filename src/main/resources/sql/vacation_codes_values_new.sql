-- 새로운 휴가 유형 코드 값 추가
INSERT INTO code_values (code_group, code_value, code_name, description, is_active, sort_order, created_at, updated_at) VALUES
('VACATION_TYPE', 'MORNING_HALF_1', '오전 반반차 1 (09:00-11:00)', '오전 반반차 1 - 2시간', 1, 3, NOW(), NOW()),
('VACATION_TYPE', 'MORNING_HALF_2', '오전 반반차 2 (11:00-13:00)', '오전 반반차 2 - 2시간', 1, 4, NOW(), NOW()),
('VACATION_TYPE', 'AFTERNOON_HALF_1', '오후 반반차 1 (14:00-16:00)', '오후 반반차 1 - 2시간', 1, 6, NOW(), NOW()),
('VACATION_TYPE', 'AFTERNOON_HALF_2', '오후 반반차 2 (16:00-18:00)', '오후 반반차 2 - 2시간', 1, 7, NOW(), NOW())
ON DUPLICATE KEY UPDATE
code_name = VALUES(code_name),
description = VALUES(description),
updated_at = NOW();

-- 기존 휴가 유형 업데이트
UPDATE code_values SET 
    code_name = '오전 휴가 (09:00-13:00)',
    description = '오전 휴가 - 4시간',
    updated_at = NOW()
WHERE code_group = 'VACATION_TYPE' AND code_value = 'MORNING';

UPDATE code_values SET 
    code_name = '오후 휴가 (14:00-18:00)',
    description = '오후 휴가 - 4시간',
    updated_at = NOW()
WHERE code_group = 'VACATION_TYPE' AND code_value = 'AFTERNOON';

UPDATE code_values SET 
    code_name = '하루 종일 휴가',
    description = '하루 종일 휴가',
    updated_at = NOW()
WHERE code_group = 'VACATION_TYPE' AND code_value IN ('ALL_DAY', 'FULL_DAY');

UPDATE code_values SET 
    code_name = '사용자 정의 휴가',
    description = '사용자 정의 휴가',
    updated_at = NOW()
WHERE code_group = 'VACATION_TYPE' AND code_value = 'CUSTOM_TIME';
