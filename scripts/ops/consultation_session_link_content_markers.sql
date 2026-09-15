-- 상담일지 본문 「시간·인물 마커」 진단 (읽기 전용 / 본문 텍스트 미출력)
-- 전제: 워크플로 preamble 이 @client_name, @client_id, @session_date, @slot_a_time, @slot_b_time 설정
-- 목적: 한쪽 슬롯 일지에 두 회기(slot A + slot B) 내용이 섞였는지 사람 대신 「토큰 개수」로만 제시
-- 금지: 본문 SELECT 출력(PII), 본문 overwrite, rem/used, leftover fix-mismatches, UPDATE/DELETE 일체
-- 판정은 참고용 힌트 — 최종 남편/본인 귀속은 사람이 UI·상담사 확인으로 결정
-- 매칭: @client_id(users.id) 우선 → name LIKE → BY_DATE_SLOT 폴백 (dry-run 과 동일 규칙, 하드코딩 금지)

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

SELECT '=== D0) 대상 해석 ===' AS section;

SELECT
  @client_id AS client_id_input,
  (SELECT user_id FROM ops_session_link_clients ORDER BY user_id LIMIT 1) AS resolved_client_id,
  (SELECT COUNT(*) FROM ops_session_link_clients) AS resolved_client_cnt,
  @session_date AS session_date,
  @slot_a_time AS slot_a_time,
  @slot_b_time AS slot_b_time;

SELECT '=== D1) 일지별 시간 마커 (본문 미출력 / 토큰 개수만) ===' AS section;

SELECT
  b.record_id,
  b.consultation_id,
  b.slot_label,
  b.session_number,
  b.schedule_seq,
  CHAR_LENGTH(b.blob_text) AS blob_len,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11시', ''))) DIV CHAR_LENGTH('11시') AS cnt_11si,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11:00', ''))) DIV CHAR_LENGTH('11:00') AS cnt_1100,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12시', ''))) DIV CHAR_LENGTH('12시') AS cnt_12si,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12:00', ''))) DIV CHAR_LENGTH('12:00') AS cnt_1200,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '오전', ''))) DIV CHAR_LENGTH('오전') AS cnt_am,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '오후', ''))) DIV CHAR_LENGTH('오후') AS cnt_pm,
  CASE
    WHEN (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11시', ''))) DIV CHAR_LENGTH('11시')
       + (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11:00', ''))) DIV CHAR_LENGTH('11:00') > 0
     AND (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12시', ''))) DIV CHAR_LENGTH('12시')
       + (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12:00', ''))) DIV CHAR_LENGTH('12:00') > 0
      THEN 'TIME_MARKER_BOTH_SLOTS'
    WHEN (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11시', ''))) DIV CHAR_LENGTH('11시')
       + (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '11:00', ''))) DIV CHAR_LENGTH('11:00') > 0
      THEN 'TIME_MARKER_SLOT_A_ONLY'
    WHEN (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12시', ''))) DIV CHAR_LENGTH('12시')
       + (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '12:00', ''))) DIV CHAR_LENGTH('12:00') > 0
      THEN 'TIME_MARKER_SLOT_B_ONLY'
    ELSE 'TIME_MARKER_NONE'
  END AS time_marker_verdict
FROM (
  SELECT
    cr.id AS record_id,
    cr.consultation_id AS consultation_id,
    cr.session_number AS session_number,
    s.session_sequence AS schedule_seq,
    CASE
      WHEN s.start_time IS NULL THEN 'NO_SCHEDULE'
      WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
      WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
      ELSE 'OTHER'
    END AS slot_label,
    CONCAT_WS('\n',
      cr.client_condition, cr.main_issues, cr.intervention_methods, cr.client_response,
      cr.next_session_plan, cr.homework_assigned, cr.risk_factors, cr.progress_evaluation,
      cr.goal_achievement_details, cr.consultant_observations, cr.consultant_assessment,
      cr.special_considerations, cr.family_relationships, cr.social_support,
      cr.environmental_factors, cr.follow_up_actions
    ) AS blob_text
  FROM consultation_records cr
  INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
  LEFT JOIN schedules s ON s.id = cr.consultation_id
  WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
    AND (
      cr.session_date = @session_date
      OR EXISTS (
        SELECT 1 FROM schedules ds
        WHERE ds.id = cr.consultation_id
          AND ds.date = @session_date
          AND (ds.is_deleted = 0 OR ds.is_deleted = FALSE)
      )
    )
) b
ORDER BY b.record_id;

SELECT '=== D2) 일지별 인물·구조 마커 (개수만 / 귀속 판단은 사람) ===' AS section;

SELECT
  b.record_id,
  b.slot_label,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '남편', ''))) DIV CHAR_LENGTH('남편') AS cnt_husband,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '아내', ''))) DIV CHAR_LENGTH('아내') AS cnt_wife,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '본인', ''))) DIV CHAR_LENGTH('본인') AS cnt_self,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '부부', ''))) DIV CHAR_LENGTH('부부') AS cnt_couple,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '회기', ''))) DIV CHAR_LENGTH('회기') AS cnt_session_word,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '\n', ''))) AS cnt_newline,
  (CHAR_LENGTH(b.blob_text) - CHAR_LENGTH(REPLACE(b.blob_text, '\n\n', ''))) DIV 2 AS cnt_blank_block
