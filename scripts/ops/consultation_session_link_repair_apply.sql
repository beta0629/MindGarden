-- 상담일지↔일정 링크 정합 apply (구조적 케이스만)
-- 전제: 워크플로 preamble 가 @client_name, @client_id, @session_date, @slot_a_time, @slot_b_time 설정
-- 변경 컬럼: consultation_id, session_number(=target.session_sequence), updated_at 만
-- 금지: 본문 TEXT overwrite, rem/used, leftover fix-mismatches, mapping 상태 전이
-- apply 전 dry-run 필수 + confirm=CONFIRM
-- 동일 테이블 UPDATE 서브쿼리 금지 → 후보 temp 테이블 경유
-- 내용이 한쪽에만 있고 session_number 로 분리 불가 → 후보 0건(no-op). dry-run 의 MANUAL_CONTENT_SPLIT_REQUIRED 참고
-- 매칭: @client_id(users.id) 우선 → name LIKE → BY_DATE_SLOT 폴백.
-- users.name 평문 LIKE 는 PII 암호문 환경에서 통상 실패.
-- BY_DATE_SLOT: 해당일 slot A·B 각 정확히 1건이고 서로 같은 client_id 일 때만 (하드코딩 금지).
-- collation: users.name(utf8mb4_unicode_ci) vs connection(utf8mb4_0900_ai_ci) LIKE 1267 방지
-- 시간: TIME_FORMAT(start_time) 비교 (TIME(6) 소수초)

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET @client_name = CONVERT(IFNULL(@client_name, '') USING utf8mb4) COLLATE utf8mb4_unicode_ci;
SET @client_id = IFNULL(@client_id, 0);

DROP TABLE IF EXISTS ops_session_link_clients;
CREATE TABLE ops_session_link_clients (
  user_id BIGINT NOT NULL PRIMARY KEY
) ENGINE=MEMORY;

INSERT INTO ops_session_link_clients (user_id)
SELECT u.id
FROM users u
WHERE (@client_id > 0 AND u.id = @client_id)
   OR (
     @client_id <= 0
     AND @client_name <> ''
     AND u.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', @client_name, '%') COLLATE utf8mb4_unicode_ci
   );

