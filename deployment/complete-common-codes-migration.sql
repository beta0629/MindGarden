-- MindGarden 완전한 공통코드 마이그레이션 스크립트
-- 운영 환경용 - 모든 필요한 공통코드 포함

USE mind_garden;

-- 기존 공통코드 전체 삭제 (재실행 시)
DELETE FROM common_codes;

-- ========================================
-- 1. 기본 시스템 코드
-- ========================================

-- 사용자 역할 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('USER_ROLE', 'CLIENT', '내담자', '내담자', '상담을 받는 사용자', 1, 0, 1, NOW(), NOW(), 0),
('USER_ROLE', 'CONSULTANT', '상담사', '상담사', '상담을 제공하는 전문가', 1, 0, 2, NOW(), NOW(), 0),
('USER_ROLE', 'ADMIN', '관리자', '관리자', '시스템 관리자', 1, 0, 3, NOW(), NOW(), 0),
('USER_ROLE', 'SUPER_ADMIN', '슈퍼관리자', '슈퍼관리자', '최고 관리자', 1, 0, 4, NOW(), NOW(), 0),
('USER_ROLE', 'HQ_ADMIN', 'HQ관리자', 'HQ관리자', '본사 관리자', 1, 0, 5, NOW(), NOW(), 0);

-- 사용자 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('USER_STATUS', 'ACTIVE', '활성', '활성', '활성 상태', 1, 0, 1, NOW(), NOW(), 0),
('USER_STATUS', 'INACTIVE', '비활성', '비활성', '비활성 상태', 1, 0, 2, NOW(), NOW(), 0),
('USER_STATUS', 'SUSPENDED', '정지', '정지', '정지 상태', 1, 0, 3, NOW(), NOW(), 0),
('USER_STATUS', 'PENDING', '대기', '대기', '승인 대기 상태', 1, 0, 4, NOW(), NOW(), 0);

-- 사용자 등급 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('USER_GRADE', 'BRONZE', '브론즈', '브론즈', '브론즈 등급', 1, 0, 1, NOW(), NOW(), 0),
('USER_GRADE', 'SILVER', '실버', '실버', '실버 등급', 1, 0, 2, NOW(), NOW(), 0),
('USER_GRADE', 'GOLD', '골드', '골드', '골드 등급', 1, 0, 3, NOW(), NOW(), 0),
('USER_GRADE', 'PLATINUM', '플래티넘', '플래티넘', '플래티넘 등급', 1, 0, 4, NOW(), NOW(), 0),
('USER_GRADE', 'DIAMOND', '다이아몬드', '다이아몬드', '다이아몬드 등급', 1, 0, 5, NOW(), NOW(), 0);

-- ========================================
-- 2. 지점 관련 코드
-- ========================================

-- 지점 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('BRANCH', 'HQ', '본점', '본점', '본점', 1, 0, 1, NOW(), NOW(), 0),
('BRANCH', 'GANGNAM', '강남점', '강남점', '강남지점', 1, 0, 2, NOW(), NOW(), 0),
('BRANCH', 'HONGDAE', '홍대점', '홍대점', '홍대지점', 1, 0, 3, NOW(), NOW(), 0),
('BRANCH', 'JAMSIL', '잠실점', '잠실점', '잠실지점', 1, 0, 4, NOW(), NOW(), 0),
('BRANCH', 'SINCHON', '신촌점', '신촌점', '신촌지점', 1, 0, 5, NOW(), NOW(), 0);

-- ========================================
-- 3. 상담 관련 코드
-- ========================================

-- 상담 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SCHEDULE_STATUS', 'PENDING', '대기중', '대기중', '예약 대기 상태', 1, 0, 1, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'CONFIRMED', '확정', '확정', '예약 확정 상태', 1, 0, 2, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'COMPLETED', '완료', '완료', '상담 완료 상태', 1, 0, 3, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'CANCELLED', '취소', '취소', '예약 취소 상태', 1, 0, 4, NOW(), NOW(), 0),
('SCHEDULE_STATUS', 'NO_SHOW', '노쇼', '노쇼', '무단 불참', 1, 0, 5, NOW(), NOW(), 0);

