-- =============================================================================
-- ERP P0-2 PR-B (financial_period 시드 백필)
--
-- 목적: 테넌트별 운영 시작일 ~ D-1 까지 일/월 OPEN row 백필.
-- 합의서: docs/project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md §3
--
-- 멀티테넌트: financial_transactions.tenant_id 기준으로 테넌트별 백필.
-- idempotent: INSERT ... WHERE NOT EXISTS (UNIQUE 키 (tenant_id, period_type, period_start)).
-- 모든 row status='OPEN', 합산 컬럼 0 (마감 시 값 채워짐).
-- 운영 영향 < 1초 (테넌트당 ~1,825 일 row 가정, 합의서 §7.1).
-- =============================================================================

-- 1) 일 단위(DAY) 백필
INSERT INTO financial_period (
    tenant_id, period_type, period_start, period_end, status,
    total_income, total_expense, net_amount, total_tax_amount, total_refund,
    version, created_at, updated_at
)
SELECT
    t.tenant_id,
    'DAY' AS period_type,
    cal.day AS period_start,
    cal.day AS period_end,
    'OPEN' AS status,
    0, 0, 0, 0, 0,
    0,
    NOW(),
    NOW()
FROM (
    SELECT
        tenant_id,
        DATE(MIN(transaction_date)) AS start_date
    FROM financial_transactions
    WHERE tenant_id IS NOT NULL
      AND tenant_id <> ''
      AND transaction_date IS NOT NULL
    GROUP BY tenant_id
) AS t
INNER JOIN (
    -- 일자 시퀀스(0 ~ 2999일 = 약 8년치). 운영 시작일에서 ±N day offset 으로 사용.
    SELECT DATE_ADD('1970-01-01', INTERVAL n DAY) AS day
    FROM (
        SELECT a.n + b.n * 10 + c.n * 100 + d.n * 1000 AS n
        FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
              UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS a
        CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS b
        CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS c
        CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2) AS d
    ) AS nums
    WHERE n <= 2999
) AS cal
    ON cal.day BETWEEN t.start_date AND (CURDATE() - INTERVAL 1 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM financial_period fp
    WHERE fp.tenant_id = t.tenant_id
      AND fp.period_type = 'DAY'
      AND fp.period_start = cal.day
);

-- 2) 월 단위(MONTH) 백필
INSERT INTO financial_period (
    tenant_id, period_type, period_start, period_end, status,
    total_income, total_expense, net_amount, total_tax_amount, total_refund,
    version, created_at, updated_at
)
SELECT
    t.tenant_id,
    'MONTH' AS period_type,
    DATE_FORMAT(month_cal.month_start, '%Y-%m-01') AS period_start,
    LAST_DAY(month_cal.month_start) AS period_end,
    'OPEN' AS status,
    0, 0, 0, 0, 0,
    0,
    NOW(),
    NOW()
FROM (
    SELECT
        tenant_id,
        DATE_FORMAT(MIN(transaction_date), '%Y-%m-01') AS first_month
    FROM financial_transactions
    WHERE tenant_id IS NOT NULL
      AND tenant_id <> ''
      AND transaction_date IS NOT NULL
    GROUP BY tenant_id
) AS t
INNER JOIN (
    -- 월 시퀀스(0 ~ 999개월 = 약 83년치). 1970-01-01 시작 offset.
    SELECT DATE_ADD('1970-01-01', INTERVAL n MONTH) AS month_start
    FROM (
        SELECT a.n + b.n * 10 + c.n * 100 AS n
        FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
              UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS a
        CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS b
        CROSS JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
                    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS c
    ) AS nums
    WHERE n <= 999
) AS month_cal
    ON month_cal.month_start BETWEEN t.first_month
       AND DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y-%m-01')
WHERE NOT EXISTS (
    SELECT 1
    FROM financial_period fp
    WHERE fp.tenant_id = t.tenant_id
      AND fp.period_type = 'MONTH'
      AND fp.period_start = DATE_FORMAT(month_cal.month_start, '%Y-%m-01')
);
