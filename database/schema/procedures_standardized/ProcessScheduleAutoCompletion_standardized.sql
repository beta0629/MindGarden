-- =====================================================
-- 스케줄 자동 완료 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessScheduleAutoCompletion //

CREATE PROCEDURE ProcessScheduleAutoCompletion(
    IN p_schedule_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    IN p_force_complete TINYINT(1),
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_has_record TINYINT(1) DEFAULT 0;
    DECLARE v_validation_message VARCHAR(500) DEFAULT '';
    DECLARE v_reminder_id BIGINT DEFAULT 0;
    DECLARE v_reminder_message VARCHAR(500) DEFAULT '';
    DECLARE v_schedule_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('스케줄 자동 완료 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_schedule_id IS NULL OR p_schedule_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '스케줄 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 스케줄 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_schedule_count
    FROM schedules
    WHERE id = p_schedule_id 
      AND consultant_id = p_consultant_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;
    
    IF v_schedule_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '스케줄을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 3. 상담일지 작성 여부 확인 (테넌트 격리)
    CALL ValidateConsultationRecordBeforeCompletion(
        p_consultant_id,
        p_session_date,
        p_tenant_id,
        v_has_record,
        v_validation_message
    );
    
    -- 4. 완료 처리 또는 리마인더 생성
    IF v_has_record = 1 OR p_force_complete = 1 THEN
        -- 스케줄 완료 처리 (테넌트 격리)
        UPDATE schedules
        SET status = 'COMPLETED',
            updated_at = NOW(),
            updated_by = p_processed_by
        WHERE id = p_schedule_id 
          AND tenant_id = p_tenant_id
          AND is_deleted = FALSE;
        
        SET p_success = TRUE;
        SET p_message = '스케줄이 성공적으로 완료 처리되었습니다.';
        
        -- 시스템 로그 기록 (테넌트 격리)
        INSERT INTO system_logs (
            log_type, 
            log_level, 
            message, 
            tenant_id,
            created_at,
            created_by
        ) VALUES (
            'SCHEDULE_COMPLETION', 
            'INFO',
            CONCAT('스케줄 완료 처리: ID=', p_schedule_id, ', 강제완료=', p_force_complete),
            p_tenant_id,
            NOW(),
            p_processed_by
        );
    ELSE
        -- 상담일지 미작성 리마인더 생성 (테넌트 격리)
        CALL CreateConsultationRecordReminder(
            p_schedule_id, 
            p_consultant_id, 
            0, 
            p_session_date,
            '00:00:00', 
            '상담일지 미작성',
            p_tenant_id,
            p_processed_by,
            v_reminder_id, 
            v_reminder_message
        );
        
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성으로 완료 처리 불가: ', v_validation_message);
    END IF;
    
    COMMIT;
    
END //

DELIMITER ;

