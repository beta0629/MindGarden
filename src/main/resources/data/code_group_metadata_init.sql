-- 코드그룹 메타데이터 초기화
-- 하드코딩된 코드그룹명들을 데이터베이스로 이관

-- 기존 메타데이터 삭제 (있다면)
DELETE FROM code_group_metadata;

-- 코드그룹 메타데이터 등록
INSERT INTO code_group_metadata (group_name, korean_name, description, icon, color_code, display_order, is_active) VALUES
('GENDER', '성별', '사용자 성별 구분', '⚧', '#ef4444', 1, true),
('INCOME_CATEGORY', '수입 카테고리', '수입 항목 분류', '💰', '#10b981', 2, true),
('EXPENSE_CATEGORY', '지출 카테고리', '지출 항목 분류', '💸', '#f59e0b', 3, true),
('PACKAGE_TYPE', '패키지 유형', '상담 패키지 유형', '📦', '#3b82f6', 4, true),
('PAYMENT_METHOD', '결제 방법', '결제 수단', '💳', '#10b981', 5, true),
('PAYMENT_STATUS', '결제 상태', '결제 처리 상태', '🔄', '#f97316', 6, true),
('SPECIALTY', '전문분야', '상담 전문분야', '🎯', '#8b5cf6', 7, true),
('CONSULTATION_TYPE', '상담 유형', '상담의 유형', '💬', '#8b5cf6', 8, true),
('CONSULTATION_STATUS', '상담 상태', '상담 진행 상태', '📋', '#6b7280', 9, true),
('VACATION_TYPE', '휴가 유형', '휴가 종류', '🏖️', '#06b6d4', 10, true),
('CONSULTATION_DURATION', '상담 시간', '상담 소요 시간', '⏰', '#f59e0b', 11, true),
('ADDRESS_TYPE', '주소 유형', '주소 종류', '📍', '#10b981', 12, true),
('ITEM_CATEGORY', '아이템 카테고리', '비품 아이템 분류', '📁', '#6b7280', 13, true),
('MESSAGE_TYPE', '메시지 유형', '메시지 종류', '💌', '#8b5cf6', 14, true),
('USER_ROLE', '사용자 역할', '시스템 사용자 역할', '👑', '#f59e0b', 15, true),
('NOTIFICATION_TYPE', '알림 유형', '알림 종류', '🔔', '#7c3aed', 16, true),
('CONSULTATION_FEE', '상담료', '상담 비용', '💵', '#10b981', 17, true),
('REPORT_PERIOD', '보고서 기간', '리포트 기간 구분', '📊', '#6b7280', 18, true),
('MAPPING_STATUS', '매핑 상태', '상담사-내담자 매핑 상태', '🔗', '#3b82f6', 19, true),
('CONSULTATION_SESSION', '상담 세션', '상담 세션 유형', '🎙️', '#8b5cf6', 20, true),
('PRIORITY', '우선순위', '우선순위 구분', '⚡', '#dc2626', 21, true),
('STATUS', '상태', '일반적인 상태', '🔄', '#f97316', 22, true),
('BRANCH_TYPE', '지점 유형', '지점 분류', '🏢', '#6b7280', 23, true),
('WORK_STATUS', '근무 상태', '직원 근무 상태', '👷', '#10b981', 24, true),
('EMPLOYMENT_TYPE', '고용 유형', '고용 형태', '📋', '#6b7280', 25, true),
('EDUCATION_LEVEL', '학력', '교육 수준', '🎓', '#8b5cf6', 26, true),
('MARITAL_STATUS', '결혼 상태', '결혼 여부', '💍', '#ef4444', 27, true),
('LANGUAGE', '언어', '사용 언어', '🗣️', '#06b6d4', 28, true),
('TIMEZONE', '시간대', '시간대 구분', '🌍', '#f59e0b', 29, true),
('CURRENCY', '통화', '화폐 단위', '💱', '#10b981', 30, true);
