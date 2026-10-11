-- 운영 읽기 전용. 같은 매핑 안 점유 일정의 날짜 순서와 session_sequence 순서가 어긋난 행.
-- 점유: BOOKED / TENTATIVE_PENDING_PAYMENT(가예약) / CONFIRMED / COMPLETED / IN_PROGRESS.
-- 취소·삭제 제외. 번호 NULL 점유 일정은 항상 포함한다.
-- 취소 일정이 비운 session_sequence 를 다시 쓴 행은 cancelled_seq_reused=1.
-- 순서 비교는 session_sequence 가 있는 행만 한다.
--   date_ord_nn: 그 행들을 날짜·시작시간·id 로 매긴 번호
--   seq_ord: session_sequence·id 로 매긴 번호
--   둘이 다르면 ORDER_MISMATCH. 같은 번호가 점유 행에 2건 이상이면 DUPLICATE_SEQ.
-- date_ord 는 매핑의 점유 일정 전체(NULL 포함)를 날짜·시작시간·id 로 다시 매긴 번호.
-- 페이아웃·급여·재무 전표 테이블은 조회하지 않는다.

SELECT '=== B summary ===' AS section;

WITH occ AS (
  SELECT
    s.tenant_id,
    s.mapping_id,
    s.id AS schedule_id,
    s.`date` AS schedule_date,
    s.start_time,
    s.status,
    s.session_sequence
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
    o.schedule_date,
    o.start_time,
    o.status,
    o.session_sequence,
    ROW_NUMBER() OVER (
      PARTITION BY o.tenant_id, o.mapping_id
      ORDER BY o.schedule_date, o.start_time, o.schedule_id
    ) AS date_ord
  FROM occ o
),
nonnull AS (
  SELECT
    d.tenant_id,
    d.mapping_id,
    d.schedule_id,
    d.schedule_date,
    d.start_time,
    d.status,
    d.session_sequence,
    d.date_ord,
    ROW_NUMBER() OVER (
      PARTITION BY d.tenant_id, d.mapping_id
      ORDER BY d.schedule_date, d.start_time, d.schedule_id
    ) AS date_ord_nn,
    ROW_NUMBER() OVER (
      PARTITION BY d.tenant_id, d.mapping_id
      ORDER BY d.session_sequence, d.schedule_id
    ) AS seq_ord
  FROM dated d
  WHERE d.session_sequence IS NOT NULL
),
dup AS (
  SELECT tenant_id, mapping_id, session_sequence
  FROM nonnull
  GROUP BY tenant_id, mapping_id, session_sequence
  HAVING COUNT(*) > 1
),
reused AS (
  SELECT DISTINCT
    n.tenant_id,
    n.mapping_id,
    n.schedule_id
  FROM nonnull n
  INNER JOIN schedules c
    ON c.tenant_id = n.tenant_id
   AND c.mapping_id = n.mapping_id
   AND c.id <> n.schedule_id
   AND c.session_sequence = n.session_sequence
   AND c.status = 'CANCELLED'
   AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
),
mismatch AS (
  SELECT
    n.tenant_id,
    n.mapping_id,
    n.schedule_id,
    n.schedule_date,
    n.start_time,
    n.status,
    n.session_sequence,
    n.date_ord,
    n.seq_ord,
    CASE WHEN d.session_sequence IS NULL THEN 0 ELSE 1 END AS duplicate_seq,
    CASE WHEN r.schedule_id IS NULL THEN 0 ELSE 1 END AS cancelled_seq_reused,
    CASE
      WHEN n.date_ord_nn <> n.seq_ord THEN 'ORDER_MISMATCH'
      ELSE 'DUPLICATE_SEQ'
    END AS reason
  FROM nonnull n
  LEFT JOIN dup d
    ON d.tenant_id = n.tenant_id
   AND d.mapping_id = n.mapping_id
   AND d.session_sequence = n.session_sequence
  LEFT JOIN reused r
    ON r.tenant_id = n.tenant_id
   AND r.mapping_id = n.mapping_id
   AND r.schedule_id = n.schedule_id
  WHERE n.date_ord_nn <> n.seq_ord
     OR d.session_sequence IS NOT NULL
),
nullseq AS (
  SELECT
    d.tenant_id,
    d.mapping_id,
    d.schedule_id,
    d.schedule_date,
    d.start_time,
    d.status,
    d.session_sequence,
    d.date_ord,
    CAST(NULL AS SIGNED) AS seq_ord,
    0 AS duplicate_seq,
    0 AS cancelled_seq_reused,
    'NULL_SEQ' AS reason
  FROM dated d
  WHERE d.session_sequence IS NULL
),
flagged AS (
  SELECT
    tenant_id, mapping_id, schedule_id, schedule_date, start_time, status,
    session_sequence, date_ord, seq_ord, duplicate_seq, cancelled_seq_reused, reason
  FROM mismatch
  UNION ALL
  SELECT
    tenant_id, mapping_id, schedule_id, schedule_date, start_time, status,
    session_sequence, date_ord, seq_ord, duplicate_seq, cancelled_seq_reused, reason
  FROM nullseq
)
SELECT
  COUNT(*) AS row_count,
  COUNT(DISTINCT mapping_id) AS mapping_count,
  SUM(reason = 'ORDER_MISMATCH') AS order_mismatch_rows,
  SUM(reason = 'DUPLICATE_SEQ') AS duplicate_seq_rows,
  SUM(reason = 'NULL_SEQ') AS null_seq_rows,
  SUM(cancelled_seq_reused = 1) AS reused_cancelled_rows
