-- SCT online draft/submit status (production, read-only).
-- SELECT only. No session statements (session READ ONLY via mysql --init-command).
-- No PII / no secrets: never select answer_text_enc, target_phone*, target_email*,
--   recipient_name, respondent_meta_json, token_hash, consent *_enc columns.
-- Output: invitation id, status, draft exists, answered item count, draft save time,
--   submitted Y/N + submitted_at only.
-- Placeholders (workflow sed): __TENANT_ID__, __TARGET_DATE__ (yyyy-MM-dd, KST day).
-- Time zone: app writes draft_saved_at/submitted_at via LocalDateTime.now() with JVM
--   default Asia/Seoul (TimeZoneConfig), so app-written DATETIMEs are KST wall clock.
--   DB-default columns (created_at/updated_at CURRENT_TIMESTAMP) follow the DB session
--   time zone; section 0 prints it, and those columns get a widened lower bound
--   (KST day start - 9h) so a UTC DB clock cannot hide today's rows.
-- Answered = not_applicable = 1 OR is_blank = 0 (is_blank set by upsertAnswer when
--   text is null/blank and not N/A). Text itself is never read.

START TRANSACTION READ ONLY;

SELECT '== 0. db clock / time zone' AS section;
SELECT NOW() AS db_now,
       @@session.time_zone AS session_tz,
       @@system_time_zone AS system_tz,
       '__TARGET_DATE__' AS target_date_kst;

SELECT '== 1. sct invitations with activity on target KST day (latest 20)' AS section;
SELECT i.id AS invitation_id,
       i.status AS invitation_status,
       CASE WHEN i.draft_saved_at IS NOT NULL OR COALESCE(a.answer_rows, 0) > 0
            THEN 'Y' ELSE 'N' END AS draft_exists,
       COALESCE(a.answered_items, 0) AS saved_answered_items,
       COALESCE(a.answer_rows, 0) AS saved_answer_rows,
       i.draft_saved_at AS last_draft_saved_at,
       a.last_answer_updated_at,
       CASE WHEN i.submitted_at IS NOT NULL OR i.status = 'SUBMITTED'
            THEN 'Y' ELSE 'N' END AS submitted,
       i.submitted_at
  FROM sct_invitations i
  LEFT JOIN (
        SELECT r.invitation_id,
               COUNT(*) AS answer_rows,
               SUM(CASE WHEN r.not_applicable = 1 OR r.is_blank = 0 THEN 1 ELSE 0 END)
                 AS answered_items,
               MAX(r.updated_at) AS last_answer_updated_at
          FROM sct_response_answers r
         WHERE r.tenant_id = '__TENANT_ID__'
         GROUP BY r.invitation_id
       ) a ON a.invitation_id = i.id
 WHERE i.tenant_id = '__TENANT_ID__'
   AND i.is_deleted = 0
   AND (
         (i.created_at >= DATE_SUB('__TARGET_DATE__ 00:00:00', INTERVAL 9 HOUR)
          AND i.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
      OR (i.updated_at >= DATE_SUB('__TARGET_DATE__ 00:00:00', INTERVAL 9 HOUR)
          AND i.updated_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
      OR (i.draft_saved_at >= '__TARGET_DATE__ 00:00:00'
          AND i.draft_saved_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
      OR (i.submitted_at >= '__TARGET_DATE__ 00:00:00'
          AND i.submitted_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
      OR (a.last_answer_updated_at >= DATE_SUB('__TARGET_DATE__ 00:00:00', INTERVAL 9 HOUR)
          AND a.last_answer_updated_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
       )
 ORDER BY GREATEST(
            COALESCE(i.submitted_at, '1970-01-01'),
            COALESCE(i.draft_saved_at, '1970-01-01'),
            COALESCE(a.last_answer_updated_at, '1970-01-01'),
            COALESCE(i.updated_at, '1970-01-01'),
            COALESCE(i.created_at, '1970-01-01')
          ) DESC,
          i.id DESC
 LIMIT 20;

ROLLBACK;
