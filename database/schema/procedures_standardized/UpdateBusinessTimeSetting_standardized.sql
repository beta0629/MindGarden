-- =====================================================
-- 업무 시간 설정 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateBusinessTimeSetting //

CREATE PROCEDURE UpdateBusinessTimeSetting(
    IN p_code_group VARCHAR(50),
    IN p_code_value VARCHAR(50),
    IN p_new_value VARCHAR(100),
    IN p_tenant_id VARCHAR(100),
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_updated_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('업무 시간 설정 업데이트 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_code_group IS NULL OR p_code_group = '' THEN
        SET p_success = FALSE;
        SET p_message = '코드 그룹은 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_code_value IS NULL OR p_code_value = '' THEN
        SET p_success = FALSE;
        SET p_message = '코드 값은 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_new_value IS NULL OR p_new_value = '' THEN
        SET p_success = FALSE;
        SET p_message = '새로운 값은 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 업무 시간 설정 업데이트 (테넌트 격리)
    UPDATE common_codes 
    SET 
        code_label = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, ')')
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '분)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '시간)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '일)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                CONCAT(SUBSTRING(code_label, 1, LOCATE('(', code_label)), p_new_value, '분)')
            ELSE code_label
        END,
        korean_name = CASE 
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value IN ('START_TIME', 'END_TIME', 'LUNCH_START', 'LUNCH_END') THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, ')')
            WHEN p_code_group = 'BUSINESS_HOURS' AND p_code_value = 'SLOT_INTERVAL' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '분)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MIN_NOTICE_HOURS' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '시간)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'MAX_ADVANCE_DAYS' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '일)')
            WHEN p_code_group = 'CANCELLATION_POLICY' AND p_code_value = 'BREAK_TIME_MINUTES' THEN
                CONCAT(SUBSTRING(korean_name, 1, LOCATE('(', korean_name)), p_new_value, '분)')
            ELSE korean_name
        END,
        updated_at = NOW(),
        updated_by = p_updated_by,
        version = version + 1
    WHERE code_group = p_code_group 
      AND code_value = p_code_value
      AND tenant_id = p_tenant_id
      AND is_active = TRUE 
      AND is_deleted = FALSE;
    
    SET v_updated_count = ROW_COUNT();
    
    IF v_updated_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '업무 시간 설정을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    SET p_success = TRUE;
    SET p_message = CONCAT('업무 시간 설정이 업데이트되었습니다. (', v_updated_count, '건)');
    
    COMMIT;
    
END //

DELIMITER ;

