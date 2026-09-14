-- DATAFIX_20260914_CHOI_PREPAID (DEV mirror)
START TRANSACTION;

UPDATE institution_link_contracts
SET prepaid_amount = 100000,
    prepaid_at = '2026-09-07 00:00:00.000000',
    status = 'ACTIVE',
    notes = CONCAT(
      IFNULL(notes, ''),
      '\n[DATAFIX_20260914_CHOI_PREPAID] DEV mirror: 운영기준 선납 100,000원 정본. prepaid_at←2026-09-07.'
    ),
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 1
  AND client_id = 78
  AND is_deleted = 0;

UPDATE clients
SET institution_prepaid = TRUE,
    institution_prepaid_amount = 100000,
    institution_prepaid_date = COALESCE(institution_prepaid_date, '2026-09-07'),
    engagement_type = 'INSTITUTION_LINK',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 78;

UPDATE consultant_client_mappings
SET notes = CONCAT(
      REPLACE(IFNULL(notes,''), '기관 연계 후납', '기관 연계 선납(초기상담)'),
      '\n[DATAFIX_20260914_CHOI_PREPAID] DEV mirror: 선납 정본. INSTITUTION_LINK 유지.'
    ),
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id IN (245, 265)
  AND client_id = 78
  AND payment_timing = 'INSTITUTION_LINK';

UPDATE consultant_client_mappings
SET notes = CONCAT(
      IFNULL(notes,''),
      '\n[DATAFIX_20260914_CHOI_PREPAID] DEV mirror: FT#241→INSTITUTION_LINK_PREPAID(map265).'
    ),
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 242 AND client_id = 78;

UPDATE financial_transactions
SET category = '타기관선납',
    subcategory = 'INSTITUTION_LINK_PREPAID',
    related_entity_type = 'INSTITUTION_LINK_PREPAID',
    related_entity_id = 265,
    description = CONCAT(
      '타기관 선납 입금 확인 - 초기상담 선납 (CREDIT_CARD) [정확한금액: 90,000원]',
      ' [DATAFIX_20260914_CHOI_PREPAID] DEV mirror map242→map265; 운영SSOT=100,000; 전표실액=90,000유지'
    ),
    remarks = CONCAT(
      IFNULL(remarks,''),
      ' [DATAFIX_20260914_CHOI_PREPAID] DEV mirror 재분류. 삭제/추가INCOME 없음.'
    ),
    updated_at = CURRENT_TIMESTAMP(6),
    version = version + 1
WHERE id = 241
  AND related_entity_id = 242
  AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
  AND amount = 90000.00
  AND transaction_type = 'INCOME'
  AND (is_deleted = 0 OR is_deleted IS NULL);

SELECT ROW_COUNT() AS ft_rows_updated;
COMMIT;
