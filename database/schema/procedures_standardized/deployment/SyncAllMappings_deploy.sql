-- =====================================================
-- 전체 매핑 동기화 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS SyncAllMappings //

CREATE PROCEDURE SyncAllMappings(
    IN p_tenant_id VARCHAR(100),
    IN p_synced_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_sync_results JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_mappings INT DEFAULT 0;
    DECLARE v_valid_mappings INT DEFAULT 0;
    DECLARE v_invalid_mappings INT DEFAULT 0;
    DECLARE v_fixed_mappings INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE v_mapping_id BIGINT DEFAULT 0;
    DECLARE v_validation_code INT;
    DECLARE v_validation_message VARCHAR(500);
    DECLARE v_validation_json JSON;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_actual_used INT DEFAULT 0;
    
    DECLARE mapping_cursor CURSOR FOR 
        SELECT id FROM consultant_client_mappings 
        WHERE tenant_id = p_tenant_id
          AND status IN ('ACTIVE', 'COMPLETED')
          AND is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 동기화 중 오류 발생: ', v_error_message);
        SET p_sync_results = JSON_OBJECT('error', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_sync_results = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 전체 매핑 수 조회 (테넌트 격리)
    SELECT COUNT(*) INTO v_total_mappings
    FROM consultant_client_mappings 
    WHERE tenant_id = p_tenant_id
      AND status IN ('ACTIVE', 'COMPLETED')
      AND is_deleted = FALSE;
    
    -- 3. 각 매핑별 무결성 검증 및 수정
    OPEN mapping_cursor;
    
    read_loop: LOOP
        FETCH mapping_cursor INTO v_mapping_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 무결성 검증 (테넌트 격리)
        CALL ValidateMappingIntegrity(
            v_mapping_id,
            p_tenant_id,
            v_validation_code,
            v_validation_message,
            v_validation_json
        );
        
        IF v_validation_code = 0 THEN
            SET v_valid_mappings = v_valid_mappings + 1;
        ELSE
            SET v_invalid_mappings = v_invalid_mappings + 1;
            
            -- 자동 수정 시도 (테넌트 격리)
            SELECT consultant_id, client_id
            INTO v_consultant_id, v_client_id
            FROM consultant_client_mappings
            WHERE id = v_mapping_id
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;
            
            -- 실제 사용된 회기 수 계산 (테넌트 격리)
            SELECT COUNT(*) INTO v_actual_used
            FROM schedules 
            WHERE consultant_id = v_consultant_id
              AND client_id = v_client_id
              AND tenant_id = p_tenant_id
              AND status IN ('COMPLETED', 'BOOKED')
              AND is_deleted = FALSE;
            
            -- 매핑 정보 업데이트 (테넌트 격리)
            UPDATE consultant_client_mappings 
            SET 
                used_sessions = v_actual_used,
                remaining_sessions = total_sessions - v_actual_used,
                updated_at = NOW(),
                updated_by = p_synced_by
            WHERE id = v_mapping_id
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;
            
            SET v_fixed_mappings = v_fixed_mappings + 1;
        END IF;
    END LOOP;
    
    CLOSE mapping_cursor;
    
    -- 4. 결과 생성
    SET p_sync_results = JSON_OBJECT(
        'total_mappings', v_total_mappings,
        'valid_mappings', v_valid_mappings,
        'invalid_mappings', v_invalid_mappings,
        'fixed_mappings', v_fixed_mappings,
        'sync_timestamp', NOW()
    );
    
    SET p_success = TRUE;
    SET p_message = CONCAT('전체 동기화 완료. 총 ', v_total_mappings, '개 매핑 중 ', v_valid_mappings, '개 유효, ', v_fixed_mappings, '개 수정');
    
    COMMIT;
    
END //

DELIMITER ;

