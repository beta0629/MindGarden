-- =====================================================
-- 업무 시간 설정 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetBusinessTimeSettings //

CREATE PROCEDURE GetBusinessTimeSettings(
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_settings_data JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_business_hours JSON;
    DECLARE v_cancellation_policy JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('업무 시간 설정 조회 중 오류 발생: ', v_error_message);
        SET p_settings_data = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_settings_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 업무 시간 설정 조회 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'code_group', code_group,
            'code_value', code_value,
            'code_label', code_label,
            'korean_name', korean_name,
            'setting_key', CASE 
                WHEN code_value = 'START_TIME' THEN 'businessStartTime'
                WHEN code_value = 'END_TIME' THEN 'businessEndTime'
                WHEN code_value = 'LUNCH_START' THEN 'lunchStartTime'
                WHEN code_value = 'LUNCH_END' THEN 'lunchEndTime'
                WHEN code_value = 'SLOT_INTERVAL' THEN 'slotIntervalMinutes'
            END,
            'setting_value', CASE 
                WHEN code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                    SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE(')', korean_name) - LOCATE('(', korean_name) - 1)
                WHEN code_value = 'SLOT_INTERVAL' THEN
                    SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('분', korean_name) - LOCATE('(', korean_name) - 1)
            END
        )
    )
    INTO v_business_hours
    FROM common_codes 
    WHERE code_group = 'BUSINESS_HOURS' 
      AND tenant_id = p_tenant_id
      AND is_active = TRUE 
      AND is_deleted = FALSE
    ORDER BY sort_order;
    
    -- 3. 취소 정책 설정 조회 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'code_group', code_group,
            'code_value', code_value,
            'code_label', code_label,
            'korean_name', korean_name,
            'setting_key', CASE 
                WHEN code_value = 'MIN_NOTICE_HOURS' THEN 'minNoticeHours'
                WHEN code_value = 'MAX_ADVANCE_DAYS' THEN 'maxAdvanceBookingDays'
                WHEN code_value = 'BREAK_TIME_MINUTES' THEN 'breakTimeMinutes'
            END,
            'setting_value', CASE 
                WHEN code_value = 'MIN_NOTICE_HOURS' THEN
                    SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('시간', korean_name) - LOCATE('(', korean_name) - 1)
                WHEN code_value = 'MAX_ADVANCE_DAYS' THEN
                    SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('일', korean_name) - LOCATE('(', korean_name) - 1)
                WHEN code_value = 'BREAK_TIME_MINUTES' THEN
                    SUBSTRING(korean_name, LOCATE('(', korean_name) + 1, LOCATE('분', korean_name) - LOCATE('(', korean_name) - 1)
            END
        )
    )
    INTO v_cancellation_policy
    FROM common_codes 
    WHERE code_group = 'CANCELLATION_POLICY' 
      AND tenant_id = p_tenant_id
      AND is_active = TRUE 
      AND is_deleted = FALSE
    ORDER BY sort_order;
    
    -- 4. 최종 설정 데이터 생성
    SET p_settings_data = JSON_OBJECT(
        'business_hours', IFNULL(v_business_hours, JSON_ARRAY()),
        'cancellation_policy', IFNULL(v_cancellation_policy, JSON_ARRAY())
    );
    
    SET p_success = TRUE;
    SET p_message = '업무 시간 설정 조회가 완료되었습니다.';
    
END //

DELIMITER ;

