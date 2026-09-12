-- 상담일지↔일정 링크 정합 dry-run (읽기 전용)
-- 전제: 워크플로 preamble 가 @client_name, @session_date, @slot_a_time, @slot_b_time 설정
-- 금지: rem/used 변경, leftover fix-mismatches, 본문(TEXT) overwrite
-- 목적: 11시/12시 일정·일지 링크 상태와 구조적 케이스만 보고

SELECT '=== 1) 내담자 후보 (이름 마스킹) ===' AS section;

SELECT
  u.id AS user_id,
  u.tenant_id,
  u.role,
  CONCAT(LEFT(IFNULL(u.name, ''), 1), '**') AS name_masked,
  u.is_deleted
FROM users u
WHERE u.name LIKE CONCAT('%', @client_name, '%')
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
    WHEN s.start_time = @slot_a_time THEN 'SLOT_A'
    WHEN s.start_time = @slot_b_time THEN 'SLOT_B'
    ELSE 'OTHER'
  END AS slot_label
FROM schedules s
INNER JOIN users u ON u.id = s.client_id
WHERE u.name LIKE CONCAT('%', @client_name, '%')
  AND s.date = @session_date
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
  AND s.start_time IN (@slot_a_time, @slot_b_time)
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
    WHEN s.start_time = @slot_a_time THEN 'SLOT_A'
    WHEN s.start_time = @slot_b_time THEN 'SLOT_B'
    ELSE 'OTHER_OR_MISSING_SCHEDULE'
  END AS linked_slot,
  CHAR_LENGTH(IFNULL(cr.client_condition, '')) AS len_client_condition,
  CHAR_LENGTH(IFNULL(cr.main_issues, '')) AS len_main_issues,
  CHAR_LENGTH(IFNULL(cr.intervention_methods, '')) AS len_intervention,
  CHAR_LENGTH(IFNULL(cr.consultant_observations, '')) AS len_observations
FROM consultation_records cr
INNER JOIN users u ON u.id = cr.client_id
LEFT JOIN schedules s ON s.id = cr.consultation_id
WHERE u.name LIKE CONCAT('%', @client_name, '%')
  AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)
  AND (
    cr.session_date = @session_date
    OR cr.consultation_id IN (
      SELECT s2.id
      FROM schedules s2
      INNER JOIN users u2 ON u2.id = s2.client_id
      WHERE u2.name LIKE CONCAT('%', @client_name, '%')
        AND s2.date = @session_date
        AND s2.start_time IN (@slot_a_time, @slot_b_time)
        AND (s2.is_deleted = 0 OR s2.is_deleted = FALSE)
    )
  )
ORDER BY cr.session_date, cr.session_number, cr.id;

SELECT '=== 4) 일정별 일지 건수 (구조 판별용) ===' AS section;

SELECT
  s.id AS schedule_id,
  s.start_time,
  s.session_sequence,
  CASE
    WHEN s.start_time = @slot_a_time THEN 'SLOT_A'
    WHEN s.start_time = @slot_b_time THEN 'SLOT_B'
    ELSE 'OTHER'
  END AS slot_label,
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

SELECT '=== 5) 구조적 케이스 분류 (apply 후보 / 수동만) ===' AS section;

SELECT
  CASE
    WHEN slot_a_cnt = 1 AND slot_b_cnt = 1 THEN 'LINK_OK_OR_CONTENT_CHECK'
    WHEN (slot_a_cnt = 0 AND slot_b_cnt = 2)
      OR (slot_a_cnt = 2 AND slot_b_cnt = 0) THEN 'STRUCT_ORPHAN_DOUBLE_SAFE_CANDIDATE'
    WHEN wrong_link_cnt > 0 THEN 'STRUCT_WRONG_CONSULTATION_ID_CANDIDATE'
    WHEN slot_a_cnt + slot_b_cnt = 0 THEN 'NO_RECORDS'
    ELSE 'AMBIGUOUS_MANUAL_ONLY'
  END AS case_code,
  slot_a_id,
  slot_a_seq,
  slot_a_cnt,
  slot_b_id,
  slot_b_seq,
  slot_b_cnt,
  wrong_link_cnt,
  '본문(남편/본인) 자동 판별 금지 — dry-run 길이·링크만 확인 후 수동 CONFIRM' AS note
FROM (
  SELECT
    (SELECT s.id FROM schedules s
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_a_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_a_id,
    (SELECT s.session_sequence FROM schedules s
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_a_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_a_seq,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_a_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)) AS slot_a_cnt,
    (SELECT s.id FROM schedules s
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_b_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_b_id,
    (SELECT s.session_sequence FROM schedules s
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_b_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
     ORDER BY s.id LIMIT 1) AS slot_b_seq,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN schedules s ON s.id = cr.consultation_id
      INNER JOIN users u ON u.id = s.client_id
     WHERE u.name LIKE CONCAT('%', @client_name, '%')
       AND s.date = @session_date
       AND s.start_time = @slot_b_time
       AND (s.is_deleted = 0 OR s.is_deleted = FALSE)
       AND (cr.is_deleted = 0 OR cr.is_deleted = FALSE)) AS slot_b_cnt,
    (SELECT COUNT(*) FROM consultation_records cr
      INNER JOIN users u ON u.id = cr.client_id
      INNER JOIN schedules linked ON linked.id = cr.consultation_id
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
       AND linked.id <> target.id
       AND linked.start_time IN (@slot_a_time, @slot_b_time)) AS wrong_link_cnt
) t;

SELECT '=== 6) 수동 CONFIRM 체크리스트 ===' AS section;

SELECT checklist_item FROM (
  SELECT 1 AS ord, 'dry-run section 2~4 에서 SLOT_A(기본 11:00)=남편·SLOT_B(기본 12:00)=본인 인지 사람이 확인' AS checklist_item
  UNION ALL
  SELECT 2, '본문 길이만 보고 남편/본인 추정하지 말 것 — 필요 시 UI/상담사 확인'
  UNION ALL
  SELECT 3, 'case_code 가 STRUCT_*_CANDIDATE 일 때만 apply + confirm=CONFIRM 검토'
  UNION ALL
  SELECT 4, 'AMBIGUOUS_MANUAL_ONLY / LINK_OK_OR_CONTENT_CHECK 는 apply 자동 금지'
  UNION ALL
  SELECT 5, 'rem/used·mapping leftover·fix-mismatches 절대 실행하지 말 것'
) c
ORDER BY ord;
