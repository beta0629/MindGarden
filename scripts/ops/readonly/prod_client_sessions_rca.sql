-- 운영 내담자 회기 RCA — 순수 SELECT.
-- 치환: __CLIENT_ID__ (양의 정수, 없으면 0), __DISCOVER_MAPPING_ID__ (양의 정수, 없으면 0).
-- client_id=0 이면 discover 매핑의 consultant 기준으로
--   total_sessions=12 또는 (used_sessions=1 AND remaining_sessions=11) 인 행을 나열하고,
--   distinct client_id 가 1개일 때만 본문 쿼리를 실행한다.
-- users.name 은 AES 암호문이라 이름 조건 없음. 전화·이메일·PG 원문·이력 JSON 전문 미선택.
-- 테넌트: tenants.subdomain = 'mindgarden' 만.

SELECT '00_tenant' AS q, t.tenant_id, t.subdomain, t.status
FROM tenants t
WHERE t.subdomain = 'mindgarden';

SELECT '00b_discover_seed' AS q, s.id AS seed_mapping_id, s.consultant_id, s.client_id,
       s.status, s.payment_status, s.payment_timing,
       s.total_sessions, s.used_sessions, s.remaining_sessions,
       s.package_name, s.package_price, s.payment_amount, s.created_at, s.updated_at
FROM consultant_client_mappings s
WHERE s.id = __DISCOVER_MAPPING_ID__
  AND __DISCOVER_MAPPING_ID__ <> 0
  AND s.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden');

SELECT '00c_discover_candidates' AS q, d.id AS mapping_id, d.client_id, d.consultant_id,
       d.status, d.payment_timing, d.payment_status,
       d.total_sessions, d.used_sessions, d.remaining_sessions,
       d.package_name, d.package_price, d.payment_amount, d.created_at, d.updated_at
FROM consultant_client_mappings d
INNER JOIN consultant_client_mappings seed
        ON seed.id = __DISCOVER_MAPPING_ID__
       AND seed.tenant_id = d.tenant_id
       AND seed.consultant_id = d.consultant_id
WHERE __DISCOVER_MAPPING_ID__ <> 0
  AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
ORDER BY d.created_at, d.id;

SELECT '00d_discover_client_count' AS q, COUNT(DISTINCT d.client_id) AS distinct_client_count
FROM consultant_client_mappings d
INNER JOIN consultant_client_mappings seed
        ON seed.id = __DISCOVER_MAPPING_ID__
       AND seed.tenant_id = d.tenant_id
       AND seed.consultant_id = d.consultant_id
WHERE __DISCOVER_MAPPING_ID__ <> 0
  AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11));

SELECT '00e_target_client' AS q, t.cid AS client_id
FROM (
    SELECT __CLIENT_ID__ AS cid
    WHERE __CLIENT_ID__ <> 0
    UNION ALL
    SELECT d.client_id
    FROM consultant_client_mappings d
    INNER JOIN consultant_client_mappings seed
            ON seed.id = __DISCOVER_MAPPING_ID__
           AND seed.tenant_id = d.tenant_id
           AND seed.consultant_id = d.consultant_id
    WHERE __CLIENT_ID__ = 0
      AND __DISCOVER_MAPPING_ID__ <> 0
      AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
      AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
    GROUP BY d.client_id
    HAVING (
        SELECT COUNT(DISTINCT d2.client_id)
        FROM consultant_client_mappings d2
        INNER JOIN consultant_client_mappings seed2
                ON seed2.id = __DISCOVER_MAPPING_ID__
               AND seed2.tenant_id = d2.tenant_id
               AND seed2.consultant_id = d2.consultant_id
        WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
          AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
    ) = 1
) t;

SELECT '01_client' AS q, u.id AS client_id, u.role, u.tenant_id,
       u.is_active, u.lifecycle_state, u.is_deleted, u.created_at
FROM users u
WHERE u.role = 'CLIENT'
  AND u.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND u.id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      );

