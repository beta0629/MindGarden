-- ============================================================================
-- MySQL 이벤트 스케줄러 활성화 및 통계 자동화 설정
-- ============================================================================

-- 1. 이벤트 스케줄러 활성화
SET GLOBAL event_scheduler = ON;

-- 2. 현재 이벤트 스케줄러 상태 확인
SELECT @@global.event_scheduler AS scheduler_status;

-- 3. 기존 이벤트 삭제 (있다면)
DROP EVENT IF EXISTS daily_statistics_update;
DROP EVENT IF EXISTS consultant_performance_update;
DROP EVENT IF EXISTS performance_monitoring;

-- ============================================================================
-- 4. 일별 통계 자동 업데이트 이벤트 (매일 자정 1분 후)
-- ============================================================================

DELIMITER $$

CREATE EVENT daily_statistics_update
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '00:01:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    SET v_yesterday = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY);
    
    -- 어제 날짜의 모든 지점 통계 업데이트
    CALL UpdateAllBranchDailyStatistics(v_yesterday);
    
    -- 로그 기록
    INSERT INTO erp_sync_log (
        sync_type, sync_date, records_processed, status, 
        started_at, completed_at, duration_seconds
    ) VALUES (
        'FINANCIAL', NOW(), 
        (SELECT COUNT(DISTINCT branch_code) FROM schedules WHERE date = v_yesterday),
        'COMPLETED', NOW(), NOW(), 0
    );
END$$

DELIMITER ;

-- ============================================================================
-- 5. 상담사 성과 자동 업데이트 이벤트 (매일 자정 3분 후)
-- ============================================================================

DELIMITER $$

CREATE EVENT consultant_performance_update
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '00:03:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    SET v_yesterday = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY);
    
    -- 어제 날짜의 모든 상담사 성과 업데이트
    CALL UpdateAllConsultantPerformance(v_yesterday);
    
    -- 로그 기록
    INSERT INTO erp_sync_log (
        sync_type, sync_date, records_processed, status, 
        started_at, completed_at, duration_seconds
    ) VALUES (
        'SALARY', NOW(), 
        (SELECT COUNT(DISTINCT consultant_id) FROM schedules WHERE date = v_yesterday),
        'COMPLETED', NOW(), NOW(), 0
    );
END$$

DELIMITER ;

-- ============================================================================
-- 6. 성과 모니터링 자동 실행 이벤트 (매일 자정 5분 후)
-- ============================================================================

DELIMITER $$

CREATE EVENT performance_monitoring
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '00:05:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    SET v_yesterday = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY);
    
    -- 어제 날짜의 성과 모니터링 (알림 생성)
    CALL DailyPerformanceMonitoring(v_yesterday);
    
    -- 로그 기록
    INSERT INTO erp_sync_log (
        sync_type, sync_date, records_processed, status, 
        started_at, completed_at, duration_seconds
    ) VALUES (
        'CUSTOMER', NOW(), 
        (SELECT COUNT(*) FROM performance_alerts WHERE DATE(created_at) = v_yesterday),
        'COMPLETED', NOW(), NOW(), 0
    );
END$$

DELIMITER ;

-- ============================================================================
-- 7. 생성된 이벤트 확인
-- ============================================================================

SELECT 
    event_name AS '이벤트명',
    event_definition AS '실행내용',
    interval_value AS '실행주기',
    interval_field AS '주기단위',
    starts AS '시작시간',
    status AS '상태'
FROM information_schema.events 
WHERE event_schema = DATABASE()
ORDER BY event_name;

-- ============================================================================
-- 8. 스케줄러 활성화 완료 메시지
-- ============================================================================

SELECT 
    'MySQL 이벤트 스케줄러가 활성화되었습니다!' AS message,
    @@global.event_scheduler AS scheduler_status,
    (SELECT COUNT(*) FROM information_schema.events WHERE event_schema = DATABASE()) AS created_events;
