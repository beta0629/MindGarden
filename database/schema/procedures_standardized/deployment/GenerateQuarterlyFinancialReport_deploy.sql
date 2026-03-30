-- =====================================================
-- 분기별 재무 보고서 생성 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GenerateQuarterlyFinancialReport //

CREATE PROCEDURE GenerateQuarterlyFinancialReport(
    IN p_year INT,
    IN p_quarter INT,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_report_data JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    DECLARE v_summary JSON;
    DECLARE v_monthly_breakdown JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('분기별 재무 보고서 생성 중 오류 발생: ', v_error_message);
        SET p_report_data = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_report_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE;
    END IF;
    
    IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
        SET p_success = FALSE;
        SET p_message = '유효한 연도를 입력해주세요.';
        SET p_report_data = JSON_OBJECT('error', '유효한 연도가 필요합니다.');
        LEAVE;
    END IF;
    
    IF p_quarter IS NULL OR p_quarter < 1 OR p_quarter > 4 THEN
        SET p_success = FALSE;
        SET p_message = '유효한 분기를 입력해주세요. (1-4)';
        SET p_report_data = JSON_OBJECT('error', '유효한 분기가 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 분기 시작/종료 날짜 계산
    CASE p_quarter
        WHEN 1 THEN 
            SET start_date = DATE(CONCAT(p_year, '-01-01'));
            SET end_date = DATE(CONCAT(p_year, '-03-31'));
        WHEN 2 THEN 
            SET start_date = DATE(CONCAT(p_year, '-04-01'));
            SET end_date = DATE(CONCAT(p_year, '-06-30'));
        WHEN 3 THEN 
            SET start_date = DATE(CONCAT(p_year, '-07-01'));
            SET end_date = DATE(CONCAT(p_year, '-09-30'));
        WHEN 4 THEN 
            SET start_date = DATE(CONCAT(p_year, '-10-01'));
            SET end_date = DATE(CONCAT(p_year, '-12-31'));
    END CASE;
    
    -- 3. 분기별 재무 요약 (테넌트 격리)
    SELECT JSON_OBJECT(
        'report_year', p_year,
        'report_quarter', p_quarter,
        'tenant_id', p_tenant_id,
        'total_revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        'total_expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'net_profit', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'total_transactions', COUNT(*),
        'active_months', COUNT(DISTINCT MONTH(ft.transaction_date))
    )
    INTO v_summary
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN start_date AND end_date
      AND ft.is_deleted = FALSE;
    
    -- 4. 월별 분기 내 상세 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'month', MONTH(ft.transaction_date),
            'monthly_revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
            'monthly_expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
            'monthly_transactions', COUNT(*)
        )
    )
    INTO v_monthly_breakdown
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN start_date AND end_date
      AND ft.is_deleted = FALSE
    GROUP BY MONTH(ft.transaction_date)
    ORDER BY MONTH(ft.transaction_date);
    
    -- 5. 최종 보고서 데이터 생성
    SET p_report_data = JSON_OBJECT(
        'summary', IFNULL(v_summary, JSON_OBJECT()),
        'monthly_breakdown', IFNULL(v_monthly_breakdown, JSON_ARRAY())
    );
    
    SET p_success = TRUE;
    SET p_message = '분기별 재무 보고서 생성이 완료되었습니다.';
    
END //

DELIMITER ;

