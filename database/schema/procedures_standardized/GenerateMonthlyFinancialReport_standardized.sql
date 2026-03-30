-- =====================================================
-- 월별 재무 보고서 생성 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GenerateMonthlyFinancialReport //

CREATE PROCEDURE GenerateMonthlyFinancialReport(
    IN p_year INT,
    IN p_month INT,
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
    DECLARE v_daily_breakdown JSON;
    DECLARE v_category_breakdown JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('월별 재무 보고서 생성 중 오류 발생: ', v_error_message);
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
    
    IF p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
        SET p_success = FALSE;
        SET p_message = '유효한 월을 입력해주세요.';
        SET p_report_data = JSON_OBJECT('error', '유효한 월이 필요합니다.');
        LEAVE;
    END IF;
    
    -- 2. 날짜 범위 설정
    SET start_date = DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'));
    SET end_date = LAST_DAY(start_date);
    
    -- 3. 월별 재무 요약 (테넌트 격리)
    SELECT JSON_OBJECT(
        'report_year', p_year,
        'report_month', p_month,
        'tenant_id', p_tenant_id,
        'total_revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        'total_expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'net_profit', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        'total_transactions', COUNT(*),
        'active_days', COUNT(DISTINCT DATE(ft.transaction_date))
    )
    INTO v_summary
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN start_date AND end_date
      AND ft.is_deleted = FALSE;
    
    -- 4. 일별 재무 상세 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'transaction_date', DATE(ft.transaction_date),
            'daily_revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
            'daily_expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
            'daily_transactions', COUNT(*)
        )
    )
    INTO v_daily_breakdown
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN start_date AND end_date
      AND ft.is_deleted = FALSE
    GROUP BY DATE(ft.transaction_date)
    ORDER BY DATE(ft.transaction_date);
    
    -- 5. 카테고리별 분석 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'category', ft.category,
            'transaction_type', ft.transaction_type,
            'transaction_count', COUNT(*),
            'total_amount', SUM(ft.amount),
            'average_amount', AVG(ft.amount),
            'max_amount', MAX(ft.amount),
            'min_amount', MIN(ft.amount)
        )
    )
    INTO v_category_breakdown
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN start_date AND end_date
      AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY SUM(ft.amount) DESC;
    
    -- 6. 최종 보고서 데이터 생성
    SET p_report_data = JSON_OBJECT(
        'summary', IFNULL(v_summary, JSON_OBJECT()),
        'daily_breakdown', IFNULL(v_daily_breakdown, JSON_ARRAY()),
        'category_breakdown', IFNULL(v_category_breakdown, JSON_ARRAY())
    );
    
    SET p_success = TRUE;
    SET p_message = '월별 재무 보고서 생성이 완료되었습니다.';
    
END //

DELIMITER ;

