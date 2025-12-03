-- ========================================
-- 공통코드 시스템 설정
-- 작성일: 2025-12-03
-- 목적: 시스템 공통코드 vs 테넌트 공통코드 구분
-- ========================================

-- ========================================
-- 1. code_group_metadata 테이블 수정
-- ========================================

-- category 컬럼 추가 (없는 경우 - 에러 무시)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'core_solution' 
       AND TABLE_NAME = 'code_group_metadata' 
       AND COLUMN_NAME = 'category') = 0,
    'ALTER TABLE code_group_metadata ADD COLUMN category VARCHAR(50) COMMENT ''카테고리 (USER, SYSTEM, BUSINESS, FINANCE, etc)''',
    'SELECT ''category column already exists'''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- code_type 컬럼 기본값 설정
ALTER TABLE code_group_metadata
MODIFY COLUMN code_type VARCHAR(20) DEFAULT 'TENANT' COMMENT 'SYSTEM 또는 TENANT';

-- ========================================
-- 2. 시스템 공통코드 그룹 메타데이터 삽입
-- ========================================

-- 사용자 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('USER_STATUS', '사용자 상태', 'SYSTEM', 'USER', '사용자 계정 상태', 'person', 1, 1),
('GENDER', '성별', 'SYSTEM', 'USER', '성별 구분', 'gender', 1, 2),
('AGE_GROUP', '연령대', 'SYSTEM', 'USER', '연령대 구분', 'people', 1, 3)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 시스템 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('SYSTEM_STATUS', '시스템 상태', 'SYSTEM', 'SYSTEM', '시스템 운영 상태', 'server', 1, 10),
('NOTIFICATION_TYPE', '알림 타입', 'SYSTEM', 'SYSTEM', '알림 발송 방법', 'bell', 1, 11),
('LOG_LEVEL', '로그 레벨', 'SYSTEM', 'SYSTEM', '로그 레벨', 'file', 1, 12)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 금융 관련 (표준)
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('BANK', '은행', 'SYSTEM', 'FINANCE', '은행 목록', 'bank', 1, 20),
('PAYMENT_STATUS', '결제 상태', 'SYSTEM', 'FINANCE', '결제 처리 상태', 'card', 1, 21)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 주소 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('ADDRESS_TYPE', '주소 타입', 'SYSTEM', 'ADDRESS', '주소 유형', 'house', 1, 30),
('REGION', '지역', 'SYSTEM', 'ADDRESS', '시/도 지역', 'map', 1, 31)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 날짜/시간 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('DAY_OF_WEEK', '요일', 'SYSTEM', 'TIME', '요일 구분', 'calendar', 1, 40),
('TIME_SLOT', '시간대', 'SYSTEM', 'TIME', '시간대 구분', 'clock', 1, 41)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- ========================================
-- 3. 테넌트 공통코드 그룹 메타데이터 삽입
-- ========================================

-- 상담 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('CONSULTATION_PACKAGE', '상담 패키지', 'TENANT', 'CONSULT', '상담 패키지 (금액 포함)', 'box', 1, 100),
('PACKAGE_TYPE', '패키지 타입', 'TENANT', 'CONSULT', '패키지 유형', 'tag', 1, 101),
('SPECIALTY', '전문 분야', 'TENANT', 'CONSULT', '상담사 전문 분야', 'star', 1, 102),
('CONSULTATION_TYPE', '상담 유형', 'TENANT', 'CONSULT', '상담 방식', 'chat', 1, 103),
('CONSULTATION_STATUS', '상담 상태', 'TENANT', 'CONSULT', '상담 진행 상태', 'check', 1, 104),
('CONSULTATION_OUTCOME', '상담 결과', 'TENANT', 'CONSULT', '상담 결과', 'clipboard', 1, 105),
('REFERRAL_SOURCE', '의뢰 경로', 'TENANT', 'CONSULT', '내담자 유입 경로', 'signpost', 1, 106),
('ASSESSMENT_TYPE', '평가 유형', 'TENANT', 'CONSULT', '심리평가 유형 (금액 포함)', 'file', 1, 107)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 재무 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('PAYMENT_METHOD', '결제 방법', 'TENANT', 'FINANCE', '결제 수단', 'wallet', 1, 200),
('FINANCIAL_CATEGORY', '재무 카테고리', 'TENANT', 'FINANCE', '수입/지출 분류', 'cash', 1, 201),
('TAX_CATEGORY', '세금 카테고리', 'TENANT', 'FINANCE', '세금 분류', 'receipt', 1, 202),
('BUDGET_CATEGORY', '예산 카테고리', 'TENANT', 'FINANCE', '예산 분류', 'pie', 1, 203)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 구매 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('ITEM_CATEGORY', '품목 카테고리', 'TENANT', 'PURCHASE', '구매 품목 분류', 'cart', 1, 300),
('SUPPLIER', '공급업체', 'TENANT', 'PURCHASE', '공급업체 목록', 'truck', 1, 301)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 인사 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('EMPLOYMENT_TYPE', '고용 형태', 'TENANT', 'HR', '고용 형태', 'briefcase', 1, 400),
('POSITION', '직급', 'TENANT', 'HR', '직급 체계', 'ladder', 1, 401)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- 마케팅 관련
INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES 
('MARKETING_CHANNEL', '마케팅 채널', 'TENANT', 'MARKETING', '마케팅 채널', 'megaphone', 1, 500)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category);

