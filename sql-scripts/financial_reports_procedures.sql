-- 재무 보고서 PL/SQL 프로시저
-- 월별/분기별/연도별 재무 보고서 생성 프로시저들

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

DELIMITER //

-- 1. 월별 재무 보고서 생성 프로시저
DROP PROCEDURE IF EXISTS GenerateMonthlyFinancialReport;
CREATE PROCEDURE GenerateMonthlyFinancialReport(
    IN p_year INT,
    IN p_month INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 날짜 범위 설정
    SET start_date = DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'));
    SET end_date = LAST_DAY(start_date);
    
    -- 월별 재무 요약
    SELECT 
        p_year AS report_year,
        p_month AS report_month,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT DATE(ft.transaction_date)) AS active_days
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 일별 재무 상세
    SELECT 
        DATE(ft.transaction_date) AS transaction_date,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS daily_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS daily_expenses,
        COUNT(*) AS daily_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY DATE(ft.transaction_date)
    ORDER BY transaction_date;
    
    -- 카테고리별 분석
    SELECT 
        ft.category,
        ft.transaction_type,
        COUNT(*) AS transaction_count,
        SUM(ft.amount) AS total_amount,
        AVG(ft.amount) AS average_amount,
        MAX(ft.amount) AS max_amount,
        MIN(ft.amount) AS min_amount
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY total_amount DESC;
    
END //

-- 2. 분기별 재무 보고서 생성 프로시저
DROP PROCEDURE IF EXISTS GenerateQuarterlyFinancialReport;
CREATE PROCEDURE GenerateQuarterlyFinancialReport(
    IN p_year INT,
    IN p_quarter INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 분기 시작/종료 날짜 계산
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
    
    -- 분기별 재무 요약
    SELECT 
        p_year AS report_year,
        p_quarter AS report_quarter,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT MONTH(ft.transaction_date)) AS active_months
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 월별 분기 내 상세
    SELECT 
        MONTH(ft.transaction_date) AS month,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS monthly_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS monthly_expenses,
        COUNT(*) AS monthly_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY MONTH(ft.transaction_date)
    ORDER BY month;
    
END //

-- 3. 연도별 재무 보고서 생성 프로시저
DROP PROCEDURE IF EXISTS GenerateYearlyFinancialReport;
CREATE PROCEDURE GenerateYearlyFinancialReport(
    IN p_year INT,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE start_date DATE;
    DECLARE end_date DATE;
    
    -- 연도 시작/종료 날짜
    SET start_date = DATE(CONCAT(p_year, '-01-01'));
    SET end_date = DATE(CONCAT(p_year, '-12-31'));
    
    -- 연도별 재무 요약
    SELECT 
        p_year AS report_year,
        p_branch_code AS branch_code,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(*) AS total_transactions,
        COUNT(DISTINCT MONTH(ft.transaction_date)) AS active_months,
        COUNT(DISTINCT ft.branch_code) AS active_branches
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE;
    
    -- 분기별 연도 내 상세
    SELECT 
        QUARTER(ft.transaction_date) AS quarter,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS quarterly_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS quarterly_expenses,
        COUNT(*) AS quarterly_transactions
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY QUARTER(ft.transaction_date)
    ORDER BY quarter;
    
    -- 지점별 연도 내 상세
    SELECT 
        ft.branch_code,
        cc.code_label AS branch_name,
        SUM(CASE WHEN ft.transaction_type = 'REVENUE' THEN ft.amount ELSE 0 END) AS branch_revenue,
        SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END) AS branch_expenses,
        COUNT(*) AS branch_transactions
    FROM financial_transactions ft
    LEFT JOIN common_codes cc ON ft.branch_code = cc.code_value AND cc.code_group = 'BRANCH'
    WHERE ft.transaction_date BETWEEN start_date AND end_date
    AND (p_branch_code IS NULL OR ft.branch_code = p_branch_code)
    AND ft.is_deleted = FALSE
    GROUP BY ft.branch_code, cc.code_label
    ORDER BY branch_revenue DESC;
    
END //

-- 4. 재무 성과 지표 계산 프로시저
DROP PROCEDURE IF EXISTS CalculateFinancialKPIs;
CREATE PROCEDURE CalculateFinancialKPIs(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(50)
)
BEGIN
    DECLARE total_revenue BIGINT DEFAULT 0;
    DECLARE total_expenses BIGINT DEFAULT 0;
    DECLARE net_profit BIGINT DEFAULT 0;
    DECLARE total_transactions INT DEFAULT 0;
    DECLARE profit_margin DECIMAL(5,2) DEFAULT 0;
    DECLARE avg_transaction_value DECIMAL(15,2) DEFAULT 0;
    
    -- 기본 재무 데이터 조회
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO total_revenue, total_expenses, total_transactions
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND (p_branch_code IS NULL OR branch_code = p_branch_code)
    AND is_deleted = FALSE;
    
    -- KPI 계산
    SET net_profit = total_revenue - total_expenses;
    SET profit_margin = CASE 
        WHEN total_revenue > 0 THEN (net_profit / total_revenue) * 100 
        ELSE 0 
    END;
    SET avg_transaction_value = CASE 
        WHEN total_transactions > 0 THEN total_revenue / total_transactions 
        ELSE 0 
    END;
    
    -- 결과 반환
    SELECT 
        total_revenue,
        total_expenses,
        net_profit,
        total_transactions,
        profit_margin,
        avg_transaction_value,
        p_start_date AS period_start,
        p_end_date AS period_end;
        
END //

DELIMITER ;
