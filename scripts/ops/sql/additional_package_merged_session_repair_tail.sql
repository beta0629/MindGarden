-- 추가 패키지 병합 회기 보정 본문.
-- 러너가 같은 세션에서 먼저 연다:
--   START TRANSACTION
--   repair_allowlist 잠금 조회
--   CREATE TEMPORARY TABLE tmp_plan AS <목록 SELECT>
-- 이 파일에는 COMMIT 과 ROLLBACK 을 두지 않는다. 러너가 마지막에 하나만 붙인다.
-- 베이스 테이블 변경은 consultant_client_mappings 의 used/remaining/version/updated_at
-- 과 schedules 의 mapping_id/session_sequence/version/updated_at 뿐이다.
-- status, end_date, 메모 본문, 전표 테이블은 바꾸지 않는다.
--
-- 기대 순번은 허용 목록만 옮긴다는 가정으로 정책 A 를 다시 계산한다.
-- 목록 SELECT 의 expected_session_sequence 는 어긋난 일정을 전부 옮길 때의 값이다.
-- 허용 목록이 그 타깃의 어긋난 일정 전부이면 두 순번은 같아야 한다.

CREATE TEMPORARY TABLE tmp_apply AS
SELECT
    p.tenant_id,
    p.additional_mapping_id,
    p.target_mapping_id,
    p.additional_sessions,
    p.target_total_sessions,
    p.target_used_sessions,
    p.target_remaining_sessions,
    p.target_status,
    p.target_version,
    p.consuming_schedule_count,
    p.same_target_schedule_count,
    p.target_expected_used_sessions,
    p.target_expected_remaining_sessions,
    p.target_expected_used_if_same_target_all,
    p.target_expected_remaining_if_same_target_all,
    p.schedule_id,
    p.schedule_status,
    p.schedule_date,
    p.schedule_start_time,
    p.schedule_session_sequence,
    p.expected_session_sequence AS list_expected_session_sequence,
    p.schedule_version,
    p.schedule_mapping_id,
    p.plan_status,
    p.merged_at,
    p.labeled_by_mapping_id,
    ROW_NUMBER() OVER (
        PARTITION BY p.tenant_id, p.target_mapping_id
        ORDER BY p.schedule_date, p.schedule_start_time, p.schedule_id
    ) AS apply_rank
FROM tmp_plan p
INNER JOIN repair_allowlist a
    ON a.additional_mapping_id = p.additional_mapping_id
   AND a.schedule_id = p.schedule_id;

CREATE TEMPORARY TABLE tmp_apply_ids AS
SELECT tenant_id, target_mapping_id, schedule_id
FROM tmp_apply;

CREATE TEMPORARY TABLE tmp_apply_targets AS
SELECT DISTINCT tenant_id, target_mapping_id
FROM tmp_apply_ids;

CREATE TEMPORARY TABLE tmp_nums (
    seq_n INT NOT NULL PRIMARY KEY
);

INSERT INTO tmp_nums (seq_n)
WITH RECURSIVE n AS (
    SELECT 1 AS seq_n
    UNION ALL
    SELECT seq_n + 1 FROM n WHERE seq_n < 1000
)
SELECT seq_n FROM n;

CREATE TEMPORARY TABLE tmp_occupied AS
SELECT DISTINCT
    s.tenant_id,
    k.target_mapping_id,
    s.session_sequence
FROM schedules s
INNER JOIN tmp_apply_targets k
    ON k.tenant_id = s.tenant_id
   AND (s.mapping_id = k.target_mapping_id OR s.mapping_id IS NULL)
INNER JOIN consultant_client_mappings t
    ON t.tenant_id = k.tenant_id
   AND t.id = k.target_mapping_id
   AND (t.is_deleted = 0 OR t.is_deleted = FALSE OR t.is_deleted IS NULL)
