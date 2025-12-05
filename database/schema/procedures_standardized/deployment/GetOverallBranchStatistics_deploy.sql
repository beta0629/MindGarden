-- =====================================================
-- 전체 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetOverallBranchStatistics //

CREATE PROCEDURE GetOverallBranchStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_period VARCHAR(20), -- 'WEEK', 'MONTH', 'QUARTER', 'YEAR'
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_users INT,
    OUT p_active_users INT,
    OUT p_total_consultants INT,
    OUT p_active_consultants INT,
    OUT p_total_clients INT,
    OUT p_active_clients INT,
    OUT p_total_schedules INT,
    OUT p_completed_schedules INT,
    OUT p_cancelled_schedules INT,
    OUT p_average_rating DECIMAL(3,2)
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 통계 조회 중 오류 발생: ', v_error_message);
        SET p_total_users = 0;
        SET p_active_users = 0;
        SET p_total_consultants = 0;
        SET p_active_consultants = 0;
        SET p_total_clients = 0;
        SET p_active_clients = 0;
        SET p_total_schedules = 0;
        SET p_completed_schedules = 0;
        SET p_cancelled_schedules = 0;
        SET p_average_rating = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_users = 0;
        SET p_active_users = 0;
        SET p_total_consultants = 0;
        SET p_active_consultants = 0;
        SET p_total_clients = 0;
        SET p_active_clients = 0;
        SET p_total_schedules = 0;
        SET p_completed_schedules = 0;
        SET p_cancelled_schedules = 0;
        SET p_average_rating = 0;
        LEAVE;
    END IF;
    
    -- 2. 기간 계산
    SET end_date = CURDATE();
    CASE p_period
        WHEN 'WEEK' THEN SET start_date = DATE_SUB(end_date, INTERVAL 7 DAY);
        WHEN 'MONTH' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
        WHEN 'QUARTER' THEN SET start_date = DATE_SUB(end_date, INTERVAL 3 MONTH);
        WHEN 'YEAR' THEN SET start_date = DATE_SUB(end_date, INTERVAL 1 YEAR);
        ELSE SET start_date = DATE_SUB(end_date, INTERVAL 1 MONTH);
    END CASE;
    
    -- 3. 전체 사용자 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_total_users 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE;
    
    -- 4. 활성 사용자 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_active_users 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND is_active = TRUE;
    
    -- 5. 전체 상담사 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_total_consultants 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND role = 'CONSULTANT';
    
    -- 6. 활성 상담사 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_active_consultants 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND role = 'CONSULTANT' 
      AND is_active = TRUE;
    
    -- 7. 전체 내담자 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_total_clients 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND role = 'CLIENT';
    
    -- 8. 활성 내담자 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_active_clients 
    FROM users 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND role = 'CLIENT' 
      AND is_active = TRUE;
    
    -- 9. 전체 상담 일정 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_total_schedules 
    FROM schedules 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND date BETWEEN start_date AND end_date;
    
    -- 10. 완료된 상담 일정 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_completed_schedules 
    FROM schedules 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND status = 'COMPLETED' 
      AND date BETWEEN start_date AND end_date;
    
    -- 11. 취소된 상담 일정 수 (테넌트 격리)
    SELECT COUNT(*) INTO p_cancelled_schedules 
    FROM schedules 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND status = 'CANCELLED' 
      AND date BETWEEN start_date AND end_date;
    
    -- 12. 평균 평점 (테넌트 격리)
    SELECT COALESCE(AVG(heart_score), 0) INTO p_average_rating 
    FROM consultant_ratings 
    WHERE tenant_id = p_tenant_id
      AND is_deleted = FALSE 
      AND created_at BETWEEN start_date AND end_date;
    
    SET p_success = TRUE;
    SET p_message = '전체 통계 조회가 완료되었습니다.';
    
END //

DELIMITER ;

