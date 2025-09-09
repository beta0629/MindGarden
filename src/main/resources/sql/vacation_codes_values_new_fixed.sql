-- 새로운 휴가 유형 코드 값 추가
INSERT INTO code_values (code_group_id, code, name, description, is_active, is_deleted, version, sort_order, created_at, updated_at) VALUES
(8, 'MORNING_HALF_1', '오전 반반차 1 (09:00-11:00)', '오전 반반차 1 - 2시간', 1, 0, 0, 3, NOW(), NOW()),
(8, 'MORNING_HALF_2', '오전 반반차 2 (11:00-13:00)', '오전 반반차 2 - 2시간', 1, 0, 0, 4, NOW(), NOW()),
(8, 'AFTERNOON_HALF_1', '오후 반반차 1 (14:00-16:00)', '오후 반반차 1 - 2시간', 1, 0, 0, 6, NOW(), NOW()),
(8, 'AFTERNOON_HALF_2', '오후 반반차 2 (16:00-18:00)', '오후 반반차 2 - 2시간', 1, 0, 0, 7, NOW(), NOW())
ON DUPLICATE KEY UPDATE
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- 기존 휴가 유형 업데이트
UPDATE code_values SET 
    name = '오전 휴가 (09:00-13:00)',
    description = '오전 휴가 - 4시간',
    updated_at = NOW()
WHERE code_group_id = 8 AND code = 'MORNING';

UPDATE code_values SET 
    name = '오후 휴가 (14:00-18:00)',
    description = '오후 휴가 - 4시간',
    updated_at = NOW()
WHERE code_group_id = 8 AND code = 'AFTERNOON';

UPDATE code_values SET 
    name = '하루 종일 휴가',
    description = '하루 종일 휴가',
    updated_at = NOW()
WHERE code_group_id = 8 AND code IN ('ALL_DAY', 'FULL_DAY');

UPDATE code_values SET 
    name = '사용자 정의 휴가',
    description = '사용자 정의 휴가',
    updated_at = NOW()
WHERE code_group_id = 8 AND code = 'CUSTOM_TIME';
