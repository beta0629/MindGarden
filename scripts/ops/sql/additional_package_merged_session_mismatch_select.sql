-- 추가 패키지 병합 후 회기 귀속이 어긋난 일정. 읽기 전용 한 문장.
-- 식별자·숫자·상태·일자·시각만 출력한다. 이름·연락처·notes 본문은 출력하지 않는다.
--
-- 컬럼 SSOT
--   consultant_client_mappings: tenant_id, id, consultant_id, client_id, status,
--     total_sessions, used_sessions, remaining_sessions, notes, terminated_at,
--     is_deleted, version (ConsultantClientMapping, AuditableTenantBase)
--   schedules: tenant_id, id, consultant_id, client_id, mapping_id, session_sequence,
--     status, date, start_time, schedule_type, is_deleted, version (Schedule)
-- 상태 문자열은 EnumType.STRING.
--
-- 병합 표식 NOTES_ADDITIONAL_MAPPING_MERGED_FMT
--   [추가 패키지 병합 완료] targetActiveMappingId=<id> sessions=<n>
-- 추가 표식 NOTES_ADDITIONAL_MAPPING_MARKER = [추가 매칭]
-- 타깃 id 는 parseActiveMappingIdFromAdditionalNotes 와 같다.
--   대소문자 구분 첫 매치 activeMappingId=<숫자> 를 고른 뒤 = 뒤를 숫자로 읽는다.
--   MySQL 8.0 REGEXP_SUBSTR 는 캡처 그룹 인덱스를 받지 않는다.
--   targetActiveMappingId= 도 같은 부분 문자열에 걸린다.
--   두 줄이 있으면 앞줄 [추가 매칭] activeMappingId= 가 먼저다.
-- 병합 줄의 targetActiveMappingId 는 merged_line_target_id 로 따로 대조한다.
-- 추가 회기는 total_sessions (merge 가 addSessions 에 넣은 값).
-- 병합 시각은 terminated_at.
-- 기간 컷오프는 두지 않는다. 병합 표식은 해당 코드 이후로만 기록된다.
--
-- 일정 귀속은 findDeductedConsultationSchedulesForMapping 과 같다.
--   is_deleted 거짓, schedule_type NULL 또는 CONSULTATION,
--   consultant_id·client_id 존재, session_sequence NOT NULL,
--   status 는 occupyingStatusesForConsultationScheduleHistory
--   (BOOKED, TENTATIVE_PENDING_PAYMENT, CONFIRMED, COMPLETED, IN_PROGRESS).
--   CANCELLED·AVAILABLE·VACATION 제외.
--   mapping_id = 추가 행 id
--   또는 mapping_id IS NULL 이면서 상담사·내담자 쌍이 같다.
--
-- 기대 used/remaining 은 추가 매칭별이다.
--   target_expected_used_sessions = 타깃 used + 그 추가 행의 소비 일정 수
--   target_expected_remaining_sessions = 타깃 remaining - 그 수
-- 같은 타깃의 어긋난 일정을 전부 반영한 값은 *_if_same_target_all 이다.
-- 기대 session_sequence 는 그 전부를 타깃으로 옮긴다는 가정에서의 정책 A(gap-fill).
--   점유 순번은 타깃에 귀속된 소비 일정에서, 이번에 옮길 일정 id 를 뺀 것이다.
--   배정 순서는 date, start_time, id.
--   빈 칸은 1..target.total_sessions. 총 회기 밖 순번은 만들지 않는다 (상한 1000).
-- plan_status 가 READY 가 아니면 보정은 그 행을 쓰지 않는다.

