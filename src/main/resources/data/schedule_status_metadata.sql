-- 스케줄 상태 메타데이터 추가
-- ScheduleCalendar.js의 하드코딩된 색상/아이콘을 동적 처리로 변경

-- 1. 스케줄 상태 코드그룹 메타데이터 추가
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
('SCHEDULE_STATUS', '스케줄 상태', '일정 상태 구분', '📅', '#3b82f6', 31, true);

-- 2. 스케줄 상태별 색상/아이콘 정보를 common_codes에 추가
-- 기존 코드가 있다면 업데이트, 없다면 새로 생성
INSERT INTO common_codes (code_group, code_value, code_label, code_description, icon, color_code, is_active, sort_order, is_deleted, version, created_at, updated_at) VALUES
('SCHEDULE_STATUS', 'AVAILABLE', '예약 가능', '예약 가능한 시간대', '⚪', '#e5e7eb', true, 1, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'BOOKED', '예약됨', '예약이 확정된 시간대', '📅', '#3b82f6', true, 2, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'CONFIRMED', '확정됨', '상담이 확정된 시간대', '✅', '#8b5cf6', true, 3, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'IN_PROGRESS', '진행중', '상담이 진행 중인 시간대', '🔄', '#f59e0b', true, 4, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'COMPLETED', '완료됨', '상담이 완료된 시간대', '🎉', '#10b981', true, 5, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'CANCELLED', '취소됨', '취소된 상담 시간대', '❌', '#ef4444', true, 6, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'BLOCKED', '차단됨', '사용할 수 없는 시간대', '🚫', '#6b7280', true, 7, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'UNDER_REVIEW', '검토중', '검토가 필요한 시간대', '🔍', '#f97316', true, 8, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'VACATION', '휴가', '휴가로 설정된 시간대', '🏖️', '#06b6d4', true, 9, false, 0, NOW(), NOW()),
('SCHEDULE_STATUS', 'NO_SHOW', '무단불참', '예약했지만 오지 않은 경우', '👻', '#dc2626', true, 10, false, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    code_label = VALUES(code_label),
    code_description = VALUES(code_description),
    updated_at = NOW();
