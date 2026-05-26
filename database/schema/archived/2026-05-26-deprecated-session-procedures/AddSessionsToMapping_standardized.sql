-- =====================================================
-- 회기 추가 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS AddSessionsToMapping //

CREATE PROCEDURE AddSessionsToMapping(
    IN p_mapping_id BIGINT,
    IN p_additional_sessions INT,
    IN p_package_name VARCHAR(100),
    IN p_package_price BIGINT,
    IN p_extension_reason TEXT,
    IN p_tenant_id VARCHAR(100),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('회기 추가 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_additional_sessions IS NULL OR p_additional_sessions <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '추가할 회기 수는 1 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 현재 매핑 정보 조회 (테넌트 격리)
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        status
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_mapping_status
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 3. 매핑 존재 여부 확인
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 4. 매핑 존재 및 상태 검증
    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_mapping_status NOT IN ('ACTIVE', 'COMPLETED') THEN
        SET p_success = FALSE;
        SET p_message = '회기 추가가 가능한 상태가 아닙니다.';
        ROLLBACK;
        LEAVE;
    ELSE
        -- 5. 회기 추가 처리 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET 
            total_sessions = total_sessions + p_additional_sessions,
            remaining_sessions = remaining_sessions + p_additional_sessions,
            status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_created_by
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        -- 6. 회기 추가 로그 기록 (테넌트 격리)
        INSERT INTO session_usage_logs (
            mapping_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            additional_sessions,
            package_name,
            package_price,
            reason,
            tenant_id,
            created_at,
            created_by
        ) VALUES (
            p_mapping_id, 
            (SELECT consultant_id FROM consultant_client_mappings 
             WHERE id = p_mapping_id AND tenant_id = p_tenant_id AND is_deleted = FALSE),
            (SELECT client_id FROM consultant_client_mappings 
             WHERE id = p_mapping_id AND tenant_id = p_tenant_id AND is_deleted = FALSE),
            'EXTENSION', 
            'ADD', 
            p_additional_sessions,
            p_package_name,
            p_package_price,
            p_extension_reason,
            p_tenant_id,
            NOW(),
            p_created_by
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('회기 추가 완료. 총 회기: ', (v_current_total + p_additional_sessions), ', 남은 회기: ', (v_current_remaining + p_additional_sessions));
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

