-- =====================================================
-- 할인 환불 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessDiscountRefund //

CREATE PROCEDURE ProcessDiscountRefund(
    IN p_mapping_id BIGINT,
    IN p_refund_amount DECIMAL(15,2),
    IN p_refund_reason VARCHAR(500),
    IN p_tenant_id VARCHAR(100),
    IN p_processed_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_remaining_amount DECIMAL(15,2);
    DECLARE v_refunded_amount DECIMAL(15,2);
    DECLARE v_new_remaining_amount DECIMAL(15,2);
    DECLARE v_refund_transaction_id BIGINT;
    DECLARE v_discount_code VARCHAR(50);
    DECLARE v_accounting_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 처리 중 오류 발생: ', v_error_message);
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
    
    -- 2. 할인 회계 거래 조회 (테넌트 격리)
    SELECT id, status, remaining_amount, refunded_amount, discount_code
    INTO v_accounting_id, v_current_status, v_remaining_amount, v_refunded_amount, v_discount_code
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id 
      AND tenant_id = p_tenant_id
      AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND')
      AND is_deleted = FALSE;
    
    -- 3. 할인 회계 거래 존재 여부 확인
    SELECT COUNT(*) INTO v_accounting_count
    FROM discount_accounting_transactions
    WHERE mapping_id = p_mapping_id 
      AND tenant_id = p_tenant_id
      AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND')
      AND is_deleted = FALSE;
    
    IF v_accounting_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '환불 가능한 할인 거래를 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSEIF v_remaining_amount < p_refund_amount THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 요청 금액이 잔여 금액을 초과합니다. 잔여: ', v_remaining_amount, ', 요청: ', p_refund_amount);
        ROLLBACK;
        LEAVE;
    ELSE
        -- 4. 환불 거래 생성 (테넌트 격리)
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
            created_by,
            discount_code
        ) VALUES (
            'EXPENSE', 
            'DISCOUNT_REFUND', 
            'PACKAGE_DISCOUNT_REFUND', 
            p_refund_amount,
            CONCAT('할인 환불 - ', IFNULL(v_discount_code, 'N/A'), ' (', p_refund_amount, '원) - ', p_refund_reason),
            p_mapping_id, 
            'CONSULTANT_CLIENT_MAPPING', 
            p_tenant_id,
            NOW(), 
            'COMPLETED', 
            FALSE,
            NOW(), 
            p_processed_by,
            v_discount_code
        );
        
        SET v_refund_transaction_id = LAST_INSERT_ID();
        
        -- 5. 잔여 금액 계산
        SET v_new_remaining_amount = v_remaining_amount - p_refund_amount;
        
        -- 6. 할인 회계 거래 업데이트 (테넌트 격리)
        UPDATE discount_accounting_transactions 
        SET refunded_amount = IFNULL(refunded_amount, 0) + p_refund_amount,
            remaining_amount = v_new_remaining_amount,
            refund_transaction_id = v_refund_transaction_id,
            refund_reason = p_refund_reason,
            refunded_at = NOW(),
            status = CASE 
                WHEN v_new_remaining_amount <= 0 THEN 'FULL_REFUND'
                ELSE 'PARTIAL_REFUND'
            END,
            updated_at = NOW(),
            updated_by = p_processed_by
        WHERE id = v_accounting_id 
          AND tenant_id = p_tenant_id
          AND is_deleted = FALSE;
        
        -- 7. 매핑 테이블 업데이트 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET final_amount = v_new_remaining_amount,
            updated_at = NOW(),
            updated_by = p_processed_by
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('환불 처리 완료. 환불거래ID: ', v_refund_transaction_id, ', 잔여금액: ', v_new_remaining_amount);
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