SELECT '02_mappings' AS q, m.id AS mapping_id, m.consultant_id, m.client_id,
       m.status, m.payment_status, m.payment_timing, m.deposit_confirmed,
       m.total_sessions, m.used_sessions, m.remaining_sessions,
       m.package_name, m.package_price, m.payment_amount, m.payment_method,
       (m.payment_reference IS NOT NULL AND m.payment_reference <> '') AS has_payment_reference,
       m.payment_date, m.admin_approval_date, m.start_date, m.end_date,
       m.terminated_at, m.termination_reason,
       (m.notes IS NOT NULL AND m.notes <> '') AS has_notes,
       m.assigned_at, m.created_at, m.updated_at, m.is_deleted
FROM consultant_client_mappings m
JOIN users c ON c.id = m.client_id
WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND c.tenant_id = m.tenant_id
  AND m.client_id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      )
ORDER BY m.created_at, m.id;

SELECT '03_mapping_history' AS q, h.id, h.mapping_id, h.event_type,
       h.reason, h.triggered_by_user_id, h.created_at,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.before_state_json, '$.totalSessions'),
           JSON_EXTRACT(h.before_state_json, '$.total_sessions')
       )) AS SIGNED) AS before_total,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.before_state_json, '$.usedSessions'),
           JSON_EXTRACT(h.before_state_json, '$.used_sessions')
       )) AS SIGNED) AS before_used,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.before_state_json, '$.remainingSessions'),
           JSON_EXTRACT(h.before_state_json, '$.remaining_sessions')
       )) AS SIGNED) AS before_remaining,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.after_state_json, '$.totalSessions'),
           JSON_EXTRACT(h.after_state_json, '$.total_sessions')
       )) AS SIGNED) AS after_total,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.after_state_json, '$.usedSessions'),
           JSON_EXTRACT(h.after_state_json, '$.used_sessions')
       )) AS SIGNED) AS after_used,
       CAST(JSON_UNQUOTE(COALESCE(
           JSON_EXTRACT(h.after_state_json, '$.remainingSessions'),
           JSON_EXTRACT(h.after_state_json, '$.remaining_sessions')
       )) AS SIGNED) AS after_remaining
FROM consultant_client_mapping_history h
WHERE h.mapping_id IN (
        SELECT m.id
        FROM consultant_client_mappings m
        WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
          AND m.client_id IN (
                SELECT t.cid
                FROM (
                    SELECT __CLIENT_ID__ AS cid
                    WHERE __CLIENT_ID__ <> 0
                    UNION ALL
                    SELECT d.client_id
                    FROM consultant_client_mappings d
                    INNER JOIN consultant_client_mappings seed
                            ON seed.id = __DISCOVER_MAPPING_ID__
                           AND seed.tenant_id = d.tenant_id
                           AND seed.consultant_id = d.consultant_id
                    WHERE __CLIENT_ID__ = 0
                      AND __DISCOVER_MAPPING_ID__ <> 0
                      AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                      AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                    GROUP BY d.client_id
                    HAVING (
                        SELECT COUNT(DISTINCT d2.client_id)
                        FROM consultant_client_mappings d2
                        INNER JOIN consultant_client_mappings seed2
                                ON seed2.id = __DISCOVER_MAPPING_ID__
                               AND seed2.tenant_id = d2.tenant_id
                               AND seed2.consultant_id = d2.consultant_id
                        WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                          AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                    ) = 1
                ) t
              )
      )
ORDER BY h.created_at, h.id;

SELECT '04_orders' AS q, o.id AS order_id, o.public_id, o.client_id, o.status,
       o.checkout_source, o.subtotal_minor, o.cash_due_minor, o.created_at,
       l.id AS line_id, l.sku_id, l.sku_code_snapshot, l.title_snapshot,
       l.session_count_snapshot, l.quantity, l.unit_price_minor, l.line_total_minor,
       l.consultant_client_mapping_id,
       sku.sku_code, sku.title AS sku_title, sku.session_count AS sku_session_count,
       sku.unit_price_minor AS sku_unit_price_minor
