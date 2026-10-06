-- 다른 매칭에서 넘어온 회기 복원으로 ACTIVE used 가 소비 일정보다 작은 행. 읽기 전용.
-- resolveMappingForSessionRestore: 일정 mapping 이 ACTIVE/SESSIONS_EXHAUSTED 가 아니면
--   같은 상담사·내담자의 최신 ACTIVE 에 restoreSession (used-1, remaining+1).
-- 식별자·숫자·상태만 출력한다. 이름·연락처·notes 본문은 출력하지 않는다.
--
-- (a) ACTIVE 매칭. used_sessions < mapping_id 로 라벨된 소비 일정 수.
--   schedules.mapping_id = mappings.id, 같은 tenant_id
--   is_deleted = 0, session_sequence IS NOT NULL
--   status IN (BOOKED, CONFIRMED, IN_PROGRESS, COMPLETED)
--   TENTATIVE_PENDING_PAYMENT 는 요청 목록에 없다.
--   schedule_type NULL 또는 CONSULTATION. BREAK 등은 소비 일정이 아니다.
--   used_shortfall = 라벨된 소비 일정 수 - used_sessions
--
-- (b) 종료된 추가 매칭과 대상 매칭의 total/used/remaining.
--   status = TERMINATED, notes 에 [추가 매칭] 과 [추가 패키지 병합 완료]
--   대상 id 는 parseActiveMappingIdFromAdditionalNotes 와 같다.
--   대소문자 구분 첫 매치 activeMappingId=<숫자>. MySQL 8.0 REGEXP_SUBSTR 는 5인자.
--   targetActiveMappingId= 도 그 부분 문자열에 걸린다. 앞줄 [추가 매칭] 이 먼저다.

SELECT
    'ACTIVE_USED_SHORTFALL' AS list_section,
    m.tenant_id,
    m.id AS mapping_id,
    m.total_sessions,
    m.used_sessions,
    m.remaining_sessions,
    COUNT(s.id) AS labeled_consuming_schedule_count,
    COUNT(s.id) - COALESCE(m.used_sessions, 0) AS used_shortfall
FROM consultant_client_mappings m
INNER JOIN schedules s
    ON s.tenant_id = m.tenant_id
   AND s.mapping_id = m.id
   AND s.is_deleted = 0
   AND s.session_sequence IS NOT NULL
   AND (s.schedule_type IS NULL OR s.schedule_type = 'CONSULTATION')
   AND s.status IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
WHERE m.is_deleted = 0
  AND m.status = 'ACTIVE'
GROUP BY
    m.tenant_id,
    m.id,
    m.total_sessions,
    m.used_sessions,
    m.remaining_sessions
HAVING COUNT(s.id) > COALESCE(m.used_sessions, 0)
ORDER BY m.tenant_id, m.id;

SELECT
    'TERMINATED_ADDITIONAL_TARGET' AS list_section,
    a.tenant_id,
    a.additional_mapping_id,
    a.target_mapping_id,
    t.status AS target_status,
    t.total_sessions AS target_total_sessions,
    t.used_sessions AS target_used_sessions,
    t.remaining_sessions AS target_remaining_sessions
FROM (
    SELECT
        m.tenant_id,
        m.id AS additional_mapping_id,
        CAST(
            SUBSTRING_INDEX(
                REGEXP_SUBSTR(m.notes, 'activeMappingId=[0-9]+', 1, 1, 'c'),
                '=',
                -1
            ) AS UNSIGNED
        ) AS target_mapping_id
    FROM consultant_client_mappings m
    WHERE m.status = 'TERMINATED'
      AND m.is_deleted = 0
      AND m.notes LIKE '%[추가 매칭]%'
      AND m.notes LIKE '%[추가 패키지 병합 완료]%'
) a
LEFT JOIN consultant_client_mappings t
    ON t.tenant_id = a.tenant_id
   AND t.id = a.target_mapping_id
   AND t.is_deleted = 0
WHERE a.target_mapping_id IS NOT NULL
  AND a.target_mapping_id > 0
ORDER BY a.tenant_id, a.additional_mapping_id;
