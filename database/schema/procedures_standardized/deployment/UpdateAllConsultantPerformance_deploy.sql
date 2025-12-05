-- =====================================================
-- 전체 상담사 성과 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateAllConsultantPerformance //

CREATE PROCEDURE UpdateAllConsultantPerformance(
    IN p_tenant_id VARCHAR(100),
    IN p_performance_date DATE,
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_processed_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_update_success BOOLEAN;
    DECLARE v_update_message TEXT;
    
    DECLARE consultant_cursor CURSOR FOR
        SELECT DISTINCT consultant_id 
        FROM schedules 
        WHERE tenant_id = p_tenant_id
          AND date = p_performance_date 
          AND is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 상담사 성과 업데이트 중 오류 발생: ', v_error_message);
        SET p_processed_count = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_performance_date IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '성과 날짜는 필수입니다.';
        SET p_processed_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_processed_count = 0;
    
    OPEN consultant_cursor;
    
    read_loop: LOOP
        FETCH consultant_cursor INTO v_consultant_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 상담사 성과 업데이트 (테넌트 격리)
        CALL UpdateConsultantPerformance(
            v_consultant_id, 
            p_performance_date,
            p_tenant_id,
            p_updated_by,
            v_update_success,
            v_update_message
        );
        
        IF v_update_success = TRUE THEN
            SET p_processed_count = p_processed_count + 1;
        END IF;
    END LOOP;
    
    CLOSE consultant_cursor;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('전체 상담사 성과 업데이트 완료. 처리된 상담사 수: ', p_processed_count);
    
    COMMIT;
    
END //

DELIMITER ;

