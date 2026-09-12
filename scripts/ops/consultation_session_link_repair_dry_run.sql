-- 상담일지↔일정 링크 정합 dry-run (읽기 전용)
-- 전제: 워크플로 preamble 가 @client_name, @client_id, @session_date, @slot_a_time, @slot_b_time 설정
-- 금지: rem/used 변경, leftover fix-mismatches, 본문(TEXT) overwrite
-- 목적: 11시/12시 일정·일지 링크 상태와 구조적 케이스만 보고
-- 매칭: @client_id(users.id) 우선 → name LIKE → BY_DATE_SLOT 폴백.
-- users.name 은 PersonalNameAttributeConverter(AES keyId::…) 암호문이라
-- 평문 LIKE('%이름%') 로는 통상 0건. PII 환경에서는 date+slot 유일 client 폴백 또는 client_id input.
-- BY_DATE_SLOT: 해당일 slot A·B 각 정확히 1건이고 서로 같은 client_id 일 때만 자동 해석 (하드코딩 금지).
-- collation: users.name(utf8mb4_unicode_ci) vs connection(utf8mb4_0900_ai_ci) LIKE 1267 방지
-- 시간: schedules.start_time 은 TIME(6) → TIME_FORMAT('%H:%i:%s') 비교로 소수초 무시

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

-- PII name LIKE 실패 시: date + slot A/B 유일·동일 client_id 이면 폴백 (input 하드코딩 없음)
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

SET @match_mode := CASE
  WHEN @client_id > 0 THEN 'BY_CLIENT_ID'
  WHEN EXISTS (
    SELECT 1 FROM users u
    WHERE @client_name <> ''
      AND u.name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', @client_name, '%') COLLATE utf8mb4_unicode_ci
    LIMIT 1
  ) THEN 'BY_CLIENT_NAME_LIKE'
  WHEN (SELECT COUNT(*) FROM ops_session_link_clients) > 0 THEN 'BY_DATE_SLOT'
  WHEN @client_name <> '' THEN 'BY_CLIENT_NAME_LIKE'
  ELSE 'NO_MATCH_KEY'
END;

-- 해당일 A/B slot schedule id 스냅샷 (같은 TEMP 재참조 1137 회피)
DROP TABLE IF EXISTS ops_session_link_day_slots;
CREATE TABLE ops_session_link_day_slots (
  schedule_id BIGINT NOT NULL PRIMARY KEY,
  start_time TIME NOT NULL,
  session_sequence INT NULL
) ENGINE=MEMORY;

INSERT INTO ops_session_link_day_slots (schedule_id, start_time, session_sequence)
SELECT s.id, s.start_time, s.session_sequence
FROM schedules s
INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
WHERE s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'));

