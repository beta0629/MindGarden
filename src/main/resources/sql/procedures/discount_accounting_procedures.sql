-- =====================================================
-- 할인 회계 처리 PL/SQL 프로시저
-- 복잡한 할인 계산, 환불 처리, 상태 관리 자동화
-- =====================================================

DELIMITER $$

-- 1. 할인 적용 프로시저
DROP PROCEDURE IF EXISTS ApplyDiscountAccounting$$
CREATE PROCEDURE ApplyDiscountAccounting(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(10,2),
    IN p_discount_amount DECIMAL(10,2),
    IN p_final_amount DECIMAL(10,2),
    IN p_branch_code VARCHAR(20),
    IN p_applied_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_revenue_transaction_id BIGINT;
    DECLARE v_discount_transaction_id BIGINT;
    DECLARE v_accounting_transaction_id BIGINT;
    DECLARE v_existing_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('할인 적용 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    START TRANSACTION;
    
    -- 1. 기존 할인 거래 확인
    SELECT COUNT(*) INTO v_existing_count 
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND');
    
    IF v_existing_count > 0 THEN
        SET p_result_code = -2;
        SET p_result_message = '이미 할인이 적용된 매핑입니다.';
        ROLLBACK;
    ELSE
        -- 2. 매출 거래 생성
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code, 
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'INCOME', 'CONSULTATION', 'PACKAGE_SALE', p_original_amount,
            CONCAT('패키지 판매 - 원래 금액 (할인코드: ', IFNULL(p_discount_code, 'N/A'), ')'),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', p_branch_code,
            NOW(), 'COMPLETED', NOW(), p_discount_code
        );
        
        SET v_revenue_transaction_id = LAST_INSERT_ID();
        
        -- 3. 할인 거래 생성 (음수로 저장)
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code,
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'DISCOUNT', 'SALES_DISCOUNT', 'PACKAGE_DISCOUNT', -p_discount_amount,
            CONCAT('패키지 할인 - ', IFNULL(p_discount_code, '자동할인'), ' (', p_discount_amount, '원)'),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', p_branch_code,
            NOW(), 'COMPLETED', NOW(), p_discount_code
        );
        
        SET v_discount_transaction_id = LAST_INSERT_ID();
        
        -- 4. 할인 회계 거래 생성
        INSERT INTO discount_accounting_transactions (
            mapping_id, discount_code, original_amount, discount_amount, final_amount,
            remaining_amount, status, revenue_transaction_id, discount_transaction_id,
            branch_code, applied_by, applied_at, created_at
        ) VALUES (
            p_mapping_id, p_discount_code, p_original_amount, p_discount_amount, p_final_amount,
            p_final_amount, 'APPLIED', v_revenue_transaction_id, v_discount_transaction_id,
            p_branch_code, p_applied_by, NOW(), NOW()
        );
        
        SET v_accounting_transaction_id = LAST_INSERT_ID();
        
        -- 5. 매핑 테이블 업데이트
        UPDATE consultant_client_mappings 
        SET discount_code = p_discount_code,
            discount_amount = p_discount_amount,
            original_amount = p_original_amount,
            final_amount = p_final_amount,
            discount_applied_at = NOW(),
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('할인 적용 완료. 회계거래ID: ', v_accounting_transaction_id);
    END IF;
END$$

