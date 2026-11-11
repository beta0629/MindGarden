-- RCA: consultant_client_mappings id=393 ACTIVE -> SESSIONS_EXHAUSTED
-- at 2026-11-11 21:14:27.368960 (DB local, Asia/Seoul).
-- SELECT only. No SET. No PII columns (name/phone/email). No raw IP.
-- No before_json/after_json/metadata_json dumps (status keys only).
-- Window: 2026-11-11 21:10:00 .. 21:20:00, plus 21:00:00 .. 21:30:00 for schedulers.

SELECT '== 1. mapping 393 columns (names/types only)' AS section;
SELECT COLUMN_NAME,
       COLUMN_TYPE,
       IS_NULLABLE,
       COLUMN_DEFAULT
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'consultant_client_mappings'
   AND COLUMN_NAME IN (
         'id','tenant_id','client_id','consultant_id','status',
         'payment_status','payment_timing','total_sessions','used_sessions',
         'remaining_sessions','is_deleted','created_at','updated_at',
         'end_date','approved_by','version','deleted_at','updated_by',
         'created_by','last_modified_by'
       )
 ORDER BY ORDINAL_POSITION;

SELECT '== 2. candidate audit/history/scheduler tables present' AS section;
SELECT TABLE_NAME
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME IN (
         'audit_logs',
         'mapping_update_logs',
         'session_usage_logs',
         'shedlock',
         'scheduler_execution_log',
         'scheduler_execution_summary',
         'session_recovery_alerts',
         'consultant_client_mappings_aud',
         'consultation_records',
         'schedules'
       )
 ORDER BY TABLE_NAME;

SELECT '== 3. mapping 393 current fields' AS section;
SELECT m.id,
       m.tenant_id,
       m.client_id,
       m.consultant_id,
       m.status,
       m.payment_status,
       m.payment_timing,
       m.total_sessions,
       m.used_sessions,
       m.remaining_sessions,
       m.is_deleted,
       m.created_at,
       m.updated_at,
       m.end_date,
       m.deleted_at,
       m.version,
       (m.approved_by IS NOT NULL) AS has_approved_by,
       CHAR_LENGTH(m.approved_by) AS approved_by_len
  FROM consultant_client_mappings m
 WHERE m.id = 393;

SELECT '== 4. mapping 393 updated_by-like columns if present' AS section;
SELECT COLUMN_NAME
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'consultant_client_mappings'
   AND COLUMN_NAME IN ('updated_by','created_by','last_modified_by','approved_by');

SELECT '== 5. audit_logs columns' AS section;
SELECT COLUMN_NAME, COLUMN_TYPE
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND TABLE_NAME = 'audit_logs'
 ORDER BY ORDINAL_POSITION;

SELECT '== 6. audit_logs rows for entity_id 393' AS section;
SELECT a.id,
       a.tenant_id,
       a.actor_user_id,
       a.actor_role,
       a.target_user_id,
       a.action,
       a.entity_type,
       a.entity_id,
       a.created_at,
       (a.ip_address IS NOT NULL AND a.ip_address <> '') AS has_ip,
       JSON_UNQUOTE(JSON_EXTRACT(a.before_json, '$.status')) AS before_status,
       JSON_UNQUOTE(JSON_EXTRACT(a.after_json, '$.status')) AS after_status,
       JSON_UNQUOTE(JSON_EXTRACT(a.before_json, '$.remainingSessions')) AS before_remaining,
       JSON_UNQUOTE(JSON_EXTRACT(a.after_json, '$.remainingSessions')) AS after_remaining,
       JSON_UNQUOTE(JSON_EXTRACT(a.before_json, '$.usedSessions')) AS before_used,
       JSON_UNQUOTE(JSON_EXTRACT(a.after_json, '$.usedSessions')) AS after_used
  FROM audit_logs a
 WHERE a.entity_id = 393
 ORDER BY a.id;

SELECT '== 7. audit_logs in 21:10-21:20 (no JSON dump)' AS section;
SELECT a.id,
       a.tenant_id,
       a.actor_user_id,
       a.actor_role,
       a.action,
       a.entity_type,
       a.entity_id,
       a.created_at,
       (a.ip_address IS NOT NULL AND a.ip_address <> '') AS has_ip
  FROM audit_logs a
 WHERE a.created_at >= '2026-11-11 21:10:00'
   AND a.created_at <  '2026-11-11 21:20:00'
 ORDER BY a.created_at, a.id;

SELECT '== 8. audit_logs counts around the change' AS section;
SELECT SUM(a.created_at >= '2026-11-11 21:10:00' AND a.created_at < '2026-11-11 21:20:00') AS cnt_21_10_20,
       SUM(a.created_at >= '2026-11-11 21:14:00' AND a.created_at < '2026-11-11 21:15:00') AS cnt_21_14,
       SUM(a.entity_id = 393) AS cnt_entity_393,
       SUM(a.entity_id = 393 AND a.created_at >= '2026-11-11 21:10:00' AND a.created_at < '2026-11-11 21:20:00') AS cnt_entity_393_in_window
  FROM audit_logs a
 WHERE a.created_at >= '2026-11-11 21:00:00'
   AND a.created_at <  '2026-11-11 21:30:00'
    OR a.entity_id = 393;

