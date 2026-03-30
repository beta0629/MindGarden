-- =====================================================
-- 할인 회계 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ApplyDiscountAccounting //

CREATE PROCEDURE ApplyDiscountAccounting(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(10,2),
    IN p_discount_amount DECIMAL(10,2),
    IN p_final_amount DECIMAL(10,2),
    IN p_tenant_id VARCHAR(100),
    IN p_applied_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_revenue_transaction_id BIGINT;
    DECLARE v_discount_transaction_id BIGINT;
    DECLARE v_accounting_transaction_id BIGINT;
    DECLARE v_existing_count INT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('할인 적용 중 오류 발생: ', v_error_message);
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
    
    IF p_original_amount IS NULL OR p_original_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '원래 금액은 0 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_discount_amount IS NULL OR p_discount_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '할인 금액은 0 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_final_amount IS NULL OR p_final_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '최종 금액은 0 이상이어야 합니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 매핑 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 3. 기존 할인 거래 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_existing_count 
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id 
      AND tenant_id = p_tenant_id
      AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND')
      AND is_deleted = FALSE;
    
    IF v_existing_count > 0 THEN
        SET p_success = FALSE;
        SET p_message = '이미 할인이 적용된 매핑입니다.';
        ROLLBACK;
        LEAVE;
    ELSE
        -- 4. 매출 거래 생성 (테넌트 격리)
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
            'INCOME', 
            'CONSULTATION', 
            'PACKAGE_SALE', 
            p_original_amount,
            CONCAT('패키지 판매 - 원래 금액 (할인코드: ', IFNULL(p_discount_code, 'N/A'), ')'),
            p_mapping_id, 
            'CONSULTANT_CLIENT_MAPPING', 
            p_tenant_id,
            NOW(), 
            'COMPLETED', 
            FALSE,
            NOW(), 
            p_applied_by,
            p_discount_code
        );
        
        SET v_revenue_transaction_id = LAST_INSERT_ID();
        
        -- 5. 할인 거래 생성 (EXPENSE 타입으로 저장, 테넌트 격리)
        -- 표준화: transaction_type은 INCOME 또는 EXPENSE만 사용 (DISCOUNT는 사용하지 않음)
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
            'SALES_DISCOUNT', 
            'PACKAGE_DISCOUNT', 
            p_discount_amount,
            CONCAT('패키지 할인 - ', IFNULL(p_discount_code, '자동할인'), ' (', p_discount_amount, '원)'),
            p_mapping_id, 
            'CONSULTANT_CLIENT_MAPPING', 
            p_tenant_id,
            NOW(), 
            'COMPLETED', 
            FALSE,
            NOW(), 
            p_applied_by,
            p_discount_code
        );
        
        SET v_discount_transaction_id = LAST_INSERT_ID();
        
        -- 6. 할인 회계 거래 생성 (테넌트 격리)
        INSERT INTO discount_accounting_transactions (
            mapping_id, 
            discount_code, 
            original_amount, 
            discount_amount, 
            final_amount,
            remaining_amount, 
            status, 
            revenue_transaction_id, 
            discount_transaction_id,
            tenant_id,
            applied_by, 
            applied_at, 
            created_at,
            created_by,
            is_deleted
        ) VALUES (
            p_mapping_id, 
            p_discount_code, 
            p_original_amount, 
            p_discount_amount, 
            p_final_amount,
            p_final_amount, 
            'APPLIED', 
            v_revenue_transaction_id, 
            v_discount_transaction_id,
            p_tenant_id,
            p_applied_by, 
            NOW(), 
            NOW(),
            p_applied_by,
            FALSE
        );
        
        SET v_accounting_transaction_id = LAST_INSERT_ID();
        
        -- 7. 매핑 테이블 업데이트 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET discount_code = p_discount_code,
            discount_amount = p_discount_amount,
            original_amount = p_original_amount,
            final_amount = p_final_amount,
            discount_applied_at = NOW(),
            updated_at = NOW(),
            updated_by = p_applied_by
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        COMMIT;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('할인 적용 완료. 회계거래ID: ', v_accounting_transaction_id);
    END IF;
    
END //

DELIMITER ;