FROM shop_client_orders o
LEFT JOIN shop_client_order_lines l ON l.client_order_id = o.id
LEFT JOIN shop_catalog_skus sku ON sku.id = l.sku_id
WHERE o.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND o.client_id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      )
ORDER BY o.created_at, l.line_no;

SELECT '05_payments' AS q, p.id, p.payment_id, p.order_id, p.payer_id, p.recipient_id,
       p.status, p.method, p.provider, p.amount, p.requested_amount, p.portone_paid_amount,
       (p.payment_id IS NOT NULL AND p.payment_id <> '') AS has_payment_id,
       (p.order_id IS NOT NULL AND p.order_id <> '') AS has_order_id,
       p.approved_at, p.cancelled_at, p.refunded_at, p.created_at
FROM payments p
WHERE p.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND p.payer_id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      )
ORDER BY p.created_at, p.id;

SELECT '06_financial' AS q, f.id, f.related_entity_type, f.related_entity_id,
       f.transaction_type, f.status, f.category, f.subcategory, f.amount,
       f.transaction_date, f.is_deleted, f.created_at
FROM financial_transactions f
WHERE f.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND f.is_deleted = 0
  AND (
        (
          f.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%'
          AND f.related_entity_id IN (
            SELECT m.id
            FROM consultant_client_mappings m
            WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND m.client_id IN (
                    SELECT t.cid
                    FROM (
                        SELECT __CLIENT_ID__ AS cid
                        WHERE __CLIENT_ID__ <> 0
                        UNION ALL
                        SELECT d.client_id
                        FROM consultant_client_mappings d
                        INNER JOIN consultant_client_mappings seed
                                ON seed.id = __DISCOVER_MAPPING_ID__
                               AND seed.tenant_id = d.tenant_id
                               AND seed.consultant_id = d.consultant_id
                        WHERE __CLIENT_ID__ = 0
                          AND __DISCOVER_MAPPING_ID__ <> 0
                          AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                          AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                        GROUP BY d.client_id
                        HAVING (
                            SELECT COUNT(DISTINCT d2.client_id)
                            FROM consultant_client_mappings d2
                            INNER JOIN consultant_client_mappings seed2
                                    ON seed2.id = __DISCOVER_MAPPING_ID__
                                   AND seed2.tenant_id = d2.tenant_id
                                   AND seed2.consultant_id = d2.consultant_id
                            WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                              AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                        ) = 1
                    ) t
                  )
          )
        )
     OR (
          f.related_entity_type = 'SHOP_ORDER_CONSULTATION'
          AND f.related_entity_id IN (
            SELECT o.id
            FROM shop_client_orders o
            WHERE o.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND o.client_id IN (
                    SELECT t.cid
                    FROM (
                        SELECT __CLIENT_ID__ AS cid
                        WHERE __CLIENT_ID__ <> 0
                        UNION ALL
                        SELECT d.client_id
                        FROM consultant_client_mappings d
                        INNER JOIN consultant_client_mappings seed
                                ON seed.id = __DISCOVER_MAPPING_ID__
                               AND seed.tenant_id = d.tenant_id
                               AND seed.consultant_id = d.consultant_id
                        WHERE __CLIENT_ID__ = 0
                          AND __DISCOVER_MAPPING_ID__ <> 0
                          AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                          AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                        GROUP BY d.client_id
                        HAVING (
                            SELECT COUNT(DISTINCT d2.client_id)
                            FROM consultant_client_mappings d2
                            INNER JOIN consultant_client_mappings seed2
                                    ON seed2.id = __DISCOVER_MAPPING_ID__
                                   AND seed2.tenant_id = d2.tenant_id
                                   AND seed2.consultant_id = d2.consultant_id
                            WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                              AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                        ) = 1
                    ) t
                  )
          )
        )
     OR (
          f.related_entity_type = 'PAYMENT'
          AND f.related_entity_id IN (
            SELECT p.id
            FROM payments p
            WHERE p.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND p.payer_id IN (
                    SELECT t.cid
                    FROM (
                        SELECT __CLIENT_ID__ AS cid
                        WHERE __CLIENT_ID__ <> 0
                        UNION ALL
                        SELECT d.client_id
                        FROM consultant_client_mappings d
                        INNER JOIN consultant_client_mappings seed
                                ON seed.id = __DISCOVER_MAPPING_ID__
                               AND seed.tenant_id = d.tenant_id
                               AND seed.consultant_id = d.consultant_id
                        WHERE __CLIENT_ID__ = 0
                          AND __DISCOVER_MAPPING_ID__ <> 0
                          AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                          AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                        GROUP BY d.client_id
                        HAVING (
                            SELECT COUNT(DISTINCT d2.client_id)
                            FROM consultant_client_mappings d2
                            INNER JOIN consultant_client_mappings seed2
                                    ON seed2.id = __DISCOVER_MAPPING_ID__
                                   AND seed2.tenant_id = d2.tenant_id
                                   AND seed2.consultant_id = d2.consultant_id
                            WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                              AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                        ) = 1
                    ) t
                  )
          )
        )
      )