SELECT '== 9. mapping_update_logs for 393' AS section;
SELECT l.id,
       l.mapping_id,
       l.old_total_sessions,
       l.new_total_sessions,
       l.created_at,
       l.updated_at,
       CHAR_LENGTH(l.updated_by) AS updated_by_len,
       (l.updated_by REGEXP '^[0-9]+$') AS updated_by_is_numeric,
       CASE WHEN l.updated_by REGEXP '^[0-9]+$' THEN l.updated_by ELSE NULL END AS updated_by_user_id
  FROM mapping_update_logs l
 WHERE l.mapping_id = 393
 ORDER BY l.id;

SELECT '== 10. session_usage_logs for 393' AS section;
SELECT s.id,
       s.mapping_id,
       s.schedule_id,
       s.consultant_id,
       s.client_id,
       s.session_type,
       s.action_type,
       s.created_at
  FROM session_usage_logs s
 WHERE s.mapping_id = 393
 ORDER BY s.id;

SELECT '== 11. shedlock current rows' AS section;
SELECT sl.name,
       sl.locked_at,
       sl.lock_until,
       sl.locked_by
  FROM shedlock sl
 ORDER BY sl.locked_at;

SELECT '== 12. scheduler_execution_log 21:00-21:30 (mapping/session/schedule related or in 21:10-21:20)' AS section;
SELECT e.id,
       e.execution_id,
       e.tenant_id,
       e.scheduler_name,
       e.status,
       e.execution_time,
       e.started_at,
       e.completed_at,
       (e.error_message IS NOT NULL AND e.error_message <> '') AS has_error
  FROM scheduler_execution_log e
 WHERE e.started_at >= '2026-11-11 21:00:00'
   AND e.started_at <  '2026-11-11 21:30:00'
    OR (e.completed_at >= '2026-11-11 21:00:00' AND e.completed_at < '2026-11-11 21:30:00')
 ORDER BY e.started_at, e.id;

SELECT '== 13. scheduler_execution_summary 21:00-21:30' AS section;
SELECT s.id,
       s.execution_id,
       s.scheduler_name,
       s.total_tenants,
       s.success_count,
       s.failure_count,
       s.total_duration,
       s.started_at,
       s.completed_at
  FROM scheduler_execution_summary s
 WHERE s.started_at >= '2026-11-11 21:00:00'
   AND s.started_at <  '2026-11-11 21:30:00'
    OR (s.completed_at >= '2026-11-11 21:00:00' AND s.completed_at < '2026-11-11 21:30:00')
 ORDER BY s.started_at, s.id;

SELECT '== 14. session_recovery_alerts 393 or 21:00-21:30' AS section;
SELECT r.id,
       r.tenant_id,
       r.schedule_id,
       r.mapping_id,
       r.reason,
       r.created_at,
       r.updated_at,
       r.resolved_at
  FROM session_recovery_alerts r
 WHERE r.mapping_id = 393
    OR r.schedule_id IN (
         SELECT sch.id FROM schedules sch WHERE sch.mapping_id = 393
       )
    OR (r.created_at >= '2026-11-11 21:00:00' AND r.created_at < '2026-11-11 21:30:00')
    OR (r.updated_at >= '2026-11-11 21:00:00' AND r.updated_at < '2026-11-11 21:30:00')
 ORDER BY r.id;

SELECT '== 15. schedules for mapping 393 (or same pair updated in window)' AS section;
SELECT sch.id,
       sch.tenant_id,
       sch.mapping_id,
       sch.consultant_id,
       sch.client_id,
       sch.status,
       sch.session_sequence,
       sch.date,
       sch.start_time,
       sch.end_time,
       sch.created_at,
       sch.updated_at
  FROM schedules sch
 WHERE sch.mapping_id = 393
    OR (
         sch.tenant_id = 'tenant-incheon-counseling-001'
         AND sch.client_id = 108
         AND sch.consultant_id = 3
         AND sch.updated_at >= '2026-11-11 21:10:00'
         AND sch.updated_at <  '2026-11-11 21:20:00'
       )
 ORDER BY sch.id;

SELECT '== 16. consultation_records for the pair (ids/roles/timestamps only)' AS section;
SELECT cr.id,
       cr.consultation_id,
       cr.client_id,
       cr.consultant_id,
       cr.session_date,
       cr.is_session_completed,
       cr.completion_time,
       cr.created_by_user_id,
       cr.created_by_role,
       cr.updated_by_user_id,
       cr.updated_by_role,
       cr.created_at,
       cr.updated_at
  FROM consultation_records cr
 WHERE cr.client_id = 108
   AND cr.consultant_id = 3
   AND (
         cr.consultation_id IN (SELECT sch.id FROM schedules sch WHERE sch.mapping_id = 393)
         OR (cr.updated_at >= '2026-11-11 21:10:00' AND cr.updated_at < '2026-11-11 21:20:00')
         OR (cr.completion_time >= '2026-11-11 21:10:00' AND cr.completion_time < '2026-11-11 21:20:00')
       )
 ORDER BY cr.id;

SELECT '== 17. mappings of the same pair (status only, no PII)' AS section;
SELECT m.id,
       m.status,
       m.payment_timing,
       m.payment_status,
       m.total_sessions,
       m.used_sessions,
       m.remaining_sessions,
       m.created_at,
       m.updated_at,
       m.end_date,
       m.version
  FROM consultant_client_mappings m
 WHERE m.tenant_id = 'tenant-incheon-counseling-001'
   AND m.client_id = 108
   AND m.consultant_id = 3
 ORDER BY m.id;
