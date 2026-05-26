-- =============================================================================
-- 스케줄러 E3 P2 — 통합 재무 프로시저 5종 표준화 본 재배포 (core_solution)
--   (2026-05-31, 핫픽스 / 매일 04:00 KST 재무 분석 04:00 사이클 실패 해소)
--
-- 배경:
--   • 운영 로그: core_solution 컨텍스트에서
--     "Parameter index of 4 is out of range (1, 2)" 매일 04:00 재현.
--   • 정본 재조사 (core-debugger Agent c836b864) 결과:
--       - core_solution.financial_transactions / branches 는 tenant_id 신설 + backfill 100% 완료.
--       - 5개 프로시저(GetBranchFinancialBreakdown / GetMonthlyFinancialTrend /
--         GetCategoryFinancialBreakdown / GenerateQuarterlyFinancialReport /
--         CalculateFinancialKPIs) 의 운영 본은 mind_garden 과 동일한 레거시
--         시그니처(2~3 IN, OUT 0개, tenant_id 미사용) — Java 6-인자 + 3 OUT 패턴과 완전 드리프트.
--       - SSOT(database/schema/procedures_standardized/*_standardized.sql) 5종은
--         이미 정공법 본(tenant_id WHERE 포함 + Java 시그니처 정합). deploy 만 안 된 상태.
--
-- 변경:
--   1. DROP IF EXISTS + CREATE PROCEDURE 5종을 단일 마이그레이션으로 재배포.
--   2. 시그니처: (tenant_id|year+quarter+tenant_id, period_dates, OUT success, OUT message, OUT data...)
--      ─ Java PlSqlFinancialServiceImpl 5개 prepareCall 과 1:1 정합.
--   3. 본문은 SSOT (`database/schema/procedures_standardized/*_standardized.sql`) 와 동일.
--      ─ tenant_id WHERE 격리, INCOME/EXPENSE 거래 타입(운영 데이터 정합).
--   4. SSOT 호환 fix: BEGIN 블록에 fin_proc 라벨 부여 → 무라벨 LEAVE; 가 LEAVE fin_proc;
--      ─ MySQL 8.0 은 무라벨 LEAVE 를 거부함 — SSOT 도 같은 fix 동시 반영.
--
-- 게이트:
--   • core_solution 단독 deploy (default schema). mind_garden 은 동결 — 별도 후속에서 DROP.
--   • Java 무변경 (5개 prepareCall 시그니처는 이미 표준화 본과 정합).
--   • 운영 DB 직접 UPDATE/INSERT/DELETE 없음 — Flyway DDL 만.
--
-- 배포 검증:
--   1) flyway info → V20260531_004 SUCCESS
--   2) SELECT ROUTINE_NAME, PARAMETER_NAME, ORDINAL_POSITION, PARAMETER_MODE
--      FROM information_schema.parameters
--      WHERE SPECIFIC_SCHEMA = DATABASE()
--        AND SPECIFIC_NAME IN ('GetBranchFinancialBreakdown','GetMonthlyFinancialTrend',
--                              'GetCategoryFinancialBreakdown','GenerateQuarterlyFinancialReport',
--                              'CalculateFinancialKPIs')
--      ORDER BY SPECIFIC_NAME, ORDINAL_POSITION;
--      → IN p_tenant_id ... OUT p_success ... OUT p_message ... 6 (or 11) 행 확인.
--   3) 다음 04:00 KST 사이클: "Parameter index of 4 is out of range" 미재현 확인.
-- =============================================================================

DELIMITER $$

-- 1. 지점별 재무 분석 (3 IN + 3 OUT)
DROP PROCEDURE IF EXISTS GetBranchFinancialBreakdown$$
CREATE PROCEDURE GetBranchFinancialBreakdown(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_breakdown_data JSON
)
fin_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 분석 중 오류 발생: ', v_error_message);
        SET p_breakdown_data = JSON_OBJECT('error', v_error_message);
    END;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_breakdown_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE fin_proc;
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_breakdown_data = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
        LEAVE fin_proc;
    END IF;

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
END fin_proc$$

-- 2. 월별 재무 추이 (3 IN + 3 OUT)
DROP PROCEDURE IF EXISTS GetMonthlyFinancialTrend$$
CREATE PROCEDURE GetMonthlyFinancialTrend(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_trend_data JSON
)
fin_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('월별 재무 추이 조회 중 오류 발생: ', v_error_message);
        SET p_trend_data = JSON_OBJECT('error', v_error_message);
    END;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_trend_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE fin_proc;
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_trend_data = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
        LEAVE fin_proc;
    END IF;

    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'month', DATE_FORMAT(ft.transaction_date, '%Y-%m'),
            'monthly_revenue', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0),
            'monthly_expenses', COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
            'monthly_profit', COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) -
                SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0),
            'transaction_count', COUNT(*)
        )
    )
    INTO p_trend_data
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN p_start_date AND p_end_date
      AND ft.is_deleted = FALSE
    GROUP BY DATE_FORMAT(ft.transaction_date, '%Y-%m')
    ORDER BY DATE_FORMAT(ft.transaction_date, '%Y-%m');

    SET p_success = TRUE;
    SET p_message = '월별 재무 추이 조회가 완료되었습니다.';
END fin_proc$$

-- 3. 카테고리별 재무 분석 (3 IN + 3 OUT)
DROP PROCEDURE IF EXISTS GetCategoryFinancialBreakdown$$
CREATE PROCEDURE GetCategoryFinancialBreakdown(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_breakdown_data JSON
)
fin_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('카테고리별 재무 분석 중 오류 발생: ', v_error_message);
        SET p_breakdown_data = JSON_OBJECT('error', v_error_message);
    END;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_breakdown_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE fin_proc;
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_breakdown_data = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
        LEAVE fin_proc;
    END IF;

    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'category', ft.category,
            'transaction_type', ft.transaction_type,
            'transaction_count', COUNT(*),
            'total_amount', SUM(ft.amount),
            'average_amount', AVG(ft.amount)
        )
    )
    INTO p_breakdown_data
    FROM financial_transactions ft
    WHERE ft.tenant_id = p_tenant_id
      AND ft.transaction_date BETWEEN p_start_date AND p_end_date
      AND ft.is_deleted = FALSE
    GROUP BY ft.category, ft.transaction_type
    ORDER BY SUM(ft.amount) DESC;

    SET p_success = TRUE;
    SET p_message = '카테고리별 재무 분석이 완료되었습니다.';
END fin_proc$$

-- 4. 분기별 재무 보고서 (3 IN + 3 OUT)
DROP PROCEDURE IF EXISTS GenerateQuarterlyFinancialReport$$
CREATE PROCEDURE GenerateQuarterlyFinancialReport(
    IN p_year INT,
    IN p_quarter INT,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_report_data JSON
)
fin_proc: BEGIN
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

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_report_data = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        LEAVE fin_proc;
    END IF;

    IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
        SET p_success = FALSE;
        SET p_message = '유효한 연도를 입력해주세요.';
        SET p_report_data = JSON_OBJECT('error', '유효한 연도가 필요합니다.');
        LEAVE fin_proc;
    END IF;

    IF p_quarter IS NULL OR p_quarter < 1 OR p_quarter > 4 THEN
        SET p_success = FALSE;
        SET p_message = '유효한 분기를 입력해주세요. (1-4)';
        SET p_report_data = JSON_OBJECT('error', '유효한 분기가 필요합니다.');
        LEAVE fin_proc;
    END IF;

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

    SET p_report_data = JSON_OBJECT(
        'summary', IFNULL(v_summary, JSON_OBJECT()),
        'monthly_breakdown', IFNULL(v_monthly_breakdown, JSON_ARRAY())
    );

    SET p_success = TRUE;
    SET p_message = '분기별 재무 보고서 생성이 완료되었습니다.';
END fin_proc$$

-- 5. 재무 KPI 계산 (3 IN + 8 OUT). INCOME/EXPENSE 운영 데이터 정합.
DROP PROCEDURE IF EXISTS CalculateFinancialKPIs$$
CREATE PROCEDURE CalculateFinancialKPIs(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_total_expenses DECIMAL(15,2),
    OUT p_net_profit DECIMAL(15,2),
    OUT p_total_transactions INT,
    OUT p_profit_margin DECIMAL(5,2),
    OUT p_avg_transaction_value DECIMAL(15,2)
)
fin_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('재무 KPI 계산 중 오류 발생: ', v_error_message);
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
        SET p_profit_margin = 0;
        SET p_avg_transaction_value = 0;
    END;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
        SET p_profit_margin = 0;
        SET p_avg_transaction_value = 0;
        LEAVE fin_proc;
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
        SET p_profit_margin = 0;
        SET p_avg_transaction_value = 0;
        LEAVE fin_proc;
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO p_total_revenue, p_total_expenses, p_total_transactions
    FROM financial_transactions
    WHERE tenant_id = p_tenant_id
      AND transaction_date BETWEEN p_start_date AND p_end_date
      AND is_deleted = FALSE;

    SET p_net_profit = p_total_revenue - p_total_expenses;
    SET p_profit_margin = CASE
        WHEN p_total_revenue > 0 THEN ROUND((p_net_profit / p_total_revenue) * 100, 2)
        ELSE 0
    END;
    SET p_avg_transaction_value = CASE
        WHEN p_total_transactions > 0 THEN ROUND(p_total_revenue / p_total_transactions, 2)
        ELSE 0
    END;

    SET p_success = TRUE;
    SET p_message = '재무 KPI 계산이 완료되었습니다.';
END fin_proc$$

DELIMITER ;
