-- =====================================================
-- 할인 회계 처리 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ProcessDiscountAccounting //

CREATE PROCEDURE ProcessDiscountAccounting(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(15,2),
    IN p_discount_amount DECIMAL(15,2),
    IN p_final_amount DECIMAL(15,2),
    IN p_discount_type VARCHAR(20),
    IN p_tenant_id VARCHAR(100),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_accounting_id BIGINT,
    OUT p_erp_transaction_id VARCHAR(100),
    OUT p_accounting_summary JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_discount_name VARCHAR(100);
    DECLARE v_discount_rate DECIMAL(5,4);
    DECLARE v_tax_amount DECIMAL(15,2);
    DECLARE v_net_amount DECIMAL(15,2);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_mapping_count INT DEFAULT 0;
    DECLARE v_discount_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('할인 회계 처리 중 오류 발생: ', v_error_message);
        SET p_accounting_id = NULL;
        SET p_erp_transaction_id = NULL;
        SET p_accounting_summary = JSON_OBJECT('error', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_accounting_id = NULL;
        SET p_erp_transaction_id = NULL;
        SET p_accounting_summary = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        ROLLBACK;
    ELSEIF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_accounting_id = NULL;
        SET p_erp_transaction_id = NULL;
        SET p_accounting_summary = JSON_OBJECT('error', '매핑 ID가 필요합니다.');
        ROLLBACK;
    ELSEIF p_original_amount IS NULL OR p_original_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '원래 금액은 0 이상이어야 합니다.';
        SET p_accounting_id = NULL;
        SET p_erp_transaction_id = NULL;
        SET p_accounting_summary = JSON_OBJECT('error', '유효한 금액이 필요합니다.');
        ROLLBACK;
    ELSE
        -- 2. 매핑 정보 조회 (테넌트 격리)
        SELECT 
            consultant_id,
            client_id
        INTO v_consultant_id, v_client_id
        FROM consultant_client_mappings ccm
        WHERE ccm.id = p_mapping_id 
          AND ccm.tenant_id = p_tenant_id
          AND ccm.is_deleted = FALSE;
        
        -- 3. 매핑 존재 여부 확인
        SELECT COUNT(*) INTO v_mapping_count
        FROM consultant_client_mappings
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id
          AND is_deleted = FALSE;
        
        IF v_mapping_count = 0 THEN
            SET p_success = FALSE;
            SET p_message = '매핑을 찾을 수 없습니다.';
            SET p_accounting_id = NULL;
            SET p_erp_transaction_id = NULL;
            SET p_accounting_summary = JSON_OBJECT('error', '매핑을 찾을 수 없습니다.');
            ROLLBACK;
        ELSE
            -- 4. 할인 정보 조회 (테넌트 격리)
            SELECT 
                discount_name,
                discount_rate
            INTO v_discount_name, v_discount_rate
            FROM package_discounts
            WHERE discount_code = p_discount_code 
              AND tenant_id = p_tenant_id
              AND is_active = TRUE
              AND is_deleted = FALSE;
            
            -- 5. 할인 존재 여부 확인
            SELECT COUNT(*) INTO v_discount_count
            FROM package_discounts
            WHERE discount_code = p_discount_code 
              AND tenant_id = p_tenant_id
              AND is_active = TRUE
              AND is_deleted = FALSE;
            
            IF v_discount_count = 0 THEN
                SET p_success = FALSE;
                SET p_message = '활성화된 할인 코드를 찾을 수 없습니다.';
                SET p_accounting_id = NULL;
                SET p_erp_transaction_id = NULL;
                SET p_accounting_summary = JSON_OBJECT('error', '활성화된 할인 코드를 찾을 수 없습니다.');
                ROLLBACK;
            ELSE
                -- 6. 세금 계산 (부가가치세 10%)
                SET v_tax_amount = p_final_amount * 0.10;
                SET v_net_amount = p_final_amount - v_tax_amount;
                
                -- 7. 할인 회계 거래 생성 (테넌트 격리)
                -- 주의: discount_accounting_transactions 테이블에 is_deleted, created_by 필드가 없음
                INSERT INTO discount_accounting_transactions (
                    mapping_id,
                    discount_code,
                    discount_name,
                    original_amount,
                    discount_amount,
                    final_amount,
                    tax_amount,
                    net_amount,
                    discount_type,
                    consultant_id,
                    client_id,
                    tenant_id,
                    status,
                    created_at,
                    updated_at
                ) VALUES (
                    p_mapping_id,
                    p_discount_code,
                    v_discount_name,
                    p_original_amount,
                    p_discount_amount,
                    p_final_amount,
                    v_tax_amount,
                    v_net_amount,
                    p_discount_type,
                    v_consultant_id,
                    v_client_id,
                    p_tenant_id,
                    'APPLIED',
                    NOW(),
                    NOW()
                );
                
                SET p_accounting_id = LAST_INSERT_ID();
                
                -- 8. ERP 거래 ID 생성
                SET p_erp_transaction_id = CONCAT('DISCOUNT_', p_accounting_id, '_', UNIX_TIMESTAMP());
                
                -- 9. 회계 요약 JSON 생성
                SET p_accounting_summary = JSON_OBJECT(
                    'accountingId', p_accounting_id,
                    'erpTransactionId', p_erp_transaction_id,
                    'originalAmount', p_original_amount,
                    'discountAmount', p_discount_amount,
                    'finalAmount', p_final_amount,
                    'taxAmount', v_tax_amount,
                    'netAmount', v_net_amount,
                    'discountRate', v_discount_rate,
                    'discountType', p_discount_type,
                    'tenantId', p_tenant_id,
                    'consultantId', v_consultant_id,
                    'clientId', v_client_id
                );
                
                SET p_success = TRUE;
                SET p_message = '할인 회계 처리가 완료되었습니다.';
                
                COMMIT;
            END IF;
        END IF;
    END IF;
    
END //

DELIMITER ;

