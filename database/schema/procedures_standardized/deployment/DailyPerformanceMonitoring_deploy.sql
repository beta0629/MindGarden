-- =====================================================
-- 일일 성과 모니터링 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS DailyPerformanceMonitoring //

CREATE PROCEDURE DailyPerformanceMonitoring(
    IN p_tenant_id VARCHAR(100),
    IN p_monitoring_date DATE,
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_alert_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_consultant_name VARCHAR(100);
    DECLARE v_completion_rate DECIMAL(5,2);
    DECLARE v_alert_message TEXT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT 
            cp.consultant_id, 
            u.name,
            cp.completion_rate
        FROM consultant_performance cp
        JOIN users u ON cp.consultant_id = u.id
        WHERE cp.performance_date = p_monitoring_date
          AND cp.tenant_id = p_tenant_id
          AND u.tenant_id = p_tenant_id
          AND cp.completion_rate < 70.0  -- 완료율 70% 미만
          AND u.is_active = TRUE
          AND cp.is_deleted = FALSE
          AND u.is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('일일 성과 모니터링 중 오류 발생: ', v_error_message);
        SET p_alert_count = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_alert_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_monitoring_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '모니터링 날짜는 필수입니다.';
        SET p_alert_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_alert_count = 0;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id, v_consultant_name, v_completion_rate;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 알림 메시지 생성
        SET v_alert_message = CONCAT(
            '완료율 기준 미달: ', 
            ROUND(v_completion_rate, 1), 
            '% (기준: 70%)'
        );
        
        -- 기존 알림이 없는 경우에만 새 알림 생성 (테넌트 격리)
        IF NOT EXISTS (
            SELECT 1 FROM performance_alerts 
            WHERE consultant_id = v_consultant_id 
              AND tenant_id = p_tenant_id
              AND DATE(created_at) = p_monitoring_date
              AND alert_level = 'WARNING'
              AND is_deleted = FALSE
        ) THEN
            INSERT INTO performance_alerts (
                consultant_id, 
                consultant_name, 
                alert_level, 
                completion_rate,
                alert_message, 
                status, 
                tenant_id,
                created_at,
                created_by
            ) VALUES (
                v_consultant_id, 
                v_consultant_name, 
                'WARNING', 
                v_completion_rate,
                v_alert_message, 
                'PENDING', 
                p_tenant_id,
                NOW(),
                p_processed_by
            );
            
            SET p_alert_count = p_alert_count + 1;
        END IF;
        
    END LOOP;
    
    CLOSE consultant_cursor;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('일일 성과 모니터링 완료. 알림 생성: ', p_alert_count, '건');
    
    COMMIT;
    
END //

DELIMITER ;

