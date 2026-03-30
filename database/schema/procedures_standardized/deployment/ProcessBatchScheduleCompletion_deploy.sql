-- =====================================================
-- 스케줄 일괄 완료 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessBatchScheduleCompletion //

CREATE PROCEDURE ProcessBatchScheduleCompletion(
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_processed_count INT,
    OUT p_completed_count INT,
    OUT p_reminder_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_schedule_id BIGINT;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_session_date DATE;
    DECLARE v_has_record BOOLEAN;
    DECLARE v_validation_message TEXT;
    DECLARE v_reminder_id BIGINT;
    DECLARE v_reminder_message TEXT;
    DECLARE v_completed BOOLEAN;
    DECLARE v_completion_message TEXT;
    
    DECLARE schedule_cursor CURSOR FOR
        SELECT s.id, s.consultant_id, s.date
        FROM schedules s
        WHERE s.tenant_id = p_tenant_id
          AND s.status IN ('BOOKED', 'CONFIRMED')
          AND s.date <= CURDATE()
          AND s.is_deleted = FALSE
          AND (s.date < CURDATE() OR (s.date = CURDATE() AND s.end_time <= CURTIME()));
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('스케줄 일괄 완료 처리 중 오류 발생: ', v_error_message);
        SET p_processed_count = 0;
        SET p_completed_count = 0;
        SET p_reminder_count = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_processed_count = 0;
        SET p_completed_count = 0;
        SET p_reminder_count = 0;
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_processed_count = 0;
    SET p_completed_count = 0;
    SET p_reminder_count = 0;
    
    OPEN schedule_cursor;
    
    read_loop: LOOP
        FETCH schedule_cursor INTO v_schedule_id, v_consultant_id, v_session_date;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        SET p_processed_count = p_processed_count + 1;
        
        -- 상담일지 작성 여부 확인 (테넌트 격리)
        CALL ValidateConsultationRecordBeforeCompletion(
            v_consultant_id,
            v_session_date,
            p_tenant_id,
            v_has_record,
            v_validation_message
        );
        
        IF v_has_record = TRUE THEN
            -- 스케줄 완료 처리 (테넌트 격리)
            UPDATE schedules
            SET status = 'COMPLETED', 
                updated_at = NOW(),
                updated_by = p_processed_by
            WHERE id = v_schedule_id 
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;
            
            SET p_completed_count = p_completed_count + 1;
        ELSE
            -- 상담일지 미작성 리마인더 생성 (테넌트 격리)
            CALL CreateConsultationRecordReminder(
                v_schedule_id, 
                v_consultant_id, 
                0, 
                v_session_date,
                '00:00:00', 
                '상담일지 미작성',
                p_tenant_id,
                p_processed_by,
                v_reminder_id, 
                v_reminder_message
            );
            
            SET p_reminder_count = p_reminder_count + 1;
        END IF;
    END LOOP;
    
    CLOSE schedule_cursor;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('일괄 처리 완료: 처리=', p_processed_count,
        ', 완료=', p_completed_count,
        ', 알림=', p_reminder_count);
    
    -- 시스템 로그 기록 (테넌트 격리)
    -- 주의: system_logs 테이블이 실제 DB에 존재하지 않을 수 있음
    -- 필요시 테이블 생성 마이그레이션 추가 필요
    -- INSERT INTO system_logs (
    --     log_type, 
    --     log_level, 
    --     message, 
    --     tenant_id,
    --     created_at,
    --     created_by
    -- ) VALUES (
    --     'BATCH_SCHEDULE_COMPLETION', 
    --     'INFO', 
    --     p_message, 
    --     p_tenant_id,
    --     NOW(),
    --     p_processed_by
    -- );
    
    COMMIT;
    
END //

DELIMITER ;

