-- Mapping ERP partial-success damage counts (production, read-only).
-- SELECT only. No SET (session READ ONLY via mysql --init-command).
-- No PII: never select name/phone/email/memo/description/old_value/new_value/
--   changed_by/package_name. Output ids, counts, dates, amounts, statuses only.
-- Purpose: count damage when UpdateMappingInfo partially succeeds
--   (session invariant break, amount vs ledger mismatch, history↔ERP window miss).
-- Placeholders (workflow sed): __TENANT_ID__, __MISMATCH_WINDOW_MINUTES__.
-- ERP adjustment signature (match without selecting description text):
--   soft-delete prior INCOME (is_deleted=1, related_entity link, category CONSULTATION);
--   insert PACKAGE_SALE CONSULTATION INCOME for related_entity mapping.

START TRANSACTION READ ONLY;

SELECT '== 0. table presence (mapping_change_history)' AS section;
SELECT TABLE_NAME,
       TABLE_TYPE,
       ENGINE,
       TABLE_ROWS
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'mapping_change_history';

SELECT '== 1. session invariant damage rows' AS section;
SELECT m.id AS mapping_id,
       m.status,
       m.total_sessions,
       m.used_sessions,
       m.remaining_sessions,
       CASE
         WHEN m.total_sessions IS NULL OR m.used_sessions IS NULL THEN NULL
         ELSE (m.total_sessions - m.used_sessions)
       END AS expected_remaining,
       m.created_at,
       m.updated_at
  FROM consultant_client_mappings m
 WHERE m.tenant_id = '__TENANT_ID__'
   AND m.is_deleted = 0
   AND (
         (
           m.total_sessions IS NOT NULL
           AND m.used_sessions IS NOT NULL
           AND m.total_sessions < m.used_sessions
         )
         OR (
           m.total_sessions IS NOT NULL
           AND m.used_sessions IS NOT NULL
           AND (
             m.remaining_sessions IS NULL
             OR m.remaining_sessions <> (m.total_sessions - m.used_sessions)
           )
         )
         OR (
           m.remaining_sessions IS NOT NULL
           AND (m.total_sessions IS NULL OR m.used_sessions IS NULL)
         )
       )
 ORDER BY m.id
 LIMIT 500;

SELECT '== 1b. session invariant damage count' AS section;
SELECT COUNT(*) AS session_invariant_damage_cnt
  FROM consultant_client_mappings m
 WHERE m.tenant_id = '__TENANT_ID__'
   AND m.is_deleted = 0
   AND (
         (
           m.total_sessions IS NOT NULL
           AND m.used_sessions IS NOT NULL
           AND m.total_sessions < m.used_sessions
         )
         OR (
           m.total_sessions IS NOT NULL
           AND m.used_sessions IS NOT NULL
           AND (
             m.remaining_sessions IS NULL
             OR m.remaining_sessions <> (m.total_sessions - m.used_sessions)
           )
         )
         OR (
           m.remaining_sessions IS NOT NULL
           AND (m.total_sessions IS NULL OR m.used_sessions IS NULL)
         )
       );

SELECT '== 2. amount vs ledger disagreement rows' AS section;
SELECT m.id AS mapping_id,
       m.status,
       m.package_price,
       m.payment_amount,
       IFNULL(ledger.ledger_sum, 0) AS ledger_sum,
       IFNULL(ledger.income_row_cnt, 0) AS income_row_cnt,
       m.created_at,
       m.updated_at
  FROM consultant_client_mappings m
  LEFT JOIN (
        SELECT ft.related_entity_id AS mapping_id,
               SUM(ft.amount) AS ledger_sum,
               COUNT(*) AS income_row_cnt
          FROM financial_transactions ft
         WHERE ft.tenant_id = '__TENANT_ID__'
           AND ft.is_deleted = 0
           AND ft.transaction_type = 'INCOME'
           AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
         GROUP BY ft.related_entity_id
       ) ledger
    ON ledger.mapping_id = m.id
 WHERE m.tenant_id = '__TENANT_ID__'
   AND m.is_deleted = 0
   AND (
         (
           (
             (m.package_price IS NOT NULL AND m.package_price <> 0)
             OR (m.payment_amount IS NOT NULL AND m.payment_amount <> 0)
           )
           AND IFNULL(ledger.income_row_cnt, 0) = 0
         )
         OR (
           m.package_price IS NOT NULL
           AND IFNULL(ledger.ledger_sum, 0) <> m.package_price
         )
         OR (
           m.payment_amount IS NOT NULL
           AND IFNULL(ledger.ledger_sum, 0) <> m.payment_amount
         )
       )
 ORDER BY m.id
 LIMIT 500;