-- 상담 방법 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('CONSULTATION_METHOD', 'FACE_TO_FACE', '대면 상담', '대면 상담', '직접 만나서 하는 상담', 1, 0, 1, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'VIDEO_CALL', '화상 상담', '화상 상담', '화상통화로 하는 상담', 1, 0, 2, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'PHONE_CALL', '전화 상담', '전화 상담', '전화로 하는 상담', 1, 0, 3, NOW(), NOW(), 0),
('CONSULTATION_METHOD', 'TEXT_CHAT', '채팅 상담', '채팅 상담', '텍스트 채팅으로 하는 상담', 1, 0, 4, NOW(), NOW(), 0);

-- 상담 완료 사유 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('COMPLETION_REASON', 'NORMAL', '정상 완료', '정상 완료', '정상적으로 완료된 상담', 1, 0, 1, NOW(), NOW(), 0),
('COMPLETION_REASON', 'EARLY_END', '조기 종료', '조기 종료', '예정보다 일찍 종료된 상담', 1, 0, 2, NOW(), NOW(), 0),
('COMPLETION_REASON', 'CLIENT_REQUEST', '내담자 요청', '내담자 요청', '내담자 요청으로 종료', 1, 0, 3, NOW(), NOW(), 0),
('COMPLETION_REASON', 'EMERGENCY', '응급 상황', '응급 상황', '응급 상황으로 인한 종료', 1, 0, 4, NOW(), NOW(), 0);

-- ========================================
-- 4. 상담사 관련 코드
-- ========================================

-- 상담사 등급 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('CONSULTANT_GRADE', 'INTERN', '인턴', '인턴', '인턴 상담사', 1, 0, 1, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'JUNIOR', '주니어', '주니어', '주니어 상담사', 1, 0, 2, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'SENIOR', '시니어', '시니어', '시니어 상담사', 1, 0, 3, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'EXPERT', '전문가', '전문가', '전문가 상담사', 1, 0, 4, NOW(), NOW(), 0),
('CONSULTANT_GRADE', 'MASTER', '마스터', '마스터', '마스터 상담사', 1, 0, 5, NOW(), NOW(), 0);

-- 상담사 전문 분야 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SPECIALTY', 'FAMILY', '가족 상담', '가족 상담', '가족 관계 상담 전문', 1, 0, 1, NOW(), NOW(), 0),
('SPECIALTY', 'COUPLE', '부부 상담', '부부 상담', '부부 관계 상담 전문', 1, 0, 2, NOW(), NOW(), 0),
('SPECIALTY', 'CHILD', '아동 상담', '아동 상담', '아동 상담 전문', 1, 0, 3, NOW(), NOW(), 0),
('SPECIALTY', 'ADOLESCENT', '청소년 상담', '청소년 상담', '청소년 상담 전문', 1, 0, 4, NOW(), NOW(), 0),
('SPECIALTY', 'CAREER', '진로 상담', '진로 상담', '진로 및 직업 상담 전문', 1, 0, 5, NOW(), NOW(), 0),
('SPECIALTY', 'DEPRESSION', '우울증 상담', '우울증 상담', '우울증 치료 전문', 1, 0, 6, NOW(), NOW(), 0),
('SPECIALTY', 'ANXIETY', '불안장애 상담', '불안장애 상담', '불안장애 치료 전문', 1, 0, 7, NOW(), NOW(), 0),
('SPECIALTY', 'TRAUMA', '트라우마 상담', '트라우마 상담', '트라우마 치료 전문', 1, 0, 8, NOW(), NOW(), 0);

-- ========================================
-- 5. 결제 관련 코드
-- ========================================

