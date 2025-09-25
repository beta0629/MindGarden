-- ============================================================================
-- 통합회계 관리 PL/SQL 시스템
-- 복잡한 회계 로직을 PL/SQL로 최적화하여 성능 향상 및 데이터 일관성 보장
-- ============================================================================

-- 한글 인코딩 설정
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER //

-- ============================================================================
-- 1. 통합 금액 검증 및 일관성 검사 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS ValidateIntegratedAmount//

CREATE PROCEDURE ValidateIntegratedAmount(
    IN p_mapping_id BIGINT,
    IN p_input_amount DECIMAL(15,2),
    OUT p_is_valid BOOLEAN,
    OUT p_validation_message TEXT,
    OUT p_recommended_amount DECIMAL(15,2),
    OUT p_amount_breakdown JSON,
    OUT p_consistency_score DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_erp_total_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_price_per_session DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_difference DECIMAL(15,2) DEFAULT 0;
    DECLARE v_consistency_issues INT DEFAULT 0;
    DECLARE v_breakdown JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('금액 검증 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT 
        COALESCE(package_price, 0),
        COALESCE(payment_amount, 0),
        COALESCE(total_sessions, 0)
    INTO v_package_price, v_payment_amount, v_total_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id AND is_deleted = false;
    
    -- ERP 거래 총액 계산
    SELECT COALESCE(SUM(amount), 0)
    INTO v_erp_total_amount
    FROM financial_transactions 
    WHERE related_entity_id = p_mapping_id 
    AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
    AND transaction_type = 'INCOME'
    AND is_deleted = false;
    
    -- 회기당 단가 계산
    IF v_total_sessions > 0 AND v_package_price > 0 THEN
        SET v_price_per_session = v_package_price / v_total_sessions;
    END IF;
    
    -- 금액 일관성 검사
    SET v_consistency_issues = 0;
    
    -- 1. 패키지 가격과 ERP 금액 비교
    IF v_package_price > 0 AND v_erp_total_amount > 0 THEN
        SET v_difference = ABS(v_package_price - v_erp_total_amount);
        IF v_difference > v_package_price * 0.01 THEN -- 1% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 2. 패키지 가격과 결제 금액 비교
    IF v_package_price > 0 AND v_payment_amount > 0 THEN
        SET v_difference = ABS(v_package_price - v_payment_amount);
        IF v_difference > v_package_price * 0.1 THEN -- 10% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 3. 입력 금액과 패키지 가격 비교
    IF p_input_amount > 0 AND v_package_price > 0 THEN
        SET v_difference = ABS(p_input_amount - v_package_price);
        IF v_difference > v_package_price * 0.1 THEN -- 10% 이상 차이
            SET v_consistency_issues = v_consistency_issues + 1;
        END IF;
    END IF;
    
    -- 일관성 점수 계산 (0-100)
    SET p_consistency_score = GREATEST(0, 100 - (v_consistency_issues * 25));
    
    -- 금액 분석 JSON 생성
    SET v_breakdown = JSON_OBJECT(
        'packagePrice', v_package_price,
        'paymentAmount', v_payment_amount,
        'erpTotalAmount', v_erp_total_amount,
        'inputAmount', p_input_amount,
        'pricePerSession', v_price_per_session,
        'totalSessions', v_total_sessions,
        'consistencyIssues', v_consistency_issues
    );
    
    -- 검증 결과 결정
    IF v_consistency_issues = 0 THEN
        SET p_is_valid = TRUE;
        SET p_validation_message = '모든 금액이 일관성 있게 관리되고 있습니다.';
        SET p_recommended_amount = p_input_amount;
    ELSEIF v_consistency_issues = 1 THEN
        SET p_is_valid = TRUE;
        SET p_validation_message = '경미한 금액 불일치가 있습니다. 확인이 필요합니다.';
        SET p_recommended_amount = v_package_price;
    ELSE
        SET p_is_valid = FALSE;
        SET p_validation_message = '심각한 금액 불일치가 있습니다. 즉시 확인이 필요합니다.';
        SET p_recommended_amount = v_package_price;
    END IF;
    
    SET p_amount_breakdown = v_breakdown;
    SET p_success = TRUE;
    SET p_message = '금액 검증이 완료되었습니다.';
    
    COMMIT;
END//

-- ============================================================================
-- 2. 전사 통합 재무 현황 집계 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS GetConsolidatedFinancialData//

CREATE PROCEDURE GetConsolidatedFinancialData(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_codes JSON,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_total_expenses DECIMAL(15,2),
    OUT p_net_profit DECIMAL(15,2),
    OUT p_total_transactions INT,
    OUT p_branch_count INT,
    OUT p_financial_summary JSON,
    OUT p_branch_breakdown JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_branch_name VARCHAR(100);
    DECLARE v_branch_revenue DECIMAL(15,2);
    DECLARE v_branch_expenses DECIMAL(15,2);
    DECLARE v_branch_transactions INT;
    DECLARE v_branch_index INT DEFAULT 0;
    DECLARE v_branch_array JSON;
    DECLARE v_branch_data JSON;
    DECLARE v_branch_breakdown_array JSON DEFAULT JSON_ARRAY();
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('통합 재무 데이터 조회 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 초기화
    SET p_total_revenue = 0;
    SET p_total_expenses = 0;
    SET p_total_transactions = 0;
    SET p_branch_count = 0;
    
    -- 지점별 재무 데이터 집계
    IF p_branch_codes IS NULL THEN
        -- 모든 지점 조회
        SELECT JSON_ARRAYAGG(code_value)
        INTO v_branch_array
        FROM common_codes 
        WHERE code_group = 'BRANCH' AND is_active = true AND is_deleted = false;
    ELSE
        SET v_branch_array = p_branch_codes;
    END IF;
    
    -- 각 지점별 데이터 처리
    WHILE v_branch_index < JSON_LENGTH(v_branch_array) DO
        SET v_branch_code = JSON_UNQUOTE(JSON_EXTRACT(v_branch_array, CONCAT('$[', v_branch_index, ']')));
        
        -- 지점명 조회
        SELECT code_label INTO v_branch_name
        FROM common_codes 
        WHERE code_group = 'BRANCH' AND code_value = v_branch_code;
        
        -- 지점별 수익 집계
        SELECT COALESCE(SUM(amount), 0)
        INTO v_branch_revenue
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.branch_code = v_branch_code
        AND ft.transaction_type = 'INCOME'
        AND s.date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = false
        AND s.is_deleted = false;
        
        -- 지점별 지출 집계
        SELECT COALESCE(SUM(amount), 0)
        INTO v_branch_expenses
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.branch_code = v_branch_code
        AND ft.transaction_type = 'EXPENSE'
        AND s.date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = false
        AND s.is_deleted = false;
        
        -- 지점별 거래 수
        SELECT COUNT(*)
        INTO v_branch_transactions
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.branch_code = v_branch_code
        AND s.date BETWEEN p_start_date AND p_end_date
        AND ft.is_deleted = false
        AND s.is_deleted = false;
        
        -- 전체 집계에 추가
        SET p_total_revenue = p_total_revenue + v_branch_revenue;
        SET p_total_expenses = p_total_expenses + v_branch_expenses;
        SET p_total_transactions = p_total_transactions + v_branch_transactions;
        SET p_branch_count = p_branch_count + 1;
        
        -- 지점별 데이터를 JSON 배열에 추가
        SET v_branch_data = JSON_OBJECT(
            'branchCode', v_branch_code,
            'branchName', v_branch_name,
            'revenue', v_branch_revenue,
            'expenses', v_branch_expenses,
            'netProfit', v_branch_revenue - v_branch_expenses,
            'transactionCount', v_branch_transactions,
            'profitMargin', CASE 
                WHEN v_branch_revenue > 0 THEN 
                    ROUND(((v_branch_revenue - v_branch_expenses) / v_branch_revenue) * 100, 2)
                ELSE 0 
            END
        );
        
        SET v_branch_breakdown_array = JSON_ARRAY_APPEND(v_branch_breakdown_array, '$', v_branch_data);
        
        SET v_branch_index = v_branch_index + 1;
    END WHILE;
    
    -- 순이익 계산
    SET p_net_profit = p_total_revenue - p_total_expenses;
    
    -- 통합 요약 JSON 생성
    SET p_financial_summary = JSON_OBJECT(
        'totalRevenue', p_total_revenue,
        'totalExpenses', p_total_expenses,
        'netProfit', p_net_profit,
        'totalTransactions', p_total_transactions,
        'branchCount', p_branch_count,
        'averageRevenuePerBranch', CASE 
            WHEN p_branch_count > 0 THEN p_total_revenue / p_branch_count 
            ELSE 0 
        END,
        'overallProfitMargin', CASE 
            WHEN p_total_revenue > 0 THEN 
                ROUND((p_net_profit / p_total_revenue) * 100, 2)
            ELSE 0 
        END
    );
    
    SET p_branch_breakdown = v_branch_breakdown_array;
    SET p_success = TRUE;
    SET p_message = '통합 재무 데이터 조회가 완료되었습니다.';
    
    COMMIT;
END//

-- ============================================================================
-- 3. 할인 회계 통합 처리 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS ProcessDiscountAccounting//

CREATE PROCEDURE ProcessDiscountAccounting(
    IN p_mapping_id BIGINT,
    IN p_discount_code VARCHAR(50),
    IN p_original_amount DECIMAL(15,2),
    IN p_discount_amount DECIMAL(15,2),
    IN p_final_amount DECIMAL(15,2),
    IN p_discount_type VARCHAR(20),
    OUT p_accounting_id BIGINT,
    OUT p_erp_transaction_id VARCHAR(100),
    OUT p_accounting_summary JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_discount_name VARCHAR(100);
    DECLARE v_discount_rate DECIMAL(5,4);
    DECLARE v_tax_amount DECIMAL(15,2);
    DECLARE v_net_amount DECIMAL(15,2);
    DECLARE v_branch_code VARCHAR(20);
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('할인 회계 처리 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 매핑 정보 조회
    SELECT 
        ccm.branch_code,
        ccm.consultant_id,
        ccm.client_id
    INTO v_branch_code, v_consultant_id, v_client_id
    FROM consultant_client_mappings ccm
    WHERE ccm.id = p_mapping_id AND ccm.is_deleted = false;
    
    -- 할인 정보 조회
    SELECT 
        discount_name,
        discount_rate
    INTO v_discount_name, v_discount_rate
    FROM package_discounts
    WHERE discount_code = p_discount_code AND is_active = true;
    
    -- 세금 계산 (부가가치세 10%)
    SET v_tax_amount = p_final_amount * 0.10;
    SET v_net_amount = p_final_amount - v_tax_amount;
    
    -- 할인 회계 거래 생성
    INSERT INTO discount_accounting_transactions (
        mapping_id,
        discount_code,
        discount_name,
        original_amount,
        discount_amount,
        final_amount,
        tax_amount,
        net_amount,
        discount_type,
        branch_code,
        consultant_id,
        client_id,
        created_at,
        updated_at
    ) VALUES (
        p_mapping_id,
        p_discount_code,
        v_discount_name,
        p_original_amount,
        p_discount_amount,
        p_final_amount,
        v_tax_amount,
        v_net_amount,
        p_discount_type,
        v_branch_code,
        v_consultant_id,
        v_client_id,
        NOW(),
        NOW()
    );
    
    SET p_accounting_id = LAST_INSERT_ID();
    
    -- ERP 거래 ID 생성
    SET p_erp_transaction_id = CONCAT('DISCOUNT_', p_accounting_id, '_', UNIX_TIMESTAMP());
    
    -- 회계 요약 JSON 생성
    SET p_accounting_summary = JSON_OBJECT(
        'accountingId', p_accounting_id,
        'erpTransactionId', p_erp_transaction_id,
        'originalAmount', p_original_amount,
        'discountAmount', p_discount_amount,
        'finalAmount', p_final_amount,
        'taxAmount', v_tax_amount,
        'netAmount', v_net_amount,
        'discountRate', v_discount_rate,
        'discountType', p_discount_type,
        'branchCode', v_branch_code,
        'consultantId', v_consultant_id,
        'clientId', v_client_id
    );
    
    SET p_success = TRUE;
    SET p_message = '할인 회계 처리가 완료되었습니다.';
    
    COMMIT;
END//

-- ============================================================================
-- 4. 재무 보고서 자동 생성 프로시저
-- ============================================================================

DROP PROCEDURE IF EXISTS GenerateFinancialReport//

CREATE PROCEDURE GenerateFinancialReport(
    IN p_report_type VARCHAR(20),
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_branch_code VARCHAR(20),
    OUT p_report_data JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_total_revenue DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_expenses DECIMAL(15,2) DEFAULT 0;
    DECLARE v_net_profit DECIMAL(15,2) DEFAULT 0;
    DECLARE v_transaction_count INT DEFAULT 0;
    DECLARE v_daily_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_category_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_consultant_breakdown JSON DEFAULT JSON_ARRAY();
    DECLARE v_report_summary JSON;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 보고서 생성 중 오류 발생: ', @text);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 기본 재무 데이터 집계
    SELECT 
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_revenue, v_total_expenses, v_transaction_count
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date BETWEEN p_period_start AND p_period_end
    AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
    AND ft.is_deleted = false
    AND s.is_deleted = false;
    
    SET v_net_profit = v_total_revenue - v_total_expenses;
    
    -- 일별 분석 (월별 보고서인 경우)
    IF p_report_type = 'monthly' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'date', s.date,
                'revenue', daily_revenue,
                'expenses', daily_expenses,
                'netProfit', daily_revenue - daily_expenses,
                'transactionCount', daily_count
            )
        )
        INTO v_daily_breakdown
        FROM (
            SELECT 
                s.date,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as daily_revenue,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as daily_expenses,
                COUNT(*) as daily_count
            FROM schedules s
            LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id
            WHERE s.date BETWEEN p_period_start AND p_period_end
            AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
            AND (ft.is_deleted = false OR ft.id IS NULL)
            AND s.is_deleted = false
            GROUP BY s.date
            ORDER BY s.date
        ) daily_data;
    END IF;
    
    -- 카테고리별 분석
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'category', ft.category,
            'revenue', category_revenue,
            'expenses', category_expenses,
            'netProfit', category_revenue - category_expenses,
            'transactionCount', category_count
        )
    )
    INTO v_category_breakdown
    FROM (
        SELECT 
            ft.category,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as category_revenue,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as category_expenses,
            COUNT(*) as category_count
        FROM financial_transactions ft
        JOIN schedules s ON ft.related_entity_id = s.id
        WHERE s.date BETWEEN p_period_start AND p_period_end
        AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
        AND ft.is_deleted = false
        AND s.is_deleted = false
        GROUP BY ft.category
        ORDER BY category_revenue DESC
    ) category_data;
    
    -- 상담사별 분석
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'consultantId', s.consultant_id,
            'consultantName', u.name,
            'revenue', consultant_revenue,
            'expenses', consultant_expenses,
            'netProfit', consultant_revenue - consultant_expenses,
            'transactionCount', consultant_count
        )
    )
    INTO v_consultant_breakdown
    FROM (
        SELECT 
            s.consultant_id,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as consultant_revenue,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as consultant_expenses,
            COUNT(*) as consultant_count
        FROM schedules s
        LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id
        LEFT JOIN users u ON u.id = s.consultant_id
        WHERE s.date BETWEEN p_period_start AND p_period_end
        AND (p_branch_code IS NULL OR s.branch_code = p_branch_code)
        AND (ft.is_deleted = false OR ft.id IS NULL)
        AND s.is_deleted = false
        GROUP BY s.consultant_id, u.name
        ORDER BY consultant_revenue DESC
    ) consultant_data;
    
    -- 보고서 요약 생성
    SET v_report_summary = JSON_OBJECT(
        'reportType', p_report_type,
        'periodStart', p_period_start,
        'periodEnd', p_period_end,
        'branchCode', p_branch_code,
        'totalRevenue', v_total_revenue,
        'totalExpenses', v_total_expenses,
        'netProfit', v_net_profit,
        'transactionCount', v_transaction_count,
        'profitMargin', CASE 
            WHEN v_total_revenue > 0 THEN 
                ROUND((v_net_profit / v_total_revenue) * 100, 2)
            ELSE 0 
        END,
        'averageDailyRevenue', CASE 
            WHEN DATEDIFF(p_period_end, p_period_start) > 0 THEN 
                v_total_revenue / DATEDIFF(p_period_end, p_period_start)
            ELSE 0 
        END
    );
    
    -- 최종 보고서 데이터 생성
    SET p_report_data = JSON_OBJECT(
        'summary', v_report_summary,
        'dailyBreakdown', v_daily_breakdown,
        'categoryBreakdown', v_category_breakdown,
        'consultantBreakdown', v_consultant_breakdown
    );
    
    SET p_success = TRUE;
    SET p_message = '재무 보고서가 성공적으로 생성되었습니다.';
    
    COMMIT;
END//

DELIMITER ;

-- ============================================================================
-- 프로시저 생성 완료
-- ============================================================================