SELECT '== 2b. amount vs ledger disagreement count' AS section;
SELECT COUNT(*) AS amount_ledger_mismatch_cnt
  FROM consultant_client_mappings m
  LEFT JOIN (
        SELECT ft.related_entity_id AS mapping_id,
               SUM(ft.amount) AS ledger_sum,
               COUNT(*) AS income_row_cnt
          FROM financial_transactions ft
         WHERE ft.tenant_id = '__TENANT_ID__'
           AND ft.is_deleted = 0
           AND ft.transaction_type = 'INCOME'
           AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
         GROUP BY ft.related_entity_id
       ) ledger
    ON ledger.mapping_id = m.id
 WHERE m.tenant_id = '__TENANT_ID__'
   AND m.is_deleted = 0
   AND (
         (
           (
             (m.package_price IS NOT NULL AND m.package_price <> 0)
             OR (m.payment_amount IS NOT NULL AND m.payment_amount <> 0)
           )
           AND IFNULL(ledger.income_row_cnt, 0) = 0
         )
         OR (
           m.package_price IS NOT NULL
           AND IFNULL(ledger.ledger_sum, 0) <> m.package_price
         )
         OR (
           m.payment_amount IS NOT NULL
           AND IFNULL(ledger.ledger_sum, 0) <> m.payment_amount
         )
       );