-- 2. 할인 환불 처리 프로시저
DROP PROCEDURE IF EXISTS ProcessDiscountRefund$$
CREATE PROCEDURE ProcessDiscountRefund(
    IN p_mapping_id BIGINT,
    IN p_refund_amount DECIMAL(10,2),
    IN p_refund_reason VARCHAR(500),
    IN p_processed_by VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_remaining_amount DECIMAL(10,2);
    DECLARE v_refunded_amount DECIMAL(10,2);
    DECLARE v_new_remaining_amount DECIMAL(10,2);
    DECLARE v_refund_transaction_id BIGINT;
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_discount_code VARCHAR(50);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('환불 처리 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    START TRANSACTION;
    
    -- 1. 할인 회계 거래 조회
    SELECT id, status, remaining_amount, refunded_amount, branch_code, discount_code
    INTO v_accounting_id, v_current_status, v_remaining_amount, v_refunded_amount, v_branch_code, v_discount_code
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id 
    AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND');
    
    IF v_accounting_id IS NULL THEN
        SET p_result_code = -2;
        SET p_result_message = '환불 가능한 할인 거래를 찾을 수 없습니다.';
        ROLLBACK;
    ELSEIF v_remaining_amount < p_refund_amount THEN
        SET p_result_code = -3;
        SET p_result_message = CONCAT('환불 요청 금액이 잔여 금액을 초과합니다. 잔여: ', v_remaining_amount, ', 요청: ', p_refund_amount);
        ROLLBACK;
    ELSE
        -- 2. 환불 거래 생성
        INSERT INTO financial_transactions (
            transaction_type, category, subcategory, amount, description,
            related_entity_id, related_entity_type, branch_code,
            transaction_date, status, created_at, discount_code
        ) VALUES (
            'REFUND', 'DISCOUNT_REFUND', 'PACKAGE_DISCOUNT_REFUND', p_refund_amount,
            CONCAT('할인 환불 - ', IFNULL(v_discount_code, 'N/A'), ' (', p_refund_amount, '원) - ', p_refund_reason),
            p_mapping_id, 'CONSULTANT_CLIENT_MAPPING', v_branch_code,
            NOW(), 'COMPLETED', NOW(), v_discount_code
        );
        
        SET v_refund_transaction_id = LAST_INSERT_ID();
        
        -- 3. 잔여 금액 계산
        SET v_new_remaining_amount = v_remaining_amount - p_refund_amount;
        
        -- 4. 할인 회계 거래 업데이트
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
            updated_at = NOW()
        WHERE id = v_accounting_id;
        
        -- 5. 매핑 테이블 업데이트
        UPDATE consultant_client_mappings 
        SET final_amount = v_new_remaining_amount,
            updated_at = NOW()
        WHERE id = p_mapping_id;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('환불 처리 완료. 환불거래ID: ', v_refund_transaction_id, ', 잔여금액: ', v_new_remaining_amount);
    END IF;
END$$

-- 3. 할인 상태 업데이트 프로시저
DROP PROCEDURE IF EXISTS UpdateDiscountStatus$$
CREATE PROCEDURE UpdateDiscountStatus(
    IN p_mapping_id BIGINT,
    IN p_new_status VARCHAR(20),
    IN p_updated_by VARCHAR(100),
    IN p_reason VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500)
)
BEGIN
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('상태 업데이트 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    START TRANSACTION;
    
    -- 1. 할인 회계 거래 조회
    SELECT id, status INTO v_accounting_id, v_current_status
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id;
    
    IF v_accounting_id IS NULL THEN
        SET p_result_code = -2;
        SET p_result_message = '할인 회계 거래를 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 2. 상태 업데이트
        UPDATE discount_accounting_transactions 
        SET status = p_new_status,
            updated_at = NOW(),
            notes = CONCAT(IFNULL(notes, ''), ' | ', p_reason, ' (', p_updated_by, ')')
        WHERE id = v_accounting_id;
        
        -- 3. 상태별 특별 처리
        CASE p_new_status
            WHEN 'CONFIRMED' THEN
                UPDATE discount_accounting_transactions 
                SET confirmed_at = NOW()
                WHERE id = v_accounting_id;
            WHEN 'CANCELLED' THEN
                UPDATE discount_accounting_transactions 
                SET cancelled_at = NOW(),
                    cancellation_reason = p_reason
                WHERE id = v_accounting_id;
        END CASE;
        
        COMMIT;
        
        SET p_result_code = 0;
        SET p_result_message = CONCAT('상태 업데이트 완료: ', v_current_status, ' -> ', p_new_status);
    END IF;
END$$

-- 4. 할인 통계 조회 프로시저
DROP PROCEDURE IF EXISTS GetDiscountStatistics$$
CREATE PROCEDURE GetDiscountStatistics(
    IN p_branch_code VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_discounts DECIMAL(10,2),
    OUT p_total_refunds DECIMAL(10,2),
    OUT p_net_discounts DECIMAL(10,2),
    OUT p_discount_count INT,
    OUT p_refund_count INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = CONCAT('통계 조회 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    -- 할인 통계 계산
    SELECT 
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(refunded_amount), 0),
        COALESCE(SUM(discount_amount - IFNULL(refunded_amount, 0)), 0),
        COUNT(*),
        SUM(CASE WHEN refunded_amount > 0 THEN 1 ELSE 0 END)
    INTO p_total_discounts, p_total_refunds, p_net_discounts, p_discount_count, p_refund_count
    FROM discount_accounting_transactions 
    WHERE branch_code = p_branch_code
    AND DATE(applied_at) BETWEEN p_start_date AND p_end_date
    AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND', 'FULL_REFUND');
END$$

-- 5. 할인 무결성 검증 프로시저
DROP PROCEDURE IF EXISTS ValidateDiscountIntegrity$$
CREATE PROCEDURE ValidateDiscountIntegrity(
    IN p_branch_code VARCHAR(20),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(500),
    OUT p_error_count INT
)
BEGIN
    DECLARE v_mismatch_count INT DEFAULT 0;
    DECLARE v_orphan_count INT DEFAULT 0;
    DECLARE v_negative_remaining INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = CONCAT('무결성 검증 중 오류 발생: ', ERROR_MESSAGE());
    END;
    
    -- 1. 매핑과 할인 거래 불일치 검사
    SELECT COUNT(*) INTO v_mismatch_count
    FROM consultant_client_mappings ccm
    LEFT JOIN discount_accounting_transactions dat ON ccm.id = dat.mapping_id
    WHERE ccm.branch_code = p_branch_code
    AND ccm.discount_code IS NOT NULL
    AND dat.id IS NULL;
    
    -- 2. 고아 할인 거래 검사
    SELECT COUNT(*) INTO v_orphan_count
    FROM discount_accounting_transactions dat
    LEFT JOIN consultant_client_mappings ccm ON dat.mapping_id = ccm.id
    WHERE dat.branch_code = p_branch_code
    AND ccm.id IS NULL;
    
    -- 3. 음수 잔여 금액 검사
    SELECT COUNT(*) INTO v_negative_remaining
    FROM discount_accounting_transactions 
    WHERE branch_code = p_branch_code
    AND remaining_amount < 0;
    
    SET p_error_count = v_mismatch_count + v_orphan_count + v_negative_remaining;
    
    IF p_error_count = 0 THEN
        SET p_result_code = 0;
        SET p_result_message = '할인 무결성 검증 통과';
    ELSE
        SET p_result_code = 1;
        SET p_result_message = CONCAT('무결성 오류 발견 - 매핑불일치:', v_mismatch_count, 
                                    ', 고아거래:', v_orphan_count, 
                                    ', 음수잔여:', v_negative_remaining);
    END IF;
END$$

DELIMITER ;
