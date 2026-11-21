-- 운영 P1 RCA (2026-11-11): 일정 날짜 변경 후 D-1 리마인드 재발송 여부 — 읽기 전용 SELECT 만.
-- 플레이스홀더: __TARGET_DATE__ (조회일, KST), __SINCE__ (영향 집계 시작일).
-- 출력 금지: 전화번호·이름·본문. id/상태/시각/슬롯 키만.

SELECT '== A. env' AS section;
SELECT VERSION() AS mysql_version, NOW() AS db_now, @@session.time_zone AS session_tz, @@system_time_zone AS system_tz;

SELECT '== B. schema (slot key / slot_changed_at / unique)' AS section;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE()
   AND ((TABLE_NAME = 'notification_batch_send_log' AND COLUMN_NAME IN ('target_slot_key','sent_at','success','channel_used'))
     OR (TABLE_NAME = 'schedules' AND COLUMN_NAME IN ('slot_changed_at','updated_at','is_deleted','date','start_time'))
     OR (TABLE_NAME = 'schedule_change_notification_pending' AND COLUMN_NAME IN ('previous_date','previous_start_time','created_at','updated_at','status','is_deleted')))
 ORDER BY TABLE_NAME, COLUMN_NAME;
SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_batch_send_log' AND NON_UNIQUE = 0
 GROUP BY INDEX_NAME;

SELECT '== C1. global flags (notification.*)' AS section;
SELECT IFNULL(tenant_id,'(null)') AS tenant_id, config_key, LEFT(config_value, 12) AS value, is_active
  FROM system_config
 WHERE config_key LIKE 'notification.%' AND IFNULL(is_encrypted,0) = 0
 ORDER BY config_key, tenant_id;

SELECT '== C2. SMS_TEMPLATE dispatch_enabled (D2/LATE/SINGLE)' AS section;
SELECT IFNULL(tenant_id,'(core)') AS tenant_id, code_value,
       JSON_UNQUOTE(JSON_EXTRACT(extra_data, '$.dispatch_enabled')) AS dispatch_enabled
  FROM common_codes
 WHERE code_group = 'SMS_TEMPLATE'
   AND code_value IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_LATE','RESERVATION_IMMEDIATE_SINGLE')
 ORDER BY code_value, tenant_id;

SELECT '== D. ReservationReminder 실행 로그 (조회일-1 ~ 조회일)' AS section;
SELECT tenant_id, scheduler_name, status, started_at, LEFT(IFNULL(CAST(result_data AS CHAR), IFNULL(error_message,'')), 160) AS msg
  FROM scheduler_execution_log
 WHERE scheduler_name LIKE 'ReservationReminder%'
   AND started_at >= DATE_SUB('__TARGET_DATE__', INTERVAL 1 DAY)
   AND started_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
 ORDER BY started_at, tenant_id, scheduler_name;

