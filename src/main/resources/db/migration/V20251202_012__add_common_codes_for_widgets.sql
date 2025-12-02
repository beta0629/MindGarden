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
    code_group, code_value, code_label, korean_name,
    code_description, sort_order, is_active,
    created_at, updated_at, is_deleted, version
) VALUES
-- 핵심 위젯
('WIDGET_TYPE', 'WELCOME', '환영 위젯', '환영 위젯',
 'Welcome Widget', 1, 1,
 NOW(), NOW(), 0, 0),
('WIDGET_TYPE', 'SUMMARY_PANELS', '요약 패널', '요약 패널',
 'Summary Panels', 2, 1,
 NOW(), NOW(), 0, 0),

-- 관리 위젯
('WIDGET_TYPE', 'CONSULTANT_MANAGEMENT', '상담사 관리', '상담사 관리',
 'Consultant Management', 10, 1,
 NOW(), NOW(), 0, 0),
('WIDGET_TYPE', 'CLIENT_MANAGEMENT', '내담자 관리', '내담자 관리',
 'Client Management', 11, 1,
 NOW(), NOW(), 0, 0),
('WIDGET_TYPE', 'SESSION_MANAGEMENT', '회기 관리', '회기 관리',
 'Session Management', 12, 1,
 NOW(), NOW(), 0, 0),

-- 통계 위젯
('WIDGET_TYPE', 'STATISTICS_GRID', '통계 그리드', '통계 그리드',
 'Statistics Grid', 20, 1,
 NOW(), NOW(), 0, 0),
('WIDGET_TYPE', 'CONSULTATION_SUMMARY', '상담 요약', '상담 요약',
 'Consultation Summary', 21, 1,
 NOW(), NOW(), 0, 0);

-- =====================================================
-- 2. BUSINESS_TYPE (업종)
-- =====================================================

INSERT IGNORE INTO common_codes (
    code_group, code_value, code_label, korean_name,
    code_description, sort_order, is_active,
    created_at, updated_at, is_deleted, version
) VALUES
('BUSINESS_TYPE', 'CONSULTATION', '상담소', '상담소',
 'Consultation Center', 1, 1,
 NOW(), NOW(), 0, 0),
('BUSINESS_TYPE', 'ACADEMY', '학원', '학원',
 'Academy', 2, 1,
 NOW(), NOW(), 0, 0);

-- =====================================================
-- 3. 위젯 오류 메시지
-- =====================================================

INSERT INTO common_codes (
    code_group, code_value, code_label, korean_name,
    code_description, sort_order, is_active,
    created_at, updated_at, is_deleted, version
) VALUES
('ERROR_MESSAGE', 'WIDGET_NOT_FOUND', '위젯을 찾을 수 없습니다', '위젯을 찾을 수 없습니다',
 'Widget not found', 1, 1,
 NOW(), NOW(), 0, 0),
('ERROR_MESSAGE', 'WIDGET_ADD_FORBIDDEN', '이 위젯은 추가할 수 없습니다', '이 위젯은 추가할 수 없습니다',
 'Cannot add this widget', 2, 1,
 NOW(), NOW(), 0, 0),
('ERROR_MESSAGE', 'WIDGET_DELETE_FORBIDDEN', '이 위젯은 삭제할 수 없습니다', '이 위젯은 삭제할 수 없습니다',
 'Cannot delete this widget', 3, 1,
 NOW(), NOW(), 0, 0);