FROM flagged;

SELECT '=== B rows ===' AS section;

WITH occ AS (
  SELECT
    s.tenant_id,
    s.mapping_id,
    s.id AS schedule_id,
    s.`date` AS schedule_date,
    s.start_time,
    s.status,
    s.session_sequence
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
    o.schedule_date,
    o.start_time,
    o.status,
    o.session_sequence,
    ROW_NUMBER() OVER (
      PARTITION BY o.tenant_id, o.mapping_id
      ORDER BY o.schedule_date, o.start_time, o.schedule_id
    ) AS date_ord
  FROM occ o
),
nonnull AS (
  SELECT
    d.tenant_id,
    d.mapping_id,
    d.schedule_id,
    d.schedule_date,
    d.start_time,
    d.status,
    d.session_sequence,
    d.date_ord,
    ROW_NUMBER() OVER (
      PARTITION BY d.tenant_id, d.mapping_id
      ORDER BY d.schedule_date, d.start_time, d.schedule_id
    ) AS date_ord_nn,
    ROW_NUMBER() OVER (
      PARTITION BY d.tenant_id, d.mapping_id
      ORDER BY d.session_sequence, d.schedule_id
    ) AS seq_ord
  FROM dated d
  WHERE d.session_sequence IS NOT NULL
),
dup AS (
  SELECT tenant_id, mapping_id, session_sequence
  FROM nonnull
  GROUP BY tenant_id, mapping_id, session_sequence
  HAVING COUNT(*) > 1
),
reused AS (
  SELECT DISTINCT
    n.tenant_id,
    n.mapping_id,
    n.schedule_id
  FROM nonnull n
  INNER JOIN schedules c
    ON c.tenant_id = n.tenant_id
   AND c.mapping_id = n.mapping_id
   AND c.id <> n.schedule_id
   AND c.session_sequence = n.session_sequence
   AND c.status = 'CANCELLED'
   AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
),
mismatch AS (
  SELECT
    n.tenant_id,
    n.mapping_id,
    n.schedule_id,
    n.schedule_date,
    n.start_time,
    n.status,
    n.session_sequence,
    n.date_ord,
    n.seq_ord,
    CASE WHEN d.session_sequence IS NULL THEN 0 ELSE 1 END AS duplicate_seq,
    CASE WHEN r.schedule_id IS NULL THEN 0 ELSE 1 END AS cancelled_seq_reused,
    CASE
      WHEN n.date_ord_nn <> n.seq_ord THEN 'ORDER_MISMATCH'
      ELSE 'DUPLICATE_SEQ'
    END AS reason
  FROM nonnull n
  LEFT JOIN dup d
    ON d.tenant_id = n.tenant_id
   AND d.mapping_id = n.mapping_id
   AND d.session_sequence = n.session_sequence
  LEFT JOIN reused r
    ON r.tenant_id = n.tenant_id
   AND r.mapping_id = n.mapping_id
   AND r.schedule_id = n.schedule_id
  WHERE n.date_ord_nn <> n.seq_ord
     OR d.session_sequence IS NOT NULL
),
nullseq AS (
  SELECT
    d.tenant_id,
    d.mapping_id,
    d.schedule_id,
    d.schedule_date,
    d.start_time,
    d.status,
    d.session_sequence,
    d.date_ord,
    CAST(NULL AS SIGNED) AS seq_ord,
    0 AS duplicate_seq,
    0 AS cancelled_seq_reused,
    'NULL_SEQ' AS reason
  FROM dated d
  WHERE d.session_sequence IS NULL
),
flagged AS (
  SELECT
    tenant_id, mapping_id, schedule_id, schedule_date, start_time, status,
    session_sequence, date_ord, seq_ord, duplicate_seq, cancelled_seq_reused, reason
  FROM mismatch
  UNION ALL
  SELECT
    tenant_id, mapping_id, schedule_id, schedule_date, start_time, status,
    session_sequence, date_ord, seq_ord, duplicate_seq, cancelled_seq_reused, reason
  FROM nullseq
)
SELECT
  f.mapping_id,
  f.tenant_id,
  f.schedule_id,
  f.schedule_date,
  TIME_FORMAT(f.start_time, '%H:%i:%s') AS start_time,
  f.status,
  f.session_sequence,
  f.date_ord,
  f.seq_ord,
  f.reason,
  f.duplicate_seq,
  f.cancelled_seq_reused,
  (
    SELECT GROUP_CONCAT(cr.id ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = f.tenant_id
      AND cr.consultation_id = f.schedule_id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_ids,
  (
    SELECT GROUP_CONCAT(cr.session_number ORDER BY cr.id SEPARATOR ',')
    FROM consultation_records cr
    WHERE cr.tenant_id = f.tenant_id
      AND cr.consultation_id = f.schedule_id
      AND (cr.is_deleted = 0 OR cr.is_deleted IS NULL)
  ) AS record_session_numbers
FROM flagged f
ORDER BY f.tenant_id, f.mapping_id, f.date_ord, f.schedule_id;