SELECT '== 3a. latest PACKAGE_UPDATE history without ERP adj in window' AS section;
SELECT h.id AS history_id,
       h.mapping_id,
       h.change_type,
       h.changed_at,
       m.status AS mapping_status,
       nearest.nearest_ft_id,
       nearest.nearest_ft_created_at,
       nearest.nearest_ft_amount,
       nearest.minutes_delta
  FROM mapping_change_history h
 INNER JOIN consultant_client_mappings m
    ON m.id = h.mapping_id
   AND m.tenant_id = '__TENANT_ID__'
  LEFT JOIN (
        SELECT h_inner.id AS history_id,
               ft.id AS nearest_ft_id,
               ft.created_at AS nearest_ft_created_at,
               ft.amount AS nearest_ft_amount,
               TIMESTAMPDIFF(MINUTE, h_inner.changed_at, ft.created_at) AS minutes_delta
          FROM mapping_change_history h_inner
         INNER JOIN consultant_client_mappings m_inner
            ON m_inner.id = h_inner.mapping_id
           AND m_inner.tenant_id = '__TENANT_ID__'
         INNER JOIN financial_transactions ft
            ON ft.tenant_id = '__TENANT_ID__'
           AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
           AND ft.related_entity_id = h_inner.mapping_id
           AND ft.transaction_type = 'INCOME'
           AND ft.category = 'CONSULTATION'
           AND ft.subcategory = 'PACKAGE_SALE'
         WHERE h_inner.change_type = 'PACKAGE_UPDATE'
           AND NOT EXISTS (
                 SELECT 1
                   FROM financial_transactions ft2
                  WHERE ft2.tenant_id = '__TENANT_ID__'
                    AND ft2.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
                    AND ft2.related_entity_id = h_inner.mapping_id
                    AND ft2.transaction_type = 'INCOME'
                    AND ft2.category = 'CONSULTATION'
                    AND ft2.subcategory = 'PACKAGE_SALE'
                    AND (
                          ABS(TIMESTAMPDIFF(SECOND, h_inner.changed_at, ft2.created_at))
                          < ABS(TIMESTAMPDIFF(SECOND, h_inner.changed_at, ft.created_at))
                          OR (
                               ABS(TIMESTAMPDIFF(SECOND, h_inner.changed_at, ft2.created_at))
                               = ABS(TIMESTAMPDIFF(SECOND, h_inner.changed_at, ft.created_at))
                               AND ft2.id < ft.id
                             )
                        )
               )
       ) nearest
    ON nearest.history_id = h.id
 WHERE h.change_type = 'PACKAGE_UPDATE'
   AND NOT EXISTS (
         SELECT 1
           FROM mapping_change_history h2
          WHERE h2.mapping_id = h.mapping_id
            AND h2.change_type = 'PACKAGE_UPDATE'
            AND (
                  h2.changed_at > h.changed_at
                  OR (h2.changed_at = h.changed_at AND h2.id > h.id)
                )
       )
   AND NOT EXISTS (
         SELECT 1
           FROM financial_transactions ft
          WHERE ft.tenant_id = '__TENANT_ID__'
            AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
            AND ft.related_entity_id = h.mapping_id
            AND ft.transaction_type = 'INCOME'
            AND ft.category = 'CONSULTATION'
            AND ft.subcategory = 'PACKAGE_SALE'
            AND ft.created_at BETWEEN DATE_SUB(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                  AND DATE_ADD(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
       )
   AND NOT EXISTS (
         SELECT 1
           FROM financial_transactions ft
          WHERE ft.tenant_id = '__TENANT_ID__'
            AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
            AND ft.related_entity_id = h.mapping_id
            AND ft.transaction_type = 'INCOME'
            AND ft.category = 'CONSULTATION'
            AND ft.is_deleted = 1
            AND ft.updated_at BETWEEN DATE_SUB(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                 AND DATE_ADD(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
       )
 ORDER BY h.changed_at DESC, h.id DESC
 LIMIT 500;

SELECT '== 3b. PACKAGE_SALE INCOME without PACKAGE_UPDATE history in window' AS section;
SELECT ft.id AS ft_id,
       ft.related_entity_id AS mapping_id,
       ft.amount,
       ft.status AS ft_status,
       ft.is_deleted,
       ft.created_at AS ft_created_at,
       nearest.nearest_history_id,
       nearest.nearest_changed_at,
       nearest.minutes_delta
  FROM financial_transactions ft
 INNER JOIN consultant_client_mappings m
    ON m.id = ft.related_entity_id
   AND m.tenant_id = '__TENANT_ID__'
  LEFT JOIN (
        SELECT ft_inner.id AS ft_id,
               h.id AS nearest_history_id,
               h.changed_at AS nearest_changed_at,
               TIMESTAMPDIFF(MINUTE, h.changed_at, ft_inner.created_at) AS minutes_delta
          FROM financial_transactions ft_inner
         INNER JOIN consultant_client_mappings m_inner
            ON m_inner.id = ft_inner.related_entity_id
           AND m_inner.tenant_id = '__TENANT_ID__'
         INNER JOIN mapping_change_history h
            ON h.mapping_id = ft_inner.related_entity_id
           AND h.change_type = 'PACKAGE_UPDATE'
         WHERE ft_inner.tenant_id = '__TENANT_ID__'
           AND ft_inner.is_deleted = 0
           AND ft_inner.transaction_type = 'INCOME'
           AND ft_inner.category = 'CONSULTATION'
           AND ft_inner.subcategory = 'PACKAGE_SALE'
           AND ft_inner.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
           AND NOT EXISTS (
                 SELECT 1
                   FROM mapping_change_history h2
                  WHERE h2.mapping_id = ft_inner.related_entity_id
                    AND h2.change_type = 'PACKAGE_UPDATE'
                    AND (
                          ABS(TIMESTAMPDIFF(SECOND, h2.changed_at, ft_inner.created_at))
                          < ABS(TIMESTAMPDIFF(SECOND, h.changed_at, ft_inner.created_at))
                          OR (
                               ABS(TIMESTAMPDIFF(SECOND, h2.changed_at, ft_inner.created_at))
                               = ABS(TIMESTAMPDIFF(SECOND, h.changed_at, ft_inner.created_at))
                               AND h2.id < h.id
                             )
                        )
               )
       ) nearest
    ON nearest.ft_id = ft.id
 WHERE ft.tenant_id = '__TENANT_ID__'
   AND ft.is_deleted = 0
   AND ft.transaction_type = 'INCOME'
   AND ft.category = 'CONSULTATION'
   AND ft.subcategory = 'PACKAGE_SALE'
   AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
   AND NOT EXISTS (
         SELECT 1
           FROM mapping_change_history h
          INNER JOIN consultant_client_mappings mh
             ON mh.id = h.mapping_id
            AND mh.tenant_id = '__TENANT_ID__'
          WHERE h.mapping_id = ft.related_entity_id
            AND h.change_type = 'PACKAGE_UPDATE'
            AND h.changed_at BETWEEN DATE_SUB(ft.created_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                AND DATE_ADD(ft.created_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
       )
 ORDER BY ft.created_at DESC, ft.id DESC
 LIMIT 500;

SELECT '== 3c. history ERP mismatch counts' AS section;
SELECT (
         SELECT COUNT(*)
           FROM mapping_change_history h
          INNER JOIN consultant_client_mappings m
             ON m.id = h.mapping_id
            AND m.tenant_id = '__TENANT_ID__'
          WHERE h.change_type = 'PACKAGE_UPDATE'
            AND NOT EXISTS (
                  SELECT 1
                    FROM mapping_change_history h2
                   WHERE h2.mapping_id = h.mapping_id
                     AND h2.change_type = 'PACKAGE_UPDATE'
                     AND (
                           h2.changed_at > h.changed_at
                           OR (h2.changed_at = h.changed_at AND h2.id > h.id)
                         )
                )
            AND NOT EXISTS (
                  SELECT 1
                    FROM financial_transactions ft
                   WHERE ft.tenant_id = '__TENANT_ID__'
                     AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
                     AND ft.related_entity_id = h.mapping_id
                     AND ft.transaction_type = 'INCOME'
                     AND ft.category = 'CONSULTATION'
                     AND ft.subcategory = 'PACKAGE_SALE'
                     AND ft.created_at BETWEEN DATE_SUB(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                           AND DATE_ADD(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                )
            AND NOT EXISTS (
                  SELECT 1
                    FROM financial_transactions ft
                   WHERE ft.tenant_id = '__TENANT_ID__'
                     AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
                     AND ft.related_entity_id = h.mapping_id
                     AND ft.transaction_type = 'INCOME'
                     AND ft.category = 'CONSULTATION'
                     AND ft.is_deleted = 1
                     AND ft.updated_at BETWEEN DATE_SUB(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                          AND DATE_ADD(h.changed_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                )
       ) AS history_without_erp_adj_cnt,
       (
         SELECT COUNT(*)
           FROM financial_transactions ft
          INNER JOIN consultant_client_mappings m
             ON m.id = ft.related_entity_id
            AND m.tenant_id = '__TENANT_ID__'
          WHERE ft.tenant_id = '__TENANT_ID__'
            AND ft.is_deleted = 0
            AND ft.transaction_type = 'INCOME'
            AND ft.category = 'CONSULTATION'
            AND ft.subcategory = 'PACKAGE_SALE'
            AND ft.related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
            AND NOT EXISTS (
                  SELECT 1
                    FROM mapping_change_history h
                   INNER JOIN consultant_client_mappings mh
                      ON mh.id = h.mapping_id
                     AND mh.tenant_id = '__TENANT_ID__'
                   WHERE h.mapping_id = ft.related_entity_id
                     AND h.change_type = 'PACKAGE_UPDATE'
                     AND h.changed_at BETWEEN DATE_SUB(ft.created_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                                         AND DATE_ADD(ft.created_at, INTERVAL __MISMATCH_WINDOW_MINUTES__ MINUTE)
                )
       ) AS package_sale_without_history_cnt;

ROLLBACK;