-- 결제 상태 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('PAYMENT_STATUS', 'PENDING', '결제 대기', '결제 대기', '결제 대기 중', 1, 0, 1, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'COMPLETED', '결제 완료', '결제 완료', '결제가 완료됨', 1, 0, 2, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'FAILED', '결제 실패', '결제 실패', '결제가 실패함', 1, 0, 3, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'CANCELLED', '결제 취소', '결제 취소', '결제가 취소됨', 1, 0, 4, NOW(), NOW(), 0),
('PAYMENT_STATUS', 'REFUNDED', '환불 완료', '환불 완료', '환불이 완료됨', 1, 0, 5, NOW(), NOW(), 0);

-- 결제 방법 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('PAYMENT_METHOD', 'CARD', '신용카드', '신용카드', '신용카드 결제', 1, 0, 1, NOW(), NOW(), 0),
('PAYMENT_METHOD', 'BANK_TRANSFER', '계좌이체', '계좌이체', '계좌이체 결제', 1, 0, 2, NOW(), NOW(), 0),
('PAYMENT_METHOD', 'VIRTUAL_ACCOUNT', '가상계좌', '가상계좌', '가상계좌 결제', 1, 0, 3, NOW(), NOW(), 0),
('PAYMENT_METHOD', 'CASH', '현금', '현금', '현금 결제', 1, 0, 4, NOW(), NOW(), 0);

-- 세션 패키지 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SESSION_PACKAGE', 'SINGLE', '단회기', '단회기', '1회 상담', 1, 0, 1, NOW(), NOW(), 0),
('SESSION_PACKAGE', 'PACKAGE_5', '5회 패키지', '5회 패키지', '5회 상담 패키지', 1, 0, 2, NOW(), NOW(), 0),
('SESSION_PACKAGE', 'PACKAGE_10', '10회 패키지', '10회 패키지', '10회 상담 패키지', 1, 0, 3, NOW(), NOW(), 0),
('SESSION_PACKAGE', 'PACKAGE_20', '20회 패키지', '20회 패키지', '20회 상담 패키지', 1, 0, 4, NOW(), NOW(), 0);

-- ========================================
-- 6. 알림 관련 코드
-- ========================================

-- 알림 유형 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('NOTIFICATION_TYPE', 'SCHEDULE_REMINDER', '일정 알림', '일정 알림', '상담 일정 알림', 1, 0, 1, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'PAYMENT_COMPLETE', '결제 완료', '결제 완료', '결제 완료 알림', 1, 0, 2, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'SCHEDULE_CHANGE', '일정 변경', '일정 변경', '상담 일정 변경 알림', 1, 0, 3, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'SYSTEM_NOTICE', '시스템 공지', '시스템 공지', '시스템 공지사항', 1, 0, 4, NOW(), NOW(), 0),
('NOTIFICATION_TYPE', 'MESSAGE', '메시지', '메시지', '개인 메시지 알림', 1, 0, 5, NOW(), NOW(), 0);

-- ========================================
-- 7. 평가 관련 코드
-- ========================================

-- 평가 태그 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('RATING_TAG', 'PROFESSIONAL', '전문적', '전문적', '전문적인 상담', 1, 0, 1, NOW(), NOW(), 0),
('RATING_TAG', 'KIND', '친절함', '친절함', '친절한 상담', 1, 0, 2, NOW(), NOW(), 0),
('RATING_TAG', 'COMFORTABLE', '편안함', '편안함', '편안한 분위기', 1, 0, 3, NOW(), NOW(), 0),
('RATING_TAG', 'HELPFUL', '도움됨', '도움됨', '도움이 되는 상담', 1, 0, 4, NOW(), NOW(), 0),
('RATING_TAG', 'UNDERSTANDING', '이해심', '이해심', '이해심 많은 상담', 1, 0, 5, NOW(), NOW(), 0),
('RATING_TAG', 'PATIENT', '인내심', '인내심', '인내심 있는 상담', 1, 0, 6, NOW(), NOW(), 0),
('RATING_TAG', 'INSIGHTFUL', '통찰력', '통찰력', '통찰력 있는 조언', 1, 0, 7, NOW(), NOW(), 0);