ORDER BY f.transaction_date, f.id;

SELECT '07_accounting' AS q, a.id, a.entry_number, a.entry_date, a.entry_type,
       a.account_code, a.amount, a.approval_status, a.entry_status,
       a.financial_transaction_id, a.related_transaction_id, a.related_transaction_type,
       a.is_deleted, a.created_at
FROM accounting_entries a
WHERE a.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND a.is_deleted = 0
  AND a.financial_transaction_id IN (
        SELECT f.id
        FROM financial_transactions f
        WHERE f.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
          AND f.is_deleted = 0
          AND (
                (
                  f.related_entity_type LIKE 'CONSULTANT_CLIENT_MAPPING%'
                  AND f.related_entity_id IN (
                    SELECT m.id
                    FROM consultant_client_mappings m
                    WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                      AND m.client_id IN (
                            SELECT t.cid
                            FROM (
                                SELECT __CLIENT_ID__ AS cid
                                WHERE __CLIENT_ID__ <> 0
                                UNION ALL
                                SELECT d.client_id
                                FROM consultant_client_mappings d
                                INNER JOIN consultant_client_mappings seed
                                        ON seed.id = __DISCOVER_MAPPING_ID__
                                       AND seed.tenant_id = d.tenant_id
                                       AND seed.consultant_id = d.consultant_id
                                WHERE __CLIENT_ID__ = 0
                                  AND __DISCOVER_MAPPING_ID__ <> 0
                                  AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                  AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                                GROUP BY d.client_id
                                HAVING (
                                    SELECT COUNT(DISTINCT d2.client_id)
                                    FROM consultant_client_mappings d2
                                    INNER JOIN consultant_client_mappings seed2
                                            ON seed2.id = __DISCOVER_MAPPING_ID__
                                           AND seed2.tenant_id = d2.tenant_id
                                           AND seed2.consultant_id = d2.consultant_id
                                    WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                      AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                                ) = 1
                            ) t
                          )
                  )
                )
             OR (
                  f.related_entity_type = 'SHOP_ORDER_CONSULTATION'
                  AND f.related_entity_id IN (
                    SELECT o.id
                    FROM shop_client_orders o
                    WHERE o.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                      AND o.client_id IN (
                            SELECT t.cid
                            FROM (
                                SELECT __CLIENT_ID__ AS cid
                                WHERE __CLIENT_ID__ <> 0
                                UNION ALL
                                SELECT d.client_id
                                FROM consultant_client_mappings d
                                INNER JOIN consultant_client_mappings seed
                                        ON seed.id = __DISCOVER_MAPPING_ID__
                                       AND seed.tenant_id = d.tenant_id
                                       AND seed.consultant_id = d.consultant_id
                                WHERE __CLIENT_ID__ = 0
                                  AND __DISCOVER_MAPPING_ID__ <> 0
                                  AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                  AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                                GROUP BY d.client_id
                                HAVING (
                                    SELECT COUNT(DISTINCT d2.client_id)
                                    FROM consultant_client_mappings d2
                                    INNER JOIN consultant_client_mappings seed2
                                            ON seed2.id = __DISCOVER_MAPPING_ID__
                                           AND seed2.tenant_id = d2.tenant_id
                                           AND seed2.consultant_id = d2.consultant_id
                                    WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                      AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                                ) = 1
                            ) t
                          )
                  )
                )
             OR (
                  f.related_entity_type = 'PAYMENT'
                  AND f.related_entity_id IN (
                    SELECT p.id
                    FROM payments p
                    WHERE p.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                      AND p.payer_id IN (
                            SELECT t.cid
                            FROM (
                                SELECT __CLIENT_ID__ AS cid
                                WHERE __CLIENT_ID__ <> 0
                                UNION ALL
                                SELECT d.client_id
                                FROM consultant_client_mappings d
                                INNER JOIN consultant_client_mappings seed
                                        ON seed.id = __DISCOVER_MAPPING_ID__
                                       AND seed.tenant_id = d.tenant_id
                                       AND seed.consultant_id = d.consultant_id
                                WHERE __CLIENT_ID__ = 0
                                  AND __DISCOVER_MAPPING_ID__ <> 0
                                  AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                  AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
                                GROUP BY d.client_id
                                HAVING (
                                    SELECT COUNT(DISTINCT d2.client_id)
                                    FROM consultant_client_mappings d2
                                    INNER JOIN consultant_client_mappings seed2
                                            ON seed2.id = __DISCOVER_MAPPING_ID__
                                           AND seed2.tenant_id = d2.tenant_id
                                           AND seed2.consultant_id = d2.consultant_id
                                    WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                                      AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
                                ) = 1
                            ) t
                          )
                  )
                )
              )
      )
