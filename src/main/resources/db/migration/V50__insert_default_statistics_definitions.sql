-- 기본 통계 정의 데이터 삽입
-- 시스템 기본 통계 (tenant_id = NULL)

-- 스케줄 관련 통계
INSERT INTO statistics_definitions (tenant_id, statistic_code, statistic_name_ko, statistic_name_en, category, calculation_type, data_source_type, calculation_rule, aggregation_period, display_order, description, is_deleted, version) VALUES
(NULL, 'TOTAL_CONSULTATIONS_TODAY', '오늘 총 상담 수', 'Total Consultations Today', 'SCHEDULE', 'COUNT', 'SCHEDULE', 
 '{"type":"COUNT","source":"SCHEDULE","filter":{"date":"TODAY","status":["SCHEDULED","IN_PROGRESS","COMPLETED"]}}', 
 'DAILY', 1, '오늘 예정된 모든 상담 수', 0, 0),
 
(NULL, 'COMPLETED_CONSULTATIONS_TODAY', '오늘 완료된 상담 수', 'Completed Consultations Today', 'SCHEDULE', 'COUNT', 'SCHEDULE', 
 '{"type":"COUNT","source":"SCHEDULE","filter":{"date":"TODAY","status":"COMPLETED"}}', 
 'DAILY', 2, '오늘 완료된 상담 수', 0, 0),
 
(NULL, 'CANCELLED_CONSULTATIONS_TODAY', '오늘 취소된 상담 수', 'Cancelled Consultations Today', 'SCHEDULE', 'COUNT', 'SCHEDULE', 
 '{"type":"COUNT","source":"SCHEDULE","filter":{"date":"TODAY","status":"CANCELLED"}}', 
 'DAILY', 3, '오늘 취소된 상담 수', 0, 0),

-- 수익 관련 통계
(NULL, 'TOTAL_REVENUE_TODAY', '오늘 총 수익', 'Total Revenue Today', 'REVENUE', 'SUM', 'SCHEDULE', 
 '{"type":"SUM","source":"SCHEDULE","filter":{"date":"TODAY","status":"COMPLETED"},"field":"revenue","fallback":{"type":"LOOKUP","source":"MAPPING","field":"packagePrice","join":{"from":"schedule.mappingId","to":"mapping.id"}}}', 
 'DAILY', 10, '오늘 완료된 상담의 총 수익', 0, 0),

(NULL, 'TOTAL_REVENUE_THIS_MONTH', '이번 달 총 수익', 'Total Revenue This Month', 'REVENUE', 'SUM', 'SCHEDULE', 
 '{"type":"SUM","source":"SCHEDULE","filter":{"dateRange":"THIS_MONTH","status":"COMPLETED"},"field":"revenue","fallback":{"type":"LOOKUP","source":"MAPPING","field":"packagePrice","join":{"from":"schedule.mappingId","to":"mapping.id"}}}', 
 'MONTHLY', 11, '이번 달 완료된 상담의 총 수익', 0, 0),

-- 상담사 관련 통계
(NULL, 'TOTAL_CONSULTANTS', '총 상담사 수', 'Total Consultants', 'CONSULTANT', 'COUNT', 'USER', 
 '{"type":"COUNT","source":"USER","filter":{"role":"CONSULTANT","isActive":true}}', 
 'DAILY', 20, '활성화된 상담사 수', 0, 0),

(NULL, 'ACTIVE_CONSULTANTS_TODAY', '오늘 활동한 상담사 수', 'Active Consultants Today', 'CONSULTANT', 'COUNT', 'SCHEDULE', 
 '{"type":"COUNT_DISTINCT","source":"SCHEDULE","filter":{"date":"TODAY"},"field":"consultantId"}', 
 'DAILY', 21, '오늘 상담 일정이 있는 상담사 수', 0, 0),

-- 내담자 관련 통계
(NULL, 'TOTAL_CLIENTS', '총 내담자 수', 'Total Clients', 'CLIENT', 'COUNT', 'USER', 
 '{"type":"COUNT","source":"USER","filter":{"role":"CLIENT","isActive":true}}', 
 'DAILY', 30, '활성화된 내담자 수', 0, 0),

(NULL, 'NEW_CLIENTS_THIS_MONTH', '이번 달 신규 내담자 수', 'New Clients This Month', 'CLIENT', 'COUNT', 'USER', 
 '{"type":"COUNT","source":"USER","filter":{"role":"CLIENT","createdDateRange":"THIS_MONTH"}}', 
 'MONTHLY', 31, '이번 달 신규 등록된 내담자 수', 0, 0),

-- 매칭 관련 통계
(NULL, 'TOTAL_ACTIVE_MAPPINGS', '활성 매칭 수', 'Total Active Mappings', 'MAPPING', 'COUNT', 'MAPPING', 
 '{"type":"COUNT","source":"MAPPING","filter":{"status":"ACTIVE"}}', 
 'DAILY', 40, '현재 활성화된 상담사-내담자 매칭 수', 0, 0),

(NULL, 'PENDING_PAYMENT_MAPPINGS', '입금 대기 매칭 수', 'Pending Payment Mappings', 'MAPPING', 'COUNT', 'MAPPING', 
 '{"type":"COUNT","source":"MAPPING","filter":{"status":"PENDING_PAYMENT"}}', 
 'DAILY', 41, '입금 대기 중인 매칭 수', 0, 0),

-- 평균 관련 통계
(NULL, 'AVERAGE_CONSULTATION_DURATION', '평균 상담 시간', 'Average Consultation Duration', 'SCHEDULE', 'AVG', 'SCHEDULE', 
 '{"type":"AVG","source":"SCHEDULE","filter":{"status":"COMPLETED","dateRange":"LAST_30_DAYS"},"field":"durationMinutes"}', 
 'DAILY', 50, '최근 30일 완료된 상담의 평균 시간 (분)', 0, 0),

(NULL, 'AVERAGE_CONSULTANT_RATING', '평균 상담사 평점', 'Average Consultant Rating', 'CONSULTANT', 'AVG', 'RATING', 
 '{"type":"AVG","source":"RATING","filter":{"status":"ACTIVE"},"field":"heartScore"}', 
 'DAILY', 51, '활성화된 상담사 평점의 평균', 0, 0);


