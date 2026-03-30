-- =====================================================
-- 할인 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetDiscountStatistics //

CREATE PROCEDURE GetDiscountStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_discounts DECIMAL(15,2),
    OUT p_total_refunds DECIMAL(15,2),
    OUT p_net_discounts DECIMAL(15,2),
    OUT p_discount_count INT,
    OUT p_refund_count INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('할인 통계 조회 중 오류 발생: ', v_error_message);
        SET p_total_discounts = 0;
        SET p_total_refunds = 0;
        SET p_net_discounts = 0;
        SET p_discount_count = 0;
        SET p_refund_count = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_discounts = 0;
        SET p_total_refunds = 0;
        SET p_net_discounts = 0;
        SET p_discount_count = 0;
        SET p_refund_count = 0;
        LEAVE;
    END IF;
    
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_total_discounts = 0;
        SET p_total_refunds = 0;
        SET p_net_discounts = 0;
        SET p_discount_count = 0;
        SET p_refund_count = 0;
        LEAVE;
    END IF;
    
    -- 2. 할인 통계 계산 (테넌트 격리)
    -- 주의: discount_accounting_transactions 테이블에 is_deleted 필드가 없음
    SELECT 
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(refunded_amount), 0),
        COALESCE(SUM(discount_amount - IFNULL(refunded_amount, 0)), 0),
        COUNT(*),
        SUM(CASE WHEN refunded_amount > 0 THEN 1 ELSE 0 END)
    INTO p_total_discounts, p_total_refunds, p_net_discounts, p_discount_count, p_refund_count
    FROM discount_accounting_transactions 
    WHERE tenant_id = p_tenant_id
      AND DATE(applied_at) BETWEEN p_start_date AND p_end_date
      AND status IN ('APPLIED', 'CONFIRMED', 'PARTIAL_REFUND', 'FULL_REFUND');
    
    SET p_success = TRUE;
    SET p_message = '할인 통계 조회가 완료되었습니다.';
    
END //

DELIMITER ;

