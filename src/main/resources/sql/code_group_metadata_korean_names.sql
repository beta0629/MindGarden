-- 코드 그룹 메타데이터 한글명 추가
-- 모든 코드 그룹에 대한 한글명, 아이콘, 색상 정보를 추가

INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
-- 사용자 관련
('USER_ROLE', '사용자역할', '시스템 사용자의 역할을 나타내는 코드', '👤', '#007bff', 1, true),
('USER_STATUS', '사용자상태', '사용자의 활성/비활성 상태를 나타내는 코드', '🟢', '#28a745', 2, true),
('USER_GRADE', '사용자등급', '사용자의 등급을 나타내는 코드', '⭐', '#ffc107', 3, true),
('CONSULTANT_GRADE', '상담사등급', '상담사의 등급을 나타내는 코드', '👨‍⚕️', '#17a2b8', 4, true),
('CLIENT_STATUS', '내담자상태', '내담자의 상태를 나타내는 코드', '👥', '#6f42c1', 5, true),

-- 시스템 관련
('STATUS', '상태', '일반적인 상태를 나타내는 코드', '📊', '#6c757d', 10, true),
('PRIORITY', '우선순위', '우선순위를 나타내는 코드', '⚡', '#fd7e14', 11, true),
('MAPPING_STATUS', '매핑상태', '상담사-내담자 매핑 상태를 나타내는 코드', '🔗', '#20c997', 12, true),
('GENDER', '성별', '성별을 나타내는 코드', '⚧', '#e83e8c', 13, true),

-- 결제/급여 관련
('PAYMENT_METHOD', '결제방법', '결제 방법을 나타내는 코드', '💳', '#28a745', 20, true),
('PAYMENT_STATUS', '결제상태', '결제 상태를 나타내는 코드', '💰', '#ffc107', 21, true),
('SALARY_STATUS', '급여상태', '급여 상태를 나타내는 코드', '💵', '#17a2b8', 22, true),
('BUDGET_CATEGORY', '예산카테고리', '예산 카테고리를 나타내는 코드', '📈', '#6f42c1', 23, true),
('BUDGET_STATUS', '예산상태', '예산 상태를 나타내는 코드', '📊', '#fd7e14', 24, true),

-- 상담 관련
('CONSULTATION_PACKAGE', '상담패키지', '상담 패키지를 나타내는 코드', '📦', '#007bff', 30, true),
('CONSULTATION_STATUS', '상담상태', '상담 상태를 나타내는 코드', '🔄', '#28a745', 31, true),
('CONSULTATION_TYPE', '상담유형', '상담 유형을 나타내는 코드', '🎯', '#ffc107', 32, true),
('CONSULTATION_METHOD', '상담방법', '상담 방법을 나타내는 코드', '📞', '#17a2b8', 33, true),
('CONSULTATION_LOCATION', '상담장소', '상담 장소를 나타내는 코드', '🏢', '#6f42c1', 34, true),
('CONSULTATION_SESSION', '상담세션', '상담 세션을 나타내는 코드', '⏰', '#fd7e14', 35, true),
('SCHEDULE_STATUS', '스케줄상태', '스케줄 상태를 나타내는 코드', '📅', '#20c997', 36, true),
('SCHEDULE_TYPE', '스케줄유형', '스케줄 유형을 나타내는 코드', '📋', '#e83e8c', 37, true),
('SESSION_PACKAGE', '회기패키지', '회기 패키지를 나타내는 코드', '🎫', '#6c757d', 38, true),

-- ERP 관련
('PURCHASE_STATUS', '구매상태', '구매 상태를 나타내는 코드', '🛒', '#007bff', 40, true),
('PURCHASE_CATEGORY', '구매카테고리', '구매 카테고리를 나타내는 코드', '📦', '#28a745', 41, true),
('FINANCIAL_STATUS', '재무상태', '재무 상태를 나타내는 코드', '💼', '#ffc107', 42, true),
('TAX_CATEGORY', '세무카테고리', '세무 카테고리를 나타내는 코드', '🧾', '#17a2b8', 43, true),

-- 휴가 관련
('VACATION_TYPE', '휴가유형', '휴가 유형을 나타내는 코드', '🏖️', '#20c997', 50, true),
('VACATION_STATUS', '휴가상태', '휴가 상태를 나타내는 코드', '📝', '#6f42c1', 51, true),

-- 보고서 관련
('REPORT_PERIOD', '보고서기간', '보고서 기간을 나타내는 코드', '📊', '#fd7e14', 60, true),
('YEAR_RANGE', '년도범위', '년도 범위를 나타내는 코드', '📅', '#e83e8c', 61, true),
('MONTH_RANGE', '월범위', '월 범위를 나타내는 코드', '📆', '#6c757d', 62, true),
('DATE_RANGE', '날짜범위', '날짜 범위를 나타내는 코드', '🗓️', '#007bff', 63, true),

-- 기타
('RESPONSIBILITY', '담당분야', '담당 분야를 나타내는 코드', '🎯', '#28a745', 70, true),
('PRIORITY_LEVEL', '우선순위레벨', '우선순위 레벨을 나타내는 코드', '⚡', '#ffc107', 71, true)

ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    description = VALUES(description),
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    display_order = VALUES(display_order),
    is_active = VALUES(is_active);

-- 결과 확인
SELECT '코드 그룹 메타데이터 한글명 추가 완료' as status, COUNT(*) as total_metadata 
FROM code_group_metadata 
WHERE is_active = true;
