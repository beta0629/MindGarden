-- ====================================================================
-- 통계 시스템용 확장 공통코드 초기화 스크립트
-- PL/SQL 프로시저에서 사용되는 모든 설정값들
-- ====================================================================

-- 성과 평가 임계값
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_THRESHOLD', 'CRITICAL', '위험 수준 임계값', '50', 1, TRUE, '성과 임계값'),
('PERFORMANCE_THRESHOLD', 'WARNING', '경고 수준 임계값', '70', 2, TRUE, '성과 임계값'),
('PERFORMANCE_THRESHOLD', 'EXCELLENT', '우수 수준 임계값', '90', 3, TRUE, '성과 임계값');

-- 성과 점수 가중치
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_WEIGHT', 'COMPLETION_RATE', '완료율 가중치', '30', 1, TRUE, '성과 가중치'),
('PERFORMANCE_WEIGHT', 'AVERAGE_RATING', '평균 평점 가중치', '20', 2, TRUE, '성과 가중치'),
('PERFORMANCE_WEIGHT', 'CLIENT_RETENTION', '고객 유지율 가중치', '20', 3, TRUE, '성과 가중치'),
('PERFORMANCE_WEIGHT', 'CANCELLATION_BONUS', '취소율 보너스 점수', '15', 4, TRUE, '성과 가중치'),
('PERFORMANCE_WEIGHT', 'NOSHOW_BONUS', '노쇼율 보너스 점수', '15', 5, TRUE, '성과 가중치');

-- 등급 기준 점수
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_GRADE', 'S_GRADE_THRESHOLD', 'S급 기준 점수', '90', 1, TRUE, '등급 기준'),
('PERFORMANCE_GRADE', 'A_GRADE_THRESHOLD', 'A급 기준 점수', '80', 2, TRUE, '등급 기준'),
('PERFORMANCE_GRADE', 'B_GRADE_THRESHOLD', 'B급 기준 점수', '70', 3, TRUE, '등급 기준'),
('PERFORMANCE_GRADE', 'C_GRADE_THRESHOLD', 'C급 기준 점수', '60', 4, TRUE, '등급 기준');

-- 등급 한글명
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_GRADE_NAME', 'S', 'S급 등급명', 'S급', 1, TRUE, '등급명'),
('PERFORMANCE_GRADE_NAME', 'A', 'A급 등급명', 'A급', 2, TRUE, '등급명'),
('PERFORMANCE_GRADE_NAME', 'B', 'B급 등급명', 'B급', 3, TRUE, '등급명'),
('PERFORMANCE_GRADE_NAME', 'C', 'C급 등급명', 'C급', 4, TRUE, '등급명'),
('PERFORMANCE_GRADE_NAME', 'D', 'D급 등급명', 'D급', 5, TRUE, '등급명');

-- 완료율 기준
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_COMPLETION_RATE', 'EXCELLENT_THRESHOLD', '우수 완료율 기준', '90', 1, TRUE, '완료율 기준'),
('PERFORMANCE_COMPLETION_RATE', 'GOOD_THRESHOLD', '양호 완료율 기준', '80', 2, TRUE, '완료율 기준'),
('PERFORMANCE_COMPLETION_RATE', 'WARNING_THRESHOLD', '경고 완료율 기준', '70', 3, TRUE, '완료율 기준'),
('PERFORMANCE_COMPLETION_RATE', 'CRITICAL_THRESHOLD', '위험 완료율 기준', '50', 4, TRUE, '완료율 기준');

-- 취소율 기준
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_CANCELLATION_RATE', 'ACCEPTABLE_THRESHOLD', '허용 취소율 기준', '10', 1, TRUE, '취소율 기준'),
('PERFORMANCE_CANCELLATION_RATE', 'WARNING_THRESHOLD', '경고 취소율 기준', '15', 2, TRUE, '취소율 기준'),
('PERFORMANCE_CANCELLATION_RATE', 'CRITICAL_THRESHOLD', '위험 취소율 기준', '25', 3, TRUE, '취소율 기준');

-- 노쇼율 기준
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_NOSHOW_RATE', 'ACCEPTABLE_THRESHOLD', '허용 노쇼율 기준', '5', 1, TRUE, '노쇼율 기준'),
('PERFORMANCE_NOSHOW_RATE', 'WARNING_THRESHOLD', '경고 노쇼율 기준', '10', 2, TRUE, '노쇼율 기준'),
('PERFORMANCE_NOSHOW_RATE', 'CRITICAL_THRESHOLD', '위험 노쇼율 기준', '20', 3, TRUE, '노쇼율 기준');

