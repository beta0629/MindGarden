-- 운영 읽기 전용. 내담자 1명(이상)의 일정·매핑·일지 구조만. 이름·연락처·본문 없음.
-- 세션은 READ ONLY. 페이아웃·급여·재무 전표 테이블은 조회하지 않는다.
-- __CLIENT_IDS__ 는 워크플로가 정수 목록으로만 치환한다.

SELECT '=== A schedules (cancelled included, date order) ===' AS section;
SELECT
  s.id,
  s.tenant_id,
  s.client_id,
  s.consultant_id,
  s.`date` AS schedule_date,
  TIME_FORMAT(s.start_time, '%H:%i:%s') AS start_time,
  s.status,
  s.mapping_id,
  s.session_sequence,
  s.is_deleted + 0 AS is_deleted
FROM schedules s
WHERE s.client_id IN (__CLIENT_IDS__)
ORDER BY s.client_id, s.`date`, s.start_time, s.id;

SELECT '=== A mappings ===' AS section;
SELECT
  m.id,
  m.tenant_id,
  m.client_id,
  m.consultant_id,
  m.status,
  m.total_sessions,
  m.used_sessions,
  m.remaining_sessions,
  m.payment_status,
  m.created_at,
  m.is_deleted + 0 AS is_deleted
FROM consultant_client_mappings m
WHERE m.client_id IN (__CLIENT_IDS__)
ORDER BY m.client_id, m.id;

SELECT '=== A consultation_records joined to schedule status ===' AS section;
SELECT
  cr.id,
  cr.tenant_id,
  cr.client_id,
  cr.consultation_id,
  cr.session_number,
  cr.session_date,
  cr.is_session_completed + 0 AS is_session_completed,
  cr.is_deleted + 0 AS record_is_deleted,
  s.status AS schedule_status,
  s.session_sequence AS schedule_session_sequence,
  s.mapping_id AS schedule_mapping_id,
  s.is_deleted + 0 AS schedule_is_deleted
FROM consultation_records cr
LEFT JOIN schedules s
  ON s.id = cr.consultation_id
 AND s.tenant_id = cr.tenant_id
WHERE cr.client_id IN (__CLIENT_IDS__)
ORDER BY cr.client_id, cr.session_date, cr.id;
