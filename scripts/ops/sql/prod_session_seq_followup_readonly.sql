-- 운영 읽기 전용. D형(같은 매핑·같은 session_sequence 점유 2건 이상), N형(368·387),
-- 일정 478 과 매핑 36 목록. SELECT 만.
-- 이름·연락처·notes 원문·금액·지급·재무 전표는 조회하지 않는다.
-- 일정 전용 history 테이블이 없으면 일정의 created_at·updated_at 와 매핑 이력만 사용한다.

SELECT '=== schema ===' AS section;
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    TABLE_NAME IN (
      'consultant_client_mapping_history',
      'audit_logs',
      'schedule_change_notification_pending'
    )
    OR TABLE_NAME LIKE '%schedule%hist%'
    OR TABLE_NAME LIKE '%schedules_hist%'
  )
ORDER BY TABLE_NAME;

SELECT '=== cases ===' AS section;

WITH occ AS (
  SELECT
    s.tenant_id,
    s.mapping_id,
    s.id AS schedule_id,
    s.client_id,
    s.consultant_id,
    s.`date` AS schedule_date,
    s.start_time,
    s.status,
    s.session_sequence,
    s.created_at,
    s.updated_at
  FROM schedules s
  WHERE s.mapping_id IS NOT NULL
    AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
    AND s.status IN (
      'BOOKED',
      'TENTATIVE_PENDING_PAYMENT',
      'CONFIRMED',
      'COMPLETED',
      'IN_PROGRESS'
    )
),
dated AS (
  SELECT
    o.tenant_id,
    o.mapping_id,
    o.schedule_id,
    o.client_id,
    o.consultant_id,
    o.schedule_date,
    o.start_time,
    o.status,
    o.session_sequence,
    o.created_at,
    o.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY o.tenant_id, o.mapping_id
      ORDER BY o.schedule_date, o.start_time, o.schedule_id
    ) AS date_ord,
    COUNT(*) OVER (PARTITION BY o.tenant_id, o.mapping_id) AS occupying_cnt,
    SUM(o.status IN ('BOOKED', 'TENTATIVE_PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'))
      OVER (PARTITION BY o.tenant_id, o.mapping_id) AS open_cnt
  FROM occ o
),
dup AS (
  SELECT tenant_id, mapping_id, session_sequence
  FROM dated
  WHERE session_sequence IS NOT NULL
  GROUP BY tenant_id, mapping_id, session_sequence
  HAVING COUNT(*) > 1
),
targets AS (
  SELECT d.tenant_id, d.mapping_id, d.schedule_id, d.client_id, d.consultant_id,
         d.schedule_date, d.start_time, d.status, d.session_sequence,
         d.created_at, d.updated_at, d.date_ord, d.occupying_cnt, d.open_cnt,
         'D' AS case_kind
  FROM dated d
  INNER JOIN dup p
    ON p.tenant_id = d.tenant_id
   AND p.mapping_id = d.mapping_id
   AND p.session_sequence = d.session_sequence
  UNION ALL
  SELECT d.tenant_id, d.mapping_id, d.schedule_id, d.client_id, d.consultant_id,
         d.schedule_date, d.start_time, d.status, d.session_sequence,
         d.created_at, d.updated_at, d.date_ord, d.occupying_cnt, d.open_cnt,
         'N' AS case_kind
  FROM dated d
  WHERE d.schedule_id IN (368, 387)
  UNION ALL
  SELECT d.tenant_id, d.mapping_id, d.schedule_id, d.client_id, d.consultant_id,
         d.schedule_date, d.start_time, d.status, d.session_sequence,
         d.created_at, d.updated_at, d.date_ord, d.occupying_cnt, d.open_cnt,
         'R478' AS case_kind
  FROM dated d
  WHERE d.schedule_id = 478
)
SELECT
  t.case_kind,
  t.schedule_id,
  t.mapping_id,
  t.tenant_id,
  t.client_id,
  t.consultant_id,
  t.schedule_date,
  TIME_FORMAT(t.start_time, '%H:%i:%s') AS start_time,
  t.status,
  t.session_sequence,
  t.date_ord,
  t.created_at AS schedule_created_at,
  t.updated_at AS schedule_updated_at,
  m.status AS mapping_status,
  m.payment_status,
  m.payment_timing,
  m.deposit_confirmed + 0 AS deposit_confirmed,
  m.total_sessions,
  m.used_sessions,
  m.remaining_sessions,
  t.occupying_cnt,
  t.open_cnt,
  CASE
    WHEN m.total_sessions IS NOT NULL AND (
      t.occupying_cnt > m.total_sessions
      OR IFNULL(m.used_sessions, 0) > m.total_sessions
    ) THEN 'YES'
    ELSE 'NO'
  END AS total_exceeded,
  IFNULL(m.notes LIKE '%[회기 승계]%', 0) AS succession_note,
  IFNULL(
    m.notes LIKE '%[추가 패키지 병합 완료]%' OR m.notes LIKE '%[추가 매칭]%',
    0
  ) AS merge_note,
  IFNULL(m.notes LIKE '%중복 매칭 통합%', 0) AS dup_merge_note,
  (
    SELECT COUNT(*)
    FROM consultant_client_mappings o
    WHERE o.tenant_id = m.tenant_id
      AND o.client_id = m.client_id
      AND o.id <> m.id
      AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
  ) AS other_mapping_cnt,
  (
    SELECT COUNT(*)
    FROM consultant_client_mapping_history h
    WHERE h.tenant_id = t.tenant_id
      AND h.mapping_id = t.mapping_id
  ) AS mapping_history_cnt,
  (
    SELECT GROUP_CONCAT(cr.id ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = t.tenant_id
      AND cr.consultation_id = t.schedule_id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_ids,
  (
    SELECT GROUP_CONCAT(cr.session_number ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = t.tenant_id
      AND cr.consultation_id = t.schedule_id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_session_numbers,
  CASE
    WHEN t.schedule_id = 478 THEN '판단 필요'
    WHEN t.session_sequence IS NULL THEN '판단 필요'
    WHEN m.total_sessions IS NOT NULL AND (
      t.occupying_cnt > m.total_sessions
      OR IFNULL(m.used_sessions, 0) > m.total_sessions
    ) THEN '판단 필요'
    WHEN IFNULL(m.notes LIKE '%[회기 승계]%', 0) = 1
      OR IFNULL(m.notes LIKE '%[추가 패키지 병합 완료]%' OR m.notes LIKE '%[추가 매칭]%', 0) = 1
      OR IFNULL(m.notes LIKE '%중복 매칭 통합%', 0) = 1 THEN '판단 필요'
    WHEN (
      SELECT COUNT(*)
      FROM consultation_records cr
      WHERE cr.tenant_id = t.tenant_id
        AND cr.consultation_id = t.schedule_id
        AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
    ) > 1 THEN '판단 필요'
    WHEN (
      SELECT MIN(cr.session_number)
      FROM consultation_records cr
      WHERE cr.tenant_id = t.tenant_id
        AND cr.consultation_id = t.schedule_id
        AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
    ) IS NOT NULL
      AND (
        SELECT MIN(cr.session_number)
        FROM consultation_records cr
        WHERE cr.tenant_id = t.tenant_id
          AND cr.consultation_id = t.schedule_id
          AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
      ) <> t.date_ord THEN '판단 필요'
    ELSE '재정렬 가능'
  END AS suggestion,
  CASE
    WHEN t.schedule_id = 478 THEN 'REPAIR_478'
    WHEN t.session_sequence IS NULL THEN 'NULL_SEQ'
    WHEN m.total_sessions IS NOT NULL AND (
      t.occupying_cnt > m.total_sessions
      OR IFNULL(m.used_sessions, 0) > m.total_sessions
    ) THEN 'TOTAL_EXCEEDED'
    WHEN IFNULL(m.notes LIKE '%[회기 승계]%', 0) = 1
      OR IFNULL(m.notes LIKE '%[추가 패키지 병합 완료]%' OR m.notes LIKE '%[추가 매칭]%', 0) = 1
      OR IFNULL(m.notes LIKE '%중복 매칭 통합%', 0) = 1 THEN 'SUCCESSION_OR_MERGE'
    WHEN (
      SELECT COUNT(*)
      FROM consultation_records cr
      WHERE cr.tenant_id = t.tenant_id
        AND cr.consultation_id = t.schedule_id
        AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
    ) > 1 THEN 'MULTI_RECORD'
    WHEN (
      SELECT MIN(cr.session_number)
      FROM consultation_records cr
      WHERE cr.tenant_id = t.tenant_id
        AND cr.consultation_id = t.schedule_id
        AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
    ) IS NOT NULL
      AND (
        SELECT MIN(cr.session_number)
        FROM consultation_records cr
        WHERE cr.tenant_id = t.tenant_id
          AND cr.consultation_id = t.schedule_id
          AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
      ) <> t.date_ord THEN 'JOURNAL_NOT_DATE_ORD'
    ELSE 'REORDER_OK'
  END AS suggestion_basis
FROM targets t
INNER JOIN consultant_client_mappings m
  ON m.id = t.mapping_id
 AND m.tenant_id = t.tenant_id
ORDER BY t.case_kind, t.mapping_id, t.date_ord, t.schedule_id;

SELECT '=== repair 478 ===' AS section;
SELECT
  s.id AS schedule_id,
  s.mapping_id,
  s.session_sequence,
  s.status,
  s.`date` AS schedule_date,
  TIME_FORMAT(s.start_time, '%H:%i:%s') AS start_time,
  s.created_at,
  s.updated_at,
  s.is_deleted + 0 AS is_deleted,
  CASE
    WHEN s.mapping_id = 36 AND s.session_sequence = 22 THEN 'APPLIED'
    ELSE 'NOT_APPLIED'
  END AS repair_285_to_36,
  (
    SELECT GROUP_CONCAT(cr.session_number ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = s.tenant_id
      AND cr.consultation_id = s.id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_session_numbers
FROM schedules s
WHERE s.id = 478;

SELECT '=== mapping 36 occupying ===' AS section;
WITH occ AS (
  SELECT
    s.tenant_id,
    s.mapping_id,
    s.id AS schedule_id,
    s.`date` AS schedule_date,
    s.start_time,
    s.status,
    s.session_sequence,
    s.created_at,
    s.updated_at
  FROM schedules s
  WHERE s.mapping_id = 36
    AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
    AND s.status IN (
      'BOOKED',
      'TENTATIVE_PENDING_PAYMENT',
      'CONFIRMED',
      'COMPLETED',
      'IN_PROGRESS'
    )
)
SELECT
  o.mapping_id,
  o.schedule_id,
  o.schedule_date,
  TIME_FORMAT(o.start_time, '%H:%i:%s') AS start_time,
  o.status,
  o.session_sequence,
  ROW_NUMBER() OVER (
    ORDER BY o.schedule_date, o.start_time, o.schedule_id
  ) AS date_ord,
  o.created_at,
  o.updated_at,
  (
    SELECT GROUP_CONCAT(cr.session_number ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = o.tenant_id
      AND cr.consultation_id = o.schedule_id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_session_numbers
FROM occ o
ORDER BY date_ord;

SELECT '=== mapping 285 still holding 478 ===' AS section;
SELECT
  m.id,
  m.status,
  m.payment_status,
  m.payment_timing,
  m.deposit_confirmed + 0 AS deposit_confirmed,
  m.total_sessions,
  m.used_sessions,
  m.remaining_sessions,
  m.created_at,
  IFNULL(m.notes LIKE '%[회기 승계]%', 0) AS succession_note,
  IFNULL(
    m.notes LIKE '%[추가 패키지 병합 완료]%' OR m.notes LIKE '%[추가 매칭]%',
    0
  ) AS merge_note,
  (
    SELECT COUNT(*)
    FROM schedules s
    WHERE s.mapping_id = m.id
      AND s.tenant_id = m.tenant_id
      AND s.id = 478
      AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
  ) AS schedule_478_still_here
FROM consultant_client_mappings m
WHERE m.id = 285;

SELECT '=== sibling mappings ===' AS section;
WITH occ AS (
  SELECT s.tenant_id, s.mapping_id, s.id AS schedule_id, s.session_sequence
  FROM schedules s
  WHERE s.mapping_id IS NOT NULL
    AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
    AND s.status IN (
      'BOOKED', 'TENTATIVE_PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'
    )
),
dup AS (
  SELECT tenant_id, mapping_id, session_sequence
  FROM occ
  WHERE session_sequence IS NOT NULL
  GROUP BY tenant_id, mapping_id, session_sequence
  HAVING COUNT(*) > 1
),
map_ids AS (
  SELECT DISTINCT d.tenant_id, d.mapping_id
  FROM occ d
  INNER JOIN dup p
    ON p.tenant_id = d.tenant_id
   AND p.mapping_id = d.mapping_id
   AND p.session_sequence = d.session_sequence
  UNION
  SELECT s.tenant_id, s.mapping_id
  FROM schedules s
  WHERE s.id IN (368, 387, 478)
  UNION
  SELECT m.tenant_id, m.id
  FROM consultant_client_mappings m
  WHERE m.id IN (36, 285)
)
SELECT
  src.mapping_id AS case_mapping_id,
  o.id AS other_mapping_id,
  o.client_id,
  o.status,
  o.payment_status,
  o.payment_timing,
  o.total_sessions,
  o.used_sessions,
  o.remaining_sessions,
  o.created_at,
  IFNULL(o.notes LIKE '%[회기 승계]%', 0) AS succession_note,
  IFNULL(
    o.notes LIKE '%[추가 패키지 병합 완료]%' OR o.notes LIKE '%[추가 매칭]%',
    0
  ) AS merge_note,
  IFNULL(o.notes LIKE '%중복 매칭 통합%', 0) AS dup_merge_note
FROM map_ids src
INNER JOIN consultant_client_mappings base
  ON base.id = src.mapping_id
 AND base.tenant_id = src.tenant_id
INNER JOIN consultant_client_mappings o
  ON o.tenant_id = base.tenant_id
 AND o.client_id = base.client_id
 AND o.id <> base.id
 AND (o.is_deleted = 0 OR o.is_deleted IS NULL)
ORDER BY src.mapping_id, o.created_at, o.id;

SELECT '=== mapping history ===' AS section;
WITH occ AS (
  SELECT s.tenant_id, s.mapping_id, s.session_sequence
  FROM schedules s
  WHERE s.mapping_id IS NOT NULL
    AND (s.is_deleted = 0 OR s.is_deleted IS NULL)
    AND s.status IN (
      'BOOKED', 'TENTATIVE_PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'
    )
),
dup AS (
  SELECT tenant_id, mapping_id, session_sequence
  FROM occ
  WHERE session_sequence IS NOT NULL
  GROUP BY tenant_id, mapping_id, session_sequence
  HAVING COUNT(*) > 1
),
map_ids AS (
  SELECT DISTINCT d.tenant_id, d.mapping_id FROM occ d
  INNER JOIN dup p
    ON p.tenant_id = d.tenant_id
   AND p.mapping_id = d.mapping_id
   AND p.session_sequence = d.session_sequence
  UNION
  SELECT s.tenant_id, s.mapping_id FROM schedules s WHERE s.id IN (368, 387, 478)
  UNION
  SELECT m.tenant_id, m.id FROM consultant_client_mappings m WHERE m.id IN (36, 285)
)
SELECT
  h.mapping_id,
  h.id AS history_id,
  h.created_at,
  h.event_type,
  JSON_UNQUOTE(JSON_EXTRACT(h.before_state_json, '$.status')) AS before_status,
  JSON_EXTRACT(h.before_state_json, '$.totalSessions') AS before_total,
  JSON_EXTRACT(h.before_state_json, '$.usedSessions') AS before_used,
  JSON_EXTRACT(h.before_state_json, '$.remainingSessions') AS before_remaining,
  JSON_UNQUOTE(JSON_EXTRACT(h.after_state_json, '$.status')) AS after_status,
  JSON_EXTRACT(h.after_state_json, '$.totalSessions') AS after_total,
  JSON_EXTRACT(h.after_state_json, '$.usedSessions') AS after_used,
  JSON_EXTRACT(h.after_state_json, '$.remainingSessions') AS after_remaining,
  CASE
    WHEN h.reason REGEXP '^SESSION_USED via schedule [0-9]+$'
      THEN CAST(SUBSTRING_INDEX(h.reason, ' ', -1) AS UNSIGNED)
    ELSE NULL
  END AS via_schedule_id,
  IFNULL(h.reason LIKE '%[회기 승계]%', 0) AS succession_marker,
  IFNULL(
    h.reason LIKE '%[추가 패키지 병합 완료]%' OR h.reason LIKE '%[추가 매칭]%',
    0
  ) AS merge_marker,
  JSON_EXTRACT(h.after_state_json, '$.sourceMappingId') AS after_source_mapping_id,
  JSON_EXTRACT(h.after_state_json, '$.targetMappingId') AS after_target_mapping_id,
  JSON_EXTRACT(h.after_state_json, '$.sessionCount') AS after_session_count
FROM consultant_client_mapping_history h
INNER JOIN map_ids ids
  ON ids.tenant_id = h.tenant_id
 AND ids.mapping_id = h.mapping_id
ORDER BY h.mapping_id, h.created_at, h.id;

SELECT '=== succession audit ===' AS section;
WITH map_ids AS (
  SELECT m.id AS mapping_id
  FROM consultant_client_mappings m
  WHERE m.id IN (36, 285)
     OR m.id IN (
       SELECT DISTINCT s.mapping_id
       FROM schedules s
       WHERE s.id IN (368, 387, 478)
          OR s.id IN (
            SELECT s2.id
            FROM schedules s2
            WHERE s2.mapping_id IS NOT NULL
              AND s2.session_sequence IS NOT NULL
              AND (s2.is_deleted = 0 OR s2.is_deleted IS NULL)
              AND s2.status IN (
                'BOOKED', 'TENTATIVE_PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'
              )
              AND EXISTS (
                SELECT 1
                FROM schedules s3
                WHERE s3.tenant_id = s2.tenant_id
                  AND s3.mapping_id = s2.mapping_id
                  AND s3.session_sequence = s2.session_sequence
                  AND s3.id <> s2.id
                  AND (s3.is_deleted = 0 OR s3.is_deleted IS NULL)
                  AND s3.status IN (
                    'BOOKED', 'TENTATIVE_PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'IN_PROGRESS'
                  )
              )
          )
     )
)
SELECT
  a.id AS audit_id,
  a.created_at,
  a.action,
  a.entity_type,
  a.entity_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(a.metadata_json, '$.sourceMappingId')) AS UNSIGNED) AS source_mapping_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(a.metadata_json, '$.targetMappingId')) AS UNSIGNED) AS target_mapping_id,
  CAST(JSON_UNQUOTE(JSON_EXTRACT(a.metadata_json, '$.sessionCount')) AS UNSIGNED) AS session_count
FROM audit_logs a
WHERE a.action = 'MAPPING_SESSION_SUCCESSION'
  AND (
    CAST(JSON_UNQUOTE(JSON_EXTRACT(a.metadata_json, '$.sourceMappingId')) AS UNSIGNED)
      IN (SELECT mapping_id FROM map_ids)
    OR CAST(JSON_UNQUOTE(JSON_EXTRACT(a.metadata_json, '$.targetMappingId')) AS UNSIGNED)
      IN (SELECT mapping_id FROM map_ids)
  )
ORDER BY a.created_at, a.id;
