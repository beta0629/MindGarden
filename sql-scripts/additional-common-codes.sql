-- 추가 공통 코드 데이터
-- ERP 보고서, 성과 지표, 전문분야 관리, 반복 지출 관리용 공통 코드

-- 1. 알림 관련 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('ALERT_PRIORITY', 'NORMAL', '일반', '일반 우선순위 알림', true, 1, NOW(), NOW()),
('ALERT_PRIORITY', 'HIGH', '높음', '높은 우선순위 알림', true, 2, NOW(), NOW()),
('ALERT_PRIORITY', 'LOW', '낮음', '낮은 우선순위 알림', true, 3, NOW(), NOW()),
('ALERT_STATUS', 'UNREAD', '읽지 않음', '읽지 않은 알림', true, 1, NOW(), NOW()),
('ALERT_STATUS', 'READ', '읽음', '읽은 알림', true, 2, NOW(), NOW());

-- 2. 배치 상태 관련 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('BATCH_STATUS', 'PENDING', '대기', '배치 실행 대기 상태', true, 1, NOW(), NOW()),
('BATCH_STATUS', 'IN_PROGRESS', '진행중', '배치 실행 진행 중', true, 2, NOW(), NOW()),
('BATCH_STATUS', 'COMPLETED', '완료', '배치 실행 완료', true, 3, NOW(), NOW()),
('BATCH_STATUS', 'FAILED', '실패', '배치 실행 실패', true, 4, NOW(), NOW());

-- 3. 상담사 전문분야 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('CONSULTANT_SPECIALTY', 'INDIVIDUAL_THERAPY', '개인상담', '개인 심리상담 전문', true, 1, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'COUPLE_THERAPY', '부부상담', '부부 관계 상담 전문', true, 2, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'FAMILY_THERAPY', '가족상담', '가족 관계 상담 전문', true, 3, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'CHILD_THERAPY', '아동상담', '아동 심리상담 전문', true, 4, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'ADOLESCENT_THERAPY', '청소년상담', '청소년 심리상담 전문', true, 5, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'TRAUMA_THERAPY', '트라우마상담', '트라우마 치료 전문', true, 6, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'ANXIETY_THERAPY', '불안상담', '불안 장애 치료 전문', true, 7, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'DEPRESSION_THERAPY', '우울상담', '우울 장애 치료 전문', true, 8, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'ADDICTION_THERAPY', '중독상담', '중독 치료 전문', true, 9, NOW(), NOW()),
('CONSULTANT_SPECIALTY', 'CAREER_COUNSELING', '진로상담', '진로 및 직업 상담 전문', true, 10, NOW(), NOW());

-- 4. 반복 지출 주기 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('RECURRING_FREQUENCY', 'monthly', '월간', '매월 반복', true, 1, NOW(), NOW()),
('RECURRING_FREQUENCY', 'quarterly', '분기별', '분기별 반복', true, 2, NOW(), NOW()),
('RECURRING_FREQUENCY', 'yearly', '연간', '매년 반복', true, 3, NOW(), NOW());

-- 5. ERP 보고서 유형 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('REPORT_TYPE', 'monthly', '월별 보고서', '월별 재무 보고서', true, 1, NOW(), NOW()),
('REPORT_TYPE', 'quarterly', '분기별 보고서', '분기별 재무 보고서', true, 2, NOW(), NOW()),
('REPORT_TYPE', 'yearly', '연별 보고서', '연별 재무 보고서', true, 3, NOW(), NOW());

-- 6. 성과 지표 유형 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('PERFORMANCE_METRIC', 'CONSULTATION_COUNT', '상담 건수', '총 상담 건수 지표', true, 1, NOW(), NOW()),
('PERFORMANCE_METRIC', 'REVENUE', '매출', '총 매출 지표', true, 2, NOW(), NOW()),
('PERFORMANCE_METRIC', 'SATISFACTION', '만족도', '고객 만족도 지표', true, 3, NOW(), NOW()),
('PERFORMANCE_METRIC', 'CONSULTANT_COUNT', '상담사 수', '총 상담사 수 지표', true, 4, NOW(), NOW());

