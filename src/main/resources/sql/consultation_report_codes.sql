-- 상담 리포트 관련 공통 코드 추가
-- 작성일: 2025-09-12
-- 작성자: MindGarden Team

-- 1. 보고서 기간 코드 그룹
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('REPORT_PERIOD', 'WEEK', '주별', '주별 리포트 기간', 1, true, NOW(), NOW(), false, 0),
('REPORT_PERIOD', 'MONTH', '월별', '월별 리포트 기간', 2, true, NOW(), NOW(), false, 0),
('REPORT_PERIOD', 'QUARTER', '분기별', '분기별 리포트 기간', 3, true, NOW(), NOW(), false, 0),
('REPORT_PERIOD', 'YEAR', '년별', '년별 리포트 기간', 4, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 2. 년도 범위 코드 그룹 (최근 10년)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('YEAR_RANGE', '2015', '2015년', '2015년도', 1, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2016', '2016년', '2016년도', 2, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2017', '2017년', '2017년도', 3, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2018', '2018년', '2018년도', 4, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2019', '2019년', '2019년도', 5, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2020', '2020년', '2020년도', 6, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2021', '2021년', '2021년도', 7, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2022', '2022년', '2022년도', 8, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2023', '2023년', '2023년도', 9, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2024', '2024년', '2024년도', 10, true, NOW(), NOW(), false, 0),
('YEAR_RANGE', '2025', '2025년', '2025년도', 11, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 3. 월 범위 코드 그룹 (1-12월)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('MONTH_RANGE', '1', '1월', '1월', 1, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '2', '2월', '2월', 2, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '3', '3월', '3월', 3, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '4', '4월', '4월', 4, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '5', '5월', '5월', 5, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '6', '6월', '6월', 6, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '7', '7월', '7월', 7, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '8', '8월', '8월', 8, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '9', '9월', '9월', 9, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '10', '10월', '10월', 10, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '11', '11월', '11월', 11, true, NOW(), NOW(), false, 0),
('MONTH_RANGE', '12', '12월', '12월', 12, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 4. 날짜 범위 코드 그룹 (통계 대시보드용)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('DATE_RANGE', 'TODAY', '오늘', '오늘 날짜 범위', 1, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'YESTERDAY', '어제', '어제 날짜 범위', 2, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'THIS_WEEK', '이번 주', '이번 주 날짜 범위', 3, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_WEEK', '지난 주', '지난 주 날짜 범위', 4, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'THIS_MONTH', '이번 달', '이번 달 날짜 범위', 5, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_MONTH', '지난 달', '지난 달 날짜 범위', 6, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'THIS_QUARTER', '이번 분기', '이번 분기 날짜 범위', 7, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_QUARTER', '지난 분기', '지난 분기 날짜 범위', 8, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'THIS_YEAR', '올해', '올해 날짜 범위', 9, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_YEAR', '작년', '작년 날짜 범위', 10, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_30_DAYS', '최근 30일', '최근 30일 날짜 범위', 11, true, NOW(), NOW(), false, 0),
('DATE_RANGE', 'LAST_90_DAYS', '최근 90일', '최근 90일 날짜 범위', 12, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 5. 매칭 상태 코드 그룹
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('MAPPING_STATUS', 'HAS_MAPPING', '매칭 있음', '매칭이 존재하는 상태', 1, true, NOW(), NOW(), false, 0),
('MAPPING_STATUS', 'ACTIVE_MAPPING', '활성 매칭', '활성화된 매칭 상태', 2, true, NOW(), NOW(), false, 0),
('MAPPING_STATUS', 'NO_MAPPING', '매칭 없음', '매칭이 없는 상태', 3, true, NOW(), NOW(), false, 0),
('MAPPING_STATUS', 'PENDING_MAPPING', '매칭 대기', '매칭 대기 중인 상태', 4, true, NOW(), NOW(), false, 0),
('MAPPING_STATUS', 'INACTIVE_MAPPING', '비활성 매칭', '비활성화된 매칭 상태', 5, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 6. 상담 세션 코드 그룹
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('CONSULTATION_SESSION', 'ONLINE', '온라인', '온라인 상담 세션', 1, true, NOW(), NOW(), false, 0),
('CONSULTATION_SESSION', 'OFFLINE', '오프라인', '오프라인 상담 세션', 2, true, NOW(), NOW(), false, 0),
('CONSULTATION_SESSION', 'PHONE', '전화', '전화 상담 세션', 3, true, NOW(), NOW(), false, 0),
('CONSULTATION_SESSION', 'VIDEO', '화상', '화상 상담 세션', 4, true, NOW(), NOW(), false, 0),
('CONSULTATION_SESSION', 'CHAT', '채팅', '채팅 상담 세션', 5, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 7. 우선순위 코드 그룹
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, created_at, updated_at, is_deleted, version) VALUES
('PRIORITY_LEVEL', 'URGENT', '긴급', '긴급 우선순위', 1, true, NOW(), NOW(), false, 0),
('PRIORITY_LEVEL', 'HIGH', '높음', '높은 우선순위', 2, true, NOW(), NOW(), false, 0),
('PRIORITY_LEVEL', 'MEDIUM', '보통', '보통 우선순위', 3, true, NOW(), NOW(), false, 0),
('PRIORITY_LEVEL', 'LOW', '낮음', '낮은 우선순위', 4, true, NOW(), NOW(), false, 0),
('PRIORITY_LEVEL', 'MINIMAL', '최소', '최소 우선순위', 5, true, NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE 
    updated_at = NOW();

-- 결과 확인
SELECT '공통 코드 추가 완료' as status, COUNT(*) as total_codes 
FROM common_codes 
WHERE code_group IN ('REPORT_PERIOD', 'YEAR_RANGE', 'MONTH_RANGE', 'DATE_RANGE', 'MAPPING_STATUS', 'CONSULTATION_SESSION', 'PRIORITY_LEVEL');