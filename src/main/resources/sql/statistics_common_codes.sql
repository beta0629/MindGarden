-- ============================================
-- 통계 시스템 공통 코드 초기 데이터
-- ============================================

-- 성과 평가 기준 공통 코드
INSERT INTO common_codes (code_group, code_value, code_name, description, sort_order, is_active, created_at, updated_at) VALUES
-- 완료율 평가 기준
('PERFORMANCE_COMPLETION_RATE', 'EXCELLENT_THRESHOLD', '우수 완료율 기준', '90', 1, 1, NOW(), NOW()),
('PERFORMANCE_COMPLETION_RATE', 'GOOD_THRESHOLD', '양호 완료율 기준', '80', 2, 1, NOW(), NOW()),
('PERFORMANCE_COMPLETION_RATE', 'WARNING_THRESHOLD', '경고 완료율 기준', '70', 3, 1, NOW(), NOW()),
('PERFORMANCE_COMPLETION_RATE', 'CRITICAL_THRESHOLD', '위험 완료율 기준', '50', 4, 1, NOW(), NOW()),

-- 취소율 평가 기준
('PERFORMANCE_CANCELLATION_RATE', 'ACCEPTABLE_THRESHOLD', '허용 취소율', '10', 1, 1, NOW(), NOW()),
('PERFORMANCE_CANCELLATION_RATE', 'WARNING_THRESHOLD', '경고 취소율', '15', 2, 1, NOW(), NOW()),
('PERFORMANCE_CANCELLATION_RATE', 'CRITICAL_THRESHOLD', '위험 취소율', '25', 3, 1, NOW(), NOW()),

-- 노쇼율 평가 기준
('PERFORMANCE_NOSHOW_RATE', 'ACCEPTABLE_THRESHOLD', '허용 노쇼율', '5', 1, 1, NOW(), NOW()),
('PERFORMANCE_NOSHOW_RATE', 'WARNING_THRESHOLD', '경고 노쇼율', '10', 2, 1, NOW(), NOW()),
('PERFORMANCE_NOSHOW_RATE', 'CRITICAL_THRESHOLD', '위험 노쇼율', '20', 3, 1, NOW(), NOW()),

-- 성과 점수 가중치
('PERFORMANCE_SCORE_WEIGHT', 'COMPLETION_RATE', '완료율 가중치', '30', 1, 1, NOW(), NOW()),
('PERFORMANCE_SCORE_WEIGHT', 'AVERAGE_RATING', '평균 평점 가중치', '20', 2, 1, NOW(), NOW()),
('PERFORMANCE_SCORE_WEIGHT', 'CLIENT_RETENTION', '고객 유지율 가중치', '20', 3, 1, NOW(), NOW()),
('PERFORMANCE_SCORE_WEIGHT', 'CANCELLATION_BONUS', '취소율 보너스 점수', '15', 4, 1, NOW(), NOW()),
('PERFORMANCE_SCORE_WEIGHT', 'NOSHOW_BONUS', '노쇼율 보너스 점수', '15', 5, 1, NOW(), NOW()),

-- 등급 기준
('PERFORMANCE_GRADE', 'S_GRADE_THRESHOLD', 'S급 기준 점수', '90', 1, 1, NOW(), NOW()),
('PERFORMANCE_GRADE', 'A_GRADE_THRESHOLD', 'A급 기준 점수', '80', 2, 1, NOW(), NOW()),
('PERFORMANCE_GRADE', 'B_GRADE_THRESHOLD', 'B급 기준 점수', '70', 3, 1, NOW(), NOW()),
('PERFORMANCE_GRADE', 'C_GRADE_THRESHOLD', 'C급 기준 점수', '60', 4, 1, NOW(), NOW()),

-- 등급명
('PERFORMANCE_GRADE_NAME', 'S', 'S급', 'S급', 1, 1, NOW(), NOW()),
('PERFORMANCE_GRADE_NAME', 'A', 'A급', 'A급', 2, 1, NOW(), NOW()),
('PERFORMANCE_GRADE_NAME', 'B', 'B급', 'B급', 3, 1, NOW(), NOW()),
('PERFORMANCE_GRADE_NAME', 'C', 'C급', 'C급', 4, 1, NOW(), NOW()),
('PERFORMANCE_GRADE_NAME', 'D', 'D급', 'D급', 5, 1, NOW(), NOW()),