FROM (
  SELECT
    cr.id AS record_id,
    CASE
      WHEN s.start_time IS NULL THEN 'NO_SCHEDULE'
      WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_a_time, '%H:%i:%s') THEN 'SLOT_A'
      WHEN TIME_FORMAT(s.start_time, '%H:%i:%s') = TIME_FORMAT(@slot_b_time, '%H:%i:%s') THEN 'SLOT_B'
      ELSE 'OTHER'
    END AS slot_label,
    CONCAT_WS('\n',
      cr.client_condition, cr.main_issues, cr.intervention_methods, cr.client_response,
      cr.next_session_plan, cr.homework_assigned, cr.risk_factors, cr.progress_evaluation,
      cr.goal_achievement_details, cr.consultant_observations, cr.consultant_assessment,
      cr.special_considerations, cr.family_relationships, cr.social_support,
      cr.environmental_factors, cr.follow_up_actions
    ) AS blob_text
  FROM consultation_records cr
  INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
  LEFT JOIN schedules s ON s.id = cr.consultation_id
  WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
    AND (
      cr.session_date = @session_date
      OR EXISTS (
        SELECT 1 FROM schedules ds
        WHERE ds.id = cr.consultation_id
          AND ds.date = @session_date
          AND (ds.is_deleted = 0 OR ds.is_deleted = FALSE)
      )
    )
) b
ORDER BY b.record_id;

SELECT '=== D3) 일지별 필드 길이 (수동 분리 시 어느 필드를 나눌지 파악용) ===' AS section;

SELECT
  cr.id AS record_id,
  cr.consultation_id,
  cr.session_number,
  CHAR_LENGTH(IFNULL(cr.client_condition, '')) AS len_client_condition,
  CHAR_LENGTH(IFNULL(cr.main_issues, '')) AS len_main_issues,
  CHAR_LENGTH(IFNULL(cr.intervention_methods, '')) AS len_intervention_methods,
  CHAR_LENGTH(IFNULL(cr.client_response, '')) AS len_client_response,
  CHAR_LENGTH(IFNULL(cr.next_session_plan, '')) AS len_next_session_plan,
  CHAR_LENGTH(IFNULL(cr.progress_evaluation, '')) AS len_progress_evaluation,
  CHAR_LENGTH(IFNULL(cr.consultant_observations, '')) AS len_consultant_observations,
  CHAR_LENGTH(IFNULL(cr.consultant_assessment, '')) AS len_consultant_assessment,
  CHAR_LENGTH(IFNULL(cr.special_considerations, '')) AS len_special_considerations,
  CHAR_LENGTH(IFNULL(cr.family_relationships, '')) AS len_family_relationships
