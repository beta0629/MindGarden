-- =====================================================
-- 매핑 회기 사용 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UseSessionForMapping //

CREATE PROCEDURE UseSessionForMapping(
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_schedule_id BIGINT,
    IN p_session_type VARCHAR(50),
    IN p_tenant_id VARCHAR(100),
    IN p_used_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_mapping_id BIGINT DEFAULT NULL;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('회기 사용 처리 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '상담사 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_client_id IS NULL OR p_client_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '내담자 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_schedule_id IS NULL OR p_schedule_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '스케줄 ID는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 활성 매핑 조회 (테넌트 격리)
    SELECT 
        id, 
        remaining_sessions, 
        used_sessions, 
        total_sessions,
        status,
        payment_status
    INTO 
        v_mapping_id, 
        v_remaining_sessions, 
        v_used_sessions, 
        v_total_sessions,
        v_mapping_status,
        v_payment_status
    FROM consultant_client_mappings 
    WHERE consultant_id = p_consultant_id 
      AND client_id = p_client_id 
      AND tenant_id = p_tenant_id
      AND status = 'ACTIVE'
      AND is_deleted = FALSE
    LIMIT 1;
    
    -- 3. 매핑 존재 여부 확인
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE consultant_id = p_consultant_id 
      AND client_id = p_client_id 
      AND tenant_id = p_tenant_id
      AND status = 'ACTIVE'
      AND is_deleted = FALSE;
    
    -- 4. 매핑 존재 및 상태 검증
    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '활성 매핑을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_mapping_status != 'ACTIVE' THEN
        SET p_success = FALSE;
        SET p_message = '매핑이 활성 상태가 아닙니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_success = FALSE;
        SET p_message = '결제가 확인되지 않은 매핑입니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_remaining_sessions <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '사용 가능한 회기가 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSE
        -- 5. 회기 사용 처리 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET 
            remaining_sessions = remaining_sessions - 1,
            used_sessions = used_sessions + 1,
            updated_at = NOW(),
            updated_by = p_used_by
        WHERE id = v_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        -- 6. 회기 사용 로그 기록
        -- 주의: session_usage_logs 테이블에 tenant_id, created_by 필드가 없음
        INSERT INTO session_usage_logs (
            mapping_id, 
            schedule_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type,
            created_at
        ) VALUES (
            v_mapping_id, 
            p_schedule_id, 
            p_consultant_id, 
            p_client_id, 
            p_session_type, 
            'USE',
            NOW()
        );
        
        -- 7. 매핑 상태 업데이트 (회기 소진 시, 테넌트 격리)
        IF (v_remaining_sessions - 1) = 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'COMPLETED',
                end_date = NOW(),
                updated_at = NOW(),
                updated_by = p_used_by
            WHERE id = v_mapping_id 
              AND tenant_id = p_tenant_id 
              AND is_deleted = FALSE;
        END IF;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('회기 사용 완료. 남은 회기: ', (v_remaining_sessions - 1));
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

