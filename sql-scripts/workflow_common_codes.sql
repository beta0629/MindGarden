-- 워크플로우 자동화 관련 공통코드
-- 사용자 역할 코드
INSERT INTO common_code_groups (group_code, group_name, description, is_active, created_at, updated_at) VALUES
('USER_ROLE', '사용자 역할', '시스템 내 사용자 역할 코드', true, NOW(), NOW()),
('MESSAGE_TYPE', '메시지 타입', '알림 메시지 타입 코드', true, NOW(), NOW()),
('WORKFLOW_STATUS', '워크플로우 상태', '워크플로우 실행 상태 코드', true, NOW(), NOW()),
('SCHEDULE_STATUS', '스케줄 상태', '스케줄 상태 코드', true, NOW(), NOW()),
('PAYMENT_STATUS', '결제 상태', '결제 상태 코드', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE group_name = VALUES(group_name), description = VALUES(description);

-- 사용자 역할 코드값
INSERT INTO common_codes (group_code, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
('USER_ROLE', 'CONSULTANT', '상담사', '상담을 담당하는 전문가', 1, true, NOW(), NOW()),
('USER_ROLE', 'CLIENT', '내담자', '상담을 받는 고객', 2, true, NOW(), NOW()),
('USER_ROLE', 'ADMIN', '관리자', '시스템 관리자', 3, true, NOW(), NOW()),
('USER_ROLE', 'BRANCH_SUPER_ADMIN', '지점 수퍼 관리자', '지점 최고 관리자', 4, true, NOW(), NOW()),
('USER_ROLE', 'HQ_MASTER', '본사 마스터', '본사 최고 관리자', 5, true, NOW(), NOW()),
('USER_ROLE', 'BRANCH_MANAGER', '지점 관리자', '지점 관리자', 6, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name), description = VALUES(description);

-- 메시지 타입 코드값
INSERT INTO common_codes (group_code, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
('MESSAGE_TYPE', 'APPOINTMENT_CONFIRMATION', '예약 확인', '예약 생성 시 확인 메시지', 1, true, NOW(), NOW()),
('MESSAGE_TYPE', 'NEW_APPOINTMENT', '새 예약', '새로운 예약 생성 알림', 2, true, NOW(), NOW()),
('MESSAGE_TYPE', 'COMPLETION', '상담 완료', '상담 완료 알림', 3, true, NOW(), NOW()),
('MESSAGE_TYPE', 'RATING_REQUEST', '평가 요청', '상담 평가 요청 메시지', 4, true, NOW(), NOW()),
('MESSAGE_TYPE', 'PAYMENT_COMPLETION', '결제 완료', '결제 완료 알림', 5, true, NOW(), NOW()),
('MESSAGE_TYPE', 'REMINDER', '리마인더', '예약 리마인더 메시지', 6, true, NOW(), NOW()),
('MESSAGE_TYPE', 'INCOMPLETE_CONSULTATION', '미완료 상담', '미완료 상담 알림', 7, true, NOW(), NOW()),
('MESSAGE_TYPE', 'DAILY_SUMMARY', '일일 요약', '일일 성과 요약 메시지', 8, true, NOW(), NOW()),
('MESSAGE_TYPE', 'MONTHLY_REPORT', '월간 리포트', '월간 성과 리포트', 9, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name), description = VALUES(description);

-- 워크플로우 상태 코드값
INSERT INTO common_codes (group_code, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
('WORKFLOW_STATUS', 'SUCCESS', '성공', '워크플로우 실행 성공', 1, true, NOW(), NOW()),
('WORKFLOW_STATUS', 'FAILED', '실패', '워크플로우 실행 실패', 2, true, NOW(), NOW()),
('WORKFLOW_STATUS', 'RUNNING', '실행중', '워크플로우 실행 중', 3, true, NOW(), NOW()),
('WORKFLOW_STATUS', 'PENDING', '대기', '워크플로우 실행 대기', 4, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name), description = VALUES(description);

-- 스케줄 상태 코드값 (기존 것과 중복되지 않도록 확인)
INSERT INTO common_codes (group_code, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
('SCHEDULE_STATUS', 'BOOKED', '예약됨', '예약이 확정된 상태', 1, true, NOW(), NOW()),
('SCHEDULE_STATUS', 'CONFIRMED', '확정됨', '예약이 확정된 상태', 2, true, NOW(), NOW()),
('SCHEDULE_STATUS', 'COMPLETED', '완료됨', '상담이 완료된 상태', 3, true, NOW(), NOW()),
('SCHEDULE_STATUS', 'CANCELLED', '취소됨', '예약이 취소된 상태', 4, true, NOW(), NOW()),
('SCHEDULE_STATUS', 'NO_SHOW', '미참석', '예약 시간에 참석하지 않은 상태', 5, true, NOW(), NOW()),
('SCHEDULE_STATUS', 'VACATION', '휴가', '상담사 휴가 상태', 6, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name), description = VALUES(description);

-- 결제 상태 코드값
INSERT INTO common_codes (group_code, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
('PAYMENT_STATUS', 'PENDING', '대기', '결제 대기 상태', 1, true, NOW(), NOW()),
('PAYMENT_STATUS', 'APPROVED', '승인', '결제 승인 상태', 2, true, NOW(), NOW()),
('PAYMENT_STATUS', 'CANCELLED', '취소', '결제 취소 상태', 3, true, NOW(), NOW()),
('PAYMENT_STATUS', 'REFUNDED', '환불', '결제 환불 상태', 4, true, NOW(), NOW()),
('PAYMENT_STATUS', 'FAILED', '실패', '결제 실패 상태', 5, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE code_name = VALUES(code_name), description = VALUES(description);