-- ========================================
-- 8. 급여 관리 코드
-- ========================================

-- 급여 유형 코드
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SALARY_TYPE', 'EMPLOYEE', '직원', '직원', '정규직 직원', 1, 0, 1, NOW(), NOW(), 0),
('SALARY_TYPE', 'FREELANCE', '프리랜서', '프리랜서', '프리랜서 상담사', 1, 0, 2, NOW(), NOW(), 0);

-- 급여 지급일 옵션
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SALARY_PAY_DAY', '5', '매월 5일', '매월 5일', '매월 5일 지급', 1, 0, 1, NOW(), NOW(), 0),
('SALARY_PAY_DAY', '10', '매월 10일', '매월 10일', '매월 10일 지급', 1, 0, 2, NOW(), NOW(), 0),
('SALARY_PAY_DAY', '15', '매월 15일', '매월 15일', '매월 15일 지급', 1, 0, 3, NOW(), NOW(), 0),
('SALARY_PAY_DAY', '25', '매월 25일', '매월 25일', '매월 25일 지급', 1, 0, 4, NOW(), NOW(), 0),
('SALARY_PAY_DAY', 'LAST', '매월 말일', '매월 말일', '매월 말일 지급', 1, 0, 5, NOW(), NOW(), 0),
('SALARY_PAY_DAY', 'CUSTOM', '사용자 정의', '사용자 정의', '사용자가 정의한 날짜', 1, 0, 6, NOW(), NOW(), 0);

-- 급여 옵션 유형
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('SALARY_OPTION_TYPE', 'BONUS', '상여금', '상여금', '성과에 따른 상여금', 1, 0, 1, NOW(), NOW(), 0),
('SALARY_OPTION_TYPE', 'ALLOWANCE', '수당', '수당', '각종 수당', 1, 0, 2, NOW(), NOW(), 0),
('SALARY_OPTION_TYPE', 'OVERTIME', '연장근무수당', '연장근무수당', '연장근무에 대한 수당', 1, 0, 3, NOW(), NOW(), 0),
('SALARY_OPTION_TYPE', 'NIGHT_SHIFT', '야간수당', '야간수당', '야간근무에 대한 수당', 1, 0, 4, NOW(), NOW(), 0),
('SALARY_OPTION_TYPE', 'HOLIDAY', '휴일수당', '휴일수당', '휴일근무에 대한 수당', 1, 0, 5, NOW(), NOW(), 0),
('SALARY_OPTION_TYPE', 'INCENTIVE', '인센티브', '인센티브', '성과 인센티브', 1, 0, 6, NOW(), NOW(), 0);

-- 상담사 등급별 기본급 (월급)
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version, extra_data)
VALUES 
('CONSULTANT_GRADE_SALARY', 'INTERN', '인턴 기본급', '인턴 기본급', '인턴 상담사 월 기본급', 1, 0, 1, NOW(), NOW(), 0, '1800000'),
('CONSULTANT_GRADE_SALARY', 'JUNIOR', '주니어 기본급', '주니어 기본급', '주니어 상담사 월 기본급', 1, 0, 2, NOW(), NOW(), 0, '2200000'),
('CONSULTANT_GRADE_SALARY', 'SENIOR', '시니어 기본급', '시니어 기본급', '시니어 상담사 월 기본급', 1, 0, 3, NOW(), NOW(), 0, '2800000'),
('CONSULTANT_GRADE_SALARY', 'EXPERT', '전문가 기본급', '전문가 기본급', '전문가 상담사 월 기본급', 1, 0, 4, NOW(), NOW(), 0, '3500000');

