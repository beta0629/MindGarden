-- leftover exhaust 불일치: used만 total-remaining 으로 맞춤 (rem·total 유지)
-- 금지: remaining = total - used (fix-mismatches 산식)
-- 실행 전 dry-run SELECT로 후보 검수 필수

CREATE TABLE IF NOT EXISTS consultant_client_mappings_repair_bak_leftover_used AS
SELECT m.*
FROM consultant_client_mappings m
WHERE 1 = 0;

INSERT INTO consultant_client_mappings_repair_bak_leftover_used
SELECT m.*
FROM consultant_client_mappings m
WHERE (m.is_deleted = 0 OR m.is_deleted = FALSE)
  AND (
    m.notes LIKE '%[점유완료소진] 일정#%'
    OR m.notes LIKE '%[회기 승계]%'
    OR m.notes LIKE '%→ 타깃매핑#%'
  )
  AND IFNULL(m.total_sessions, 0)
      <> (IFNULL(m.used_sessions, 0) + IFNULL(m.remaining_sessions, 0))
  AND (m.total_sessions - m.remaining_sessions) >= 0
  AND NOT EXISTS (
    SELECT 1 FROM consultant_client_mappings_repair_bak_leftover_used b WHERE b.id = m.id
  );

UPDATE consultant_client_mappings m
SET
  m.used_sessions = m.total_sessions - m.remaining_sessions,
  m.updated_at = NOW()
WHERE (m.is_deleted = 0 OR m.is_deleted = FALSE)
  AND (
    m.notes LIKE '%[점유완료소진] 일정#%'
    OR m.notes LIKE '%[회기 승계]%'
    OR m.notes LIKE '%→ 타깃매핑#%'
  )
  AND IFNULL(m.total_sessions, 0)
      <> (IFNULL(m.used_sessions, 0) + IFNULL(m.remaining_sessions, 0))
  AND (m.total_sessions - m.remaining_sessions) >= 0;

-- rem=0 인데 status 미전이 (leftover/승계 마커만)
UPDATE consultant_client_mappings m
SET
  m.status = 'SESSIONS_EXHAUSTED',
  m.end_date = COALESCE(m.end_date, NOW()),
  m.updated_at = NOW()
WHERE (m.is_deleted = 0 OR m.is_deleted = FALSE)
  AND IFNULL(m.remaining_sessions, 0) = 0
  AND m.status <> 'SESSIONS_EXHAUSTED'
  AND (
    m.notes LIKE '%[점유완료소진] 일정#%'
    OR m.notes LIKE '%[회기 승계]%'
    OR m.notes LIKE '%→ 타깃매핑#%'
  );

SELECT COUNT(*) AS still_mismatched
FROM consultant_client_mappings m
WHERE (m.is_deleted = 0 OR m.is_deleted = FALSE)
  AND (
    m.notes LIKE '%[점유완료소진] 일정#%'
    OR m.notes LIKE '%[회기 승계]%'
    OR m.notes LIKE '%→ 타깃매핑#%'
  )
  AND IFNULL(m.total_sessions, 0)
      <> (IFNULL(m.used_sessions, 0) + IFNULL(m.remaining_sessions, 0));
