-- 알림 관련 공통코드 추가
-- NOTIFICATION_TYPE 그룹

INSERT INTO common_codes (code_group, code_value, code_name, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('NOTIFICATION_TYPE', 'SUCCESS', '성공', '성공 알림', '성공적인 작업 완료 알림', true, 1, NOW(), NOW()),
('NOTIFICATION_TYPE', 'ERROR', '오류', '오류 알림', '오류 발생 알림', true, 2, NOW(), NOW()),
('NOTIFICATION_TYPE', 'WARNING', '경고', '경고 알림', '주의가 필요한 상황 알림', true, 3, NOW(), NOW()),
('NOTIFICATION_TYPE', 'INFO', '정보', '정보 알림', '일반적인 정보 제공 알림', true, 4, NOW(), NOW()),
('NOTIFICATION_TYPE', 'SYSTEM', '시스템', '시스템 알림', '시스템 관련 알림', true, 5, NOW(), NOW());

-- 중복 방지를 위한 조건부 삽입
INSERT IGNORE INTO common_codes (code_group, code_value, code_name, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('NOTIFICATION_TYPE', 'SUCCESS', '성공', '성공 알림', '성공적인 작업 완료 알림', true, 1, NOW(), NOW()),
('NOTIFICATION_TYPE', 'ERROR', '오류', '오류 알림', '오류 발생 알림', true, 2, NOW(), NOW()),
('NOTIFICATION_TYPE', 'WARNING', '경고', '경고 알림', '주의가 필요한 상황 알림', true, 3, NOW(), NOW()),
('NOTIFICATION_TYPE', 'INFO', '정보', '정보 알림', '일반적인 정보 제공 알림', true, 4, NOW(), NOW()),
('NOTIFICATION_TYPE', 'SYSTEM', '시스템', '시스템 알림', '시스템 관련 알림', true, 5, NOW(), NOW());
