-- 새로운 휴가 유형 코드 추가: MORNING_HALF_DAY, AFTERNOON_HALF_DAY

-- MORNING_HALF_DAY 추가
INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'MORNING_HALF_DAY', '오전반차 (09:00-14:00)', '오전반차 - 5시간', '#f59e0b', '🌅', true, false, 2.5, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- AFTERNOON_HALF_DAY 추가
INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'AFTERNOON_HALF_DAY', '오후반차 (14:00-18:00)', '오후반차 - 4시간', '#3b82f6', '🌆', true, false, 5.5, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE'
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 기존 코드들의 정렬 순서 조정
UPDATE code_values SET sort_order = 1 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'MORNING';
UPDATE code_values SET sort_order = 2 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'MORNING_HALF_1';
UPDATE code_values SET sort_order = 3 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'MORNING_HALF_2';
UPDATE code_values SET sort_order = 4 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'AFTERNOON';
UPDATE code_values SET sort_order = 6 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'AFTERNOON_HALF_1';
UPDATE code_values SET sort_order = 7 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'AFTERNOON_HALF_2';
UPDATE code_values SET sort_order = 8 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'CUSTOM_TIME';
UPDATE code_values SET sort_order = 9 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'ALL_DAY';
UPDATE code_values SET sort_order = 10 WHERE code_group_id = (SELECT id FROM code_groups WHERE code = 'VACATION_TYPE') AND code = 'FULL_DAY';