-- ========================================
-- 4. 시스템 공통코드 데이터 삽입
-- ========================================

-- USER_STATUS (사용자 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'USER_STATUS', 'ACTIVE', '활성', '활성', '정상 활동 중인 사용자', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'USER_STATUS', 'INACTIVE', '비활성', '비활성', '비활성화된 사용자', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'USER_STATUS', 'SUSPENDED', '정지', '정지', '이용 정지된 사용자', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'USER_STATUS', 'WITHDRAWN', '탈퇴', '탈퇴', '탈퇴한 사용자', 4, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description);

-- GENDER (성별)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'GENDER', 'MALE', '남성', '남성', '남성', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'GENDER', 'FEMALE', '여성', '여성', '여성', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'GENDER', 'OTHER', '기타', '기타', '기타', 3, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- AGE_GROUP (연령대)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'AGE_GROUP', 'CHILD', '아동', '아동 (7-12세)', '초등학생', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'AGE_GROUP', 'TEEN', '청소년', '청소년 (13-18세)', '중고등학생', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'AGE_GROUP', 'ADULT', '성인', '성인 (19-64세)', '성인', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'AGE_GROUP', 'SENIOR', '노인', '노인 (65세 이상)', '노인', 4, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- SYSTEM_STATUS (시스템 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'SYSTEM_STATUS', 'RUNNING', '정상 운영', '정상 운영', '시스템 정상 가동 중', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'SYSTEM_STATUS', 'MAINTENANCE', '점검 중', '점검 중', '시스템 점검 중', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'SYSTEM_STATUS', 'ERROR', '오류', '오류', '시스템 오류 발생', 3, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- NOTIFICATION_TYPE (알림 타입)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'NOTIFICATION_TYPE', 'EMAIL', '이메일', '이메일', '이메일 알림', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'NOTIFICATION_TYPE', 'SMS', 'SMS', 'SMS', 'SMS 문자 알림', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'NOTIFICATION_TYPE', 'PUSH', '푸시 알림', '푸시 알림', '앱 푸시 알림', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'NOTIFICATION_TYPE', 'KAKAO', '카카오톡', '카카오톡', '카카오톡 알림', 4, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- BANK (은행)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'BANK', 'KB', 'KB국민은행', 'KB국민은행', 'KB국민은행', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'BANK', 'SHINHAN', '신한은행', '신한은행', '신한은행', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'BANK', 'WOORI', '우리은행', '우리은행', '우리은행', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'BANK', 'HANA', '하나은행', '하나은행', '하나은행', 4, 1, 0, 0, NOW(), NOW()),
(NULL, 'BANK', 'NH', 'NH농협은행', 'NH농협은행', 'NH농협은행', 5, 1, 0, 0, NOW(), NOW()),
(NULL, 'BANK', 'IBK', 'IBK기업은행', 'IBK기업은행', 'IBK기업은행', 6, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- PAYMENT_STATUS (결제 상태)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'PAYMENT_STATUS', 'PENDING', '대기', '대기', '결제 대기 중', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'PAYMENT_STATUS', 'COMPLETED', '완료', '완료', '결제 완료', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'PAYMENT_STATUS', 'FAILED', '실패', '실패', '결제 실패', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'PAYMENT_STATUS', 'CANCELLED', '취소', '취소', '결제 취소', 4, 1, 0, 0, NOW(), NOW()),
(NULL, 'PAYMENT_STATUS', 'REFUNDED', '환불', '환불', '결제 환불', 5, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- ADDRESS_TYPE (주소 타입)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'ADDRESS_TYPE', 'HOME', '자택', '자택', '자택 주소', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'ADDRESS_TYPE', 'OFFICE', '직장', '직장', '직장 주소', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'ADDRESS_TYPE', 'OTHER', '기타', '기타', '기타 주소', 3, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- REGION (지역)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'REGION', 'SEOUL', '서울', '서울', '서울특별시', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'BUSAN', '부산', '부산', '부산광역시', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'INCHEON', '인천', '인천', '인천광역시', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'DAEGU', '대구', '대구', '대구광역시', 4, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GWANGJU', '광주', '광주', '광주광역시', 5, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'DAEJEON', '대전', '대전', '대전광역시', 6, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'ULSAN', '울산', '울산', '울산광역시', 7, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'SEJONG', '세종', '세종', '세종특별자치시', 8, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GYEONGGI', '경기', '경기', '경기도', 9, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GANGWON', '강원', '강원', '강원도', 10, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- DAY_OF_WEEK (요일)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'DAY_OF_WEEK', 'MON', '월요일', '월요일', '월요일', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'TUE', '화요일', '화요일', '화요일', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'WED', '수요일', '수요일', '수요일', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'THU', '목요일', '목요일', '목요일', 4, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'FRI', '금요일', '금요일', '금요일', 5, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'SAT', '토요일', '토요일', '토요일', 6, 1, 0, 0, NOW(), NOW()),
(NULL, 'DAY_OF_WEEK', 'SUN', '일요일', '일요일', '일요일', 7, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- TIME_SLOT (시간대)
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES 
(NULL, 'TIME_SLOT', 'MORNING', '오전', '오전 (09:00-12:00)', '오전 시간대', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'TIME_SLOT', 'AFTERNOON', '오후', '오후 (12:00-18:00)', '오후 시간대', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'TIME_SLOT', 'EVENING', '저녁', '저녁 (18:00-21:00)', '저녁 시간대', 3, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name);

-- ========================================
-- 완료
-- ========================================

