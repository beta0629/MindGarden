-- =====================================================
-- 매핑 무결성 검증 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ValidateMappingIntegrity //

CREATE PROCEDURE ValidateMappingIntegrity(
    IN p_mapping_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_validation_results JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    DECLARE v_actual_used INT DEFAULT 0;
    DECLARE v_schedule_count INT DEFAULT 0;
    DECLARE v_mapping_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('무결성 검증 중 오류 발생: ', v_error_message);
        SET p_validation_results = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_validation_results = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    IF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_validation_results = JSON_OBJECT('error', '매핑 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 매핑 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) > 0 INTO v_mapping_exists
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;
    
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;
    
    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        SET p_validation_results = JSON_OBJECT('exists', FALSE);
        LEAVE;
    ELSE
        -- 3. 매핑 정보 조회 (테넌트 격리)
        SELECT 
            total_sessions, 
            used_sessions, 
            remaining_sessions,
            consultant_id,
            client_id
        INTO 
            v_total_sessions, 
            v_used_sessions, 
            v_remaining_sessions,
            v_consultant_id,
            v_client_id
        FROM consultant_client_mappings 
        WHERE id = p_mapping_id
          AND tenant_id = p_tenant_id
          AND is_deleted = FALSE;
        
        -- 4. 실제 스케줄 수 조회 (테넌트 격리)
        SELECT COUNT(*) INTO v_actual_used
        FROM schedules 
        WHERE consultant_id = v_consultant_id
          AND client_id = v_client_id
          AND tenant_id = p_tenant_id
          AND status IN ('COMPLETED', 'BOOKED')
          AND is_deleted = FALSE;
        
        -- 5. 무결성 검증 결과 생성
        SET p_validation_results = JSON_OBJECT(
            'mapping_id', p_mapping_id,
            'total_sessions', v_total_sessions,
            'used_sessions', v_used_sessions,
            'remaining_sessions', v_remaining_sessions,
            'actual_schedule_count', v_actual_used,
            'sessions_match', (v_used_sessions = v_actual_used),
            'total_calculation_correct', (v_total_sessions = v_used_sessions + v_remaining_sessions),
            'is_valid', (v_used_sessions = v_actual_used AND v_total_sessions = v_used_sessions + v_remaining_sessions)
        );
        
        -- 6. 검증 결과 설정
        IF v_used_sessions = v_actual_used AND v_total_sessions = v_used_sessions + v_remaining_sessions THEN
            SET p_success = TRUE;
            SET p_message = '매핑 데이터 무결성이 유지되고 있습니다.';
        ELSE
            SET p_success = FALSE;
            SET p_message = '매핑 데이터에 불일치가 발견되었습니다.';
        END IF;
    END IF;
    
END //

DELIMITER ;

