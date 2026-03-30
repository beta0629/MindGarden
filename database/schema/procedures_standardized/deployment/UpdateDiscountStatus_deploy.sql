-- =====================================================
-- 할인 상태 업데이트 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateDiscountStatus //

CREATE PROCEDURE UpdateDiscountStatus(
    IN p_mapping_id BIGINT,
    IN p_new_status VARCHAR(20),
    IN p_tenant_id VARCHAR(100),
    IN p_updated_by VARCHAR(100),
    IN p_reason VARCHAR(500),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_accounting_id BIGINT;
    DECLARE v_current_status VARCHAR(20);
    DECLARE v_accounting_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상태 업데이트 중 오류 발생: ', v_error_message);
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
    
    IF p_new_status IS NULL OR p_new_status = '' THEN
        SET p_success = FALSE;
        SET p_message = '새로운 상태는 필수입니다.';
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 할인 회계 거래 조회 (테넌트 격리)
    -- 주의: discount_accounting_transactions 테이블에 is_deleted 필드가 없음
    SELECT id, status INTO v_accounting_id, v_current_status
    FROM discount_accounting_transactions 
    WHERE mapping_id = p_mapping_id 
      AND tenant_id = p_tenant_id;
    
    -- 3. 할인 회계 거래 존재 여부 확인
    SELECT COUNT(*) INTO v_accounting_count
    FROM discount_accounting_transactions
    WHERE mapping_id = p_mapping_id 
      AND tenant_id = p_tenant_id;
    
    IF v_accounting_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '할인 회계 거래를 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE;
    ELSE
        -- 4. 상태 업데이트 (테넌트 격리)
        -- 주의: discount_accounting_transactions 테이블에 is_deleted, updated_by 필드가 없음
        UPDATE discount_accounting_transactions 
        SET status = p_new_status,
            updated_at = NOW(),
            notes = CONCAT(IFNULL(notes, ''), ' | ', p_reason, ' (', p_updated_by, ')')
        WHERE id = v_accounting_id 
          AND tenant_id = p_tenant_id;
        
        -- 5. 상태별 특별 처리 (테넌트 격리)
        CASE p_new_status
            WHEN 'CONFIRMED' THEN
                UPDATE discount_accounting_transactions 
                SET confirmed_at = NOW()
                WHERE id = v_accounting_id 
                  AND tenant_id = p_tenant_id;
            WHEN 'CANCELLED' THEN
                UPDATE discount_accounting_transactions 
                SET cancelled_at = NOW(),
                    cancellation_reason = p_reason
                WHERE id = v_accounting_id 
                  AND tenant_id = p_tenant_id;
        END CASE;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('상태 업데이트 완료: ', v_current_status, ' -> ', p_new_status);
        
        COMMIT;
    END IF;
    
END //

DELIMITER ;

