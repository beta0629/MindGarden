-- =====================================================
-- 위젯 시스템 공통코드 추가
-- =====================================================
-- 목적: 위젯 관련 공통코드 등록 (하드코딩 제거)
-- 작성일: 2025-12-02
-- 표준: COMMON_CODE_SYSTEM_STANDARD.md 준수
-- =====================================================

-- =====================================================
-- 1. WIDGET_TYPE (위젯 타입)
-- =====================================================

INSERT INTO common_codes (
    code_group, code_value, code_name, code_name_ko, code_name_en,
    code_type, display_order, is_active, created_by
) VALUES
-- 코드 그룹
('WIDGET_TYPE', 'WIDGET_TYPE', '위젯 타입', '위젯 타입', 'Widget Type',
 'CORE', 0, TRUE, 'SYSTEM'),

-- 핵심 위젯
('WIDGET_TYPE', 'WELCOME', '환영 위젯', '환영 위젯', 'Welcome Widget',
 'CORE', 1, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'SUMMARY_PANELS', '요약 패널', '요약 패널', 'Summary Panels',
 'CORE', 2, TRUE, 'SYSTEM'),

-- 관리 위젯
('WIDGET_TYPE', 'CONSULTANT_MANAGEMENT', '상담사 관리', '상담사 관리', 'Consultant Management',
 'CORE', 10, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'CLIENT_MANAGEMENT', '내담자 관리', '내담자 관리', 'Client Management',
 'CORE', 11, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'SESSION_MANAGEMENT', '회기 관리', '회기 관리', 'Session Management',
 'CORE', 12, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'TEACHER_MANAGEMENT', '강사 관리', '강사 관리', 'Teacher Management',
 'CORE', 13, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'STUDENT_MANAGEMENT', '학생 관리', '학생 관리', 'Student Management',
 'CORE', 14, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'PARENT_MANAGEMENT', '학부모 관리', '학부모 관리', 'Parent Management',
 'CORE', 15, TRUE, 'SYSTEM'),

-- 통계 위젯
('WIDGET_TYPE', 'STATISTICS_GRID', '통계 그리드', '통계 그리드', 'Statistics Grid',
 'CORE', 20, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'CONSULTATION_SUMMARY', '상담 요약', '상담 요약', 'Consultation Summary',
 'CORE', 21, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'CLASS_SUMMARY', '수업 요약', '수업 요약', 'Class Summary',
 'CORE', 22, TRUE, 'SYSTEM'),

-- 학사 위젯 (학원)
('WIDGET_TYPE', 'ATTENDANCE_MANAGEMENT', '출결 관리', '출결 관리', 'Attendance Management',
 'CORE', 30, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'GRADE_MANAGEMENT', '성적 관리', '성적 관리', 'Grade Management',
 'CORE', 31, TRUE, 'SYSTEM'),

-- 시스템 위젯
('WIDGET_TYPE', 'ERP_MANAGEMENT', 'ERP 관리', 'ERP 관리', 'ERP Management',
 'CORE', 40, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'BILLING_MANAGEMENT', '청구 관리', '청구 관리', 'Billing Management',
 'CORE', 41, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'RECENT_ACTIVITIES', '최근 활동', '최근 활동', 'Recent Activities',
 'CORE', 42, TRUE, 'SYSTEM'),

-- 커스텀 위젯
('WIDGET_TYPE', 'CUSTOM_CHART', '커스텀 차트', '커스텀 차트', 'Custom Chart',
 'CORE', 50, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'CUSTOM_TABLE', '커스텀 테이블', '커스텀 테이블', 'Custom Table',
 'CORE', 51, TRUE, 'SYSTEM'),
('WIDGET_TYPE', 'CUSTOM_MEMO', '메모 위젯', '메모 위젯', 'Memo Widget',
 'CORE', 52, TRUE, 'SYSTEM');

-- =====================================================
-- 2. WIDGET_GROUP_TYPE (위젯 그룹 타입)
-- =====================================================

INSERT INTO common_codes (
    code_group, code_value, code_name, code_name_ko, code_name_en,
    code_type, display_order, is_active, created_by
) VALUES
-- 코드 그룹
('WIDGET_GROUP_TYPE', 'WIDGET_GROUP_TYPE', '위젯 그룹 타입', '위젯 그룹 타입', 'Widget Group Type',
 'CORE', 0, TRUE, 'SYSTEM'),

-- 그룹 타입
('WIDGET_GROUP_TYPE', 'CORE', '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CORE', 1, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'MANAGEMENT', '관리 위젯', '관리 위젯', 'Management Widgets',
 'CORE', 2, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'STATISTICS', '통계 위젯', '통계 위젯', 'Statistics Widgets',
 'CORE', 3, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'ACADEMIC', '학사 위젯', '학사 위젯', 'Academic Widgets',
 'CORE', 4, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'SYSTEM', '시스템 위젯', '시스템 위젯', 'System Widgets',
 'CORE', 5, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'SESSION', '상담 위젯', '상담 위젯', 'Session Widgets',
 'CORE', 6, TRUE, 'SYSTEM'),
('WIDGET_GROUP_TYPE', 'CLIENT', '내담자 위젯', '내담자 위젯', 'Client Widgets',
 'CORE', 7, TRUE, 'SYSTEM');

-- =====================================================
-- 3. BUSINESS_TYPE 업데이트 (기존에 없는 경우만 추가)
-- =====================================================

INSERT IGNORE INTO common_codes (
    code_group, code_value, code_name, code_name_ko, code_name_en,
    code_type, display_order, is_active, created_by
) VALUES
('BUSINESS_TYPE', 'BUSINESS_TYPE', '업종', '업종', 'Business Type',
 'CORE', 0, TRUE, 'SYSTEM'),
('BUSINESS_TYPE', 'CONSULTATION', '상담소', '상담소', 'Consultation Center',
 'CORE', 1, TRUE, 'SYSTEM'),
('BUSINESS_TYPE', 'ACADEMY', '학원', '학원', 'Academy',
 'CORE', 2, TRUE, 'SYSTEM'),
('BUSINESS_TYPE', 'HOSPITAL', '병원', '병원', 'Hospital',
 'CORE', 3, TRUE, 'SYSTEM'),
('BUSINESS_TYPE', 'FOOD_SERVICE', '요식업', '요식업', 'Food Service',
 'CORE', 4, TRUE, 'SYSTEM'),
('BUSINESS_TYPE', 'RETAIL', '소매업', '소매업', 'Retail',
 'CORE', 5, TRUE, 'SYSTEM');