-- 프리랜서 기본 상담료 (회당)
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version, extra_data)
VALUES 
('FREELANCE_BASE_RATE', 'JUNIOR', '주니어 상담료', '주니어 상담료', '주니어 프리랜서 상담료', 1, 0, 1, NOW(), NOW(), 0, '80000'),
('FREELANCE_BASE_RATE', 'SENIOR', '시니어 상담료', '시니어 상담료', '시니어 프리랜서 상담료', 1, 0, 2, NOW(), NOW(), 0, '100000'),
('FREELANCE_BASE_RATE', 'EXPERT', '전문가 상담료', '전문가 상담료', '전문가 프리랜서 상담료', 1, 0, 3, NOW(), NOW(), 0, '120000'),
('FREELANCE_BASE_RATE', 'MASTER', '마스터 상담료', '마스터 상담료', '마스터 프리랜서 상담료', 1, 0, 4, NOW(), NOW(), 0, '150000');

-- ========================================
-- 9. 재무 관리 코드
-- ========================================

-- 거래 유형
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('TRANSACTION_TYPE', 'INCOME', '수입', '수입', '수입 거래', 1, 0, 1, NOW(), NOW(), 0),
('TRANSACTION_TYPE', 'EXPENSE', '지출', '지출', '지출 거래', 1, 0, 2, NOW(), NOW(), 0);

-- 수입 카테고리
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('INCOME_CATEGORY', 'CONSULTATION', '상담료', '상담료', '상담 서비스 수입', 1, 0, 1, NOW(), NOW(), 0),
('INCOME_CATEGORY', 'EDUCATION', '교육 수입', '교육 수입', '교육 서비스 수입', 1, 0, 2, NOW(), NOW(), 0),
('INCOME_CATEGORY', 'OTHER', '기타 수입', '기타 수입', '기타 수입', 1, 0, 3, NOW(), NOW(), 0);

-- 수입 세부 항목
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version, parent_code_group, parent_code_value)
VALUES 
('INCOME_SUBCATEGORY', 'INDIVIDUAL', '개인 상담', '개인 상담', '개인 상담료', 1, 0, 1, NOW(), NOW(), 0, 'INCOME_CATEGORY', 'CONSULTATION'),
('INCOME_SUBCATEGORY', 'GROUP', '집단 상담', '집단 상담', '집단 상담료', 1, 0, 2, NOW(), NOW(), 0, 'INCOME_CATEGORY', 'CONSULTATION'),
('INCOME_SUBCATEGORY', 'FAMILY', '가족 상담', '가족 상담', '가족 상담료', 1, 0, 3, NOW(), NOW(), 0, 'INCOME_CATEGORY', 'CONSULTATION'),
('INCOME_SUBCATEGORY', 'WORKSHOP', '워크샵', '워크샵', '워크샵 수입', 1, 0, 4, NOW(), NOW(), 0, 'INCOME_CATEGORY', 'EDUCATION'),
('INCOME_SUBCATEGORY', 'SEMINAR', '세미나', '세미나', '세미나 수입', 1, 0, 5, NOW(), NOW(), 0, 'INCOME_CATEGORY', 'EDUCATION');

-- 지출 카테고리
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('EXPENSE_CATEGORY', 'SALARY', '급여', '급여', '직원 급여', 1, 0, 1, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'RENT', '임대료', '임대료', '사무실 임대료', 1, 0, 2, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'UTILITIES', '공과금', '공과금', '전기, 가스, 수도 등', 1, 0, 3, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'SUPPLIES', '사무용품', '사무용품', '사무 용품 구매', 1, 0, 4, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'MARKETING', '마케팅', '마케팅', '마케팅 비용', 1, 0, 5, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'EDUCATION', '교육비', '교육비', '직원 교육 및 연수', 1, 0, 6, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'TRAVEL', '출장비', '출장비', '출장 관련 비용', 1, 0, 7, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'MAINTENANCE', '유지보수', '유지보수', '시설 및 장비 유지보수', 1, 0, 8, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'INSURANCE', '보험료', '보험료', '각종 보험료', 1, 0, 9, NOW(), NOW(), 0),
('EXPENSE_CATEGORY', 'OTHER', '기타', '기타', '기타 지출', 1, 0, 10, NOW(), NOW(), 0);