SET @dr_cnt_a := (
  SELECT COUNT(*) FROM consultation_records cr
  INNER JOIN ops_session_link_day_slots ds ON ds.schedule_id = cr.consultation_id
  WHERE TIME_FORMAT(ds.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
    AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
);
SET @dr_cnt_b := (
  SELECT COUNT(*) FROM consultation_records cr
  INNER JOIN ops_session_link_day_slots ds ON ds.schedule_id = cr.consultation_id
  WHERE TIME_FORMAT(ds.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
    AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
);

SELECT '=== 0) 입력·매칭 모드 ===' AS section;

SELECT
  @match_mode AS match_mode,
  @client_id AS client_id_input,
  (SELECT user_id FROM ops_session_link_clients ORDER BY user_id LIMIT 1) AS resolved_client_id,
  CHAR_LENGTH(@client_name) AS client_name_char_len,
  @session_date AS session_date,
  @slot_a_time AS slot_a_time,
  @slot_b_time AS slot_b_time,
  (SELECT COUNT(*) FROM ops_session_link_clients) AS resolved_client_cnt;

SELECT '=== 1) 내담자 후보 (이름 마스킹 / PII 암호문 표기) ===' AS section;

SELECT
  u.id AS user_id,
  u.tenant_id,
  u.role,
  CASE
    WHEN u.name LIKE '%::%' AND CHAR_LENGTH(u.name) >= 24
      THEN CONCAT('id=', u.id, ' (PII_ENC)')
    ELSE CONCAT(LEFT(IFNULL(u.name, ''), 1), '**')
  END AS name_masked,
  u.is_deleted
FROM users u
INNER JOIN ops_session_link_clients tc ON tc.user_id = u.id
LIMIT 20;

SELECT '=== 2) 해당일 slot A/B 일정 ===' AS section;

SELECT
  s.id AS schedule_id,
  s.tenant_id,
  s.client_id,
  s.consultant_id,
  s.date AS schedule_date,
  s.start_time,
  s.end_time,
  s.status,
  s.session_sequence,
  s.mapping_id,
  s.is_deleted,
  CASE
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
    ELSE 'OTHER'
  END AS slot_label
FROM schedules s
INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
WHERE s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
ORDER BY s.start_time, s.id;

SELECT '=== 3) 해당일·해당 일정에 연결된 consultation_records ===' AS section;

SELECT
  cr.id AS record_id,
  cr.tenant_id,
  cr.consultation_id,
  cr.client_id,
  cr.consultant_id,
  cr.session_number,
  cr.session_date,
  cr.is_deleted,
  cr.created_at,
  cr.updated_at,
  s.start_time AS linked_schedule_start,
  s.session_sequence AS linked_schedule_seq,
  CASE
    WHEN s.start_time IS NOT NULL AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
    WHEN s.start_time IS NOT NULL AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
    ELSE 'OTHER_OR_MISSING_SCHEDULE'
  END AS linked_slot,
  CHAR_LENGTH(IFNULL(cr.client_condition, '')) AS len_client_condition,
  CHAR_LENGTH(IFNULL(cr.main_issues, '')) AS len_main_issues,
  CHAR_LENGTH(IFNULL(cr.intervention_methods, '')) AS len_intervention,
  CHAR_LENGTH(IFNULL(cr.consultant_observations, '')) AS len_observations
FROM consultation_records cr
INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
LEFT JOIN schedules s ON s.id = cr.consultation_id
WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND (
    cr.session_date = @session_date
    OR cr.consultation_id IN (SELECT ds.schedule_id FROM ops_session_link_day_slots ds)
  )
ORDER BY cr.session_date, cr.session_number, cr.id;

SELECT '=== 4) 일정별 일지 건수 (구조 판별용) ===' AS section;

SELECT
  s.id AS schedule_id,
  s.start_time,
  s.session_sequence,
  CASE
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
    ELSE 'OTHER'
  END AS slot_label,
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

SELECT '=== 4b) slot 매칭 진단 (NULL/0 / PII / 날짜·시간) ===' AS section;

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
  (SELECT COUNT(*) FROM ops_session_link_day_slots) AS schedules_on_date_slot_for_client_cnt,
  (SELECT COUNT(*)
   FROM schedules s
   WHERE s.date = @session_date
     AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  ) AS schedules_on_date_any_client_cnt,
  (SELECT COUNT(*)
   FROM schedules s
   WHERE s.date = @session_date
     AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
  ) AS slot_a_any_client_cnt,
  (SELECT COUNT(*)
   FROM schedules s
   WHERE s.date = @session_date
     AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
  ) AS slot_b_any_client_cnt,
  CASE
    WHEN @match_mode = 'BY_DATE_SLOT'
      THEN 'PII name LIKE 실패 → date+slot A/B 유일·동일 client 폴백으로 해석됨'
    WHEN @client_id <= 0
      AND (SELECT COUNT(*) FROM ops_session_link_clients) = 0
      AND (SELECT COUNT(*) FROM users u WHERE u.name LIKE '%::%' AND CHAR_LENGTH(u.name) >= 24) > 0
      THEN 'users.name PII 암호문(keyId::…) — client_id input 또는 date+slot 유일 client 필요'
    WHEN (SELECT COUNT(*) FROM ops_session_link_clients) = 0
      THEN '내담자 미해석 — client_id 또는 date+slot 유일성(서로 다른 client면 폴백 불가) 확인'
    WHEN (SELECT COUNT(*) FROM ops_session_link_day_slots) = 0
      AND (
        SELECT COUNT(*)
        FROM schedules s
        INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
        WHERE s.date = @session_date
          AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
      ) > 0
      THEN '해당일 일정은 있으나 slot 시간 불일치 — start_time·HH:MM:SS 재확인 (아래 해당일 일정)'
    WHEN (
      SELECT COUNT(*)
      FROM schedules s
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
      WHERE s.date = @session_date
        AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
    ) = 0
      THEN '해석된 client 에 해당일 일정 0건 — session_date·테넌트·삭제 여부 확인'
    ELSE 'slot A/B 일정 매칭됨 (section 2 참고)'
  END AS match_hint;

SELECT
  s.id AS schedule_id,
  s.client_id,
  s.start_time,
  TIME_FORMAT(s.start_time, '%H:%i:%s') AS start_time_hms,
  s.status,
  s.is_deleted
FROM schedules s
INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
WHERE s.date = @session_date
ORDER BY s.start_time, s.id
LIMIT 20;

SELECT '=== 4c) 해당일 slot A/B 일정 (client 미해석이어도 표시 — client_id 확보용) ===' AS section;

SELECT
  s.id AS schedule_id,
  s.client_id,
  s.consultant_id,
  s.start_time,
  TIME_FORMAT(s.start_time, '%H:%i:%s') AS start_time_hms,
  s.session_sequence,
  s.status,
  s.mapping_id,
  CASE
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
    WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
    ELSE 'OTHER'
  END AS slot_label
FROM schedules s
WHERE s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (
    TIME_FORMAT(@slot_a_time, '%H:%i:%s'),
    TIME_FORMAT(@slot_b_time, '%H:%i:%s')
  )
ORDER BY s.start_time, s.id;

SELECT '=== 5) 구조적 케이스 분류 (apply 후보 / 수동만) ===' AS section;

SELECT
  CASE
    WHEN slot_a_cnt = 1 AND slot_b_cnt = 1
      AND session_number_mismatch_cnt = 0 THEN 'LINK_OK_OR_CONTENT_CHECK'
    WHEN slot_a_cnt = 1 AND slot_b_cnt = 1
      AND session_number_mismatch_cnt > 0 THEN 'STRUCT_SESSION_NUMBER_SYNC_CANDIDATE'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt = 2 AND orphan_match_cnt = 1)
      OR (slot_a_cnt = 2 AND slot_b_cnt = 0 AND orphan_match_cnt = 1)
      THEN 'STRUCT_ORPHAN_DOUBLE_SAFE_CANDIDATE'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt >= 2)
      OR (slot_b_cnt = 0 AND slot_a_cnt >= 2)
      THEN 'MANUAL_CONTENT_SPLIT_REQUIRED'
    WHEN wrong_link_cnt > 0 THEN 'STRUCT_WRONG_CONSULTATION_ID_CANDIDATE'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt = 1)
      OR (slot_b_cnt = 0 AND slot_a_cnt = 1)
      THEN 'MANUAL_CONTENT_SPLIT_REQUIRED'
    WHEN slot_a_cnt + slot_b_cnt = 0 THEN 'NO_RECORDS'
    ELSE 'AMBIGUOUS_MANUAL_ONLY'
  END AS case_code,
  CASE
    WHEN (SELECT COUNT(*) FROM ops_session_link_clients) = 0
      THEN '내담자 미해석(PII 암호문 name LIKE 실패 가능) — client_id 로 dry-run 재실행. apply 금지'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt >= 1 AND orphan_match_cnt <> 1)
      OR (slot_b_cnt = 0 AND slot_a_cnt >= 1 AND orphan_match_cnt <> 1)
      THEN '수동 내용 분리 필요 — 본문(남편/본인) 자동 추정·overwrite 금지. apply는 링크/회차만(가능 시)'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt = 2 AND orphan_match_cnt = 1)
      OR (slot_a_cnt = 2 AND slot_b_cnt = 0 AND orphan_match_cnt = 1)
      THEN '구조적 이동 가능(session_number=상대 slot seq). 본문 TEXT 미변경'
    WHEN wrong_link_cnt > 0
      THEN 'consultation_id 만 올바른 schedule.id 로 연결 + session_number=session_sequence'
    WHEN session_number_mismatch_cnt > 0 AND slot_a_cnt = 1 AND slot_b_cnt = 1
      THEN '링크는 맞음 — session_number 를 session_sequence 에 맞춤만'
    ELSE '본문(남편/본인) 자동 판별 금지 — dry-run 길이·링크만 확인 후 수동 CONFIRM'
  END AS operator_note,
  slot_a_id,
  slot_a_seq,
  slot_a_cnt,
  slot_b_id,
  slot_b_seq,
  slot_b_cnt,
  wrong_link_cnt,
  orphan_match_cnt,
  session_number_mismatch_cnt
