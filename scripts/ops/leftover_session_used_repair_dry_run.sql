-- leftover exhaust 이후 total <> used+remaining 후보 조회 (읽기 전용)
-- SSOT: rem 유지, proposed_used = total - remaining
SELECT
  m.id,
  m.tenant_id,
  m.status,
  m.total_sessions,
  m.used_sessions,
  m.remaining_sessions,
  (m.total_sessions - m.used_sessions - m.remaining_sessions) AS delta,
  (m.total_sessions - m.remaining_sessions) AS proposed_used,
  LEFT(m.notes, 200) AS notes_preview
FROM consultant_client_mappings m
WHERE (m.is_deleted = 0 OR m.is_deleted = FALSE)
  AND (
    m.notes LIKE '%[점유완료소진] 일정#%'
    OR m.notes LIKE '%[회기 승계]%'
    OR m.notes LIKE '%→ 타깃매핑#%'
  )
  AND IFNULL(m.total_sessions, 0)
      <> (IFNULL(m.used_sessions, 0) + IFNULL(m.remaining_sessions, 0))
ORDER BY m.id;
