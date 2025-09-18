-- MindGarden 공통코드 초기화 스크립트
-- 운영 환경용 - 한 번만 실행

USE mind_garden;

-- 기존 공통코드 삭제 (재실행 시)
DELETE FROM common_codes;

-- 사용자 역할 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('USER_ROLE', 'CLIENT', '내담자', '내담자', '상담을 받는 사용자', 1, 0, 1, NOW(), NOW(), 0),
('USER_ROLE', 'CONSULTANT', '상담사', '상담사', '상담을 제공하는 전문가', 1, 0, 2, NOW(), NOW(), 0),
('USER_ROLE', 'ADMIN', '관리자', '관리자', '시스템 관리자', 1, 0, 3, NOW(), NOW(), 0),
('USER_ROLE', 'SUPER_ADMIN', '슈퍼관리자', '슈퍼관리자', '최고 관리자', 1, 0, 4, NOW(), NOW(), 0);

-- 상담 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SCHEDULE_STATUS', 'PENDING', '대기중', '대기중', '예약 대기 상태', 1, 0, 1, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'CONFIRMED', '확정', '확정', '예약 확정 상태', 1, 0, 2, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'COMPLETED', '완료', '완료', '상담 완료 상태', 1, 0, 3, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'CANCELLED', '취소', '취소', '예약 취소 상태', 1, 0, 4, NOW(), NOW(), 0);

-- 상담 방법 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('CONSULTATION_METHOD', 'FACE_TO_FACE', '대면 상담', '대면 상담', '직접 만나서 하는 상담', 1, 0, 1, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'VIDEO_CALL', '화상 상담', '화상 상담', '화상통화로 하는 상담', 1, 0, 2, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'PHONE_CALL', '전화 상담', '전화 상담', '전화로 하는 상담', 1, 0, 3, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'TEXT_CHAT', '채팅 상담', '채팅 상담', '텍스트 채팅으로 하는 상담', 1, 0, 4, NOW(), NOW(), 0);

-- 상담사 등급 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('CONSULTANT_GRADE', 'INTERN', '인턴', '인턴', '인턴 상담사', 1, 0, 1, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'JUNIOR', '주니어', '주니어', '주니어 상담사', 1, 0, 2, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'SENIOR', '시니어', '시니어', '시니어 상담사', 1, 0, 3, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'EXPERT', '전문가', '전문가', '전문가 상담사', 1, 0, 4, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'MASTER', '마스터', '마스터', '마스터 상담사', 1, 0, 5, NOW(), NOW(), 0);

-- 결제 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('PAYMENT_STATUS', 'PENDING', '결제 대기', '결제 대기', '결제 대기 중', 1, 0, 1, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'COMPLETED', '결제 완료', '결제 완료', '결제가 완료됨', 1, 0, 2, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'FAILED', '결제 실패', '결제 실패', '결제가 실패함', 1, 0, 3, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'CANCELLED', '결제 취소', '결제 취소', '결제가 취소됨', 1, 0, 4, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'REFUNDED', '환불 완료', '환불 완료', '환불이 완료됨', 1, 0, 5, NOW(), NOW(), 0);

-- 알림 유형 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('NOTIFICATION_TYPE', 'SCHEDULE_REMINDER', '일정 알림', '일정 알림', '상담 일정 알림', 1, 0, 1, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'PAYMENT_COMPLETE', '결제 완료', '결제 완료', '결제 완료 알림', 1, 0, 2, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'SCHEDULE_CHANGE', '일정 변경', '일정 변경', '상담 일정 변경 알림', 1, 0, 3, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'SYSTEM_NOTICE', '시스템 공지', '시스템 공지', '시스템 공지사항', 1, 0, 4, NOW(), NOW(), 0);

-- 평가 태그 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('RATING_TAG', 'PROFESSIONAL', '전문적', '전문적', '전문적인 상담', 1, 0, 1, NOW(), NOW(), 0),
('RATING_TAG', 'KIND', '친절함', '친절함', '친절한 상담', 1, 0, 2, NOW(), NOW(), 0),
('RATING_TAG', 'COMFORTABLE', '편안함', '편안함', '편안한 분위기', 1, 0, 3, NOW(), NOW(), 0),
('RATING_TAG', 'HELPFUL', '도움됨', '도움됨', '도움이 되는 상담', 1, 0, 4, NOW(), NOW(), 0),
('RATING_TAG', 'UNDERSTANDING', '이해심', '이해심', '이해심 많은 상담', 1, 0, 5, NOW(), NOW(), 0);

-- 지점 코드 (예시)
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('BRANCH', 'HQ', '본점', '본점', '본점', 1, 0, 1, NOW(), NOW(), 0),
('BRANCH', 'GANGNAM', '강남점', '강남점', '강남지점', 1, 0, 2, NOW(), NOW(), 0),
('BRANCH', 'HONGDAE', '홍대점', '홍대점', '홍대지점', 1, 0, 3, NOW(), NOW(), 0);

SELECT '✅ 공통코드 초기화 완료!' as result;
SELECT COUNT(*) as total_codes FROM common_codes;