FROM (
  SELECT
    (SELECT s.id FROM schedules s
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_a_id,
    (SELECT s.session_sequence FROM schedules s
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_a_seq,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)) AS slot_a_cnt,
    (SELECT s.id FROM schedules s
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_b_id,
    (SELECT s.session_sequence FROM schedules s
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_b_seq,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s')
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)) AS slot_b_cnt,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
      INNER JOIN schedules linked ON linked.id = cr.consultation_id
      INNER JOIN schedules target
        ON target.client_id = cr.client_id
       AND target.date = @session_date
       AND target.session_sequence = cr.session_number
       AND TIME_FORMAT(target.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
       AND (target.is_deleted = 0 OR target.is_deleted = FALSE)
     WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
       AND cr.session_date = @session_date
       AND cr.session_number IS NOT NULL
       AND linked.id <> target.id
       AND TIME_FORMAT(linked.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))) AS wrong_link_cnt,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
      INNER JOIN schedules empty_slot
        ON empty_slot.client_id = s.client_id
       AND empty_slot.date = @session_date
       AND TIME_FORMAT(empty_slot.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
       AND TIME_FORMAT(empty_slot.start_time, '%H:%i:%s') <> TIME_FORMAT(s.start_time, '%H:%i:%s')
       AND (empty_slot.is_deleted = 0 OR empty_slot.is_deleted = FALSE)
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
       AND cr.session_number = empty_slot.session_sequence
       AND NOT EXISTS (
         SELECT 1 FROM consultation_records x
         WHERE x.consultation_id = empty_slot.id
           AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
       )) AS orphan_match_cnt,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
       AND (
         cr.session_number IS NULL
         OR cr.session_number <> s.session_sequence
       )) AS session_number_mismatch_cnt
) t;

