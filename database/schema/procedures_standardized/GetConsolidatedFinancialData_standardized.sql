-- =====================================================
-- 통합 재무 데이터 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetConsolidatedFinancialData //

CREATE PROCEDURE GetConsolidatedFinancialData(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_total_expenses DECIMAL(15,2),
    OUT p_net_profit DECIMAL(15,2),
    OUT p_total_transactions INT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 데이터 조회 중 오류 발생: ', v_error_message);
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
        LEAVE;
    END IF;
    
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
        LEAVE;
    END IF;
    
    -- 2. 재무 데이터 집계 (테넌트 격리)
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO 
        p_total_revenue,
        p_total_expenses,
        p_total_transactions
    FROM financial_transactions
    WHERE tenant_id = p_tenant_id
      AND transaction_date BETWEEN p_start_date AND p_end_date
      AND is_deleted = FALSE;
    
    -- 3. 순이익 계산
    SET p_net_profit = p_total_revenue - p_total_expenses;
    
    SET p_success = TRUE;
    SET p_message = '재무 데이터 조회 완료';
    
END //

DELIMITER ;