WITH RECURSIVE nums AS (
    SELECT 1 AS seq_n
    UNION ALL
    SELECT seq_n + 1 FROM nums WHERE seq_n < 1000
),
merged AS (
    SELECT
        m.tenant_id,
        m.id AS additional_mapping_id,
        m.consultant_id,
        m.client_id,
        m.total_sessions AS additional_sessions,
        m.terminated_at AS merged_at,
        CAST(
            SUBSTRING_INDEX(
                REGEXP_SUBSTR(m.notes, 'activeMappingId=[0-9]+', 1, 1, 'c'),
                '=',
                -1
            ) AS UNSIGNED
        ) AS target_mapping_id,
        CAST(
            SUBSTRING_INDEX(
                REGEXP_SUBSTR(
                    m.notes,
                    '\\[추가 패키지 병합 완료\\] targetActiveMappingId=[0-9]+',
                    1, 1, 'c'
                ),
                '=',
                -1
            ) AS UNSIGNED
        ) AS merged_line_target_id,
        CAST(
            SUBSTRING_INDEX(
                REGEXP_SUBSTR(
                    m.notes,
                    '\\[추가 패키지 병합 완료\\] targetActiveMappingId=[0-9]+ sessions=[0-9]+',
                    1, 1, 'c'
                ),
                '=',
                -1
            ) AS UNSIGNED
        ) AS merged_note_sessions
    FROM consultant_client_mappings m
    WHERE m.status = 'TERMINATED'
      AND (m.is_deleted = 0 OR m.is_deleted = FALSE OR m.is_deleted IS NULL)
      AND m.notes LIKE '%[추가 패키지 병합 완료]%'
      AND m.notes LIKE '%[추가 매칭]%'
),
sched AS (
    SELECT
        g.tenant_id,
        g.additional_mapping_id,
        g.target_mapping_id,
        g.merged_line_target_id,
        g.additional_sessions,
        g.merged_note_sessions,
        g.merged_at,
        s.id AS schedule_id,
        s.status AS schedule_status,
        s.`date` AS schedule_date,
        s.start_time AS schedule_start_time,
        s.session_sequence AS schedule_session_sequence,
        s.mapping_id AS schedule_mapping_id,
        s.version AS schedule_version,
        CASE WHEN s.mapping_id = g.additional_mapping_id THEN 1 ELSE 0 END AS labeled_by_mapping_id
    FROM merged g
    INNER JOIN schedules s
        ON s.tenant_id = g.tenant_id
       AND s.consultant_id IS NOT NULL
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
            s.mapping_id = g.additional_mapping_id
            OR (
                s.mapping_id IS NULL
                AND s.consultant_id = g.consultant_id
                AND s.client_id = g.client_id
            )
       )
),
ambiguous AS (
    SELECT
        tenant_id,
        schedule_id,
        COUNT(*) AS match_cnt
    FROM sched
    GROUP BY tenant_id, schedule_id
),
target_row AS (
    SELECT
        t.tenant_id,
        t.id AS target_mapping_id,
        t.total_sessions AS target_total_sessions,
        t.used_sessions AS target_used_sessions,
        t.remaining_sessions AS target_remaining_sessions,
        t.status AS target_status,
        t.version AS target_version,
        t.consultant_id AS target_consultant_id,
        t.client_id AS target_client_id
    FROM consultant_client_mappings t
    INNER JOIN (
        SELECT DISTINCT tenant_id, target_mapping_id AS id
        FROM merged
        WHERE target_mapping_id IS NOT NULL
          AND target_mapping_id > 0
    ) ids
        ON ids.tenant_id = t.tenant_id
       AND ids.id = t.id
    WHERE (t.is_deleted = 0 OR t.is_deleted = FALSE OR t.is_deleted IS NULL)
),
movers AS (
    SELECT
        s.tenant_id,
        s.additional_mapping_id,
        s.target_mapping_id,
        s.merged_line_target_id,
        s.additional_sessions,
        s.merged_note_sessions,
        s.merged_at,
        s.schedule_id,
        s.schedule_status,
        s.schedule_date,
        s.schedule_start_time,
        s.schedule_session_sequence,
        s.schedule_mapping_id,
        s.schedule_version,
        s.labeled_by_mapping_id,
        a.match_cnt,
        COUNT(*) OVER (
            PARTITION BY s.tenant_id, s.additional_mapping_id
        ) AS consuming_schedule_count,
        SUM(CASE WHEN s.labeled_by_mapping_id = 1 THEN 1 ELSE 0 END) OVER (
            PARTITION BY s.tenant_id, s.additional_mapping_id
        ) AS labeled_schedule_count,
        COUNT(*) OVER (
            PARTITION BY s.tenant_id, s.target_mapping_id
        ) AS same_target_schedule_count,
        ROW_NUMBER() OVER (
            PARTITION BY s.tenant_id, s.target_mapping_id
            ORDER BY s.schedule_date, s.schedule_start_time, s.schedule_id
        ) AS move_rank
    FROM sched s
    INNER JOIN ambiguous a
        ON a.tenant_id = s.tenant_id
       AND a.schedule_id = s.schedule_id
),
occupied AS (
    SELECT DISTINCT
        s.tenant_id,
        mv.target_mapping_id,
        s.session_sequence
    FROM schedules s
    INNER JOIN (
        SELECT DISTINCT tenant_id, target_mapping_id
        FROM movers
        WHERE target_mapping_id IS NOT NULL
          AND target_mapping_id > 0
    ) mv
        ON mv.tenant_id = s.tenant_id
    INNER JOIN target_row t
        ON t.tenant_id = mv.tenant_id
       AND t.target_mapping_id = mv.target_mapping_id
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
            s.mapping_id = mv.target_mapping_id
            OR (
                s.mapping_id IS NULL
                AND s.consultant_id = t.target_consultant_id
                AND s.client_id = t.target_client_id
            )
      )
      AND NOT EXISTS (
            SELECT 1
            FROM movers mv2
            WHERE mv2.tenant_id = s.tenant_id
              AND mv2.schedule_id = s.id
      )
),
bounds AS (
    SELECT
        mv.tenant_id,
        mv.target_mapping_id,
        MAX(t.target_total_sessions) AS target_total_sessions
    FROM movers mv
    INNER JOIN target_row t
        ON t.tenant_id = mv.tenant_id
       AND t.target_mapping_id = mv.target_mapping_id
    WHERE mv.target_mapping_id IS NOT NULL
      AND mv.target_mapping_id > 0
    GROUP BY mv.tenant_id, mv.target_mapping_id
),
free_ranked AS (
    SELECT
        b.tenant_id,
        b.target_mapping_id,
        nums.seq_n,
        ROW_NUMBER() OVER (
            PARTITION BY b.tenant_id, b.target_mapping_id
            ORDER BY nums.seq_n
        ) AS free_rank
    FROM bounds b
    INNER JOIN nums
        ON b.target_total_sessions IS NOT NULL
       AND b.target_total_sessions > 0
       AND nums.seq_n <= b.target_total_sessions
       AND nums.seq_n <= 1000
    LEFT JOIN occupied o
        ON o.tenant_id = b.tenant_id
       AND o.target_mapping_id = b.target_mapping_id
       AND o.session_sequence = nums.seq_n
    WHERE o.session_sequence IS NULL
),
core AS (
    SELECT
        mv.tenant_id,
        mv.additional_mapping_id,
        mv.target_mapping_id,
        mv.merged_line_target_id,
        mv.additional_sessions,
        mv.merged_note_sessions,
        t.target_total_sessions,
        t.target_used_sessions,
        t.target_remaining_sessions,
        t.target_status,
        mv.consuming_schedule_count,
        mv.labeled_schedule_count,
        mv.same_target_schedule_count,
        CASE
            WHEN t.target_mapping_id IS NULL THEN NULL
            ELSE IFNULL(t.target_used_sessions, 0) + mv.consuming_schedule_count
        END AS target_expected_used_sessions,
        CASE
            WHEN t.target_mapping_id IS NULL THEN NULL
            ELSE IFNULL(t.target_remaining_sessions, 0) - mv.consuming_schedule_count
        END AS target_expected_remaining_sessions,
        CASE
            WHEN t.target_mapping_id IS NULL THEN NULL
            ELSE IFNULL(t.target_used_sessions, 0) + mv.same_target_schedule_count
        END AS target_expected_used_if_same_target_all,
        CASE
            WHEN t.target_mapping_id IS NULL THEN NULL
            ELSE IFNULL(t.target_remaining_sessions, 0) - mv.same_target_schedule_count
        END AS target_expected_remaining_if_same_target_all,
        mv.schedule_id,
        mv.schedule_status,
        mv.schedule_date,
        mv.schedule_start_time,
        mv.schedule_session_sequence,
        fr.seq_n AS expected_session_sequence,
        mv.merged_at,
        mv.labeled_by_mapping_id,
        CASE WHEN mv.match_cnt > 1 THEN 1 ELSE 0 END AS ambiguous_schedule,
        t.target_version,
        mv.schedule_version,
        mv.schedule_mapping_id,
        mv.move_rank
    FROM movers mv
    LEFT JOIN target_row t
        ON t.tenant_id = mv.tenant_id
       AND t.target_mapping_id = mv.target_mapping_id
    LEFT JOIN free_ranked fr
        ON fr.tenant_id = mv.tenant_id
       AND fr.target_mapping_id = mv.target_mapping_id
       AND fr.free_rank = mv.move_rank
)
SELECT
    tenant_id,
    additional_mapping_id,
    target_mapping_id,
    merged_line_target_id,
    additional_sessions,
    merged_note_sessions,
    target_total_sessions,
    target_used_sessions,
    target_remaining_sessions,
    target_status,
    consuming_schedule_count,
    labeled_schedule_count,
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
    expected_session_sequence,
    merged_at,
    labeled_by_mapping_id,
    ambiguous_schedule,
    target_version,
    schedule_version,
    schedule_mapping_id,
    CASE
        WHEN ambiguous_schedule = 1 THEN 'AMBIGUOUS'
        WHEN target_mapping_id IS NULL
            OR target_mapping_id = 0
            OR target_total_sessions IS NULL THEN 'NO_TARGET'
        WHEN merged_line_target_id IS NULL
            OR merged_line_target_id <> target_mapping_id THEN 'TARGET_ID_MISMATCH'
        WHEN IFNULL(target_remaining_sessions, 0) < labeled_schedule_count THEN 'REMAINING_SHORT'
        WHEN expected_session_sequence IS NULL THEN 'SEQ_MISSING'
        WHEN target_total_sessions IS NULL
            OR expected_session_sequence > target_total_sessions THEN 'SEQ_OVER_TOTAL'
        ELSE 'READY'
    END AS plan_status
FROM core
ORDER BY tenant_id, additional_mapping_id, schedule_date, schedule_start_time, schedule_id
;
