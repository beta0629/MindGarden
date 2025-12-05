-- =====================================================
-- 상담일지 리마인더 생성 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS CreateConsultationRecordReminder //

CREATE PROCEDURE CreateConsultationRecordReminder(
    IN p_schedule_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_session_date DATE,
    IN p_session_time TIME,
    IN p_title VARCHAR(255),
    IN p_tenant_id VARCHAR(100),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_reminder_id BIGINT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_reminder_count INT DEFAULT 0;
    DECLARE v_schedule_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('리마인더 생성 중 오류 발생: ', v_error_message);
        SET p_reminder_id = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_reminder_id = 0;
        ROLLBACK;
    ELSEIF p_schedule_id IS NULL OR p_schedule_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '스케줄 ID는 필수입니다.';
        SET p_reminder_id = 0;
        ROLLBACK;
    ELSEIF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        SET p_reminder_id = 0;
        ROLLBACK;
    ELSE
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
            SET p_reminder_id = 0;
            ROLLBACK;
        ELSE
            -- 3. 기존 리마인더 확인 (24시간 내, 테넌트 격리)
    SELECT COUNT(*)
    INTO v_reminder_count
    FROM consultation_record_alerts
    WHERE schedule_id = p_schedule_id
      AND consultant_id = p_consultant_id
      AND tenant_id = p_tenant_id
      AND alert_type = 'MISSING_RECORD'
      AND status = 'PENDING'
      AND is_deleted = FALSE
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
            -- 4. 리마인더 생성 또는 메시지 반환
            IF v_reminder_count = 0 THEN
        INSERT INTO consultation_record_alerts (
            schedule_id, 
            consultant_id, 
            client_id, 
            session_date,
            session_time, 
            title, 
            alert_type, 
            status,
            message, 
            tenant_id,
            created_at, 
            created_by,
            updated_at,
            is_deleted
        ) VALUES (
            p_schedule_id, 
            p_consultant_id, 
            p_client_id, 
            p_session_date,
            p_session_time, 
            p_title, 
            'MISSING_RECORD', 
            'PENDING',
            CONCAT('상담일지 작성이 필요합니다. 상담: ', p_title, ' (', p_session_date, ' ', IFNULL(p_session_time, ''), ')'),
            p_tenant_id,
            NOW(), 
            p_created_by,
            NOW(),
            FALSE
        );
        
                SET p_reminder_id = LAST_INSERT_ID();
                SET p_success = TRUE;
                SET p_message = '상담일지 미작성 알림이 생성되었습니다.';
                
                -- 시스템 로그 기록 (테넌트 격리)
                -- 주의: system_logs 테이블이 실제 DB에 존재하지 않을 수 있음
                -- INSERT INTO system_logs (
                --     log_type, 
                --     log_level, 
                --     message, 
                --     tenant_id,
                --     created_at,
                --     created_by
                -- ) VALUES (
                --     'CONSULTATION_REMINDER', 
                --     'WARNING',
                --     CONCAT('상담일지 미작성 알림 생성: 스케줄 ID=', p_schedule_id, ', 상담사 ID=', p_consultant_id),
                --     p_tenant_id,
                --     NOW(),
                --     p_created_by
                -- );
            ELSE
                SET p_reminder_id = 0;
                SET p_success = FALSE;
                SET p_message = '이미 24시간 내에 동일한 알림이 존재합니다.';
            END IF;
            
            COMMIT;
        END IF;
    END IF;
    
END //

DELIMITER ;