FROM consultation_records cr
INNER JOIN ops_session_link_clients tc ON tc.user_id = cr.client_id
WHERE (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND (
    cr.session_date = @session_date
    OR EXISTS (
      SELECT 1 FROM schedules ds
      WHERE ds.id = cr.consultation_id
        AND ds.date = @session_date
        AND (ds.is_deleted = 0 OR ds.is_deleted = FALSE)
    )
  )
ORDER BY cr.id;

SELECT '=== D4) 권고 조치 (자동 분리 금지 원칙 유지) ===' AS section;

SELECT
  t.slot_a_id,
  t.slot_a_seq,
  t.slot_a_cnt,
  t.slot_b_id,
  t.slot_b_seq,
  t.slot_b_cnt,
  t.mixed_marker_records,
  t.session_number_mismatch_cnt,
  CASE
    WHEN t.slot_a_id IS NULL OR t.slot_b_id IS NULL THEN 'INPUT_RECHECK'
    WHEN t.mixed_marker_records > 0 THEN 'MANUAL_SPLIT_REPORT_ONLY'
    WHEN t.session_number_mismatch_cnt > 0 THEN 'SESSION_NUMBER_SYNC_ONLY'
    ELSE 'NO_STRUCTURAL_ACTION'
  END AS recommended_action,
  CASE
    WHEN t.slot_a_id IS NULL OR t.slot_b_id IS NULL
      THEN 'slot 매칭 실패 — session_date·slot 시간·삭제 여부 확인. apply 금지'
    WHEN t.mixed_marker_records > 0
      THEN '한 일지에 두 슬롯 시간 마커 동시 존재 — 본문 자동 분리·overwrite 금지. 현황만 보고하고 수동 분리'
    WHEN t.session_number_mismatch_cnt > 0
      THEN '시간 마커상 혼재 없음 — session_number=session_sequence 동기화만 안전 (본문·rem/used 미변경)'
    ELSE '링크·회차 모두 정합 — 조치 불필요'
  END AS operator_note
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
    (SELECT COUNT(*) FROM (
      SELECT
        cr.id AS record_id,
        CONCAT_WS('\n',
          cr.client_condition, cr.main_issues, cr.intervention_methods, cr.client_response,
          cr.next_session_plan, cr.homework_assigned, cr.risk_factors, cr.progress_evaluation,
          cr.goal_achievement_details, cr.consultant_observations, cr.consultant_assessment,
          cr.special_considerations, cr.family_relationships, cr.social_support,
          cr.environmental_factors, cr.follow_up_actions
        ) AS blob_text
      FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
      WHERE s.date = @session_date
        AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
        AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
        AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
    ) mb
    WHERE (CHAR_LENGTH(mb.blob_text) - CHAR_LENGTH(REPLACE(mb.blob_text, '11시', ''))) DIV CHAR_LENGTH('11시')
        + (CHAR_LENGTH(mb.blob_text) - CHAR_LENGTH(REPLACE(mb.blob_text, '11:00', ''))) DIV CHAR_LENGTH('11:00') > 0
      AND (CHAR_LENGTH(mb.blob_text) - CHAR_LENGTH(REPLACE(mb.blob_text, '12시', ''))) DIV CHAR_LENGTH('12시')
        + (CHAR_LENGTH(mb.blob_text) - CHAR_LENGTH(REPLACE(mb.blob_text, '12:00', ''))) DIV CHAR_LENGTH('12:00') > 0
    ) AS mixed_marker_records,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN ops_session_link_clients tc ON tc.user_id = s.client_id
     WHERE s.date = @session_date
       AND TIME_FORMAT(s.start_time, '%H:%i:%s') IN (TIME_FORMAT(@slot_a_time, '%H:%i:%s'), TIME_FORMAT(@slot_b_time, '%H:%i:%s'))
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
       AND s.session_sequence IS NOT NULL
       AND (cr.session_number IS NULL OR cr.session_number <> s.session_sequence)) AS session_number_mismatch_cnt
) t;

DROP TABLE IF EXISTS ops_session_link_clients;