ORDER BY a.entry_date, a.id;

SELECT '08_schedules_all' AS q, s.id AS schedule_id, s.mapping_id, s.consultant_id, s.client_id,
       s.date, s.start_time, s.end_time, s.status, s.schedule_type,
       s.session_sequence, s.is_deleted, s.created_at, s.updated_at,
       (s.date > CURDATE() OR (s.date = CURDATE() AND s.start_time >= CURTIME())) AS is_future
FROM schedules s
WHERE s.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND s.client_id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      )
ORDER BY s.date, s.start_time, s.id;

SELECT '09_schedules_future_open' AS q, s.id, s.mapping_id, s.date, s.start_time, s.status,
       s.session_sequence, m.status AS mapping_status, m.total_sessions, m.used_sessions,
       m.remaining_sessions, m.package_name, m.payment_timing
FROM schedules s
LEFT JOIN consultant_client_mappings m
       ON m.id = s.mapping_id
      AND m.tenant_id = s.tenant_id
WHERE s.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
  AND s.status IN ('BOOKED', 'CONFIRMED', 'TENTATIVE_PENDING_PAYMENT', 'IN_PROGRESS', 'AVAILABLE')
  AND s.date >= CURDATE()
  AND s.client_id IN (
        SELECT t.cid
        FROM (
            SELECT __CLIENT_ID__ AS cid
            WHERE __CLIENT_ID__ <> 0
            UNION ALL
            SELECT d.client_id
            FROM consultant_client_mappings d
            INNER JOIN consultant_client_mappings seed
                    ON seed.id = __DISCOVER_MAPPING_ID__
                   AND seed.tenant_id = d.tenant_id
                   AND seed.consultant_id = d.consultant_id
            WHERE __CLIENT_ID__ = 0
              AND __DISCOVER_MAPPING_ID__ <> 0
              AND d.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
              AND (d.total_sessions = 12 OR (d.used_sessions = 1 AND d.remaining_sessions = 11))
            GROUP BY d.client_id
            HAVING (
                SELECT COUNT(DISTINCT d2.client_id)
                FROM consultant_client_mappings d2
                INNER JOIN consultant_client_mappings seed2
                        ON seed2.id = __DISCOVER_MAPPING_ID__
                       AND seed2.tenant_id = d2.tenant_id
                       AND seed2.consultant_id = d2.consultant_id
                WHERE d2.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
                  AND (d2.total_sessions = 12 OR (d2.used_sessions = 1 AND d2.remaining_sessions = 11))
            ) = 1
        ) t
      )
