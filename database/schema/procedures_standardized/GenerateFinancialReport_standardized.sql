-- =====================================================
-- 재무 보고서 생성 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GenerateFinancialReport //

CREATE PROCEDURE GenerateFinancialReport(
    IN p_report_type VARCHAR(20),
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_tenant_id VARCHAR(100),
    OUT p_report_data JSON,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
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
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 보고서 생성 중 오류 발생: ', v_error_message);
        SET p_report_data = JSON_OBJECT('error', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_report_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start > p_period_end THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_report_data = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- 2. 기본 재무 데이터 집계 (테넌트 격리)
    SELECT 
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_revenue, v_total_expenses, v_transaction_count
    FROM financial_transactions ft
    JOIN schedules s ON ft.related_entity_id = s.id
    WHERE s.date BETWEEN p_period_start AND p_period_end
      AND ft.tenant_id = p_tenant_id
      AND s.tenant_id = p_tenant_id
      AND ft.is_deleted = FALSE
      AND s.is_deleted = FALSE;
    
    SET v_net_profit = v_total_revenue - v_total_expenses;
    
    -- 3. 일별 분석 (월별 보고서인 경우, 테넌트 격리)
    IF p_report_type = 'monthly' THEN
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'date', daily_data.date,
                'revenue', daily_data.daily_revenue,
                'expenses', daily_data.daily_expenses,
                'netProfit', daily_data.daily_revenue - daily_data.daily_expenses,
                'transactionCount', daily_data.daily_count
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
                AND ft.tenant_id = p_tenant_id
                AND ft.is_deleted = FALSE
            WHERE s.date BETWEEN p_period_start AND p_period_end
              AND s.tenant_id = p_tenant_id
              AND s.is_deleted = FALSE
            GROUP BY s.date
            ORDER BY s.date
        ) daily_data;
    END IF;
    
    -- 4. 카테고리별 분석 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'category', category_data.category,
            'revenue', category_data.category_revenue,
            'expenses', category_data.category_expenses,
            'netProfit', category_data.category_revenue - category_data.category_expenses,
            'transactionCount', category_data.category_count
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
          AND ft.tenant_id = p_tenant_id
          AND s.tenant_id = p_tenant_id
          AND ft.is_deleted = FALSE
          AND s.is_deleted = FALSE
        GROUP BY ft.category
        ORDER BY category_revenue DESC
    ) category_data;
    
    -- 5. 상담사별 분석 (테넌트 격리)
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'consultantId', consultant_data.consultant_id,
            'consultantName', consultant_data.name,
            'revenue', consultant_data.consultant_revenue,
            'expenses', consultant_data.consultant_expenses,
            'netProfit', consultant_data.consultant_revenue - consultant_data.consultant_expenses,
            'transactionCount', consultant_data.consultant_count
        )
    )
    INTO v_consultant_breakdown
    FROM (
        SELECT 
            s.consultant_id,
            u.name,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) as consultant_revenue,
            COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) as consultant_expenses,
            COUNT(*) as consultant_count
        FROM schedules s
        LEFT JOIN financial_transactions ft ON ft.related_entity_id = s.id 
            AND ft.tenant_id = p_tenant_id
            AND ft.is_deleted = FALSE
        LEFT JOIN users u ON u.id = s.consultant_id 
            AND u.tenant_id = p_tenant_id
            AND u.is_deleted = FALSE
        WHERE s.date BETWEEN p_period_start AND p_period_end
          AND s.tenant_id = p_tenant_id
          AND s.is_deleted = FALSE
        GROUP BY s.consultant_id, u.name
        ORDER BY consultant_revenue DESC
    ) consultant_data;
    
    -- 6. 보고서 요약 생성
    SET v_report_summary = JSON_OBJECT(
        'reportType', p_report_type,
        'periodStart', p_period_start,
        'periodEnd', p_period_end,
        'tenantId', p_tenant_id,
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
                ROUND(v_total_revenue / DATEDIFF(p_period_end, p_period_start), 2)
            ELSE 0 
        END
    );
    
    -- 7. 최종 보고서 데이터 생성
    SET p_report_data = JSON_OBJECT(
        'summary', v_report_summary,
        'dailyBreakdown', IFNULL(v_daily_breakdown, JSON_ARRAY()),
        'categoryBreakdown', IFNULL(v_category_breakdown, JSON_ARRAY()),
        'consultantBreakdown', IFNULL(v_consultant_breakdown, JSON_ARRAY())
    );
    
    SET p_success = TRUE;
    SET p_message = '재무 보고서 생성 완료';
    
    COMMIT;
    
END //

DELIMITER ;

