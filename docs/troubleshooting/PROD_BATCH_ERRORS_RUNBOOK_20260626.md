# 운영 배치 ERROR 잔여 항목 Runbook (2026-06-26)

> 코드 핫픽스: `fix/prod-batch-errors-20260626`  
> 데이터-only 항목은 본 문서의 SELECT·수동 절차만 사용한다.

---

## P0 — DailyFinancialClose 부가세 (`tenant-incheon-counseling-001`)

**증상**: `TaxIntegrityException` — expected vs actual tax 차이로 일 마감 차단.

**코드**: `ErpFinancialCloseServiceImpl` — 해당 테넌트만 WARN 로그, 다른 테넌트 마감 계속.

**데이터 보정** (SSOT: `docs/operations/P1B_P1C_OPERATIONS_REPORT_20260615.md` §1.2, §3.1):

```sql
-- 1) 차이 거래 trace (SELECT only)
SELECT ft.id, ft.transaction_date, ft.transaction_type, ft.subcategory,
       ft.amount, ft.tax_amount, ft.related_entity_id
FROM financial_transactions ft
WHERE ft.tenant_id = 'tenant-incheon-counseling-001'
  AND ft.is_deleted = 0
  AND ft.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY ft.transaction_date, ft.id;

-- 2) 일 마감 합산 재현
SELECT
  SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) AS income_sum,
  SUM(CASE WHEN transaction_type = 'EXPENSE'
            AND subcategory IN ('CONSULTATION_REFUND','CONSULTATION_PARTIAL_REFUND',
                                'SESSION_REFUND','PARTIAL_SESSION_REFUND')
           THEN amount ELSE 0 END) AS refund_sum,
  SUM(CASE WHEN transaction_type = 'INCOME' THEN tax_amount ELSE 0 END) AS tax_sum
FROM financial_transactions
WHERE tenant_id = 'tenant-incheon-counseling-001'
  AND is_deleted = 0
  AND transaction_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY);
```

**조치**: ERP 어드민 화면에서 누락 `tax_amount` 보정 → 다음 02:00 KST 마감 재시도.

---

## P1 — SalaryBatchMonitor 2026-5 미완료

**수동 트리거** (SSOT: `docs/운영반영/POST_2026_06_11_DEPLOYMENT_OPERATIONS_GUIDE.md` §2.3):

```sql
-- 상태 확인 (SELECT only)
SELECT tenant_id, period_year, period_month, status, completed_at
FROM salary_batch_runs
WHERE tenant_id = 'tenant-incheon-counseling-001'
  AND period_year = 2026 AND period_month = 5;
```

운영 BE에서 급여 배치 API/스케줄러 수동 실행 후 `status=COMPLETED` 확인.

---

## P1 — SessionDeductionRecovery alerted=2

**확인 SQL**:

```sql
SELECT id, tenant_id, schedule_id, mapping_id, alert_type, status, created_at
FROM session_deduction_recovery_alerts
WHERE status = 'OPEN'
ORDER BY created_at DESC
LIMIT 20;
```

매핑·스케줄 정합성 확인 후 alert `RESOLVED` 처리 또는 회기 수동 보정(ERP/어드민).
