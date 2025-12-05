-- =====================================================
-- 재무 분석 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetBranchFinancialBreakdown //

CREATE PROCEDURE GetBranchFinancialBreakdown(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_breakdown_data JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 분석 중 오류 발생: ', v_error_message);
        SET p_breakdown_data = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_breakdown_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_breakdown_data = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 재무 분석 (테넌트 격리)
    SELECT JSON_OBJECT(
        'tenant_id', p_tenant_id,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        'expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'net_profit', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'transaction_count', COUNT(ft.id)
    )
    INTO p_breakdown_data
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN p_start_date AND p_end_date
      AND ft.is_deleted = FALSE;
    
    SET p_success = TRUE;
    SET p_message = '재무 분석이 완료되었습니다.';
    
END //

DELIMITER ;