WHERE s.consultant_id IS NOT NULL
  AND s.client_id IS NOT NULL
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND (s.schedule_type IS NULL OR s.schedule_type = 'CONSULTATION')
  AND s.session_sequence IS NOT NULL
  AND s.status IN (
        'BOOKED',
        'TENTATIVE_PENDING_PAYMENT',
        'CONFIRMED',
        'COMPLETED',
        'IN_PROGRESS'
  )
  AND (
        s.mapping_id = k.target_mapping_id
        OR (
            s.mapping_id IS NULL
            AND s.consultant_id = t.consultant_id
            AND s.client_id = t.client_id
        )
  )
  AND NOT EXISTS (
        SELECT 1
        FROM tmp_apply_ids ax
        WHERE ax.tenant_id = s.tenant_id
          AND ax.schedule_id = s.id
  );

CREATE TEMPORARY TABLE tmp_free AS
SELECT
    b.tenant_id,
    b.target_mapping_id,
    n.seq_n,
    ROW_NUMBER() OVER (
        PARTITION BY b.tenant_id, b.target_mapping_id
        ORDER BY n.seq_n
    ) AS free_rank
FROM (
    SELECT
        tenant_id,
        target_mapping_id,
        MAX(target_total_sessions) AS target_total_sessions
    FROM tmp_apply
    GROUP BY tenant_id, target_mapping_id
) b
INNER JOIN tmp_nums n
    ON b.target_total_sessions IS NOT NULL
   AND b.target_total_sessions > 0
   AND n.seq_n <= b.target_total_sessions
   AND n.seq_n <= 1000
LEFT JOIN tmp_occupied o
    ON o.tenant_id = b.tenant_id
   AND o.target_mapping_id = b.target_mapping_id
   AND o.session_sequence = n.seq_n
WHERE o.session_sequence IS NULL;

CREATE TEMPORARY TABLE tmp_apply_ready AS
SELECT
    a.tenant_id,
    a.additional_mapping_id,
    a.target_mapping_id,
    a.additional_sessions,
    a.target_total_sessions,
    a.target_used_sessions,
    a.target_remaining_sessions,
    a.target_status,
    a.target_version,
    a.consuming_schedule_count,
    a.same_target_schedule_count,
    a.target_expected_used_sessions,
    a.target_expected_remaining_sessions,
    a.target_expected_used_if_same_target_all,
    a.target_expected_remaining_if_same_target_all,
    a.schedule_id,
    a.schedule_status,
    a.schedule_date,
    a.schedule_start_time,
    a.schedule_session_sequence,
    a.list_expected_session_sequence,
    a.schedule_version,
    a.schedule_mapping_id,
    a.plan_status,
    a.merged_at,
    a.labeled_by_mapping_id,
    a.apply_rank,
    f.seq_n AS apply_session_sequence
FROM tmp_apply a
LEFT JOIN tmp_free f
    ON f.tenant_id = a.tenant_id
   AND f.target_mapping_id = a.target_mapping_id
   AND f.free_rank = a.apply_rank;

SELECT
    'BEFORE' AS phase,
    tenant_id,
    additional_mapping_id,
    target_mapping_id,
    additional_sessions,
    target_total_sessions,
    target_used_sessions,
    target_remaining_sessions,
    target_status,
    consuming_schedule_count,
    same_target_schedule_count,
    target_expected_used_sessions,
    target_expected_remaining_sessions,
    target_expected_used_if_same_target_all,
    target_expected_remaining_if_same_target_all,
    schedule_id,
    schedule_status,
    schedule_date,
    schedule_start_time,
    schedule_session_sequence,
    list_expected_session_sequence,
    apply_session_sequence,
    plan_status,
    merged_at,
    labeled_by_mapping_id,
    target_version,
    schedule_version,
    schedule_mapping_id
FROM tmp_apply_ready
ORDER BY tenant_id, additional_mapping_id, schedule_date, schedule_start_time, schedule_id;

SET @allow_n = (SELECT COUNT(*) FROM repair_allowlist);
SET @matched = (
    SELECT COUNT(*)
    FROM repair_allowlist a
    INNER JOIN tmp_plan p
        ON p.additional_mapping_id = a.additional_mapping_id
       AND p.schedule_id = a.schedule_id
);
SET @ready_n = (SELECT COUNT(*) FROM tmp_apply_ready);
SET @ready_ok = (
    SELECT COUNT(*)
    FROM tmp_apply_ready
    WHERE plan_status = 'READY'
      AND apply_session_sequence IS NOT NULL
);
SET @c = IF(@allow_n > 0 AND @allow_n = @matched AND @allow_n = @ready_n AND @allow_n = @ready_ok, 1, 0);
SET @n = 'allowlist_all_ready';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