SELECT '== E. 조회일 일시 변경된 일정 (slot_changed_at 또는 변경 pending 생성)' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.is_deleted, s.slot_changed_at, s.updated_at,
       s.consultant_id, s.client_id
  FROM schedules s
 WHERE (s.slot_changed_at >= '__TARGET_DATE__' AND s.slot_changed_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
    OR EXISTS (SELECT 1 FROM schedule_change_notification_pending p
                WHERE p.tenant_id = s.tenant_id AND p.schedule_id = s.id
                  AND p.created_at >= '__TARGET_DATE__' AND p.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
 ORDER BY s.tenant_id, s.id;

SELECT '== F. 위 일정의 변경 pending 이력' AS section;
SELECT p.tenant_id, p.schedule_id, p.previous_date, p.previous_start_time, p.status, p.created_at, p.updated_at, p.fire_at, p.processed_at
  FROM schedule_change_notification_pending p
  JOIN schedules s ON s.tenant_id = p.tenant_id AND s.id = p.schedule_id
 WHERE (s.slot_changed_at >= '__TARGET_DATE__' AND s.slot_changed_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
    OR (p.created_at >= '__TARGET_DATE__' AND p.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
 ORDER BY p.tenant_id, p.schedule_id, p.created_at;

SELECT '== G. 위 일정의 예약 SMS 발송 이력 (전체 기간)' AS section;
SELECT l.tenant_id, l.target_id AS schedule_id, l.template_code, l.target_slot_key, l.success, l.channel_used,
       l.error_code, l.sent_at, l.recipient_user_id
  FROM notification_batch_send_log l
  JOIN schedules s ON s.tenant_id = l.tenant_id AND s.id = l.target_id
 WHERE l.target_type = 'SCHEDULE'
   AND ((s.slot_changed_at >= '__TARGET_DATE__' AND s.slot_changed_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
     OR EXISTS (SELECT 1 FROM schedule_change_notification_pending p
                 WHERE p.tenant_id = s.tenant_id AND p.schedule_id = s.id
                   AND p.created_at >= '__TARGET_DATE__' AND p.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)))
 ORDER BY l.tenant_id, l.target_id, l.sent_at;

SELECT '== H. 위 일정의 즉시 SMS pending' AS section;
SELECT q.tenant_id, q.schedule_id, q.template_code, q.status, q.fire_at, q.processed_at
  FROM immediate_reservation_sms_pending q
  JOIN schedules s ON s.tenant_id = q.tenant_id AND s.id = q.schedule_id
 WHERE (s.slot_changed_at >= '__TARGET_DATE__' AND s.slot_changed_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
    OR EXISTS (SELECT 1 FROM schedule_change_notification_pending p
                WHERE p.tenant_id = s.tenant_id AND p.schedule_id = s.id
                  AND p.created_at >= '__TARGET_DATE__' AND p.created_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY))
 ORDER BY q.tenant_id, q.schedule_id, q.fire_at;

-- 영향 집계: 기간 __SINCE__ 이후 성공 발송(D2/SINGLE/LATE) 이력이 있고, 그 발송 이후 날짜가 바뀐(변경 pending.previous_date <> 현재 date) 일정.
-- eligible = 취소·삭제 제외(지난 일정은 현재 COMPLETED 일 수 있으므로 포함). 새 슬롯 키 = 현재 date + start_time ('yyyy-MM-ddTHH:mm'). D-1 = 새 date-1 09:00 배치.
SELECT '== I. 영향 집계 (테넌트별)' AS section;
SELECT m.tenant_id,
       COUNT(*) AS moved_after_send,
       SUM(m.eligible = 0) AS cancelled_or_deleted,
       SUM(m.eligible = 1 AND m.d1_passed = 1 AND m.new_d1_sent = 1) AS d1_passed_sent_on_d1,
       SUM(m.eligible = 1 AND m.d1_passed = 1 AND m.new_d1_sent = 0 AND m.changed_before_d1 = 1) AS d1_passed_missed_moved_before_d1,
       SUM(m.eligible = 1 AND m.d1_passed = 1 AND m.new_d1_sent = 0 AND m.changed_before_d1 = 0) AS d1_passed_missed_moved_after_d1_batch,
       SUM(m.eligible = 1 AND m.d1_passed = 1 AND m.new_d1_sent = 0 AND m.new_late_any = 1) AS of_missed_new_late_other_day,
       SUM(m.eligible = 1 AND m.d1_passed = 0) AS d1_future,
       SUM(m.eligible = 1 AND m.d1_passed = 0 AND m.new_slot_success_exists = 1) AS d1_future_already_has_newslot_success,
       SUM(m.eligible = 1 AND m.d1_passed = 0 AND m.legacy_blank_late_success = 1) AS d1_future_has_blank_key_late
  FROM (
    SELECT s.tenant_id, s.id,
           (s.status IN ('BOOKED','CONFIRMED','TENTATIVE_PENDING_PAYMENT','IN_PROGRESS','COMPLETED') AND IFNULL(s.is_deleted,0) = 0) AS eligible,
           (NOW() >= TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')) AS d1_passed,
           (IFNULL(s.slot_changed_at, '1970-01-01') < TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')) AS changed_before_d1,
           EXISTS (SELECT 1 FROM notification_batch_send_log l2
                    WHERE l2.tenant_id = s.tenant_id AND l2.target_type = 'SCHEDULE' AND l2.target_id = s.id
                      AND l2.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l2.success = 1
                      AND l2.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')
                      AND DATE(l2.sent_at) = DATE_SUB(s.date, INTERVAL 1 DAY)) AS new_d1_sent,
           EXISTS (SELECT 1 FROM notification_batch_send_log l3
                    WHERE l3.tenant_id = s.tenant_id AND l3.target_type = 'SCHEDULE' AND l3.target_id = s.id
                      AND l3.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l3.success = 1
                      AND l3.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')) AS new_late_any,
           EXISTS (SELECT 1 FROM notification_batch_send_log l4
                    WHERE l4.tenant_id = s.tenant_id AND l4.target_type = 'SCHEDULE' AND l4.target_id = s.id
                      AND l4.template_code IN ('RESERVATION_IMMEDIATE_LATE','RESERVATION_REMINDER_D2') AND l4.success = 1
                      AND l4.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')) AS new_slot_success_exists,
           EXISTS (SELECT 1 FROM notification_batch_send_log l5
                    WHERE l5.tenant_id = s.tenant_id AND l5.target_type = 'SCHEDULE' AND l5.target_id = s.id
                      AND l5.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l5.success = 1
                      AND l5.target_slot_key = '') AS legacy_blank_late_success
      FROM schedules s
     WHERE EXISTS (
             SELECT 1 FROM notification_batch_send_log l
               JOIN schedule_change_notification_pending p
                 ON p.tenant_id = l.tenant_id AND p.schedule_id = l.target_id
              WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id
                AND l.success = 1
                AND l.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE')
                AND l.sent_at >= '__SINCE__'
                AND p.created_at > l.sent_at
                AND IFNULL(p.is_deleted,0) = 0
                AND p.previous_date <> s.date)
  ) m
 GROUP BY m.tenant_id WITH ROLLUP;

SELECT '== J. D-1 지난 미발송 상세 (moved_before_d1, 최대 60)' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.status IN ('BOOKED','CONFIRMED','TENTATIVE_PENDING_PAYMENT','IN_PROGRESS','COMPLETED') AND IFNULL(s.is_deleted,0) = 0
   AND NOW() >= TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')
   AND IFNULL(s.slot_changed_at, '1970-01-01') < TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')
   AND NOT EXISTS (SELECT 1 FROM notification_batch_send_log l2
                    WHERE l2.tenant_id = s.tenant_id AND l2.target_type = 'SCHEDULE' AND l2.target_id = s.id
                      AND l2.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l2.success = 1
                      AND l2.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')
                      AND DATE(l2.sent_at) = DATE_SUB(s.date, INTERVAL 1 DAY))
   AND EXISTS (
         SELECT 1 FROM notification_batch_send_log l
           JOIN schedule_change_notification_pending p
             ON p.tenant_id = l.tenant_id AND p.schedule_id = l.target_id
          WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id
            AND l.success = 1
            AND l.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE')
            AND l.sent_at >= '__SINCE__'
            AND p.created_at > l.sent_at
            AND IFNULL(p.is_deleted,0) = 0
            AND p.previous_date <> s.date)
 ORDER BY s.date DESC
 LIMIT 60;

SELECT '== K. D-1 미래(발송 예정) 상세 (최대 60)' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.status IN ('BOOKED','CONFIRMED','TENTATIVE_PENDING_PAYMENT') AND IFNULL(s.is_deleted,0) = 0
   AND NOW() < TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')
   AND EXISTS (
         SELECT 1 FROM notification_batch_send_log l
           JOIN schedule_change_notification_pending p
             ON p.tenant_id = l.tenant_id AND p.schedule_id = l.target_id
          WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id
            AND l.success = 1
            AND l.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE')
            AND l.sent_at >= '__SINCE__'
            AND p.created_at > l.sent_at
            AND IFNULL(p.is_deleted,0) = 0
            AND p.previous_date <> s.date)
 ORDER BY s.date
 LIMIT 60;

-- ===== r2: 변경 pending 미생성 경로 대비 slot_changed_at/updated_at 기준 보강 =====
SELECT '== L. 조회일 수정된 일정 + 발송 이력' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.created_at, s.updated_at, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.updated_at >= '__TARGET_DATE__' AND s.updated_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
 ORDER BY s.updated_at
 LIMIT 80;

SELECT '== M. 최근 3일 slot_changed_at 일정 + 발송 이력' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.created_at, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.slot_changed_at >= DATE_SUB('__TARGET_DATE__', INTERVAL 3 DAY)
 ORDER BY s.slot_changed_at
 LIMIT 80;

SELECT '== N. 변경 pending 일별 건수 (최근 21일)' AS section;
SELECT tenant_id, DATE(created_at) AS d, status, COUNT(*) AS n
  FROM schedule_change_notification_pending
 WHERE created_at >= DATE_SUB('__TARGET_DATE__', INTERVAL 21 DAY)
 GROUP BY tenant_id, DATE(created_at), status
 ORDER BY d, tenant_id, status;

SELECT '== O. 조회일 예약 SMS 발송분' AS section;
SELECT l.tenant_id, l.target_id AS schedule_id, l.template_code, l.target_slot_key, l.success, l.channel_used, l.error_code, l.sent_at
  FROM notification_batch_send_log l
 WHERE l.sent_at >= '__TARGET_DATE__' AND l.sent_at < DATE_ADD('__TARGET_DATE__', INTERVAL 1 DAY)
   AND l.template_code IN ('RESERVATION_IMMEDIATE_LATE','RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE')
 ORDER BY l.sent_at;

-- 영향 집계 r2: 변경 pending 대신 slot_changed_at > 성공 발송 시각 (기간 __SINCE__~). 날짜 변경 확정은 LATE/D2 슬롯 키 날짜 ≠ 현재 date.
SELECT '== P. 영향 집계 r2 (slot_changed_at 기준, 테넌트별)' AS section;
SELECT m.tenant_id,
       COUNT(*) AS changed_after_send,
       SUM(m.cancelled = 1) AS cancelled_or_deleted,
       SUM(m.cancelled = 0 AND m.date_changed_by_key = 1) AS date_changed_confirmed_by_key,
       SUM(m.cancelled = 0 AND m.has_keyed = 0) AS date_change_unknown_single_only,
       SUM(m.cancelled = 0 AND m.d1_passed = 1 AND m.new_d1_sent = 1) AS d1_passed_sent_on_d1,
       SUM(m.cancelled = 0 AND m.d1_passed = 1 AND m.new_d1_sent = 0 AND m.changed_before_d1 = 1) AS d1_passed_missed_changed_before_d1,
       SUM(m.cancelled = 0 AND m.d1_passed = 1 AND m.new_d1_sent = 0 AND m.changed_before_d1 = 0) AS d1_passed_missed_changed_after_d1_batch,
       SUM(m.cancelled = 0 AND m.d1_passed = 0) AS d1_future
  FROM (
    SELECT s.tenant_id, s.id,
           (s.status = 'CANCELLED' OR IFNULL(s.is_deleted,0) = 1) AS cancelled,
           (NOW() >= TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')) AS d1_passed,
           (s.slot_changed_at < TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')) AS changed_before_d1,
           EXISTS (SELECT 1 FROM notification_batch_send_log k
                    WHERE k.tenant_id = s.tenant_id AND k.target_type = 'SCHEDULE' AND k.target_id = s.id
                      AND k.success = 1 AND k.target_slot_key <> '' AND k.sent_at < s.slot_changed_at) AS has_keyed,
           EXISTS (SELECT 1 FROM notification_batch_send_log k2
                    WHERE k2.tenant_id = s.tenant_id AND k2.target_type = 'SCHEDULE' AND k2.target_id = s.id
                      AND k2.success = 1 AND k2.target_slot_key <> '' AND k2.sent_at < s.slot_changed_at
                      AND LEFT(k2.target_slot_key, 10) <> DATE_FORMAT(s.date,'%Y-%m-%d')) AS date_changed_by_key,
           EXISTS (SELECT 1 FROM notification_batch_send_log l2
                    WHERE l2.tenant_id = s.tenant_id AND l2.target_type = 'SCHEDULE' AND l2.target_id = s.id
                      AND l2.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l2.success = 1
                      AND l2.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')
                      AND DATE(l2.sent_at) = DATE_SUB(s.date, INTERVAL 1 DAY)) AS new_d1_sent
      FROM schedules s
     WHERE s.slot_changed_at IS NOT NULL
       AND EXISTS (SELECT 1 FROM notification_batch_send_log l
                    WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id
                      AND l.success = 1
                      AND l.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE')
                      AND l.sent_at >= '__SINCE__'
                      AND l.sent_at < s.slot_changed_at)
  ) m
 GROUP BY m.tenant_id WITH ROLLUP;

SELECT '== Q. r2 상세: 발송 후 슬롯 변경 + D-1 지났는데 새 슬롯 D-1 미발송 (최대 60)' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.created_at, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.slot_changed_at IS NOT NULL AND s.status <> 'CANCELLED' AND IFNULL(s.is_deleted,0) = 0
   AND NOW() >= TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')
   AND EXISTS (SELECT 1 FROM notification_batch_send_log k
                WHERE k.tenant_id = s.tenant_id AND k.target_type = 'SCHEDULE' AND k.target_id = s.id
                  AND k.success = 1 AND k.sent_at >= '__SINCE__' AND k.sent_at < s.slot_changed_at
                  AND k.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE'))
   AND NOT EXISTS (SELECT 1 FROM notification_batch_send_log l2
                    WHERE l2.tenant_id = s.tenant_id AND l2.target_type = 'SCHEDULE' AND l2.target_id = s.id
                      AND l2.template_code = 'RESERVATION_IMMEDIATE_LATE' AND l2.success = 1
                      AND l2.target_slot_key LIKE CONCAT(DATE_FORMAT(s.date,'%Y-%m-%d'),'T',DATE_FORMAT(s.start_time,'%H:%i'),'%')
                      AND DATE(l2.sent_at) = DATE_SUB(s.date, INTERVAL 1 DAY))
 ORDER BY s.date DESC
 LIMIT 60;

SELECT '== R. 발송 후 슬롯 변경 + D-1 미래 상세 (최대 60)' AS section;
SELECT s.tenant_id, s.id, s.date, s.start_time, s.status, s.created_at, s.slot_changed_at,
       (SELECT GROUP_CONCAT(CONCAT(l.template_code,'|',l.target_slot_key,'|',l.success,'|',DATE_FORMAT(l.sent_at,'%m-%d %H:%i')) ORDER BY l.sent_at SEPARATOR ' ; ')
          FROM notification_batch_send_log l
         WHERE l.tenant_id = s.tenant_id AND l.target_type = 'SCHEDULE' AND l.target_id = s.id) AS send_logs
  FROM schedules s
 WHERE s.slot_changed_at IS NOT NULL AND s.status <> 'CANCELLED' AND IFNULL(s.is_deleted,0) = 0
   AND NOW() < TIMESTAMP(DATE_SUB(s.date, INTERVAL 1 DAY), '09:00:00')
   AND EXISTS (SELECT 1 FROM notification_batch_send_log k
                WHERE k.tenant_id = s.tenant_id AND k.target_type = 'SCHEDULE' AND k.target_id = s.id
                  AND k.success = 1 AND k.sent_at >= '__SINCE__' AND k.sent_at < s.slot_changed_at
                  AND k.template_code IN ('RESERVATION_REMINDER_D2','RESERVATION_IMMEDIATE_SINGLE','RESERVATION_IMMEDIATE_LATE'))
 ORDER BY s.date
 LIMIT 60;
