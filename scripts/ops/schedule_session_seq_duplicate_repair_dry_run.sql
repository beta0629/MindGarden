-- =============================================================================
-- 회기 순번(session_sequence) 중복 탐지 dry-run (읽기 전용 + TEMP)
-- 정책 A (회기 재사용·gap-fill): 활성 일정의 동일 tenant+mapping+session_sequence 중복만 보고
-- 금지: UPDATE/DELETE, rem/used 변경, CANCELLED 행 변경, consultation_records rewrite,
--       silent 전면 ROW_NUMBER 재부여, Flyway/CI 자동 실행
-- 스타일 참고: consultation_session_link_repair_dry_run.sql
-- =============================================================================
-- 파라미터 (세션 변수) — 테넌트/매핑/사람이름 리터럴 하드코딩 금지
--   SET @tenant_id = 'YOUR_TENANT_ID';  -- 필수
--   SET @mapping_id = 0;                 -- 0=tenant 전체 중복 스캔; >0이면 해당 mapping만 (예: mapping_id=255)
--   SET @dry_run = 1;                    -- dry-run 스크립트는 항상 읽기 전용
-- =============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;

SET @tenant_id = IFNULL(@tenant_id, '');
SET @mapping_id = IFNULL(@mapping_id, 0);
SET @dry_run = IFNULL(@dry_run, 1);

SELECT '=== 0) 파라미터 ===' AS section;

SELECT
  @tenant_id AS tenant_id,
  @mapping_id AS mapping_id_filter,
  @dry_run AS dry_run,
  CASE
    WHEN @tenant_id IS NULL OR TRIM(@tenant_id) = '' THEN 'ABORT: @tenant_id 필수'
    ELSE 'OK'
  END AS param_check;

-- 활성(점유) 상태 — 정책 A 이력 점유와 동일 allowlist (CANCELLED 제외)
-- BOOKED / TENTATIVE_PENDING_PAYMENT / CONFIRMED / IN_PROGRESS / COMPLETED

DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_active;
CREATE TEMPORARY TABLE tmp_seq_dup_active (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NOT NULL,
  session_sequence INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  status_rank INT NOT NULL,
  schedule_date DATE NULL,
  start_time TIME NULL,
  total_sessions INT NULL,
  INDEX idx_tmp_seq_dup_map (tenant_id, mapping_id, session_sequence),
  INDEX idx_tmp_seq_dup_status (status_rank, schedule_date, start_time, schedule_id)
);

INSERT INTO tmp_seq_dup_active (
  schedule_id, tenant_id, mapping_id, session_sequence, status, status_rank,
  schedule_date, start_time, total_sessions
)
SELECT
  s.id,
  s.tenant_id,
  s.mapping_id,
  s.session_sequence,
  s.status,
  CASE s.status
    WHEN 'COMPLETED' THEN 1
    WHEN 'IN_PROGRESS' THEN 2
    WHEN 'CONFIRMED' THEN 3
    WHEN 'BOOKED' THEN 4
    WHEN 'TENTATIVE_PENDING_PAYMENT' THEN 5
    ELSE 99
  END AS status_rank,
  s.date,
  s.start_time,
  m.total_sessions
FROM schedules s
INNER JOIN consultant_client_mappings m
  ON m.id = s.mapping_id
 AND m.tenant_id = s.tenant_id
WHERE TRIM(@tenant_id) <> ''
  AND s.tenant_id = @tenant_id
  AND (@mapping_id = 0 OR s.mapping_id = @mapping_id)
  AND s.mapping_id IS NOT NULL
  AND s.session_sequence IS NOT NULL
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND s.schedule_type = 'CONSULTATION'
  AND s.status IN (
    'BOOKED',
    'TENTATIVE_PENDING_PAYMENT',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED'
  );

SELECT '=== 1) 중복 그룹 요약 (tenant+mapping+session_sequence HAVING COUNT>1) ===' AS section;

SELECT
  a.tenant_id,
  a.mapping_id,
  a.session_sequence,
  COUNT(*) AS dup_cnt,
  MAX(a.total_sessions) AS total_sessions
FROM tmp_seq_dup_active a
GROUP BY a.tenant_id, a.mapping_id, a.session_sequence
HAVING COUNT(*) > 1
ORDER BY a.mapping_id, a.session_sequence;

DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_ranked;
CREATE TEMPORARY TABLE tmp_seq_dup_ranked (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NOT NULL,
  session_sequence INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  status_rank INT NOT NULL,
  schedule_date DATE NULL,
  start_time TIME NULL,
  total_sessions INT NULL,
  row_in_group INT NOT NULL,
  role_code VARCHAR(16) NOT NULL,
  INDEX idx_tmp_seq_dup_role (role_code, mapping_id)
);

INSERT INTO tmp_seq_dup_ranked (
  schedule_id, tenant_id, mapping_id, session_sequence, status, status_rank,
  schedule_date, start_time, total_sessions, row_in_group, role_code
)
SELECT
  x.schedule_id,
  x.tenant_id,
  x.mapping_id,
  x.session_sequence,
  x.status,
  x.status_rank,
  x.schedule_date,
  x.start_time,
  x.total_sessions,
  x.row_in_group,
  CASE WHEN x.row_in_group = 1 THEN 'WINNER' ELSE 'LOSER' END AS role_code
FROM (
  SELECT
    a.*,
    ROW_NUMBER() OVER (
      PARTITION BY a.tenant_id, a.mapping_id, a.session_sequence
      ORDER BY a.status_rank ASC, a.schedule_date ASC, a.start_time ASC, a.schedule_id ASC
    ) AS row_in_group
  FROM tmp_seq_dup_active a
  INNER JOIN (
    SELECT tenant_id, mapping_id, session_sequence
    FROM tmp_seq_dup_active
    GROUP BY tenant_id, mapping_id, session_sequence
    HAVING COUNT(*) > 1
  ) d
    ON d.tenant_id = a.tenant_id
   AND d.mapping_id = a.mapping_id
   AND d.session_sequence = a.session_sequence
) x;

SELECT '=== 2) 승자/패자 후보 (승자=상태우선 후 date/start_time/id ASC) ===' AS section;

SELECT
  r.role_code,
  r.schedule_id,
  r.tenant_id,
  r.mapping_id,
  r.session_sequence AS current_seq,
  r.status,
  r.status_rank,
  r.schedule_date,
  r.start_time,
  r.total_sessions,
  r.row_in_group
FROM tmp_seq_dup_ranked r
ORDER BY r.mapping_id, r.session_sequence, r.row_in_group;

-- 패자 제외 후 점유 순번 (승자 + 비중복 활성 일정)
DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_occupied;
CREATE TEMPORARY TABLE tmp_seq_dup_occupied (
  mapping_id BIGINT NOT NULL,
  session_sequence INT NOT NULL,
  PRIMARY KEY (mapping_id, session_sequence)
);

INSERT INTO tmp_seq_dup_occupied (mapping_id, session_sequence)
SELECT DISTINCT a.mapping_id, a.session_sequence
FROM tmp_seq_dup_active a
WHERE NOT EXISTS (
  SELECT 1
  FROM tmp_seq_dup_ranked r
  WHERE r.schedule_id = a.schedule_id
    AND r.role_code = 'LOSER'
);

-- 1..total_sessions 숫자열 (상한 500 — 운영 패키지 회기 상한 방어)
DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_nums;
CREATE TEMPORARY TABLE tmp_seq_dup_nums (
  n INT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_seq_dup_nums (n)
WITH RECURSIVE nums AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 500
)
SELECT n FROM nums;

DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_free;
CREATE TEMPORARY TABLE tmp_seq_dup_free (
  mapping_id BIGINT NOT NULL,
  free_seq INT NOT NULL,
  slot_rn INT NOT NULL,
  PRIMARY KEY (mapping_id, free_seq),
  INDEX idx_tmp_seq_dup_free_rn (mapping_id, slot_rn)
);

INSERT INTO tmp_seq_dup_free (mapping_id, free_seq, slot_rn)
SELECT
  m.mapping_id,
  n.n AS free_seq,
  ROW_NUMBER() OVER (PARTITION BY m.mapping_id ORDER BY n.n ASC) AS slot_rn
FROM (
  SELECT DISTINCT mapping_id, total_sessions
  FROM tmp_seq_dup_ranked
  WHERE role_code = 'LOSER'
) m
INNER JOIN tmp_seq_dup_nums n
  ON n.n <= IFNULL(m.total_sessions, 0)