CREATE TEMPORARY TABLE tmp_allow_ids AS
SELECT additional_mapping_id, schedule_id
FROM repair_allowlist;

CREATE TEMPORARY TABLE tmp_allow_mappings AS
SELECT DISTINCT additional_mapping_id
FROM tmp_allow_ids;

SET @missing_labeled = (
    SELECT COUNT(*)
    FROM tmp_plan p
    INNER JOIN tmp_allow_mappings touched
        ON touched.additional_mapping_id = p.additional_mapping_id
    LEFT JOIN tmp_allow_ids a
        ON a.additional_mapping_id = p.additional_mapping_id
       AND a.schedule_id = p.schedule_id
    WHERE p.labeled_by_mapping_id = 1
      AND a.schedule_id IS NULL
);
SET @c = IF(@missing_labeled = 0, 1, 0);
SET @n = 'allowlist_covers_labeled_schedules';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @dup_seq = (
    SELECT COUNT(*)
    FROM (
        SELECT tenant_id, target_mapping_id, apply_session_sequence
        FROM tmp_apply_ready
        GROUP BY tenant_id, target_mapping_id, apply_session_sequence
        HAVING COUNT(*) > 1
    ) d
);
SET @c = IF(@dup_seq = 0, 1, 0);
SET @n = 'apply_sequence_unique';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @seq_drift = (
    SELECT COUNT(*)
    FROM tmp_apply_ready r
    WHERE (
        SELECT COUNT(*)
        FROM tmp_apply_ids i
        WHERE i.tenant_id = r.tenant_id
          AND i.target_mapping_id = r.target_mapping_id
    ) = r.same_target_schedule_count
      AND NOT (r.apply_session_sequence <=> r.list_expected_session_sequence)
);
SET @c = IF(@seq_drift = 0, 1, 0);
SET @n = 'full_allowlist_sequence_matches_list';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

CREATE TEMPORARY TABLE tmp_target_delta AS
SELECT
    tenant_id,
    target_mapping_id,
    COUNT(*) AS session_delta,
    MAX(target_used_sessions) AS used_before,
    MIN(target_used_sessions) AS used_before_min,
    MAX(target_remaining_sessions) AS remaining_before,
    MIN(target_remaining_sessions) AS remaining_before_min,
    MAX(target_total_sessions) AS total_before,
    MIN(target_total_sessions) AS total_before_min,
    MAX(target_status) AS status_before,
    MIN(target_status) AS status_before_min,
    MAX(target_version) AS version_before,
    MIN(target_version) AS version_before_min
FROM tmp_apply_ready
GROUP BY tenant_id, target_mapping_id;

SET @delta_bad = (
    SELECT COUNT(*)
    FROM tmp_target_delta
    WHERE NOT (used_before <=> used_before_min)
       OR NOT (remaining_before <=> remaining_before_min)
       OR NOT (total_before <=> total_before_min)
       OR NOT (status_before <=> status_before_min)
       OR NOT (version_before <=> version_before_min)
       OR session_delta < 1
       OR IFNULL(remaining_before, 0) < session_delta
);
SET @c = IF(@delta_bad = 0, 1, 0);
SET @n = 'target_snapshot_stable';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @seq_over = (
    SELECT COUNT(*)
    FROM tmp_apply_ready
    WHERE apply_session_sequence IS NULL
       OR target_total_sessions IS NULL
       OR apply_session_sequence > target_total_sessions
       OR apply_session_sequence < 1
);
SET @c = IF(@seq_over = 0, 1, 0);
SET @n = 'apply_sequence_within_total';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SELECT t.id
FROM consultant_client_mappings t
INNER JOIN tmp_apply_targets k
    ON k.tenant_id = t.tenant_id
   AND k.target_mapping_id = t.id
FOR UPDATE;

