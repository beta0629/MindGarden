-- 통합 재무현황 PL/SQL 프로시저
-- 전사 재무 데이터를 통합하여 조회하는 프로시저들

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

DELIMITER //

-- 1. 전사 통합 재무 현황 조회 프로시저
DROP PROCEDURE IF EXISTS GetConsolidatedFinancialData;
CREATE PROCEDURE GetConsolidatedFinancialData(
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_revenue BIGINT,
    OUT p_total_expenses BIGINT,
    OUT p_net_profit BIGINT,
    OUT p_total_transactions INT,
    OUT p_branch_count INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE branch_code VARCHAR(50);
    DECLARE branch_name VARCHAR(100);
    DECLARE branch_revenue BIGINT DEFAULT 0;
    DECLARE branch_expenses BIGINT DEFAULT 0;
    DECLARE branch_transactions INT DEFAULT 0;
    
    -- 커서 선언: 활성 지점 목록
    DECLARE branch_cursor CURSOR FOR 
        SELECT code_value, code_label 
        FROM common_codes 
        WHERE code_group = 'BRANCH' AND is_active = TRUE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 변수 초기화
    SET p_total_revenue = 0;
    SET p_total_expenses = 0;
    SET p_net_profit = 0;
    SET p_total_transactions = 0;
    SET p_branch_count = 0;
    
    -- 지점별 재무 데이터 집계
    OPEN branch_cursor;
    
    read_loop: LOOP
        FETCH branch_cursor INTO branch_code, branch_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- 지점별 수익 조회
        SELECT COALESCE(SUM(amount), 0) INTO branch_revenue
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_type = 'INCOME'
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 지점별 지출 조회
        SELECT COALESCE(SUM(amount), 0) INTO branch_expenses
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_type = 'EXPENSE'
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 지점별 거래 건수 조회
        SELECT COUNT(*) INTO branch_transactions
        FROM financial_transactions ft
        WHERE ft.branch_code = branch_code
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE;
        
        -- 전체 합계 누적
        SET p_total_revenue = p_total_revenue + branch_revenue;
        SET p_total_expenses = p_total_expenses + branch_expenses;
        SET p_total_transactions = p_total_transactions + branch_transactions;
        SET p_branch_count = p_branch_count + 1;
        
    END LOOP;
    
    CLOSE branch_cursor;
    
    -- 순이익 계산
    SET p_net_profit = p_total_revenue - p_total_expenses;
    
END //

-- 2. 지점별 재무 상세 데이터 조회 프로시저
DROP PROCEDURE IF EXISTS GetBranchFinancialBreakdown;
CREATE PROCEDURE GetBranchFinancialBreakdown(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        cc.code_value AS branch_code,
        cc.code_label AS branch_name,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS expenses,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                 SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
        COUNT(ft.id) AS transaction_count
    FROM common_codes cc
    LEFT JOIN financial_transactions ft ON cc.code_value = ft.branch_code
        AND ft.transaction_date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = FALSE
    WHERE cc.code_group = 'BRANCH' 
    AND cc.is_active = TRUE
    GROUP BY cc.code_value, cc.code_label
    ORDER BY revenue DESC;
    
END //

-- 3. 월별 재무 추이 분석 프로시저
DROP PROCEDURE IF EXISTS GetMonthlyFinancialTrend;
CREATE PROCEDURE GetMonthlyFinancialTrend(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END) AS monthly_revenue,
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) AS monthly_expenses,
        SUM(CASE WHEN transaction_type = 'REVENUE' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) AS monthly_profit,
        COUNT(*) AS transaction_count
    FROM financial_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date
    AND is_deleted = FALSE
    GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
    ORDER BY month;
    
END //

-- 4. 카테고리별 재무 분석 프로시저
DROP PROCEDURE IF EXISTS GetCategoryFinancialBreakdown;
CREATE PROCEDURE GetCategoryFinancialBreakdown(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        ft.category,
        ft.transaction_type,
        COUNT(*) AS transaction_count,
        SUM(ft.amount) AS total_amount,
        AVG(ft.amount) AS average_amount
    FROM financial_transactions ft
    WHERE ft.transaction_date BETWEEN p_start_date AND p_end_date
    AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY total_amount DESC;
    
END //

DELIMITER ;
