-- =============================================================================
-- 회기 순번(session_sequence) 중복 보정 apply (승인 후 1회)
-- 정책 A (회기 재사용·gap-fill): 패자 schedule만 proposed next_seq 로 UPDATE
-- 변경 컬럼: schedules.session_sequence, schedules.updated_at 만
-- 금지: rem/used, CANCELLED 행, consultation_records rewrite, silent 전면 ROW_NUMBER 재부여,
--       Flyway/CI 자동 실행, 테넌트/매핑/사람이름 하드코딩
-- 전제: dry-run 검수 + @confirm='CONFIRM'
-- 스타일 참고: consultation_session_link_repair_apply.sql
-- =============================================================================
-- 파라미터 (세션 변수)
--   SET @tenant_id = 'YOUR_TENANT_ID';  -- 필수
--   SET @mapping_id = 0;                 -- 0=tenant 전체; >0이면 해당 mapping만 (예: mapping_id=255)
--   SET @dry_run = 0;                    -- apply 는 실제 UPDATE (@dry_run=1 이면 SELECT만)
--   SET @confirm = 'CONFIRM';            -- 필수 승인 토큰 (그 외면 no-op)
-- =============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;

SET @tenant_id = IFNULL(@tenant_id, '');
SET @mapping_id = IFNULL(@mapping_id, 0);
SET @dry_run = IFNULL(@dry_run, 0);
SET @confirm = IFNULL(@confirm, '');

SELECT '=== 0) 파라미터·가드 ===' AS section;

SELECT
  @tenant_id AS tenant_id,
  @mapping_id AS mapping_id_filter,
  @dry_run AS dry_run,
  @confirm AS confirm_token,
  CASE
    WHEN @tenant_id IS NULL OR TRIM(@tenant_id) = '' THEN 'ABORT: @tenant_id 필수'
    WHEN @confirm <> 'CONFIRM' THEN 'ABORT: @confirm=CONFIRM 필요'
    WHEN @dry_run = 1 THEN 'SAFE: dry_run=1 → UPDATE 생략'
    ELSE 'OK: apply 진행'
  END AS param_check;

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_active;
CREATE TEMPORARY TABLE tmp_seq_fix_active (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NOT NULL,
  session_sequence INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  status_rank INT NOT NULL,
  schedule_date DATE NULL,
  start_time TIME NULL,
  total_sessions INT NULL,
  INDEX idx_tmp_seq_fix_map (tenant_id, mapping_id, session_sequence)
);

INSERT INTO tmp_seq_fix_active (
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

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_ranked;
CREATE TEMPORARY TABLE tmp_seq_fix_ranked (
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
  role_code VARCHAR(16) NOT NULL
);

INSERT INTO tmp_seq_fix_ranked (
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
  FROM tmp_seq_fix_active a
  INNER JOIN (
    SELECT tenant_id, mapping_id, session_sequence
    FROM tmp_seq_fix_active
    GROUP BY tenant_id, mapping_id, session_sequence
    HAVING COUNT(*) > 1
  ) d
    ON d.tenant_id = a.tenant_id
   AND d.mapping_id = a.mapping_id
   AND d.session_sequence = a.session_sequence
) x;

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_occupied;
CREATE TEMPORARY TABLE tmp_seq_fix_occupied (
  mapping_id BIGINT NOT NULL,
  session_sequence INT NOT NULL,
  PRIMARY KEY (mapping_id, session_sequence)
);

INSERT INTO tmp_seq_fix_occupied (mapping_id, session_sequence)
SELECT DISTINCT a.mapping_id, a.session_sequence
FROM tmp_seq_fix_active a
WHERE NOT EXISTS (
  SELECT 1
  FROM tmp_seq_fix_ranked r
  WHERE r.schedule_id = a.schedule_id
    AND r.role_code = 'LOSER'
);

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_nums;
CREATE TEMPORARY TABLE tmp_seq_fix_nums (
  n INT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_seq_fix_nums (n)
WITH RECURSIVE nums AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM nums WHERE n < 500
)
SELECT n FROM nums;

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_free;
CREATE TEMPORARY TABLE tmp_seq_fix_free (
  mapping_id BIGINT NOT NULL,
  free_seq INT NOT NULL,
  slot_rn INT NOT NULL,
  PRIMARY KEY (mapping_id, free_seq),
  INDEX idx_tmp_seq_fix_free_rn (mapping_id, slot_rn)
);

INSERT INTO tmp_seq_fix_free (mapping_id, free_seq, slot_rn)
SELECT
  m.mapping_id,
  n.n AS free_seq,
  ROW_NUMBER() OVER (PARTITION BY m.mapping_id ORDER BY n.n ASC) AS slot_rn
FROM (
  SELECT DISTINCT mapping_id, total_sessions
  FROM tmp_seq_fix_ranked
  WHERE role_code = 'LOSER'
) m
INNER JOIN tmp_seq_fix_nums n
  ON n.n <= IFNULL(m.total_sessions, 0)
WHERE IFNULL(m.total_sessions, 0) >= 1
  AND NOT EXISTS (
    SELECT 1
    FROM tmp_seq_fix_occupied o
    WHERE o.mapping_id = m.mapping_id
      AND o.session_sequence = n.n
  );

DROP TEMPORARY TABLE IF EXISTS tmp_seq_fix_plan;
CREATE TEMPORARY TABLE tmp_seq_fix_plan (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NOT NULL,
  current_seq INT NOT NULL,
  proposed_next_seq INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  plan_status VARCHAR(32) NOT NULL
);

INSERT INTO tmp_seq_fix_plan (
  schedule_id, tenant_id, mapping_id, current_seq, proposed_next_seq, status, plan_status
)
SELECT
  l.schedule_id,
  l.tenant_id,
  l.mapping_id,
  l.session_sequence AS current_seq,
  f.free_seq AS proposed_next_seq,
  l.status,
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
  FROM tmp_seq_fix_ranked r
  WHERE r.role_code = 'LOSER'
) l
LEFT JOIN tmp_seq_fix_free f
  ON f.mapping_id = l.mapping_id
 AND f.slot_rn = l.loser_rn
