-- 285 → 36, 일정 478 의 현재 전값. 읽기 전용. notes 는 출력하지 않는다.

SELECT
    t.id AS target_mapping_id,
    t.status AS target_status,
    t.total_sessions,
    t.used_sessions,
    t.remaining_sessions,
    t.version AS target_version,
    s.id AS schedule_id,
    s.status AS schedule_status,
    s.session_sequence,
    s.mapping_id AS schedule_mapping_id,
    s.version AS schedule_version,
    s.`date` AS schedule_date,
    s.start_time AS schedule_start_time,
    a.id AS additional_mapping_id,
    a.status AS additional_status
FROM consultant_client_mappings t
INNER JOIN schedules s
    ON s.tenant_id = t.tenant_id
   AND s.id = 478
   AND s.is_deleted = 0
INNER JOIN consultant_client_mappings a
    ON a.tenant_id = t.tenant_id
   AND a.id = 285
   AND a.is_deleted = 0
WHERE t.tenant_id = 'tenant-incheon-counseling-001'
  AND t.id = 36
  AND t.is_deleted = 0;
