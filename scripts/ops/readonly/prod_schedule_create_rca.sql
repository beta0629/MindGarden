-- P0 RCA (2026-11-11) 신규 내담자 일정 생성 500 — 순수 SELECT. 개인정보(이름·전화·이메일) 값 미출력, NULL 여부만.
-- 치환: __TARGET_DATE__ (yyyy-MM-dd, KST 기준 등록일)

SELECT '00_tenant' AS q, t.tenant_id, t.subdomain, t.status FROM tenants t WHERE t.subdomain = 'mindgarden' OR t.tenant_id LIKE '%mindgarden%';

-- 01 당일 생성 사용자(역할·플래그만)
SELECT '01_users_today' AS q, u.id, u.role, u.tenant_id, u.created_at, u.is_active, u.lifecycle_state, u.is_deleted,
       (u.branch_id IS NULL) AS branch_id_null, (u.branch_code IS NULL) AS branch_code_null,
       (u.phone IS NULL OR u.phone = '') AS phone_null, (u.email IS NULL OR u.email = '') AS email_null,
       u.is_social_account, u.counseling_enabled
FROM users u
WHERE u.created_at >= '__TARGET_DATE__ 00:00:00' AND u.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
  AND u.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
ORDER BY u.created_at;

-- 02 당일 생성 CLIENT 의 매핑 (+ 상담사 계정 상태)
SELECT '02_mappings' AS q, m.id AS mapping_id, m.client_id, m.consultant_id, m.tenant_id, (m.tenant_id = c.tenant_id) AS tenant_match_client,
       m.status, m.payment_status, m.payment_timing, m.deposit_confirmed, m.total_sessions, m.used_sessions, m.remaining_sessions,
       m.package_name, m.package_price, m.payment_amount, m.payment_date IS NOT NULL AS has_payment_date, m.admin_approval_date IS NOT NULL AS approved,
       m.start_date, m.end_date, m.branch_code IS NULL AS branch_code_null, m.created_at, m.updated_at, m.is_deleted,
       cs.role AS consultant_role, cs.is_active AS consultant_active, cs.is_deleted AS consultant_deleted, (cs.tenant_id = m.tenant_id) AS consultant_tenant_match
FROM consultant_client_mappings m
JOIN users c ON c.id = m.client_id
LEFT JOIN users cs ON cs.id = m.consultant_id
WHERE c.created_at >= '__TARGET_DATE__ 00:00:00' AND c.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
  AND c.role = 'CLIENT' AND c.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
ORDER BY m.id;

-- 03 해당 내담자 일정 (상태별 건수)
SELECT '03_schedules' AS q, s.client_id, s.status, s.is_deleted, COUNT(*) AS cnt, SUM(s.mapping_id IS NULL) AS mapping_id_null
FROM schedules s JOIN users c ON c.id = s.client_id
WHERE c.created_at >= '__TARGET_DATE__ 00:00:00' AND c.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
  AND c.role = 'CLIENT' AND c.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
GROUP BY s.client_id, s.status, s.is_deleted;

-- 04 주문·라인(매핑 연결 여부)
SELECT '04_orders' AS q, o.id AS order_id, o.client_id, o.status, o.checkout_source, o.created_at,
       l.sku_code_snapshot, l.session_count_snapshot, l.quantity, l.consultant_client_mapping_id
FROM shop_client_orders o LEFT JOIN shop_client_order_lines l ON l.order_id = o.id
JOIN users c ON c.id = o.client_id
WHERE c.created_at >= '__TARGET_DATE__ 00:00:00' AND c.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
  AND c.role = 'CLIENT' AND c.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden');

-- 05 ERP 거래(매핑 연결)
SELECT '05_financial' AS q, f.related_entity_type, f.related_entity_id, f.transaction_type, f.status, f.amount, f.transaction_date, f.is_deleted
FROM financial_transactions f
WHERE f.related_entity_id IN (
  SELECT m.id FROM consultant_client_mappings m JOIN users c ON c.id = m.client_id
  WHERE c.created_at >= '__TARGET_DATE__ 00:00:00' AND c.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
    AND c.role = 'CLIENT' AND c.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden'))
  AND f.related_entity_type LIKE '%MAPPING%';

-- 06 비교: 테넌트 최근 14일 생성 매핑 상태 분포 (정상 케이스 shape)
SELECT '06_recent_mapping_shape' AS q, m.status, m.payment_status, m.payment_timing, m.deposit_confirmed,
       COUNT(*) AS cnt, SUM(m.used_sessions = 0) AS used0, SUM(m.admin_approval_date IS NULL) AS not_approved
FROM consultant_client_mappings m
WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden') AND m.created_at >= DATE_SUB('__TARGET_DATE__', INTERVAL 14 DAY)
GROUP BY m.status, m.payment_status, m.payment_timing, m.deposit_confirmed ORDER BY cnt DESC;

-- 07 무결성: 테넌트 ACTIVE 매핑 중 상담사/내담자 user 행 없음 (validateRemainingSessions NPE·lazy 로드 실패 후보)
SELECT '07_active_orphans' AS q, SUM(cs.id IS NULL) AS consultant_missing, SUM(c.id IS NULL) AS client_missing,
       SUM(m.consultant_id IS NULL) AS consultant_id_null, SUM(m.client_id IS NULL) AS client_id_null, COUNT(*) AS active_total
FROM consultant_client_mappings m
LEFT JOIN users cs ON cs.id = m.consultant_id LEFT JOIN users c ON c.id = m.client_id
WHERE m.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden') AND m.status IN ('ACTIVE','PENDING_PAYMENT','CANCELLED');

-- 08 오늘 테넌트 일정 생성 건수 (다른 사람은 되는지)
SELECT '08_schedules_created_today' AS q, s.status, COUNT(*) AS cnt
FROM schedules s WHERE s.tenant_id IN (SELECT tenant_id FROM tenants WHERE subdomain = 'mindgarden')
  AND s.created_at >= '__TARGET_DATE__ 00:00:00' GROUP BY s.status;
