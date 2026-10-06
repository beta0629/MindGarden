-- 매칭에 연결된 살아 있는 INCOME 잔존 후보. 읽기 전용 한 문장.
-- 출력은 tenant_id, mapping_id, payment_status, status, tx_id, category, amount, tx_status, created_at 만.
--
-- 컬럼 SSOT
--   financial_transactions.id, tenant_id, transaction_type, category, amount, status,
--     created_at, related_entity_id, related_entity_type, is_deleted
--   consultant_client_mappings.id, tenant_id, status, payment_status, is_deleted
-- EnumType.STRING. is_deleted 는 nullable=false.
--   transaction_type = INCOME
--   게시 중: status 가 NULL 이거나 CANCELLED, REJECTED 가 아님 (isPostedForOperator)
--   related_entity_type 슬롯:
--     CONSULTANT_CLIENT_MAPPING
--     CONSULTANT_CLIENT_MAPPING_ADDITIONAL
--   payment_status <> APPROVED.
--     PaymentStatus.DEP 도 코드의 입금 확인 값이나, 이 목록은 APPROVED 만 제외한다.
-- 같은 tenant, 매칭 id, related_entity_type 슬롯에 살아 있는 INCOME 이 2건 이상이면
-- payment_status 가 APPROVED 여도 포함한다.
-- category 는 거르지 않는다. 상담료 값은 상담료 와 CONSULTATION 이다.

WITH alive AS (
    SELECT
        ft.tenant_id,
        ft.related_entity_id AS mapping_id,
        ft.related_entity_type,
        ft.id AS tx_id,
        ft.category,
        ft.amount,
        ft.status AS tx_status,
        ft.created_at,
        COUNT(*) OVER (
            PARTITION BY ft.tenant_id, ft.related_entity_id, ft.related_entity_type
        ) AS slot_alive_count
    FROM financial_transactions ft
    WHERE ft.transaction_type = 'INCOME'
      AND ft.related_entity_type IN (
          'CONSULTANT_CLIENT_MAPPING',
          'CONSULTANT_CLIENT_MAPPING_ADDITIONAL'
      )
      AND ft.related_entity_id IS NOT NULL
      AND ft.is_deleted = 0
      AND (ft.status IS NULL OR ft.status NOT IN ('CANCELLED', 'REJECTED'))
)
SELECT
    m.tenant_id,
    m.id AS mapping_id,
    m.payment_status,
    m.status,
    a.tx_id,
    a.category,
    a.amount,
    a.tx_status,
    a.created_at
FROM consultant_client_mappings m
INNER JOIN alive a
    ON a.tenant_id = m.tenant_id
   AND a.mapping_id = m.id
WHERE m.is_deleted = 0
  AND (
      m.payment_status <> 'APPROVED'
      OR a.slot_alive_count >= 2
  )
ORDER BY m.tenant_id, m.id, a.tx_id;