WHERE f.free_seq IS NOT NULL
  AND IFNULL(l.total_sessions, 0) >= 1;

SELECT '=== 1) 적용 전 검증 — 중복 그룹 ===' AS section;

SELECT
  a.tenant_id,
  a.mapping_id,
  a.session_sequence,
  COUNT(*) AS dup_cnt
FROM tmp_seq_fix_active a
GROUP BY a.tenant_id, a.mapping_id, a.session_sequence
HAVING COUNT(*) > 1
ORDER BY a.mapping_id, a.session_sequence;

SELECT '=== 2) 적용 계획 (READY 패자만) ===' AS section;

SELECT
  p.schedule_id,
  p.tenant_id,
  p.mapping_id,
  p.current_seq,
  p.proposed_next_seq,
  p.status,
  p.plan_status
FROM tmp_seq_fix_plan p
WHERE p.plan_status = 'READY'
ORDER BY p.mapping_id, p.schedule_id;

SELECT
  (SELECT COUNT(*) FROM tmp_seq_fix_plan WHERE plan_status = 'READY') AS ready_update_cnt,
  (SELECT COUNT(*) FROM tmp_seq_fix_ranked WHERE role_code = 'LOSER') AS loser_total_cnt;

-- 백업 스냅샷 (idempotent 스키마; 동일 schedule 재삽입 방지)
CREATE TABLE IF NOT EXISTS schedules_session_seq_dup_repair_bak (
  bak_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  repaired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  schedule_id BIGINT NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  mapping_id BIGINT NULL,
  session_sequence_before INT NULL,
  session_sequence_after INT NULL,
  status VARCHAR(32) NULL,
  UNIQUE KEY uk_seq_dup_bak_schedule (schedule_id, repaired_at)
);

-- apply 본체
START TRANSACTION;

INSERT INTO schedules_session_seq_dup_repair_bak (
  schedule_id, tenant_id, mapping_id, session_sequence_before, session_sequence_after, status
)
SELECT
  p.schedule_id,
  p.tenant_id,
  p.mapping_id,
  p.current_seq,
  p.proposed_next_seq,
  p.status
FROM tmp_seq_fix_plan p
WHERE @confirm = 'CONFIRM'
  AND @dry_run = 0
  AND TRIM(@tenant_id) <> ''
  AND p.plan_status = 'READY'
  AND p.tenant_id = @tenant_id;

UPDATE schedules s
INNER JOIN tmp_seq_fix_plan p
  ON p.schedule_id = s.id
 AND p.tenant_id = s.tenant_id
 AND p.plan_status = 'READY'
SET
  s.session_sequence = p.proposed_next_seq,
  s.updated_at = NOW()
WHERE @confirm = 'CONFIRM'
  AND @dry_run = 0
  AND TRIM(@tenant_id) <> ''
  AND s.tenant_id = @tenant_id
  AND (@mapping_id = 0 OR s.mapping_id = @mapping_id)
  AND s.status <> 'CANCELLED'
  AND s.session_sequence = p.current_seq
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND s.schedule_type = 'CONSULTATION';

SELECT ROW_COUNT() AS updated_rows;

COMMIT;

SELECT '=== 3) 적용 후 검증 — 동일 필터 중복 잔존 ===' AS section;

SELECT
  s.tenant_id,
  s.mapping_id,
  s.session_sequence,
  COUNT(*) AS dup_cnt
FROM schedules s
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
  )
GROUP BY s.tenant_id, s.mapping_id, s.session_sequence
HAVING COUNT(*) > 1
ORDER BY s.mapping_id, s.session_sequence;

SELECT '=== 4) 적용된 행 스냅샷 ===' AS section;

SELECT
  b.bak_id,
  b.repaired_at,
  b.schedule_id,
  b.tenant_id,
  b.mapping_id,
  b.session_sequence_before,
  b.session_sequence_after,
  s.session_sequence AS session_sequence_now,
  s.status
FROM schedules_session_seq_dup_repair_bak b
LEFT JOIN schedules s ON s.id = b.schedule_id
WHERE b.tenant_id = @tenant_id
  AND b.repaired_at >= (NOW() - INTERVAL 1 HOUR)
ORDER BY b.bak_id DESC
LIMIT 100;

SELECT 'apply 완료(또는 dry_run/confirm 가드로 no-op). rem/used·일지 링크는 미변경.' AS note;
SELECT '후속 일지 링크: scripts/ops/consultation_session_link_repair_dry_run.sql → _apply.sql' AS follow_up;
