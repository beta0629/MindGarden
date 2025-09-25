-- =====================================================
-- 상담일지 검증 및 알림 시스템 PL/SQL 프로시저
-- =====================================================

-- 1. 스케줄 완료 전 상담일지 작성 여부 확인
DELIMITER $$

DROP PROCEDURE IF EXISTS ValidateConsultationRecordBeforeCompletion$$

CREATE PROCEDURE ValidateConsultationRecordBeforeCompletion(
    IN p_schedule_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    OUT p_has_record TINYINT(1),
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_record_count INT DEFAULT 0;
    DECLARE v_consultation_id BIGINT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_has_record = 0;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;
    
    SET p_has_record = 0;
    SET p_message = '';
    
    -- 해당 스케줄에 대한 상담일지 작성 여부 확인
    SELECT COUNT(*)
    INTO v_record_count
    FROM consultation_records cr
    WHERE cr.consultant_id = p_consultant_id
      AND cr.session_date = p_session_date
      AND cr.is_deleted = 0
      AND (cr.schedule_id = p_schedule_id OR cr.schedule_id IS NULL);
    
    IF v_record_count > 0 THEN
        SET p_has_record = 1;
        SET p_message = '상담일지가 작성되어 스케줄 완료 가능합니다.';
    ELSE
        SET p_has_record = 0;
        SET p_message = '상담일지가 작성되지 않아 스케줄 완료가 불가능합니다.';
    END IF;
    
    -- 로그 기록
    INSERT INTO system_logs (log_type, log_level, message, created_at)
    VALUES ('SCHEDULE_VALIDATION', 'INFO', 
            CONCAT('스케줄 검증: ID=', p_schedule_id, ', 상담일지=', IF(p_has_record, '작성됨', '미작성')), 
            NOW());
            
END$$

-- 2. 상담일지 미작성 알림 생성
DROP PROCEDURE IF EXISTS CreateConsultationRecordReminder$$

CREATE PROCEDURE CreateConsultationRecordReminder(
    IN p_schedule_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_session_date DATE,
    IN p_session_time TIME,
    IN p_title VARCHAR(255),
    OUT p_reminder_id BIGINT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_reminder_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_reminder_id = 0;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;
    
    SET p_reminder_id = 0;
    SET p_message = '';
    
    -- 중복 알림 방지 (24시간 내 동일 스케줄에 대한 알림이 있는지 확인)
    SELECT COUNT(*)
    INTO v_reminder_count
    FROM consultation_record_alerts
    WHERE schedule_id = p_schedule_id
      AND consultant_id = p_consultant_id
      AND alert_type = 'MISSING_RECORD'
      AND status = 'PENDING'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    IF v_reminder_count = 0 THEN
        -- 알림 생성
        INSERT INTO consultation_record_alerts (
            schedule_id, consultant_id, client_id, session_date, 
            session_time, title, alert_type, status, 
            message, created_at, updated_at
        ) VALUES (
            p_schedule_id, p_consultant_id, p_client_id, p_session_date,
            p_session_time, p_title, 'MISSING_RECORD', 'PENDING',
            CONCAT('상담일지 작성이 필요합니다. 상담: ', p_title, ' (', p_session_date, ' ', p_session_time, ')'),
            NOW(), NOW()
        );
        
        SET p_reminder_id = LAST_INSERT_ID();
        SET p_message = '상담일지 미작성 알림이 생성되었습니다.';
        
        -- 시스템 로그 기록
        INSERT INTO system_logs (log_type, log_level, message, created_at)
        VALUES ('CONSULTATION_REMINDER', 'WARNING', 
                CONCAT('상담일지 미작성 알림 생성: 스케줄 ID=', p_schedule_id, ', 상담사 ID=', p_consultant_id), 
                NOW());
    ELSE
        SET p_message = '이미 24시간 내에 동일한 알림이 존재합니다.';
    END IF;
    
END$$

-- 3. 스케줄 자동 완료 처리 (상담일지 검증 포함)
DROP PROCEDURE IF EXISTS ProcessScheduleAutoCompletion$$

CREATE PROCEDURE ProcessScheduleAutoCompletion(
    IN p_schedule_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_session_date DATE,
    IN p_force_complete TINYINT(1),
    OUT p_completed TINYINT(1),
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_has_record TINYINT(1) DEFAULT 0;
    DECLARE v_validation_message VARCHAR(500) DEFAULT '';
    DECLARE v_reminder_id BIGINT DEFAULT 0;
    DECLARE v_reminder_message VARCHAR(500) DEFAULT '';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_completed = 0;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;
    
    SET p_completed = 0;
    SET p_message = '';
    
    -- 상담일지 작성 여부 확인
    CALL ValidateConsultationRecordBeforeCompletion(
        p_schedule_id, p_consultant_id, p_session_date, 
        v_has_record, v_validation_message
    );
    
    IF v_has_record = 1 OR p_force_complete = 1 THEN
        -- 스케줄 완료 처리
        UPDATE schedules 
        SET status = 'COMPLETED', 
            updated_at = NOW()
        WHERE id = p_schedule_id;
        
        SET p_completed = 1;
        SET p_message = '스케줄이 성공적으로 완료 처리되었습니다.';
        
        -- 완료 로그 기록
        INSERT INTO system_logs (log_type, log_level, message, created_at)
        VALUES ('SCHEDULE_COMPLETION', 'INFO', 
                CONCAT('스케줄 완료 처리: ID=', p_schedule_id, ', 강제완료=', p_force_complete), 
                NOW());
    ELSE
        -- 상담일지 미작성 알림 생성
        CALL CreateConsultationRecordReminder(
            p_schedule_id, p_consultant_id, 0, p_session_date, 
            '00:00:00', '상담일지 미작성', 
            v_reminder_id, v_reminder_message
        );
        
        SET p_completed = 0;
        SET p_message = CONCAT('상담일지 미작성으로 완료 처리 불가: ', v_validation_message);
    END IF;
    
END$$

-- 4. 일괄 스케줄 완료 처리 (상담일지 검증 포함)
DROP PROCEDURE IF EXISTS ProcessBatchScheduleCompletion$$

CREATE PROCEDURE ProcessBatchScheduleCompletion(
    IN p_branch_code VARCHAR(10),
    OUT p_processed_count INT,
    OUT p_completed_count INT,
    OUT p_reminder_count INT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_schedule_id BIGINT;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_session_date DATE;
    DECLARE v_has_record TINYINT(1);
    DECLARE v_validation_message VARCHAR(500);
    DECLARE v_reminder_id BIGINT;
    DECLARE v_reminder_message VARCHAR(500);
    DECLARE v_completed TINYINT(1);
    DECLARE v_completion_message VARCHAR(500);
    
    DECLARE schedule_cursor CURSOR FOR
        SELECT s.id, s.consultant_id, s.date
        FROM schedules s
        WHERE s.branch_code = p_branch_code
          AND s.status IN ('BOOKED', 'CONFIRMED')
          AND s.date <= CURDATE()
          AND (s.date < CURDATE() OR (s.date = CURDATE() AND s.end_time <= CURTIME()));
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_message = CONCAT('오류 발생: ', @text);
        ROLLBACK;
    END;
    
    SET p_processed_count = 0;
    SET p_completed_count = 0;
    SET p_reminder_count = 0;
    SET p_message = '';
    
    OPEN schedule_cursor;
    
    read_loop: LOOP
        FETCH schedule_cursor INTO v_schedule_id, v_consultant_id, v_session_date;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        SET p_processed_count = p_processed_count + 1;
        
        -- 상담일지 작성 여부 확인
        CALL ValidateConsultationRecordBeforeCompletion(
            v_schedule_id, v_consultant_id, v_session_date, 
            v_has_record, v_validation_message
        );
        
        IF v_has_record = 1 THEN
            -- 스케줄 완료 처리
            UPDATE schedules 
            SET status = 'COMPLETED', updated_at = NOW()
            WHERE id = v_schedule_id;
            
            SET p_completed_count = p_completed_count + 1;
        ELSE
            -- 상담일지 미작성 알림 생성
            CALL CreateConsultationRecordReminder(
                v_schedule_id, v_consultant_id, 0, v_session_date, 
                '00:00:00', '상담일지 미작성', 
                v_reminder_id, v_reminder_message
            );
            
            SET p_reminder_count = p_reminder_count + 1;
        END IF;
        
    END LOOP;
    
    CLOSE schedule_cursor;
    
    SET p_message = CONCAT('일괄 처리 완료: 처리=', p_processed_count, 
                          ', 완료=', p_completed_count, 
                          ', 알림=', p_reminder_count);
    
    -- 처리 결과 로그 기록
    INSERT INTO system_logs (log_type, log_level, message, created_at)
    VALUES ('BATCH_SCHEDULE_COMPLETION', 'INFO', p_message, NOW());
    
END$$

DELIMITER ;

-- =====================================================
-- 프로시저 생성 완료
-- =====================================================
