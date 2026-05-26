-- =====================================================
-- 환불 가능 회기 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetRefundableSessions //

CREATE PROCEDURE GetRefundableSessions(
    IN p_mapping_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_refundable_sessions INT,
    OUT p_max_refund_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_current_used INT DEFAULT 0;
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_session_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 가능 회기 조회 중 오류 발생: ', v_error_message);
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSE
    
    -- 2. 매핑 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 3. 현재 매핑 정보 조회 (테넌트 격리)
    SELECT 
        total_sessions, 
        remaining_sessions, 
        used_sessions,
        package_price,
        payment_amount,
        status,
        payment_status
    INTO 
        v_current_total, 
        v_current_remaining, 
        v_current_used,
        v_package_price,
        v_payment_amount,
        v_mapping_status,
        v_payment_status
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 4. 매핑 존재 및 상태 검증
    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_success = FALSE;
        SET p_message = '이미 종료된 매핑입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF v_payment_status != 'CONFIRMED' THEN
        SET p_success = FALSE;
        SET p_message = '결제가 확인되지 않은 매핑입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSE
        -- 5. 환불 가능 회기 수 및 최대 환불 금액 계산
        SET p_refundable_sessions = v_current_remaining;
        
        IF v_current_total > 0 AND v_package_price > 0 THEN
            SET v_session_price = v_package_price / v_current_total;
            SET p_max_refund_amount = v_session_price * v_current_remaining;
        ELSE
            SET p_max_refund_amount = 0;
        END IF;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('환불 가능 회기: ', p_refundable_sessions, '회기, 최대 환불 금액: ', p_max_refund_amount, '원');
    END IF;
    END IF;
    
END //

DELIMITER ;

