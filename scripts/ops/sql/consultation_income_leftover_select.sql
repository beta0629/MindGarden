-- 상담료 INCOME 잔존 후보. 읽기 전용 한 문장.
-- 식별자·금액·상태·일시만 출력한다. 이름·설명·notes 는 출력하지 않는다.
--
-- 컬럼 SSOT
--   financial_transactions (FinancialTransaction, AuditableTenantBase)
--     id, tenant_id, transaction_type, category, amount, status,
--     transaction_date, created_at, related_entity_id, related_entity_type, is_deleted
--   consultant_client_mappings (ConsultantClientMapping)
--     id, tenant_id, status, payment_status, is_deleted
-- EnumType.STRING.
--   FinancialTransaction.TransactionType = INCOME
--   FinancialTransaction.TransactionStatus 게시 제외 = CANCELLED, REJECTED
--     (isPostedForOperator)
--   FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE = 상담료
--   FinancialTransactionConstants.CATEGORY_CONSULTATION_LEGACY = CONSULTATION
--   RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING
--   RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL
--   ConsultantClientMapping.PaymentStatus 입금 기표 = APPROVED, DEP
--     (planMappingPackageErpSync depositIncomePosted)
--   ConsultantClientMapping.MappingStatus 종료 = CANCELLED, TERMINATED
--
-- 살아 있는 행: is_deleted 가 거짓이고 status 가 CANCELLED·REJECTED 가 아니다.
-- 후보:
--   NOT_DEPOSIT_COMPLETED  매칭이 없거나 payment_status 가 APPROVED·DEP 가 아님
--   ENDED_BEFORE_DEPOSIT   status 가 CANCELLED·TERMINATED 이고 입금 기표가 아님
--   MULTIPLE_INCOME        같은 tenant·매칭 id 의 살아 있는 상담료 INCOME 이 2건 이상
-- 입금 기표(APPROVED·DEP)이고 매칭당 1건이면 나오지 않는다.

WITH alive AS (
    SELECT
        ft.tenant_id,
        ft.id AS income_id,
        ft.amount,
        ft.status AS income_status,
        ft.transaction_date,
        ft.created_at AS income_created_at,
        ft.related_entity_id AS mapping_id,
        ft.related_entity_type,
        COUNT(*) OVER (
            PARTITION BY ft.tenant_id, ft.related_entity_id
        ) AS alive_income_count
    FROM financial_transactions ft
    WHERE ft.transaction_type = 'INCOME'
      AND ft.category IN ('상담료', 'CONSULTATION')
      AND ft.related_entity_type IN (
          'CONSULTANT_CLIENT_MAPPING',
          'CONSULTANT_CLIENT_MAPPING_ADDITIONAL'
      )
      AND ft.related_entity_id IS NOT NULL
      AND (ft.is_deleted = 0 OR ft.is_deleted IS NULL)
      AND (ft.status IS NULL OR ft.status NOT IN ('CANCELLED', 'REJECTED'))
)
SELECT
    a.tenant_id,
    a.income_id,
    a.amount,
    a.income_status,
    a.transaction_date,
    a.income_created_at,
    a.mapping_id,
    m.status AS mapping_status,
    m.payment_status,
    a.related_entity_type,
    a.alive_income_count,
    CONCAT_WS(
        ',',
        IF(
            m.id IS NULL
                OR m.payment_status IS NULL
                OR m.payment_status NOT IN ('APPROVED', 'DEP'),
            'NOT_DEPOSIT_COMPLETED',
            NULL
        ),
        IF(
            m.status IN ('CANCELLED', 'TERMINATED')
                AND (
                    m.payment_status IS NULL
                    OR m.payment_status NOT IN ('APPROVED', 'DEP')
                ),
            'ENDED_BEFORE_DEPOSIT',
            NULL
        ),
        IF(a.alive_income_count > 1, 'MULTIPLE_INCOME', NULL)
    ) AS reason
FROM alive a
LEFT JOIN consultant_client_mappings m
    ON m.tenant_id = a.tenant_id
   AND m.id = a.mapping_id
   AND (m.is_deleted = 0 OR m.is_deleted IS NULL)
WHERE m.id IS NULL
   OR m.payment_status IS NULL
   OR m.payment_status NOT IN ('APPROVED', 'DEP')
   OR (
        m.status IN ('CANCELLED', 'TERMINATED')
        AND (
            m.payment_status IS NULL
            OR m.payment_status NOT IN ('APPROVED', 'DEP')
        )
   )
   OR a.alive_income_count > 1
ORDER BY a.tenant_id, a.mapping_id, a.income_id;