INSERT INTO ops_session_link_clients (user_id)
SELECT x.client_id
FROM (
  SELECT DISTINCT s.client_id AS client_id
  FROM schedules s
  WHERE s.date = @session_date
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
    AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (
      TIME_FORMAT(@slot_a_time, '%H:%i:%s'),
      TIME_FORMAT(@slot_b_time, '%H:%i:%s')
    )
) x
WHERE @client_id <= 0
  AND NOT EXISTS (SELECT 1 FROM ops_session_link_clients LIMIT 1)
  AND (
    SELECT COUNT(DISTINCT s2.client_id)
    FROM schedules s2
    WHERE s2.date = @session_date
      AND (s2.is_deleted = 0 OR s2.is_deleted = FALSE)
      AND TIME_FORMAT(s2.start_time, '%H:%i:%s') IN (
        TIME_FORMAT(@slot_a_time, '%H:%i:%s'),
        TIME_FORMAT(@slot_b_time, '%H:%i:%s')
      )
  ) = 1
  AND (
    SELECT COUNT(*)
    FROM schedules sa
    WHERE sa.date = @session_date
      AND (sa.is_deleted = 0 OR sa.is_deleted = FALSE)
      AND TIME_FORMAT(sa.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
  ) = 1
  AND (
    SELECT COUNT(*)
    FROM schedules sb
    WHERE sb.date = @session_date
      AND (sb.is_deleted = 0 OR sb.is_deleted = FALSE)
      AND TIME_FORMAT(sb.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
  ) = 1;

DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates_seen;
DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates;

CREATE TEMPORARY TABLE tmp_cr_session_link_candidates (
  record_id BIGINT NOT NULL PRIMARY KEY,
  from_consultation_id BIGINT NOT NULL,
  to_consultation_id BIGINT NOT NULL,
  to_session_number INT NULL,
  case_code VARCHAR(64) NOT NULL
);

SET @slot_a_id := (
  SELECT s.id FROM schedules s
  INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
  WHERE s.date = @session_date AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  ORDER BY s.id LIMIT 1
);
SET @slot_a_seq := (
  SELECT s.session_sequence FROM schedules s
  WHERE s.id = @slot_a_id
);
SET @slot_b_id := (
  SELECT s.id FROM schedules s
  INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
  WHERE s.date = @session_date AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
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
  @cnt_b AS cnt_b,
  (SELECT COUNT(*) FROM ops_session_link_clients) AS resolved_client_cnt,
  (SELECT user_id FROM ops_session_link_clients ORDER BY user_id LIMIT 1) AS resolved_client_id;

SELECT '=== slot 매칭 진단 (NULL/0 원인) ===' AS section;

SELECT
  (SELECT COUNT(*) FROM ops_session_link_clients) AS resolved_client_cnt,
  (SELECT COUNT(*)
   FROM users u
   WHERE @client_id <= 0
     AND @client_name <> ''
     AND u.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', @client_name, '%') COLLATE utf8mb4_unicode_ci
  ) AS client_name_like_cnt,
  (SELECT COUNT(*)
   FROM users u
   WHERE u.name LIKE '%::%'
     AND CHAR_LENGTH(u.name) >= 24
  ) AS users_pii_enc_pattern_cnt,
  (SELECT COUNT(*)
   FROM schedules s
   INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
   WHERE s.date = @session_date
     AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  ) AS schedules_on_date_for_client_cnt,
  (SELECT COUNT(*)
   FROM schedules s
   INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
   WHERE s.date = @session_date
     AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
  ) AS schedules_on_date_slot_for_client_cnt,
  CASE
    WHEN @client_id <= 0
      AND (SELECT COUNT(*) FROM ops_session_link_clients) = 0
      AND (SELECT COUNT(*) FROM users u WHERE u.name LIKE '%::%' AND CHAR_LENGTH(u.name) >= 24) > 0
      THEN 'users.name PII 암호문 — client_id input 또는 date+slot 유일 client 필요 (후보 0 유지)'
    WHEN @slot_a_id IS NULL AND @slot_b_id IS NULL
      THEN '이름/client_id/날짜/슬롯 매칭 0건 — input 재확인'
    WHEN @slot_a_id IS NULL OR @slot_b_id IS NULL
      THEN '한쪽 슬롯만 매칭 — slot 시간·삭제 여부 확인'
    ELSE 'slot A/B 모두 매칭됨'
  END AS match_hint;

DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates_seen;
CREATE TEMPORARY TABLE tmp_cr_session_link_candidates_seen (
  record_id BIGINT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_cr_session_link_candidates (
  record_id, from_consultation_id, to_consultation_id, to_session_number, case_code
)
SELECT
  cr.id,
  cr.consultation_id,
  @slot_a_id,
  @slot_a_seq,
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

INSERT INTO tmp_cr_session_link_candidates (
  record_id, from_consultation_id, to_consultation_id, to_session_number, case_code
)
SELECT
  cr.id,
  cr.consultation_id,
  @slot_b_id,
  @slot_b_seq,
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

TRUNCATE TABLE tmp_cr_session_link_candidates_seen;
INSERT INTO tmp_cr_session_link_candidates_seen (record_id)
SELECT record_id FROM tmp_cr_session_link_candidates;

INSERT INTO tmp_cr_session_link_candidates (
  record_id, from_consultation_id, to_consultation_id, to_session_number, case_code
)
SELECT
  cr.id,
  cr.consultation_id,
  target.id,
  target.session_sequence,
  'STRUCT_WRONG_CONSULTATION_ID'
FROM consultation_records cr
INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
INNER JOIN schedules wrong ON wrong.id = cr.consultation_id
INNER JOIN schedules target
  ON target.client_id = cr.client_id
 AND target.date = @session_date
 AND target.session_sequence = cr.session_number
 AND TIME_FORMAT(target.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
 AND (target.is_deleted = 0 OR target.is_deleted = FALSE)
WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND cr.session_date = @session_date
  AND cr.session_number IS NOT NULL
  AND wrong.id <> target.id
  AND TIME_FORMAT(wrong.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
  AND (wrong.is_deleted = 0 OR wrong.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM consultation_records x
    WHERE x.consultation_id = target.id
      AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
  )
  AND NOT EXISTS (
    SELECT 1 FROM tmp_cr_session_link_candidates_seen t WHERE t.record_id = cr.id
  );

TRUNCATE TABLE tmp_cr_session_link_candidates_seen;
INSERT INTO tmp_cr_session_link_candidates_seen (record_id)
SELECT record_id FROM tmp_cr_session_link_candidates;

INSERT INTO tmp_cr_session_link_candidates (
  record_id, from_consultation_id, to_consultation_id, to_session_number, case_code
)
SELECT
  cr.id,
  cr.consultation_id,
  s.id,
  s.session_sequence,
  'STRUCT_SESSION_NUMBER_SYNC'
FROM consultation_records cr
INNER JOIN schedules s ON s.id = cr.consultation_id
INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
WHERE s.date = @session_date
  AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND s.session_sequence IS NOT NULL
  AND (
    cr.session_number IS NULL
    OR cr.session_number <> s.session_sequence
  )
  AND NOT (
    (@cnt_a = 0 AND @cnt_b >= 2)
    OR (@cnt_b = 0 AND @cnt_a >= 2)
  )
  AND NOT EXISTS (
    SELECT 1 FROM tmp_cr_session_link_candidates_seen t WHERE t.record_id = cr.id
  );

SELECT '=== apply 후보 ===' AS section;
SELECT * FROM tmp_cr_session_link_candidates ORDER BY record_id;

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
  cr.session_number = c.to_session_number,
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
INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
LEFT JOIN consultation_records cr
  ON cr.consultation_id = s.id
 AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
WHERE s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
GROUP BY s.id, s.start_time, s.session_sequence
ORDER BY s.start_time, s.id;

SELECT COUNT(*) AS candidate_rows FROM tmp_cr_session_link_candidates;
SELECT COUNT(*) AS backup_rows FROM consultation_records_repair_bak_session_link;

DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates_seen;
DROP TEMPORARY TABLE IF EXISTS tmp_cr_session_link_candidates;
DROP TABLE IF EXISTS ops_session_link_clients;
