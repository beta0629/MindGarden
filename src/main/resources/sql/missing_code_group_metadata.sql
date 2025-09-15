-- 누락된 코드 그룹 메타데이터 추가
-- 실제 데이터베이스에 있는 코드 그룹들 중 누락된 것들 추가

INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
-- 누락된 코드 그룹들
('DATE_RANGE_FILTER', '날짜범위필터', '날짜 범위 필터 옵션을 나타내는 코드', '📅', '#007bff', 64, true),
('DURATION', '기간', '기간을 나타내는 코드', '⏱️', '#28a745', 65, true),
('EXPENSE_SUBCATEGORY', '지출하위카테고리', '지출 하위 카테고리를 나타내는 코드', '📊', '#ffc107', 66, true),
('FILE_TYPE', '파일유형', '파일 유형을 나타내는 코드', '📄', '#17a2b8', 67, true),
('FINANCIAL_CATEGORY', '재무카테고리', '재무 카테고리를 나타내는 코드', '💰', '#6f42c1', 68, true),
('ADDRESS_TYPE', '주소유형', '주소 유형을 나타내는 코드', '🏠', '#fd7e14', 69, true),
('ADMIN_MENU', '관리자메뉴', '관리자 메뉴를 나타내는 코드', '⚙️', '#20c997', 70, true),
('APPROVAL_STATUS', '승인상태', '승인 상태를 나타내는 코드', '✅', '#e83e8c', 71, true),
('BANK', '은행', '은행을 나타내는 코드', '🏦', '#6c757d', 72, true),
('BRANCH_SUPER_ADMIN_MENU', '지점수퍼관리자메뉴', '지점 수퍼관리자 메뉴를 나타내는 코드', '👑', '#007bff', 73, true),
('CHART_TYPE_FILTER', '차트유형필터', '차트 유형 필터를 나타내는 코드', '📈', '#28a745', 74, true),
('CLIENT_MENU', '내담자메뉴', '내담자 메뉴를 나타내는 코드', '👥', '#ffc107', 75, true),
('COMMON_CODE_GROUP', '공통코드그룹', '공통 코드 그룹을 나타내는 코드', '📋', '#17a2b8', 76, true),
('COMMON_MENU', '공통메뉴', '공통 메뉴를 나타내는 코드', '🔧', '#6f42c1', 77, true),
('CONSULTANT_GRADE_SALARY', '상담사등급급여', '상담사 등급별 급여를 나타내는 코드', '💵', '#fd7e14', 78, true),
('CONSULTANT_MENU', '상담사메뉴', '상담사 메뉴를 나타내는 코드', '👨‍⚕️', '#20c997', 79, true),
('CONSULTATION_FEE', '상담료', '상담료를 나타내는 코드', '💳', '#e83e8c', 80, true),
('CONSULTATION_MODE', '상담모드', '상담 모드를 나타내는 코드', '🔄', '#6c757d', 81, true),
('CURRENCY', '통화', '통화를 나타내는 코드', '💱', '#007bff', 82, true),
('FREELANCE_BASE_RATE', '프리랜서기본요율', '프리랜서 기본 요율을 나타내는 코드', '💼', '#28a745', 83, true),
('HQ_ADMIN_MENU', '본사관리자메뉴', '본사 관리자 메뉴를 나타내는 코드', '🏢', '#ffc107', 84, true),
('INCOME_CATEGORY', '수입카테고리', '수입 카테고리를 나타내는 코드', '📈', '#17a2b8', 85, true),
('INCOME_SUBCATEGORY', '수입하위카테고리', '수입 하위 카테고리를 나타내는 코드', '📊', '#6f42c1', 86, true),
('ITEM_CATEGORY', '항목카테고리', '항목 카테고리를 나타내는 코드', '📦', '#fd7e14', 87, true),
('LANGUAGE', '언어', '언어를 나타내는 코드', '🌐', '#20c997', 88, true),
('MENU', '메뉴', '메뉴를 나타내는 코드', '📋', '#e83e8c', 89, true),
('MENU_CATEGORY', '메뉴카테고리', '메뉴 카테고리를 나타내는 코드', '🗂️', '#6c757d', 90, true),
('MESSAGE_TYPE', '메시지유형', '메시지 유형을 나타내는 코드', '💬', '#007bff', 91, true),
('NOTIFICATION_CHANNEL', '알림채널', '알림 채널을 나타내는 코드', '🔔', '#28a745', 92, true),
('NOTIFICATION_TYPE', '알림유형', '알림 유형을 나타내는 코드', '📢', '#ffc107', 93, true),
('PACKAGE_TYPE', '패키지유형', '패키지 유형을 나타내는 코드', '📦', '#17a2b8', 94, true),
('PAYMENT_PROVIDER', '결제제공자', '결제 제공자를 나타내는 코드', '💳', '#6f42c1', 95, true),
('PERMISSION', '권한', '권한을 나타내는 코드', '🔐', '#fd7e14', 96, true),
('ROLE', '역할', '역할을 나타내는 코드', '👤', '#20c997', 97, true),
('ROLE_PERMISSION', '역할권한', '역할 권한을 나타내는 코드', '🔑', '#e83e8c', 98, true),
('SALARY_OPTION_TYPE', '급여옵션유형', '급여 옵션 유형을 나타내는 코드', '💰', '#6c757d', 99, true),
('SALARY_PAY_DAY', '급여지급일', '급여 지급일을 나타내는 코드', '📅', '#007bff', 100, true),
('SALARY_TYPE', '급여유형', '급여 유형을 나타내는 코드', '💵', '#28a745', 101, true),
('SCHEDULE_FILTER', '스케줄필터', '스케줄 필터를 나타내는 코드', '🔍', '#ffc107', 102, true),
('SCHEDULE_SORT', '스케줄정렬', '스케줄 정렬을 나타내는 코드', '📊', '#17a2b8', 103, true),
('SORT_OPTION', '정렬옵션', '정렬 옵션을 나타내는 코드', '🔄', '#6f42c1', 104, true),
('SPECIALTY', '전문분야', '전문 분야를 나타내는 코드', '🎯', '#fd7e14', 105, true),
('TAX_CALCULATION', '세금계산', '세금 계산을 나타내는 코드', '🧮', '#20c997', 106, true),
('TIMEZONE', '시간대', '시간대를 나타내는 코드', '🌍', '#e83e8c', 107, true),
('TRANSACTION_TYPE', '거래유형', '거래 유형을 나타내는 코드', '💸', '#6c757d', 108, true),
('VAT_APPLICABLE', '부가세적용', '부가세 적용을 나타내는 코드', '🧾', '#007bff', 109, true)

ON DUPLICATE KEY UPDATE 
    korean_name = VALUES(korean_name),
    description = VALUES(description),
    icon = VALUES(icon),
    color_code = VALUES(color_code),
    display_order = VALUES(display_order),
    is_active = VALUES(is_active);

-- 결과 확인
SELECT '누락된 코드 그룹 메타데이터 추가 완료' as status, COUNT(*) as total_metadata 
FROM code_group_metadata 
WHERE is_active = true;
