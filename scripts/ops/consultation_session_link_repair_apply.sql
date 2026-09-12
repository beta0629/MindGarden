-- 상담일지↔일정 링크 정합 apply (구조적 케이스만)
-- 전제: 워크플로 preamble 가 @client_name, @session_date, @slot_a_time, @slot_b_time 설정
-- 변경 컬럼: consultation_id, updated_at 만
-- 금지: 본문 TEXT overwrite, rem/used, leftover fix-mismatches, mapping 상태 전이
-- apply 전 dry-run 필수 + confirm=CONFIRM
-- 동일 테이블 UPDATE 서브쿼리 금지 → 후보 temp 테이블 경유

DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates;

CREATE TEMPORARY TABLE tmp_cr_session_link_candidates (
  record_id BIGINT NOT NULL PRIMARY KEY,
  from_consultation_id BIGINT NOT NULL,
  to_consultation_id BIGINT NOT NULL,
  case_code VARCHAR(64) NOT NULL
);

-- Slot 메타 (최대 1행씩)
SET @slot_a_id := (
  SELECT s.id FROM schedules s
  INNER JOIN users u ON u.id = s.client_id
  WHERE u.name LIKE CONCAT('%', @client_name, '%')
    AND s.date = @session_date AND s.start_time = @slot_a_time
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  ORDER BY s.id LIMIT 1
);
SET @slot_a_seq := (
  SELECT s.session_sequence FROM schedules s
  WHERE s.id = @slot_a_id
);
SET @slot_b_id := (
  SELECT s.id FROM schedules s
  INNER JOIN users u ON u.id = s.client_id
  WHERE u.name LIKE CONCAT('%', @client_name, '%')
    AND s.date = @session_date AND s.start_time = @slot_b_time
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  ORDER BY s.id LIMIT 1
);
SET @slot_b_seq := (
  SELECT s.session_sequence FROM schedules s
  WHERE s.id = @slot_b_id
);

SET @cnt_a := (
  SELECT COUNT(*) FROM consultation_records x
  WHERE x.consultation_id = @slot_a_id
    AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
);
SET @cnt_b := (
  SELECT COUNT(*) FROM consultation_records x
  WHERE x.consultation_id = @slot_b_id
    AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
);

SELECT
  @slot_a_id AS slot_a_id,
  @slot_a_seq AS slot_a_seq,
  @cnt_a AS cnt_a,
  @slot_b_id AS slot_b_id,
  @slot_b_seq AS slot_b_seq,
  @cnt_b AS cnt_b;

-- STRUCT A: B에 2건·A에 0건 → session_number=A.seq 인 행을 A로
INSERT INTO tmp_cr_session_link_candidates (record_id, from_consultation_id, to_consultation_id, case_code)
SELECT
  cr.id,
  cr.consultation_id,
  @slot_a_id,
  'STRUCT_ORPHAN_DOUBLE_B_TO_A'
FROM consultation_records cr
WHERE @slot_a_id IS NOT NULL
  AND @slot_b_id IS NOT NULL
  AND @slot_a_seq IS NOT NULL
  AND @slot_b_seq IS NOT NULL
  AND @slot_a_seq <> @slot_b_seq
  AND @cnt_a = 0
  AND @cnt_b = 2
  AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND cr.consultation_id = @slot_b_id
  AND cr.session_number = @slot_a_seq;

-- STRUCT A 대칭: A에 2건·B에 0건 → session_number=B.seq 인 행을 B로
INSERT INTO tmp_cr_session_link_candidates (record_id, from_consultation_id, to_consultation_id, case_code)
SELECT
  cr.id,
  cr.consultation_id,
  @slot_b_id,
  'STRUCT_ORPHAN_DOUBLE_A_TO_B'
FROM consultation_records cr
WHERE @slot_a_id IS NOT NULL
  AND @slot_b_id IS NOT NULL
  AND @slot_a_seq IS NOT NULL
  AND @slot_b_seq IS NOT NULL
  AND @slot_a_seq <> @slot_b_seq
  AND @cnt_b = 0
  AND @cnt_a = 2
  AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND cr.consultation_id = @slot_a_id
  AND cr.session_number = @slot_b_seq;

-- STRUCT B: session_number 는 올바른 slot seq 와 일치하나 consultation_id 가 다른 slot
INSERT INTO tmp_cr_session_link_candidates (record_id, from_consultation_id, to_consultation_id, case_code)
SELECT
  cr.id,
  cr.consultation_id,
  target.id,
  'STRUCT_WRONG_CONSULTATION_ID'
FROM consultation_records cr
INNER JOIN users u ON u.id = cr.client_id
INNER JOIN schedules wrong ON wrong.id = cr.consultation_id
INNER JOIN schedules target
  ON target.client_id = cr.client_id
 AND target.date = @session_date
 AND target.session_sequence = cr.session_number
 AND target.start_time IN (@slot_a_time, @slot_b_time)
 AND (target.is_deleted = 0 OR target.is_deleted = FALSE)
WHERE u.name LIKE CONCAT('%', @client_name, '%')
  AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND cr.session_date = @session_date
  AND cr.session_number IS NOT NULL
  AND wrong.id <> target.id
  AND wrong.start_time IN (@slot_a_time, @slot_b_time)
  AND (wrong.is_deleted = 0 OR wrong.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM consultation_records x
    WHERE x.consultation_id = target.id
      AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
  )
  AND NOT EXISTS (
    SELECT 1 FROM tmp_cr_session_link_candidates t WHERE t.record_id = cr.id
  );

SELECT '=== apply 후보 ===' AS section;
SELECT * FROM tmp_cr_session_link_candidates ORDER BY record_id;

-- 후보 0건이면 본문/불확실 케이스 — no-op (안전)
-- 백업 테이블
CREATE TABLE IF NOT EXISTS consultation_records_repair_bak_session_link AS
SELECT cr.*
FROM consultation_records cr
WHERE 1 = 0;

INSERT INTO consultation_records_repair_bak_session_link
SELECT cr.*
FROM consultation_records cr
INNER JOIN tmp_cr_session_link_candidates c ON c.record_id = cr.id
WHERE NOT EXISTS (
  SELECT 1 FROM consultation_records_repair_bak_session_link b WHERE b.id = cr.id
);

UPDATE consultation_records cr
INNER JOIN tmp_cr_session_link_candidates c ON c.record_id = cr.id
SET
  cr.consultation_id = c.to_consultation_id,
  cr.updated_at = NOW();

SELECT '=== apply 후 일정별 일지 건수 ===' AS section;

SELECT
  s.id AS schedule_id,
  s.start_time,
  s.session_sequence,
  COUNT(cr.id) AS record_count,
  GROUP_CONCAT(cr.id ORDER BY cr.id) AS record_ids,
  GROUP_CONCAT(cr.session_number ORDER BY cr.id) AS record_session_numbers
FROM schedules s
INNER JOIN users u ON u.id = s.client_id
LEFT JOIN consultation_records cr
  ON cr.consultation_id = s.id
 AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
WHERE u.name LIKE CONCAT('%', @client_name, '%')
  AND s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND s.start_time IN (@slot_a_time, @slot_b_time)
GROUP BY s.id, s.start_time, s.session_sequence
ORDER BY s.start_time, s.id;

SELECT COUNT(*) AS candidate_rows FROM tmp_cr_session_link_candidates;
SELECT COUNT(*) AS backup_rows FROM consultation_records_repair_bak_session_link;

DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates;
