-- 상담일지 미작성 알림 조회 프로시저를 실제 스키마 기준으로 다시 정의한다.
-- 이전 정의(V20260424_002)는 performance_alerts 에 없는 컬럼(alert_type·title·message·related_entity_*·branch_code·
-- is_resolved)을 읽어 EXIT HANDLER 로 빠졌고(p_success=FALSE, p_total_count=NULL → API 500), 집계 SELECT 의
-- ORDER BY 도 ONLY_FULL_GROUP_BY 에서 오류였다.
-- 미작성 판정은 ScheduleRepository#findMissingConsultationLogScheduleRowsInDateRange 와 같다:
-- 세션 테넌트의 지난 일정(p_today 이전) 중 상태가 p_statuses 에 속하고, 같은 일정 id 의 상담일지·타기관 연계 일지가 없는 건.
-- 대상 상태와 오늘 날짜는 호출부(Java)가 넘긴다. 이름은 암호화 컬럼이라 돌려주지 않는다(호출부가 복호화해 채운다).
DELIMITER $$
DROP PROCEDURE IF EXISTS GetMissingConsultationRecordAlerts$$
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
END$$
DELIMITER ;