WHERE IFNULL(m.total_sessions, 0) >= 1
  AND NOT EXISTS (
    SELECT 1
    FROM tmp_seq_dup_occupied o
    WHERE o.mapping_id = m.mapping_id
      AND o.session_sequence = n.n
  );

DROP TEMPORARY TABLE IF EXISTS tmp_seq_dup_loser_plan;
CREATE TEMPORARY TABLE tmp_seq_dup_loser_plan (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NOT NULL,
  current_seq INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  schedule_date DATE NULL,
  start_time TIME NULL,
  total_sessions INT NULL,
  loser_rn INT NOT NULL,
  proposed_next_seq INT NULL,
  plan_status VARCHAR(32) NOT NULL
);

INSERT INTO tmp_seq_dup_loser_plan (
  schedule_id, tenant_id, mapping_id, current_seq, status, schedule_date, start_time,
  total_sessions, loser_rn, proposed_next_seq, plan_status
)
SELECT
  l.schedule_id,
  l.tenant_id,
  l.mapping_id,
  l.session_sequence AS current_seq,
  l.status,
  l.schedule_date,
  l.start_time,
  l.total_sessions,
  l.loser_rn,
  f.free_seq AS proposed_next_seq,
  CASE
    WHEN IFNULL(l.total_sessions, 0) < 1 THEN 'MANUAL_NO_TOTAL'
    WHEN f.free_seq IS NULL THEN 'MANUAL_NO_FREE_SEQ'
    ELSE 'READY'
  END AS plan_status
FROM (
  SELECT
    r.*,
    ROW_NUMBER() OVER (
      PARTITION BY r.mapping_id
      ORDER BY r.status_rank ASC, r.schedule_date ASC, r.start_time ASC, r.schedule_id ASC
    ) AS loser_rn
  FROM tmp_seq_dup_ranked r
  WHERE r.role_code = 'LOSER'
) l
LEFT JOIN tmp_seq_dup_free f
  ON f.mapping_id = l.mapping_id
 AND f.slot_rn = l.loser_rn;

SELECT '=== 3) 패자 제안 next_seq (1..total 중 활성 점유 제외 최저값, 매핑 내 순차 배정) ===' AS section;

SELECT
  p.plan_status,
  p.schedule_id,
  p.tenant_id,
  p.mapping_id,
  p.current_seq,
  p.proposed_next_seq,
  p.status,
  p.schedule_date,
  p.start_time,
  p.total_sessions,
  p.loser_rn
FROM tmp_seq_dup_loser_plan p
ORDER BY p.mapping_id, p.loser_rn;

SELECT '=== 4) 요약 카운트 ===' AS section;

SELECT
  (SELECT COUNT(*) FROM tmp_seq_dup_ranked WHERE role_code = 'WINNER') AS winner_cnt,
  (SELECT COUNT(*) FROM tmp_seq_dup_loser_plan) AS loser_cnt,
  (SELECT COUNT(*) FROM tmp_seq_dup_loser_plan WHERE plan_status = 'READY') AS ready_cnt,
  (SELECT COUNT(*) FROM tmp_seq_dup_loser_plan WHERE plan_status <> 'READY') AS manual_cnt;

SELECT '=== 5) CANCELLED 참고 (이 스크립트는 미변경 — seq NULL 유지 기대) ===' AS section;

SELECT
  s.id AS schedule_id,
  s.tenant_id,
  s.mapping_id,
  s.session_sequence,
  s.status,
  s.date AS schedule_date
FROM schedules s
WHERE TRIM(@tenant_id) <> ''
  AND s.tenant_id = @tenant_id
  AND (@mapping_id = 0 OR s.mapping_id = @mapping_id)
  AND s.status = 'CANCELLED'
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND s.schedule_type = 'CONSULTATION'
  AND s.session_sequence IS NOT NULL
ORDER BY s.mapping_id, s.id
LIMIT 50;

SELECT 'dry-run 완료. apply 전 승자/패자·READY 건을 승인 기록에 첨부할 것.' AS note;
SELECT '후속 일지 링크: scripts/ops/consultation_session_link_repair_dry_run.sql / _apply.sql' AS follow_up;
