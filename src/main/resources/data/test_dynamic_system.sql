-- 동적 처리 시스템 테스트용 SQL
-- 새로운 코드그룹과 코드 추가 테스트

-- 1. 새로운 코드그룹 메타데이터 추가 테스트
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
('TEST_GROUP', '테스트 그룹', '동적 처리 시스템 테스트용', '🧪', '#ff6b6b', 99, true);

-- 2. 새로운 코드그룹에 코드 추가 테스트
INSERT INTO common_codes (code_group, code_value, code_label, code_description, icon, color_code, is_active, sort_order, created_at, updated_at) VALUES
('TEST_GROUP', 'TEST_OPTION1', '테스트 옵션 1', '첫 번째 테스트 옵션', '🟢', '#10b981', true, 1, NOW(), NOW()),
('TEST_GROUP', 'TEST_OPTION2', '테스트 옵션 2', '두 번째 테스트 옵션', '🟡', '#f59e0b', true, 2, NOW(), NOW()),
('TEST_GROUP', 'TEST_OPTION3', '테스트 옵션 3', '세 번째 테스트 옵션', '🔴', '#ef4444', true, 3, NOW(), NOW());

-- 3. 검증 쿼리
-- 코드그룹 메타데이터 조회
SELECT * FROM code_group_metadata WHERE group_name = 'TEST_GROUP';

-- 해당 그룹의 코드들 조회
SELECT code_group, code_value, code_label, icon, color_code, is_active 
FROM common_codes 
WHERE code_group = 'TEST_GROUP' 
ORDER BY sort_order;

-- 4. 정리 (테스트 완료 후 실행)
-- DELETE FROM common_codes WHERE code_group = 'TEST_GROUP';
-- DELETE FROM code_group_metadata WHERE group_name = 'TEST_GROUP';
