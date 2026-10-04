-- 생성 파일 — 직접 고치지 마세요.
-- 생성: scripts/database/sync/flyway-procedure-extract.sh generate
-- 원본: src/main/resources/db/migration/V20261007_001__get_missing_consultation_record_alerts_schedule_ssot.sql
-- 용도: 표준 프로시저 배포(개발·운영 db-diff)와 야간 운영→개발 복사 뒤 재적재.
DELIMITER //

DROP PROCEDURE IF EXISTS GetMissingConsultationRecordAlerts //

CREATE PROCEDURE GetMissingConsultationRecordAlerts(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_today DATE,
    IN p_statuses VARCHAR(255),
    OUT p_alerts JSON,
    OUT p_total_count INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message TEXT;
    DECLARE v_alerts_text LONGTEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_alerts = JSON_ARRAY();
        SET p_total_count = 0;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 알림 조회 중 오류 발생: ', v_error_message);
    END;

    SET p_alerts = JSON_ARRAY();
    SET p_total_count = 0;

    IF p_tenant_id IS NULL OR p_tenant_id = '' OR p_start_date IS NULL OR p_end_date IS NULL
            OR p_today IS NULL OR p_statuses IS NULL OR p_statuses = '' THEN
        SET p_success = FALSE;
        SET p_message = '상담일지 미작성 알림 조회 조건이 올바르지 않습니다.';
    ELSE
        SET SESSION group_concat_max_len = 16777216;

        SELECT COUNT(*),
               GROUP_CONCAT(
                   JSON_OBJECT(
                       'id', s.id,
                       'scheduleId', s.id,
                       'consultantId', s.consultant_id,
                       'alertType', 'MISSING_CONSULTATION_RECORD',
                       'relatedEntityType', 'SCHEDULE',
                       'relatedEntityId', s.id,
                       'scheduleDate', s.date,
                       'startTime', s.start_time,
                       'endTime', s.end_time,
                       'status', s.status,
                       'isResolved', FALSE
                   )
                   ORDER BY s.date DESC, s.start_time DESC, s.id DESC
                   SEPARATOR ','
               )
        INTO p_total_count, v_alerts_text
        FROM schedules s
        WHERE s.tenant_id = p_tenant_id
          AND s.is_deleted = FALSE
          AND s.consultant_id IS NOT NULL
          AND FIND_IN_SET(s.status, p_statuses) > 0
          AND s.date BETWEEN p_start_date AND p_end_date
          AND s.date < p_today
          AND NOT EXISTS (
              SELECT 1 FROM consultation_records r
              WHERE r.is_deleted = FALSE
                AND r.tenant_id = s.tenant_id
                AND r.consultation_id = s.id
          )
          AND NOT EXISTS (
              SELECT 1 FROM institution_link_consultation_logs il
              WHERE il.is_deleted = FALSE
                AND il.tenant_id = s.tenant_id
                AND il.schedule_id = s.id
          );

        IF v_alerts_text IS NOT NULL THEN
            SET p_alerts = CAST(CONCAT('[', v_alerts_text, ']') AS JSON);
        END IF;

        SET p_success = TRUE;
        IF p_total_count = 0 THEN
            SET p_message = '상담일지 미작성 알림이 없습니다.';
        ELSE
            SET p_message = '상담일지 미작성 알림 조회가 완료되었습니다.';
        END IF;
    END IF;
END //

DELIMITER ;