-- 7. 알림 아이콘 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('ALERT_ICON', 'info', '정보', '정보 알림 아이콘', true, 1, NOW(), NOW()),
('ALERT_ICON', 'warning', '경고', '경고 알림 아이콘', true, 2, NOW(), NOW()),
('ALERT_ICON', 'error', '오류', '오류 알림 아이콘', true, 3, NOW(), NOW()),
('ALERT_ICON', 'success', '성공', '성공 알림 아이콘', true, 4, NOW(), NOW()),
('ALERT_ICON', 'notification', '알림', '일반 알림 아이콘', true, 5, NOW(), NOW());

-- 8. 알림 색상 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('ALERT_COLOR', 'blue', '파란색', '파란색 알림', true, 1, NOW(), NOW()),
('ALERT_COLOR', 'green', '초록색', '초록색 알림', true, 2, NOW(), NOW()),
('ALERT_COLOR', 'yellow', '노란색', '노란색 알림', true, 3, NOW(), NOW()),
('ALERT_COLOR', 'red', '빨간색', '빨간색 알림', true, 4, NOW(), NOW()),
('ALERT_COLOR', 'purple', '보라색', '보라색 알림', true, 5, NOW(), NOW());

-- 9. 보고서 형식 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('REPORT_FORMAT', 'excel', 'Excel', 'Excel 형식 보고서', true, 1, NOW(), NOW()),
('REPORT_FORMAT', 'pdf', 'PDF', 'PDF 형식 보고서', true, 2, NOW(), NOW()),
('REPORT_FORMAT', 'csv', 'CSV', 'CSV 형식 보고서', true, 3, NOW(), NOW());

-- 10. 성과 지표 상태 공통 코드
INSERT INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) VALUES
('METRIC_STATUS', 'ACTIVE', '활성', '활성 상태 지표', true, 1, NOW(), NOW()),
('METRIC_STATUS', 'INACTIVE', '비활성', '비활성 상태 지표', true, 2, NOW(), NOW()),
('METRIC_STATUS', 'PENDING', '대기', '대기 상태 지표', true, 3, NOW(), NOW()),
('METRIC_STATUS', 'PROCESSING', '처리중', '처리 중 상태 지표', true, 4, NOW(), NOW());

-- 중복 방지를 위한 조건부 삽입 (MySQL 8.0+)
-- 기존 데이터가 있는 경우 무시
INSERT IGNORE INTO common_codes (code_group, code_value, code_label, code_description, is_active, sort_order, created_at, updated_at) 
SELECT * FROM (
    SELECT 'ALERT_PRIORITY' as code_group, 'NORMAL' as code_value, '일반' as code_label, '일반 우선순위 알림' as code_description, true as is_active, 1 as sort_order, NOW() as created_at, NOW() as updated_at
    UNION ALL SELECT 'ALERT_PRIORITY', 'HIGH', '높음', '높은 우선순위 알림', true, 2, NOW(), NOW()
    UNION ALL SELECT 'ALERT_PRIORITY', 'LOW', '낮음', '낮은 우선순위 알림', true, 3, NOW(), NOW()
    UNION ALL SELECT 'ALERT_STATUS', 'UNREAD', '읽지 않음', '읽지 않은 알림', true, 1, NOW(), NOW()
    UNION ALL SELECT 'ALERT_STATUS', 'READ', '읽음', '읽은 알림', true, 2, NOW(), NOW()
    UNION ALL SELECT 'BATCH_STATUS', 'PENDING', '대기', '배치 실행 대기 상태', true, 1, NOW(), NOW()
    UNION ALL SELECT 'BATCH_STATUS', 'IN_PROGRESS', '진행중', '배치 실행 진행 중', true, 2, NOW(), NOW()
    UNION ALL SELECT 'BATCH_STATUS', 'COMPLETED', '완료', '배치 실행 완료', true, 3, NOW(), NOW()
    UNION ALL SELECT 'BATCH_STATUS', 'FAILED', '실패', '배치 실행 실패', true, 4, NOW(), NOW()
) AS new_codes
WHERE NOT EXISTS (
    SELECT 1 FROM common_codes 
    WHERE common_codes.code_group = new_codes.code_group 
    AND common_codes.code_value = new_codes.code_value
);