ORDER BY s.date, s.start_time, s.id;

SELECT '10_ft_414_detail' AS q, f.id, f.tenant_id, f.transaction_type, f.status,
       f.category, f.subcategory, f.amount, f.tax_included, f.tax_amount,
       f.amount_before_tax, f.withholding_tax_amount, f.card_merchant_fee_amount,
       f.transaction_date, f.related_entity_type, f.related_entity_id,
       f.approved_at, f.is_deleted, f.created_at, f.updated_at
FROM financial_transactions f
WHERE f.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND f.id = 414
  AND EXISTS (
        SELECT 1 FROM consultant_client_mappings m
        WHERE m.id = f.related_entity_id
          AND m.tenant_id = f.tenant_id
          AND m.client_id = __CLIENT_ID__
      );

SELECT '11_accounting_entries_411' AS q, e.id, e.tenant_id, e.entry_number, e.entry_date,
       e.entry_type, e.account_code, e.account_name, e.amount,
       e.related_transaction_id, e.financial_transaction_id, e.related_transaction_type,
       e.balance_sheet_category, e.subcategory, e.approval_status, e.approver_id,
       e.approved_at, e.total_debit, e.total_credit, e.entry_status, e.posted_at,
       e.is_deleted, e.created_at, e.updated_at
FROM accounting_entries e
WHERE e.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND e.id = 411
  AND __CLIENT_ID__ = 101;

SELECT '12_erp_journal_entry_lines' AS q, l.id, l.journal_entry_id, l.line_number,
       l.account_id, a.account_number, a.bank_code, a.description AS account_desc,
       l.debit_amount, l.credit_amount, l.description AS line_desc,
       l.is_deleted, l.created_at, l.updated_at
FROM erp_journal_entry_lines l
LEFT JOIN accounts a
       ON a.id = l.account_id
      AND a.tenant_id = l.tenant_id
WHERE l.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND l.journal_entry_id IN (398, 411, 412)
  AND __CLIENT_ID__ = 101
ORDER BY l.journal_entry_id, l.line_number, l.id;

SELECT '13_erp_ledgers_2026_11' AS q, lg.id, lg.tenant_id, lg.account_id,
       a.account_number, a.description AS account_desc,
       lg.period_start, lg.period_end, lg.opening_balance,
       lg.total_debit, lg.total_credit, lg.closing_balance,
       lg.created_at, lg.updated_at
FROM erp_ledgers lg
LEFT JOIN accounts a
       ON a.id = lg.account_id
      AND a.tenant_id = lg.tenant_id
WHERE lg.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND lg.period_start >= '2026-11-01'
  AND lg.period_start < '2026-12-01'
  AND __CLIENT_ID__ = 101
ORDER BY lg.period_start, lg.account_id, lg.id;

SELECT '14_financial_period_2026_11' AS q, fp.id, fp.tenant_id, fp.period_type,
       fp.period_start, fp.period_end, fp.status,
       fp.total_income, fp.total_expense, fp.net_amount,
       fp.total_tax_amount, fp.total_refund,
       fp.closed_at, fp.reopened_at, fp.version, fp.created_at, fp.updated_at
FROM financial_period fp
WHERE fp.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND fp.period_end >= '2026-11-01'
  AND __CLIENT_ID__ = 101
ORDER BY fp.period_type, fp.period_start, fp.id;

SELECT '15_next_je_number' AS q, e.tenant_id,
       MAX(e.entry_number) AS max_entry_number,
       MAX(CAST(SUBSTRING(e.entry_number, LENGTH(e.entry_number) - 3) AS UNSIGNED)) AS max_seq,
       COUNT(*) AS count_2026
FROM accounting_entries e
WHERE e.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND e.entry_number LIKE CONCAT('JE-', e.tenant_id, '-2026-%')
  AND __CLIENT_ID__ = 101
GROUP BY e.tenant_id;
