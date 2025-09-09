-- 휴가 타입 코드값들 추가
INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'MORNING', '오전 휴무', '오전 시간대 휴무 (09:00-12:00)', '#ff6b6b', '🌅', true, false, 1, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'AFTERNOON', '오후 휴무', '오후 시간대 휴무 (12:00-18:00)', '#4ecdc4', '🌇', true, false, 2, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'MORNING_HALF', '오전 반반차', '오전 반반차 휴무 (09:00-10:30)', '#ffe66d', '🌄', true, false, 3, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'AFTERNOON_HALF', '오후 반반차', '오후 반반차 휴무 (15:30-18:00)', '#a8e6cf', '🌆', true, false, 4, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'CUSTOM_TIME', '사용자 정의', '사용자가 직접 시간을 설정하는 휴무', '#ff8a80', '⏰', true, false, 5, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'ALL_DAY', '하루 종일', '하루 종일 휴무', '#ff5722', '🏖️', true, false, 6, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'FULL_DAY', '하루 종일', '하루 종일 휴무 (FULL_DAY)', '#ff5722', '🏖️', true, false, 7, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_TYPE';

-- 휴가 상태 코드값들 추가
INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'PENDING', '대기중', '휴가 신청 대기 상태', '#ffc107', '⏳', true, false, 1, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_STATUS';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'APPROVED', '승인', '휴가 승인 상태', '#4caf50', '✅', true, false, 2, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_STATUS';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'REJECTED', '거부', '휴가 거부 상태', '#f44336', '❌', true, false, 3, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_STATUS';

INSERT INTO code_values (code_group_id, code, name, description, color_code, icon, is_active, is_deleted, sort_order, created_at, updated_at, version)
SELECT cg.id, 'CANCELLED', '취소', '휴가 취소 상태', '#9e9e9e', '🚫', true, false, 4, NOW(), NOW(), 0
FROM code_groups cg WHERE cg.code = 'VACATION_STATUS';