-- 알림 설정
('PERFORMANCE_ALERT', 'DUPLICATE_PREVENTION_HOURS', '중복 알림 방지 시간', '1', 1, 1, NOW(), NOW()),
('PERFORMANCE_ALERT', 'CRITICAL_THRESHOLD_DAYS', '위험 알림 지속 일수', '3', 2, 1, NOW(), NOW()),
('PERFORMANCE_ALERT', 'WARNING_THRESHOLD_DAYS', '경고 알림 지속 일수', '7', 3, 1, NOW(), NOW()),

-- 통계 업데이트 주기
('STATISTICS_UPDATE', 'DAILY_UPDATE_HOUR', '일별 통계 업데이트 시간', '1', 1, 1, NOW(), NOW()),
('STATISTICS_UPDATE', 'PERFORMANCE_UPDATE_HOUR', '성과 업데이트 시간', '2', 2, 1, NOW(), NOW()),
('STATISTICS_UPDATE', 'ALERT_CHECK_HOUR', '알림 체크 시간', '9', 3, 1, NOW(), NOW()),

-- 대시보드 설정
('DASHBOARD_CONFIG', 'TOP_PERFORMERS_COUNT', '상위 성과자 표시 수', '5', 1, 1, NOW(), NOW()),
('DASHBOARD_CONFIG', 'RECENT_DAYS_COUNT', '최근 일수', '7', 2, 1, NOW(), NOW()),
('DASHBOARD_CONFIG', 'TREND_ANALYSIS_DAYS', '트렌드 분석 일수', '30', 3, 1, NOW(), NOW()),

-- ERP 동기화 설정
('ERP_SYNC_CONFIG', 'FINANCIAL_SYNC_INTERVAL_HOURS', '재무 동기화 주기(시간)', '6', 1, 1, NOW(), NOW()),
('ERP_SYNC_CONFIG', 'SALARY_SYNC_INTERVAL_HOURS', '급여 동기화 주기(시간)', '24', 2, 1, NOW(), NOW()),
('ERP_SYNC_CONFIG', 'INVENTORY_SYNC_INTERVAL_HOURS', '재고 동기화 주기(시간)', '12', 3, 1, NOW(), NOW()),
('ERP_SYNC_CONFIG', 'RETRY_ATTEMPTS', '동기화 재시도 횟수', '3', 4, 1, NOW(), NOW()),
('ERP_SYNC_CONFIG', 'TIMEOUT_MINUTES', '동기화 타임아웃(분)', '30', 5, 1, NOW(), NOW()),

-- 알림 레벨별 메시지 템플릿
('ALERT_MESSAGE_TEMPLATE', 'COMPLETION_RATE_WARNING', '완료율 경고 메시지', '상담사 {consultantName}의 {date} 완료율이 {rate}%로 기준({threshold}%) 미달입니다.', 1, 1, NOW(), NOW()),
('ALERT_MESSAGE_TEMPLATE', 'COMPLETION_RATE_CRITICAL', '완료율 위험 메시지', '상담사 {consultantName}의 {date} 완료율이 {rate}%로 위험 수준입니다. 즉시 조치가 필요합니다.', 2, 1, NOW(), NOW()),
('ALERT_MESSAGE_TEMPLATE', 'CANCELLATION_RATE_HIGH', '취소율 높음 메시지', '상담사 {consultantName}의 취소율이 {rate}%로 높습니다. 원인 분석이 필요합니다.', 3, 1, NOW(), NOW()),
('ALERT_MESSAGE_TEMPLATE', 'PERFORMANCE_IMPROVEMENT', '성과 개선 메시지', '상담사 {consultantName}의 성과 점수가 {score}점으로 개선되었습니다.', 4, 1, NOW(), NOW());

-- 커밋
COMMIT;