SELECT '=== 5b) apply 미리보기 후보 (읽기 전용 — 실제 UPDATE 없음) ===' AS section;

SELECT * FROM (
  SELECT
    cr.id AS record_id,
    cr.consultation_id AS from_consultation_id,
    target.id AS to_consultation_id,
    cr.session_number AS from_session_number,
    target.session_sequence AS to_session_number,
    'STRUCT_WRONG_LINK_PREVIEW' AS case_code
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
  UNION ALL
  SELECT
    cr.id AS record_id,
    cr.consultation_id AS from_consultation_id,
    empty_slot.id AS to_consultation_id,
    cr.session_number AS from_session_number,
    empty_slot.session_sequence AS to_session_number,
    'STRUCT_ORPHAN_PREVIEW' AS case_code
  FROM consultation_records cr
  INNER JOIN schedules s ON s.id = cr.consultation_id
  INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
  INNER JOIN schedules empty_slot
    ON empty_slot.client_id = s.client_id
   AND empty_slot.date = @session_date
   AND TIME_FORMAT(empty_slot.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
   AND TIME_FORMAT(empty_slot.start_time, '%H:%i:%s') <> TIME_FORMAT(s.start_time, '%H:%i:%s')
   AND (empty_slot.is_deleted = 0 OR empty_slot.is_deleted = FALSE)
  WHERE s.date = @session_date
    AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
    AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
    AND cr.session_number = empty_slot.session_sequence
    AND NOT EXISTS (
      SELECT 1 FROM consultation_records x
      WHERE x.consultation_id = empty_slot.id
        AND (x.is_deleted = 0 OR x.is_deleted = FALSE)
    )
  UNION ALL
  SELECT
    cr.id AS record_id,
    cr.consultation_id AS from_consultation_id,
    s.id AS to_consultation_id,
    cr.session_number AS from_session_number,
    s.session_sequence AS to_session_number,
    'SESSION_NUMBER_SYNC_PREVIEW' AS case_code
  FROM consultation_records cr
  INNER JOIN schedules s ON s.id = cr.consultation_id
  INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
  WHERE s.date = @session_date
    AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
    AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
    AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
    AND (
      cr.session_number IS NULL
      OR cr.session_number <> s.session_sequence
    )
    AND NOT (
      (@dr_cnt_a = 0 AND @dr_cnt_b >= 2)
      OR (@dr_cnt_b = 0 AND @dr_cnt_a >= 2)
    )
) preview
ORDER BY record_id;

SELECT '=== 6) 수동 CONFIRM 체크리스트 ===' AS section;

SELECT checklist_item FROM (
  SELECT 1 AS ord, 'PII 환경: client_id input 또는 BY_DATE_SLOT(date+slot A/B 유일·동일 client) — name LIKE 만으로 NO_RECORDS 가능' AS checklist_item
  UNION ALL
  SELECT 2, 'dry-run section 2~4·4c 에서 SLOT_A(기본 11:00)=남편·SLOT_B(기본 12:00)=본인 인지 사람이 확인'
  UNION ALL
  SELECT 3, '본문 길이만 보고 남편/본인 추정하지 말 것 — 필요 시 UI/상담사 확인'
  UNION ALL
  SELECT 4, 'case_code=MANUAL_CONTENT_SPLIT_REQUIRED 이면 「수동 내용 분리 필요」 — apply는 링크/회차만'
  UNION ALL
  SELECT 5, 'case_code 가 STRUCT_*_CANDIDATE 일 때만 apply + confirm=CONFIRM 검토'
  UNION ALL
  SELECT 6, 'AMBIGUOUS_MANUAL_ONLY / LINK_OK_OR_CONTENT_CHECK / NO_RECORDS(미해석) 는 apply 자동 금지'
  UNION ALL
  SELECT 7, 'rem/used·mapping leftover·fix-mismatches 절대 실행하지 말 것'
) c
ORDER BY ord;

DROP TABLE IF EXISTS ops_session_link_day_slots;
DROP TABLE IF EXISTS ops_session_link_clients;