-- 알림 설정
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('PERFORMANCE_ALERT', 'DUPLICATE_PREVENTION_HOURS', '중복 알림 방지 시간', '1', 1, TRUE, '알림 설정'),
('PERFORMANCE_ALERT', 'CRITICAL_THRESHOLD_DAYS', '위험 알림 기준 일수', '3', 2, TRUE, '알림 설정'),
('PERFORMANCE_ALERT', 'WARNING_THRESHOLD_DAYS', '경고 알림 기준 일수', '7', 3, TRUE, '알림 설정');

-- 알림 메시지 템플릿
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('ALERT_MESSAGE_TEMPLATE', 'COMPLETION_RATE_WARNING', '완료율 경고 템플릿', '상담사 {consultantName}의 {date} 완료율이 {rate}%로 기준({threshold}%) 미달입니다.', 1, TRUE, '알림 템플릿'),
('ALERT_MESSAGE_TEMPLATE', 'COMPLETION_RATE_CRITICAL', '완료율 위험 템플릿', '상담사 {consultantName}의 {date} 완료율이 {rate}%로 위험 수준입니다. 즉시 조치가 필요합니다.', 2, TRUE, '알림 템플릿'),
('ALERT_MESSAGE_TEMPLATE', 'CANCELLATION_RATE_HIGH', '취소율 높음 템플릿', '상담사 {consultantName}의 취소율이 {rate}%로 높습니다. 원인 분석이 필요합니다.', 3, TRUE, '알림 템플릿'),
('ALERT_MESSAGE_TEMPLATE', 'PERFORMANCE_IMPROVEMENT', '성과 개선 템플릿', '상담사 {consultantName}의 성과 점수가 {score}점으로 개선되었습니다.', 4, TRUE, '알림 템플릿'),
('ALERT_MESSAGE_TEMPLATE', 'EXCELLENT_PERFORMANCE', '우수 성과 템플릿', '축하합니다! {consultantName}님의 성과가 우수합니다. (점수: {score}, 등급: {grade})', 5, TRUE, '알림 템플릿');

-- 통계 업데이트 스케줄
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('STATISTICS_UPDATE', 'DAILY_UPDATE_HOUR', '일별 통계 업데이트 시간', '1', 1, TRUE, '업데이트 스케줄'),
('STATISTICS_UPDATE', 'PERFORMANCE_UPDATE_HOUR', '성과 업데이트 시간', '2', 2, TRUE, '업데이트 스케줄'),
('STATISTICS_UPDATE', 'ALERT_CHECK_HOUR', '알림 확인 시간', '9', 3, TRUE, '업데이트 스케줄');

-- 대시보드 설정
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('DASHBOARD_CONFIG', 'TOP_PERFORMERS_COUNT', '상위 성과자 표시 수', '5', 1, TRUE, '대시보드 설정'),
('DASHBOARD_CONFIG', 'RECENT_DAYS_COUNT', '최근 일수', '7', 2, TRUE, '대시보드 설정'),
('DASHBOARD_CONFIG', 'TREND_ANALYSIS_DAYS', '트렌드 분석 일수', '30', 3, TRUE, '대시보드 설정');

-- ERP 동기화 설정
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, korean_name) VALUES
('ERP_SYNC_CONFIG', 'FINANCIAL_SYNC_INTERVAL_HOURS', '재무 동기화 간격(시간)', '6', 1, TRUE, 'ERP 동기화'),
('ERP_SYNC_CONFIG', 'SALARY_SYNC_INTERVAL_HOURS', '급여 동기화 간격(시간)', '24', 2, TRUE, 'ERP 동기화'),
('ERP_SYNC_CONFIG', 'INVENTORY_SYNC_INTERVAL_HOURS', '재고 동기화 간격(시간)', '12', 3, TRUE, 'ERP 동기화'),
('ERP_SYNC_CONFIG', 'RETRY_ATTEMPTS', '재시도 횟수', '3', 4, TRUE, 'ERP 동기화'),
('ERP_SYNC_CONFIG', 'TIMEOUT_MINUTES', '타임아웃(분)', '30', 5, TRUE, 'ERP 동기화');
