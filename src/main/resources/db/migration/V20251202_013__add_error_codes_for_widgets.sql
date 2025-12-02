-- =====================================================
-- 위젯 시스템 에러 코드 추가
-- =====================================================
-- 목적: API 에러 메시지를 공통코드로 관리 (하드코딩 제거)
-- 작성일: 2025-12-02
-- 표준: COMMON_CODE_SYSTEM_STANDARD.md 준수
-- =====================================================

-- =====================================================
-- ERROR_CODE (에러 코드)
-- =====================================================

INSERT INTO common_codes (
    code_group, code_value, code_name, code_name_ko, code_name_en,
    code_type, display_order, description, is_active, created_by
) VALUES
-- 코드 그룹
('ERROR_CODE', 'ERROR_CODE', '에러 코드', '에러 코드', 'Error Code',
 'CORE', 0, 'API 에러 코드 관리', TRUE, 'SYSTEM'),

-- 위젯 그룹 관련 에러
('ERROR_CODE', 'WIDGET_GROUP_FETCH_ERROR', '위젯 그룹 조회 실패', '위젯 그룹 조회 중 오류가 발생했습니다', 'Failed to fetch widget groups',
 'CORE', 100, '위젯 그룹 조회 실패', TRUE, 'SYSTEM'),

('ERROR_CODE', 'WIDGET_FETCH_ERROR', '위젯 조회 실패', '위젯 조회 중 오류가 발생했습니다', 'Failed to fetch widgets',
 'CORE', 101, '위젯 조회 실패', TRUE, 'SYSTEM'),

('ERROR_CODE', 'GROUPED_WIDGET_FETCH_ERROR', '그룹화된 위젯 조회 실패', '그룹화된 위젯 조회 중 오류가 발생했습니다', 'Failed to fetch grouped widgets',
 'CORE', 102, '그룹화된 위젯 조회 실패', TRUE, 'SYSTEM'),

('ERROR_CODE', 'AVAILABLE_WIDGET_FETCH_ERROR', '독립 위젯 조회 실패', '독립 위젯 조회 중 오류가 발생했습니다', 'Failed to fetch available widgets',
 'CORE', 103, '독립 위젯 조회 실패', TRUE, 'SYSTEM'),

-- 위젯 추가/삭제 관련 에러
('ERROR_CODE', 'WIDGET_ADD_FORBIDDEN', '위젯 추가 권한 없음', '이 위젯은 추가할 수 없습니다 (시스템 관리 위젯)', 'Cannot add this widget (system-managed)',
 'CORE', 110, '위젯 추가 권한 없음', TRUE, 'SYSTEM'),

('ERROR_CODE', 'WIDGET_ADD_ERROR', '위젯 추가 실패', '위젯 추가 중 오류가 발생했습니다', 'Failed to add widget',
 'CORE', 111, '위젯 추가 실패', TRUE, 'SYSTEM'),

('ERROR_CODE', 'WIDGET_DELETE_FORBIDDEN', '위젯 삭제 권한 없음', '이 위젯은 삭제할 수 없습니다 (시스템 관리 위젯)', 'Cannot delete this widget (system-managed)',
 'CORE', 112, '위젯 삭제 권한 없음', TRUE, 'SYSTEM'),

('ERROR_CODE', 'WIDGET_DELETE_ERROR', '위젯 삭제 실패', '위젯 삭제 중 오류가 발생했습니다', 'Failed to delete widget',
 'CORE', 113, '위젯 삭제 실패', TRUE, 'SYSTEM'),

-- 권한 관련 에러
('ERROR_CODE', 'PERMISSION_CHECK_ERROR', '권한 확인 실패', '위젯 권한 확인 중 오류가 발생했습니다', 'Failed to check widget permissions',
 'CORE', 120, '권한 확인 실패', TRUE, 'SYSTEM'),

-- 공통 에러
('ERROR_CODE', 'INVALID_REQUEST', '잘못된 요청', '요청 데이터가 올바르지 않습니다', 'Invalid request data',
 'CORE', 200, '잘못된 요청', TRUE, 'SYSTEM'),

('ERROR_CODE', 'INTERNAL_SERVER_ERROR', '서버 오류', '서버 내부 오류가 발생했습니다', 'Internal server error',
 'CORE', 500, '서버 내부 오류', TRUE, 'SYSTEM');

-- =====================================================
-- SUCCESS_MESSAGE (성공 메시지)
-- =====================================================

INSERT INTO common_codes (
    code_group, code_value, code_name, code_name_ko, code_name_en,
    code_type, display_order, description, is_active, created_by
) VALUES
-- 코드 그룹
('SUCCESS_MESSAGE', 'SUCCESS_MESSAGE', '성공 메시지', '성공 메시지', 'Success Message',
 'CORE', 0, 'API 성공 메시지 관리', TRUE, 'SYSTEM'),

-- 위젯 관련 성공 메시지
('SUCCESS_MESSAGE', 'WIDGET_ADD_SUCCESS', '위젯 추가 성공', '위젯이 추가되었습니다', 'Widget added successfully',
 'CORE', 100, '위젯 추가 성공', TRUE, 'SYSTEM'),

('SUCCESS_MESSAGE', 'WIDGET_DELETE_SUCCESS', '위젯 삭제 성공', '위젯이 삭제되었습니다', 'Widget deleted successfully',
 'CORE', 101, '위젯 삭제 성공', TRUE, 'SYSTEM'),

('SUCCESS_MESSAGE', 'WIDGET_UPDATE_SUCCESS', '위젯 수정 성공', '위젯이 수정되었습니다', 'Widget updated successfully',
 'CORE', 102, '위젯 수정 성공', TRUE, 'SYSTEM'),

('SUCCESS_MESSAGE', 'WIDGET_PERMISSION_VERIFIED', '위젯 권한 확인', '위젯 권한이 확인되었습니다', 'Widget permission verified',
 'CORE', 103, '위젯 권한 확인', TRUE, 'SYSTEM');

