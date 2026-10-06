-- 매칭 32, 245, 265 의 회기 이력. 읽기 전용.
-- consultant_client_mapping_history 는 SESSION_USED 기록이다.
-- restoreSession 은 이력 행을 만들지 않는다. 일정 notes 가 취소·복원 흔적이다.
-- 지급 기록과 전표는 조회하지 않는다.

SELECT
    'MAPPING' AS list_section,
    m.id AS mapping_id,
    m.tenant_id,
    m.status,
    m.payment_status,
    m.total_sessions,
    m.used_sessions,
    m.remaining_sessions,
    m.notes
FROM consultant_client_mappings m
WHERE m.tenant_id = 'tenant-incheon-counseling-001'
  AND m.id IN (32, 245, 265)
  AND m.is_deleted = 0
ORDER BY m.id;

SELECT
    'SCHEDULE' AS list_section,
    s.mapping_id,
    s.id AS schedule_id,
    s.`date` AS schedule_date,
    s.start_time,
    s.status,
    s.session_sequence,
    s.schedule_type,
    s.is_deleted,
    s.created_at,
    s.updated_at,
    s.notes
FROM schedules s
WHERE s.tenant_id = 'tenant-incheon-counseling-001'
  AND s.mapping_id IN (32, 245, 265)
ORDER BY s.mapping_id, s.`date`, s.start_time, s.id;

SELECT
    'HISTORY' AS list_section,
    h.mapping_id,
    h.id AS history_id,
    h.event_type,
    h.reason,
    h.before_state_json,
    h.after_state_json,
    h.created_at
FROM consultant_client_mapping_history h
WHERE h.tenant_id = 'tenant-incheon-counseling-001'
  AND h.mapping_id IN (32, 245, 265)
ORDER BY h.mapping_id, h.created_at, h.id;