-- 지출 세부 항목
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version, parent_code_group, parent_code_value)
VALUES 
('EXPENSE_SUBCATEGORY', 'BASE_SALARY', '기본급', '기본급', '기본급여', 1, 0, 1, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'SALARY'),
('EXPENSE_SUBCATEGORY', 'BONUS', '상여금', '상여금', '성과금 및 상여금', 1, 0, 2, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'SALARY'),
('EXPENSE_SUBCATEGORY', 'ALLOWANCE', '수당', '수당', '각종 수당', 1, 0, 3, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'SALARY'),
('EXPENSE_SUBCATEGORY', 'OFFICE_RENT', '사무실 임대', '사무실 임대', '사무실 임대료', 1, 0, 4, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'RENT'),
('EXPENSE_SUBCATEGORY', 'STORAGE_RENT', '창고 임대', '창고 임대', '창고 임대료', 1, 0, 5, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'RENT'),
('EXPENSE_SUBCATEGORY', 'ELECTRICITY', '전기료', '전기료', '전기 사용료', 1, 0, 6, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'UTILITIES'),
('EXPENSE_SUBCATEGORY', 'GAS', '가스료', '가스료', '가스 사용료', 1, 0, 7, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'UTILITIES'),
('EXPENSE_SUBCATEGORY', 'WATER', '수도료', '수도료', '수도 사용료', 1, 0, 8, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'UTILITIES'),
('EXPENSE_SUBCATEGORY', 'INTERNET', '인터넷료', '인터넷료', '인터넷 사용료', 1, 0, 9, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'UTILITIES'),
('EXPENSE_SUBCATEGORY', 'OFFICE_SUPPLIES', '사무용품', '사무용품', '일반 사무용품', 1, 0, 10, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'SUPPLIES'),
('EXPENSE_SUBCATEGORY', 'COMPUTER_SUPPLIES', 'IT용품', 'IT용품', '컴퓨터 및 IT 장비', 1, 0, 11, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'SUPPLIES'),
('EXPENSE_SUBCATEGORY', 'ONLINE_AD', '온라인 광고', '온라인 광고', '온라인 광고비', 1, 0, 12, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'MARKETING'),
('EXPENSE_SUBCATEGORY', 'PRINT_AD', '인쇄 광고', '인쇄 광고', '인쇄 광고비', 1, 0, 13, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'MARKETING'),
('EXPENSE_SUBCATEGORY', 'SEMINAR', '세미나', '세미나', '세미나 참가비', 1, 0, 14, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'EDUCATION'),
('EXPENSE_SUBCATEGORY', 'CERTIFICATION', '자격증', '자격증', '자격증 취득비', 1, 0, 15, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'EDUCATION'),
('EXPENSE_SUBCATEGORY', 'TRANSPORTATION', '교통비', '교통비', '출장 교통비', 1, 0, 16, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'TRAVEL'),
('EXPENSE_SUBCATEGORY', 'ACCOMMODATION', '숙박비', '숙박비', '출장 숙박비', 1, 0, 17, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'TRAVEL'),
('EXPENSE_SUBCATEGORY', 'MEALS', '식비', '식비', '출장 식비', 1, 0, 18, NOW(), NOW(), 0, 'EXPENSE_CATEGORY', 'TRAVEL');

-- 부가세 적용 여부
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('VAT_APPLICABLE', 'Y', '과세', '과세', '부가세 적용 대상', 1, 0, 1, NOW(), NOW(), 0),
('VAT_APPLICABLE', 'N', '비과세', '비과세', '부가세 적용 제외', 1, 0, 2, NOW(), NOW(), 0);

-- ========================================
-- 10. 휴가 관련 코드
-- ========================================

