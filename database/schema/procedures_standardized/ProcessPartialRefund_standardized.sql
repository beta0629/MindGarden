-- =====================================================
-- 부분 환불 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessPartialRefund //

CREATE PROCEDURE ProcessPartialRefund(
    IN p_mapping_id BIGINT,
    IN p_refund_amount DECIMAL(15,2),
    IN p_refund_sessions INT,
    IN p_refund_reason TEXT,
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_new_total INT DEFAULT 0;
    DECLARE v_new_remaining INT DEFAULT 0;
    DECLARE v_refunded_sessions INT DEFAULT 0;
    DECLARE v_consultant_id BIGINT DEFAULT 0;
    DECLARE v_client_id BIGINT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('부분 환불 처리 중 오류 발생: ', v_error_message);
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
    
    IF p_refund_amount IS NULL OR p_refund_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '환불 금액은 0 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_refund_sessions IS NULL OR p_refund_sessions <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '환불 회기 수는 1 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 현재 매핑 정보 조회 (테넌트 격리)
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        status,
        payment_status,
        consultant_id,
        client_id
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_mapping_status,
        v_payment_status,
        v_consultant_id,
        v_client_id
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
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_success = FALSE;
        SET p_message = '이미 종료된 매핑입니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_success = FALSE;
        SET p_message = '결제가 확인되지 않은 매핑입니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF p_refund_sessions > v_current_remaining THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 요청 회기 수(', p_refund_sessions, ')가 남은 회기 수(', v_current_remaining, ')보다 많습니다.');
        ROLLBACK;
        LEAVE;
    ELSE
        -- 5. 환불 회기 수 계산
        SET v_refunded_sessions = LEAST(p_refund_sessions, v_current_remaining);
        SET v_new_total = v_current_total - v_refunded_sessions;
        SET v_new_remaining = v_current_remaining - v_refunded_sessions;
        
        -- 6. 매핑 회기 수 조정 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET 
            total_sessions = v_new_total,
            remaining_sessions = v_new_remaining,
            payment_amount = payment_amount - p_refund_amount,
            updated_at = NOW(),
            updated_by = p_processed_by
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        -- 7. 환불 거래 생성 (테넌트 격리)
        INSERT INTO financial_transactions (
            transaction_type,
            category,
            subcategory,
            amount,
            description,
            related_entity_id,
            related_entity_type,
            tenant_id,
            transaction_date,
            status,
            is_deleted,
            created_at,
            created_by
        ) VALUES (
            'EXPENSE',
            'CONSULTATION',
            'PARTIAL_SESSION_REFUND',
            p_refund_amount,
            CONCAT('부분 환불 - ', p_refund_reason, ' (', v_refunded_sessions, '회기)'),
            p_mapping_id,
            'CONSULTANT_CLIENT_MAPPING',
            p_tenant_id,
            CURDATE(),
            'COMPLETED',
            FALSE,
            NOW(),
            p_processed_by
        );
        
        -- 8. 환불 로그 기록 (테넌트 격리)
        INSERT INTO session_usage_logs (
            mapping_id, 
            consultant_id, 
            client_id, 
            session_type, 
            action_type, 
            additional_sessions,
            reason,
            tenant_id,
            created_at,
            created_by
        ) VALUES (
            p_mapping_id, 
            v_consultant_id,
            v_client_id,
            'PARTIAL_REFUND', 
            'REFUND', 
            -v_refunded_sessions,
            p_refund_reason,
            p_tenant_id,
            NOW(),
            p_processed_by
        );
        
        -- 9. 매핑 상태 업데이트 (테넌트 격리)
        IF v_new_remaining = 0 AND v_new_total > 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'COMPLETED',
                end_date = NOW(),
                updated_at = NOW(),
                updated_by = p_processed_by
            WHERE id = p_mapping_id 
              AND tenant_id = p_tenant_id 
              AND is_deleted = FALSE;
        ELSEIF v_new_total = 0 THEN
            UPDATE consultant_client_mappings 
            SET 
                status = 'TERMINATED',
                end_date = NOW(),
                updated_at = NOW(),
                updated_by = p_processed_by
            WHERE id = p_mapping_id 
              AND tenant_id = p_tenant_id 
              AND is_deleted = FALSE;
        END IF;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('부분 환불 처리 완료. 환불 회기: ', v_refunded_sessions, '회기, 남은 회기: ', v_new_remaining, '회기');
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

