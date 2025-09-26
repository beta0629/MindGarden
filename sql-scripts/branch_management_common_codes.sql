-- 지점 관리 관련 공통코드 데이터
-- WORKING_DAY, STATS_PERIOD, STATS_METRIC 그룹 추가

-- WORKING_DAY 그룹 (근무일)
INSERT IGNORE INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, version, extra_data) VALUES
('WORKING_DAY', 'MONDAY', '월요일', '월요일', 1, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#007bff"}'),
('WORKING_DAY', 'TUESDAY', '화요일', '화요일', 2, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#007bff"}'),
('WORKING_DAY', 'WEDNESDAY', '수요일', '수요일', 3, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#007bff"}'),
('WORKING_DAY', 'THURSDAY', '목요일', '목요일', 4, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#007bff"}'),
('WORKING_DAY', 'FRIDAY', '금요일', '금요일', 5, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#007bff"}'),
('WORKING_DAY', 'SATURDAY', '토요일', '토요일', 6, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#28a745"}'),
('WORKING_DAY', 'SUNDAY', '일요일', '일요일', 7, TRUE, NOW(), NOW(), 1, '{"icon": "📅", "color": "#dc3545"}');

-- STATS_PERIOD 그룹 (통계 기간)
INSERT IGNORE INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, version, extra_data) VALUES
('STATS_PERIOD', 'week', '최근 1주', '최근 1주간 통계', 1, TRUE, NOW(), NOW(), 1, '{"icon": "📊", "color": "#17a2b8"}'),
('STATS_PERIOD', 'month', '최근 1개월', '최근 1개월간 통계', 2, TRUE, NOW(), NOW(), 1, '{"icon": "📊", "color": "#28a745"}'),
('STATS_PERIOD', 'quarter', '최근 3개월', '최근 3개월간 통계', 3, TRUE, NOW(), NOW(), 1, '{"icon": "📊", "color": "#ffc107"}'),
('STATS_PERIOD', 'year', '최근 1년', '최근 1년간 통계', 4, TRUE, NOW(), NOW(), 1, '{"icon": "📊", "color": "#6f42c1"}');

-- STATS_METRIC 그룹 (통계 지표)
INSERT IGNORE INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, version, extra_data) VALUES
('STATS_METRIC', 'userCount', '사용자 수', '사용자 수 통계', 1, TRUE, NOW(), NOW(), 1, '{"icon": "👥", "color": "#007bff"}'),
('STATS_METRIC', 'consultationCount', '상담 건수', '상담 건수 통계', 2, TRUE, NOW(), NOW(), 1, '{"icon": "💬", "color": "#28a745"}'),
('STATS_METRIC', 'revenue', '매출', '매출 통계', 3, TRUE, NOW(), NOW(), 1, '{"icon": "💰", "color": "#ffc107"}'),
('STATS_METRIC', 'growth', '성장률', '성장률 통계', 4, TRUE, NOW(), NOW(), 1, '{"icon": "📈", "color": "#dc3545"}');