-- 휴가 유형
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('VACATION_TYPE', 'ANNUAL', '연차', '연차', '연차 휴가', 1, 0, 1, NOW(), NOW(), 0),
('VACATION_TYPE', 'SICK', '병가', '병가', '병가 휴가', 1, 0, 2, NOW(), NOW(), 0),
('VACATION_TYPE', 'PERSONAL', '개인사유', '개인사유', '개인 사유 휴가', 1, 0, 3, NOW(), NOW(), 0),
('VACATION_TYPE', 'MATERNITY', '출산휴가', '출산휴가', '출산 휴가', 1, 0, 4, NOW(), NOW(), 0),
('VACATION_TYPE', 'PATERNITY', '육아휴직', '육아휴직', '육아 휴직', 1, 0, 5, NOW(), NOW(), 0);

-- 휴가 상태
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('VACATION_STATUS', 'PENDING', '대기', '대기', '승인 대기', 1, 0, 1, NOW(), NOW(), 0),
('VACATION_STATUS', 'APPROVED', '승인', '승인', '승인됨', 1, 0, 2, NOW(), NOW(), 0),
('VACATION_STATUS', 'REJECTED', '거부', '거부', '거부됨', 1, 0, 3, NOW(), NOW(), 0),
('VACATION_STATUS', 'CANCELLED', '취소', '취소', '취소됨', 1, 0, 4, NOW(), NOW(), 0);

-- 반차 구분
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('HALF_DAY_TYPE', 'MORNING', '오전 반차', '오전 반차', '오전 반일 휴가', 1, 0, 1, NOW(), NOW(), 0),
('HALF_DAY_TYPE', 'AFTERNOON', '오후 반차', '오후 반차', '오후 반일 휴가', 1, 0, 2, NOW(), NOW(), 0);

-- ========================================
-- 11. 알림톡 관련 코드
-- ========================================

-- 알림톡 설정
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('ALIMTALK_CONFIG', 'SENDER_KEY', '발신자키', '발신자키', '카카오 알림톡 발신자 키', 1, 0, 1, NOW(), NOW(), 0),
('ALIMTALK_CONFIG', 'API_KEY', 'API키', 'API키', '알림톡 API 키', 1, 0, 2, NOW(), NOW(), 0),
('ALIMTALK_CONFIG', 'BASE_URL', '기본URL', '기본URL', '알림톡 API 기본 URL', 1, 0, 3, NOW(), NOW(), 0),
('ALIMTALK_CONFIG', 'TIMEOUT', '타임아웃', '타임아웃', 'API 호출 타임아웃(초)', 1, 0, 4, NOW(), NOW(), 0);

-- 알림톡 템플릿
INSERT INTO common_codes (code_group, code_value, code_label, korean_name, code_description, is_active, is_deleted, sort_order, created_at, updated_at, version)
VALUES 
('ALIMTALK_TEMPLATE', 'SCHEDULE_REMINDER', '일정 알림', '일정 알림', '상담 일정 알림 템플릿', 1, 0, 1, NOW(), NOW(), 0),
('ALIMTALK_TEMPLATE', 'PAYMENT_COMPLETE', '결제 완료', '결제 완료', '결제 완료 알림 템플릿', 1, 0, 2, NOW(), NOW(), 0),
('ALIMTALK_TEMPLATE', 'SCHEDULE_CHANGE', '일정 변경', '일정 변경', '일정 변경 알림 템플릿', 1, 0, 3, NOW(), NOW(), 0),
('ALIMTALK_TEMPLATE', 'CANCELLATION', '예약 취소', '예약 취소', '예약 취소 알림 템플릿', 1, 0, 4, NOW(), NOW(), 0),
('ALIMTALK_TEMPLATE', 'WELCOME', '가입 환영', '가입 환영', '회원가입 환영 템플릿', 1, 0, 5, NOW(), NOW(), 0);

-- ========================================
-- 완료 메시지
-- ========================================

SELECT '🎉 완전한 공통코드 마이그레이션 완료!' as result;
SELECT COUNT(*) as total_codes FROM common_codes;
SELECT code_group, COUNT(*) as count FROM common_codes GROUP BY code_group ORDER BY code_group;