SELECT s.id
FROM schedules s
INNER JOIN tmp_apply_ids i
    ON i.tenant_id = s.tenant_id
   AND i.schedule_id = s.id
FOR UPDATE;

SET @map_drift = (
    SELECT COUNT(*)
    FROM tmp_target_delta d
    INNER JOIN consultant_client_mappings t
        ON t.tenant_id = d.tenant_id
       AND t.id = d.target_mapping_id
    WHERE NOT (t.used_sessions <=> d.used_before)
       OR NOT (t.remaining_sessions <=> d.remaining_before)
       OR NOT (t.total_sessions <=> d.total_before)
       OR NOT (t.status <=> d.status_before)
       OR NOT (t.version <=> d.version_before)
       OR NOT (t.is_deleted = 0 OR t.is_deleted = FALSE OR t.is_deleted IS NULL)
);
SET @c = IF(@map_drift = 0, 1, 0);
SET @n = 'target_unchanged_after_lock';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @sch_drift = (
    SELECT COUNT(*)
    FROM tmp_apply_ready r
    INNER JOIN schedules s
        ON s.tenant_id = r.tenant_id
       AND s.id = r.schedule_id
    WHERE NOT (s.mapping_id <=> r.schedule_mapping_id)
       OR NOT (s.session_sequence <=> r.schedule_session_sequence)
       OR NOT (s.status <=> r.schedule_status)
       OR NOT (s.version <=> r.schedule_version)
       OR NOT (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
);
SET @c = IF(@sch_drift = 0, 1, 0);
SET @n = 'schedule_unchanged_after_lock';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @pin_n = (SELECT COUNT(*) FROM repair_expected_before);
SET @pin_bad = (
    SELECT COUNT(*)
    FROM repair_expected_before e
    LEFT JOIN tmp_apply_ready r
        ON r.additional_mapping_id = e.additional_mapping_id
       AND r.schedule_id = e.schedule_id
    WHERE r.schedule_id IS NULL
       OR NOT (r.target_mapping_id <=> e.target_mapping_id)
       OR NOT (r.target_total_sessions <=> e.total_sessions)
       OR NOT (r.target_used_sessions <=> e.used_sessions)
       OR NOT (r.target_remaining_sessions <=> e.remaining_sessions)
       OR NOT (r.target_status <=> e.target_status)
       OR NOT (r.target_version <=> e.target_version)
       OR NOT (r.schedule_status <=> e.schedule_status)
       OR NOT (r.schedule_session_sequence <=> e.schedule_session_sequence)
       OR NOT (r.schedule_version <=> e.schedule_version)
       OR NOT (r.schedule_mapping_id <=> e.schedule_mapping_id)
       OR NOT (r.apply_session_sequence <=> e.apply_session_sequence)
       OR NOT (r.labeled_by_mapping_id <=> 1)
);
SET @c = IF(@pin_n = 0 OR (@pin_bad = 0 AND @pin_n = @allow_n), 1, 0);
SET @n = 'expected_before_image';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

UPDATE consultant_client_mappings t
INNER JOIN tmp_target_delta d
    ON d.tenant_id = t.tenant_id
   AND d.target_mapping_id = t.id
SET
    t.used_sessions = IFNULL(d.used_before, 0) + d.session_delta,
    t.remaining_sessions = IFNULL(d.remaining_before, 0) - d.session_delta,
    t.version = IFNULL(t.version, 0) + 1,
    t.updated_at = NOW(6)
WHERE t.used_sessions <=> d.used_before
  AND t.remaining_sessions <=> d.remaining_before
  AND t.total_sessions <=> d.total_before
  AND t.status <=> d.status_before
  AND t.version <=> d.version_before
  AND (t.is_deleted = 0 OR t.is_deleted = FALSE OR t.is_deleted IS NULL)
  AND IFNULL(d.remaining_before, 0) >= d.session_delta
  AND d.session_delta >= 1;

SET @rc_map = ROW_COUNT();
SET @expect_map = (SELECT COUNT(*) FROM tmp_target_delta);
SET @c = IF(@rc_map = @expect_map AND @expect_map > 0, 1, 0);
SET @n = 'rc_mappings';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

UPDATE schedules s
INNER JOIN tmp_apply_ready r
    ON r.tenant_id = s.tenant_id
   AND r.schedule_id = s.id
SET
    s.mapping_id = r.target_mapping_id,
    s.session_sequence = r.apply_session_sequence,
    s.version = IFNULL(s.version, 0) + 1,
    s.updated_at = NOW(6)
WHERE s.mapping_id <=> r.schedule_mapping_id
  AND s.session_sequence <=> r.schedule_session_sequence
  AND s.status <=> r.schedule_status
  AND s.version <=> r.schedule_version
  AND (s.is_deleted = 0 OR s.is_deleted = FALSE OR s.is_deleted IS NULL)
  AND (s.schedule_type IS NULL OR s.schedule_type = 'CONSULTATION')
  AND r.plan_status = 'READY'
  AND r.apply_session_sequence IS NOT NULL;

SET @rc_sch = ROW_COUNT();
SET @expect_sch = (SELECT COUNT(*) FROM tmp_apply_ready);
SET @c = IF(@rc_sch = @expect_sch AND @expect_sch = @allow_n, 1, 0);
SET @n = 'rc_schedules';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SET @post_bad = (
    SELECT COUNT(*)
    FROM tmp_apply_ready r
    INNER JOIN consultant_client_mappings t
        ON t.tenant_id = r.tenant_id
       AND t.id = r.target_mapping_id
    INNER JOIN schedules s
        ON s.tenant_id = r.tenant_id
       AND s.id = r.schedule_id
    INNER JOIN tmp_target_delta d
        ON d.tenant_id = r.tenant_id
       AND d.target_mapping_id = r.target_mapping_id
    WHERE NOT (t.used_sessions <=> (IFNULL(d.used_before, 0) + d.session_delta))
       OR NOT (t.remaining_sessions <=> (IFNULL(d.remaining_before, 0) - d.session_delta))
       OR NOT (t.status <=> d.status_before)
       OR NOT (t.total_sessions <=> d.total_before)
       OR NOT (s.mapping_id <=> r.target_mapping_id)
       OR NOT (s.session_sequence <=> r.apply_session_sequence)
       OR NOT (s.status <=> r.schedule_status)
);
SET @c = IF(@post_bad = 0, 1, 0);
SET @n = 'post_image_matches_plan';
SET @s = IF(@c, CONCAT('SELECT ''OK  ', @n, ''' AS assert_result'), CONCAT('SELECT 1 FROM `ASSERT_FAILED__', @n, '`'));
PREPARE st FROM @s;
EXECUTE st;
DEALLOCATE PREPARE st;

SELECT
    'AFTER' AS phase,
    r.tenant_id,
    r.additional_mapping_id,
    t.id AS target_mapping_id,
    t.total_sessions AS target_total_sessions,
    t.used_sessions AS target_used_sessions,
    t.remaining_sessions AS target_remaining_sessions,
    t.status AS target_status,
    t.version AS target_version,
    s.id AS schedule_id,
    s.status AS schedule_status,
    s.`date` AS schedule_date,
    s.start_time AS schedule_start_time,
    s.mapping_id AS schedule_mapping_id,
    s.session_sequence AS schedule_session_sequence,
    s.version AS schedule_version,
    r.apply_session_sequence,
    r.list_expected_session_sequence,
    d.session_delta,
    IFNULL(d.used_before, 0) + d.session_delta AS target_used_after_expected,
    IFNULL(d.remaining_before, 0) - d.session_delta AS target_remaining_after_expected
FROM tmp_apply_ready r
INNER JOIN consultant_client_mappings t
    ON t.tenant_id = r.tenant_id
   AND t.id = r.target_mapping_id
INNER JOIN schedules s
    ON s.tenant_id = r.tenant_id
   AND s.id = r.schedule_id
INNER JOIN tmp_target_delta d
    ON d.tenant_id = r.tenant_id
   AND d.target_mapping_id = r.target_mapping_id
ORDER BY r.tenant_id, r.additional_mapping_id, r.schedule_date, r.schedule_start_time, r.schedule_id;
