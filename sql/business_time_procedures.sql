-- =====================================================
-- 업무 시간 및 정책 관리 PL/SQL 프로시저
-- =====================================================

DELIMITER //

-- 업무 시간 설정 조회 프로시저
DROP PROCEDURE IF EXISTS GetBusinessTimeSettings//
CREATE PROCEDURE GetBusinessTimeSettings()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    SELECT 
        'BUSINESS_HOURS' as code_group,
        code_value,
        code_label,
        korean_name,
        CASE 
            WHEN code_value = 'START_TIME' THEN 'businessStartTime'
            WHEN code_value = 'END_TIME' THEN 'businessEndTime'
            WHEN code_value = 'LUNCH_START' THEN 'lunchStartTime'
            WHEN code_value = 'LUNCH_END' THEN 'lunchEndTime'
            WHEN code_value = 'SLOT_INTERVAL' THEN 'slotIntervalMinutes'
        END as setting_key,
        CASE 
            WHEN code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1)
            WHEN code_value = 'SLOT_INTERVAL' THEN
                CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
        END as setting_value
    FROM common_codes 
    WHERE code_group = 'BUSINESS_HOURS' 
        AND is_active = 1 
        AND is_deleted = 0
    ORDER BY sort_order;
    
    SELECT 
        'CANCELLATION_POLICY' as code_group,
        code_value,
        code_label,
        korean_name,
        CASE 
            WHEN code_value = 'MIN_NOTICE_HOURS' THEN 'minNoticeHours'
            WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 'maxAdvanceBookingDays'
            WHEN code_value = 'BREAK_TIME_MINUTES' THEN 'breakTimeMinutes'
        END as setting_key,
        CASE 
            WHEN code_value = 'MIN_NOTICE_HOURS' THEN
                CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
            WHEN code_value = 'MAX_ADVANCE_DAYS' THEN
                CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
            WHEN code_value = 'BREAK_TIME_MINUTES' THEN
                CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
        END as setting_value
    FROM common_codes 
    WHERE code_group = 'CANCELLATION_POLICY' 
        AND is_active = 1 
        AND is_deleted = 0
    ORDER BY sort_order;
    
    COMMIT;
END//

