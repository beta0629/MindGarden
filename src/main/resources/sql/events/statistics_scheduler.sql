-- ====================================================================
-- 통계 시스템 자동화 스케줄러 이벤트
-- MySQL Event Scheduler를 사용한 자동 배치 처리
-- ====================================================================

-- Event Scheduler 활성화
SET GLOBAL event_scheduler = ON;

-- ====================================================================
-- 1. 일별 통계 자동 업데이트 (매일 자정 1시)
-- ====================================================================

DROP EVENT IF EXISTS evt_daily_statistics_update;

CREATE EVENT evt_daily_statistics_update
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 01:00:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('일별 통계 자동 업데이트 실패: ', @@error_count), NOW());
    END;
    
    SET v_yesterday = CURDATE() - INTERVAL 1 DAY;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('일별 통계 자동 업데이트 시작: ', v_yesterday), NOW());
    
    -- 모든 지점의 일별 통계 업데이트
    CALL UpdateAllBranchDailyStatistics(v_yesterday);
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('일별 통계 자동 업데이트 완료: ', v_yesterday), NOW());
END;

-- ====================================================================
-- 2. 상담사 성과 자동 업데이트 (매일 자정 2시)
-- ====================================================================

DROP EVENT IF EXISTS evt_consultant_performance_update;

CREATE EVENT evt_consultant_performance_update
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 02:00:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('상담사 성과 자동 업데이트 실패: ', @@error_count), NOW());
    END;
    
    SET v_yesterday = CURDATE() - INTERVAL 1 DAY;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('상담사 성과 자동 업데이트 시작: ', v_yesterday), NOW());
    
    -- 모든 상담사의 성과 업데이트
    CALL UpdateAllConsultantPerformance(v_yesterday);
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('상담사 성과 자동 업데이트 완료: ', v_yesterday), NOW());
END;

-- ====================================================================
-- 3. 성과 모니터링 및 알림 (매일 오전 9시)
-- ====================================================================

DROP EVENT IF EXISTS evt_daily_performance_monitoring;

CREATE EVENT evt_daily_performance_monitoring
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE(), ' 09:00:00')
DO
BEGIN
    DECLARE v_yesterday DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('일일 성과 모니터링 실패: ', @@error_count), NOW());
    END;
    
    SET v_yesterday = CURDATE() - INTERVAL 1 DAY;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('일일 성과 모니터링 시작: ', v_yesterday), NOW());
    
    -- 성과 모니터링 및 알림 생성
    CALL DailyPerformanceMonitoring(v_yesterday);
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('일일 성과 모니터링 완료: ', v_yesterday), NOW());
END;

-- ====================================================================
-- 4. 주간 통계 집계 (매주 월요일 오전 3시)
-- ====================================================================

DROP EVENT IF EXISTS evt_weekly_statistics_aggregation;

CREATE EVENT evt_weekly_statistics_aggregation
ON SCHEDULE EVERY 1 WEEK
STARTS CONCAT(CURDATE() + INTERVAL (1 - DAYOFWEEK(CURDATE()) + 7) % 7 DAY, ' 03:00:00')
DO
BEGIN
    DECLARE v_week_start DATE;
    DECLARE v_week_end DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('주간 통계 집계 실패: ', @@error_count), NOW());
    END;
    
    -- 지난주 시작일과 종료일 계산
    SET v_week_end = CURDATE() - INTERVAL DAYOFWEEK(CURDATE()) DAY;
    SET v_week_start = v_week_end - INTERVAL 6 DAY;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('주간 통계 집계 시작: ', v_week_start, ' ~ ', v_week_end), NOW());
    
    -- 주간 통계 집계 테이블 업데이트 (필요시 추가 구현)
    -- 여기서는 로그만 기록
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('주간 통계 집계 완료: ', v_week_start, ' ~ ', v_week_end), NOW());
END;

-- ====================================================================
-- 5. 월간 통계 집계 (매월 1일 오전 4시)
-- ====================================================================

DROP EVENT IF EXISTS evt_monthly_statistics_aggregation;

CREATE EVENT evt_monthly_statistics_aggregation
ON SCHEDULE EVERY 1 MONTH
STARTS CONCAT(LAST_DAY(CURDATE()) + INTERVAL 1 DAY, ' 04:00:00')
DO
BEGIN
    DECLARE v_month_start DATE;
    DECLARE v_month_end DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('월간 통계 집계 실패: ', @@error_count), NOW());
    END;
    
    -- 지난달 시작일과 종료일 계산
    SET v_month_start = DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) DAY) + INTERVAL 1 DAY - INTERVAL 1 MONTH;
    SET v_month_end = LAST_DAY(v_month_start);
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('월간 통계 집계 시작: ', v_month_start, ' ~ ', v_month_end), NOW());
    
    -- 월간 통계 집계 테이블 업데이트 (필요시 추가 구현)
    -- 여기서는 로그만 기록
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('월간 통계 집계 완료: ', v_month_start, ' ~ ', v_month_end), NOW());
END;

-- ====================================================================
-- 6. 오래된 로그 정리 (매일 오전 5시)
-- ====================================================================

DROP EVENT IF EXISTS evt_cleanup_old_logs;

CREATE EVENT evt_cleanup_old_logs
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE(), ' 05:00:00')
DO
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        INSERT INTO system_logs (log_level, log_message, created_at)
        VALUES ('ERROR', CONCAT('로그 정리 실패: ', @@error_count), NOW());
    END;
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', '오래된 로그 정리 시작', NOW());
    
    -- 30일 이상 된 시스템 로그 삭제
    DELETE FROM system_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    SET v_deleted_count = ROW_COUNT();
    
    -- 읽음 처리된 지 7일 이상 된 알림 삭제
    DELETE FROM performance_alerts 
    WHERE status = 'READ' 
      AND read_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    SET v_deleted_count = v_deleted_count + ROW_COUNT();
    
    INSERT INTO system_logs (log_level, log_message, created_at)
    VALUES ('INFO', CONCAT('오래된 로그 정리 완료: ', v_deleted_count, '개 항목 삭제'), NOW());
END;

-- ====================================================================
-- 스케줄러 상태 확인 뷰
-- ====================================================================

CREATE OR REPLACE VIEW v_scheduler_status AS
SELECT 
    event_name as '이벤트명',
    event_definition as '정의',
    interval_value as '실행간격',
    interval_field as '간격단위',
    status as '상태',
    last_executed as '마지막실행',
    CONCAT(execute_at) as '다음실행'
FROM information_schema.events 
WHERE event_schema = DATABASE()
ORDER BY event_name;