-- 업무 시간 설정 업데이트 프로시저
DROP PROCEDURE IF EXISTS UpdateBusinessTimeSetting//
CREATE PROCEDURE UpdateBusinessTimeSetting(
    IN p_code_group VARCHAR(50),
    IN p_code_value VARCHAR(50),
    IN p_new_value VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    UPDATE common_codes 
    SET 
        code_label = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                REPLACE(code_label, SUBSTRING(code_label, LOCATE('(', code_label), LOCATE(')', code_label) - LOCATE('(', code_label) + 1), CONCAT('(', p_new_value, ')'))
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                REPLACE(code_label, SUBSTRING(code_label, LOCATE('(', code_label), LOCATE(')', code_label) - LOCATE('(', code_label) + 1), CONCAT('(', p_new_value, '분)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                REPLACE(code_label, SUBSTRING(code_label, LOCATE('(', code_label), LOCATE(')', code_label) - LOCATE('(', code_label) + 1), CONCAT('(', p_new_value, '시간)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                REPLACE(code_label, SUBSTRING(code_label, LOCATE('(', code_label), LOCATE(')', code_label) - LOCATE('(', code_label) + 1), CONCAT('(', p_new_value, '일)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                REPLACE(code_label, SUBSTRING(code_label, LOCATE('(', code_label), LOCATE(')', code_label) - LOCATE('(', code_label) + 1), CONCAT('(', p_new_value, '분)'))
            ELSE code_label
        END,
        korean_name = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                REPLACE(korean_name, SUBSTRING(korean_name, LOCATE('(', korean_name), LOCATE(')', korean_name) - LOCATE('(', korean_name) + 1), CONCAT('(', p_new_value, ')'))
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                REPLACE(korean_name, SUBSTRING(korean_name, LOCATE('(', korean_name), LOCATE(')', korean_name) - LOCATE('(', korean_name) + 1), CONCAT('(', p_new_value, '분)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                REPLACE(korean_name, SUBSTRING(korean_name, LOCATE('(', korean_name), LOCATE(')', korean_name) - LOCATE('(', korean_name) + 1), CONCAT('(', p_new_value, '시간)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                REPLACE(korean_name, SUBSTRING(korean_name, LOCATE('(', korean_name), LOCATE(')', korean_name) - LOCATE('(', korean_name) + 1), CONCAT('(', p_new_value, '일)'))
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                REPLACE(korean_name, SUBSTRING(korean_name, LOCATE('(', korean_name), LOCATE(')', korean_name) - LOCATE('(', korean_name) + 1), CONCAT('(', p_new_value, '분)'))
            ELSE korean_name
        END,
        updated_at = NOW(),
        version = version + 1
    WHERE code_group = p_code_group 
        AND code_value = p_code_value
        AND is_active = 1 
        AND is_deleted = 0;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '업무 시간 설정을 찾을 수 없습니다.';
    END IF;
    
    COMMIT;
END//

-- 시간 충돌 검사 프로시저
DROP PROCEDURE IF EXISTS CheckTimeConflict//
CREATE PROCEDURE CheckTimeConflict(
    IN p_consultant_id BIGINT,
    IN p_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_exclude_schedule_id BIGINT,
    OUT p_has_conflict BOOLEAN,
    OUT p_conflict_reason VARCHAR(255)
)
BEGIN
    DECLARE v_business_start_time TIME;
    DECLARE v_business_end_time TIME;
    DECLARE v_lunch_start_time TIME;
    DECLARE v_lunch_end_time TIME;
    DECLARE v_min_notice_hours INT;
    DECLARE v_max_advance_days INT;
    DECLARE v_conflict_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 기본값 설정
    SET p_has_conflict = FALSE;
    SET p_conflict_reason = '';
    
    -- 업무 시간 설정 조회
    SELECT 
        MAX(CASE WHEN code_value = 'START_TIME' THEN 
            TIME(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'END_TIME' THEN 
            TIME(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'LUNCH_START' THEN 
            TIME(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1)) 
        END),
        MAX(CASE WHEN code_value = 'LUNCH_END' THEN 
            TIME(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1)) 
        END)
    INTO v_business_start_time, v_business_end_time, v_lunch_start_time, v_lunch_end_time
    FROM common_codes 
    WHERE code_group = 'BUSINESS_HOURS' 
        AND code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END')
        AND is_active = 1 AND is_deleted = 0;
    
    -- 취소 정책 설정 조회
    SELECT 
        MAX(CASE WHEN code_value = 'MIN_NOTICE_HOURS' THEN 
            CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
        END),
        MAX(CASE WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 
            CAST(REGEXP_REPLACE(SUBSTRING(code_label, LOCATE('(', code_label) + 1, LOCATE(')', code_label) - LOCATE('(', code_label) - 1), '[^0-9]', '') AS UNSIGNED)
        END)
    INTO v_min_notice_hours, v_max_advance_days
    FROM common_codes 
    WHERE code_group = 'CANCELLATION_POLICY' 
        AND code_value IN ('MIN_NOTICE_HOURS', 'MAX_ADVANCE_DAYS')
        AND is_active = 1 AND is_deleted = 0;
    
    -- 기본값 설정 (설정이 없는 경우)
    SET v_business_start_time = IFNULL(v_business_start_time, TIME('10:00:00'));
    SET v_business_end_time = IFNULL(v_business_end_time, TIME('20:00:00'));
    SET v_lunch_start_time = IFNULL(v_lunch_start_time, TIME('12:00:00'));
    SET v_lunch_end_time = IFNULL(v_lunch_end_time, TIME('13:00:00'));
    SET v_min_notice_hours = IFNULL(v_min_notice_hours, 24);
    SET v_max_advance_days = IFNULL(v_max_advance_days, 30);
    
    -- 1. 업무 시간 체크
    IF p_start_time < v_business_start_time OR p_end_time > v_business_end_time THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '업무 시간 외 시간입니다.';
    END IF;
    
    -- 2. 점심 시간 체크
    IF NOT p_has_conflict AND (
        (p_start_time >= v_lunch_start_time AND p_start_time < v_lunch_end_time) OR
        (p_end_time > v_lunch_start_time AND p_end_time <= v_lunch_end_time) OR
        (p_start_time < v_lunch_start_time AND p_end_time > v_lunch_end_time)
    ) THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '점심 시간과 겹칩니다.';
    END IF;
    
    -- 3. 사전 예약 기간 체크
    IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) > v_max_advance_days THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = CONCAT('최대 예약 가능 일수를 초과했습니다. (', v_max_advance_days, '일)');
    END IF;
    
    -- 4. 최소 통지 시간 체크
    IF NOT p_has_conflict AND DATEDIFF(p_date, CURDATE()) = 0 AND 
       TIME_TO_SEC(TIMEDIFF(p_start_time, CURTIME())) < (v_min_notice_hours * 3600) THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = CONCAT('최소 통지 시간이 부족합니다. (', v_min_notice_hours, '시간)');
    END IF;
    
    -- 5. 기존 스케줄과의 충돌 체크
    IF NOT p_has_conflict THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedules 
        WHERE consultant_id = p_consultant_id 
            AND date = p_date
            AND status NOT IN ('CANCELLED', 'COMPLETED')
            AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
            AND (
                (p_start_time >= start_time AND p_start_time < end_time) OR
                (p_end_time > start_time AND p_end_time <= end_time) OR
                (p_start_time < start_time AND p_end_time > end_time)
            );
        
        IF v_conflict_count > 0 THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '기존 스케줄과 시간이 겹칩니다.';
        END IF;
    END IF;
    
    COMMIT;
END//

DELIMITER ;
