-- 생성 파일 — 직접 고치지 마세요.
-- 생성: scripts/database/sync/flyway-procedure-extract.sh generate
-- 원본: src/main/resources/db/migration/V20260424_002__consultation_record_alert_tenant_procedures.sql
-- 용도: 표준 프로시저 배포(개발·운영 db-diff)와 야간 운영→개발 복사 뒤 재적재.
DELIMITER //

DROP PROCEDURE IF EXISTS GetMissingConsultationRecordAlerts //

CREATE PROCEDURE GetMissingConsultationRecordAlerts(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_alerts JSON,
    OUT p_total_count INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_alerts_array JSON DEFAULT JSON_ARRAY();
    DECLARE v_error_message TEXT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('상담일지 미작성 알림 조회 중 오류 발생: ', v_error_message);
        ROLLBACK;
    END;

    SET p_success = TRUE;
    SET p_message = '상담일지 미작성 알림 조회가 완료되었습니다.';

    SELECT COUNT(*)
    INTO p_total_count
    FROM performance_alerts pa
    WHERE pa.alert_type = 'MISSING_CONSULTATION_RECORD'
      AND pa.tenant_id = p_tenant_id
      AND pa.created_at BETWEEN p_start_date AND p_end_date
      AND pa.is_deleted = FALSE;

    SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                   'id', pa.id,
                   'consultantId', pa.consultant_id,
                   'consultantName', u.name,
                   'alertType', pa.alert_type,
                   'alertLevel', pa.alert_level,
                   'title', pa.title,
                   'message', pa.message,
                   'relatedEntityType', pa.related_entity_type,
                   'relatedEntityId', pa.related_entity_id,
                   'branchCode', pa.branch_code,
                   'isResolved', pa.is_resolved,
                   'createdAt', pa.created_at,
                   'updatedAt', pa.updated_at
               )
           )
    INTO v_alerts_array
    FROM performance_alerts pa
    INNER JOIN users u ON pa.consultant_id = u.id AND u.tenant_id = p_tenant_id
    WHERE pa.alert_type = 'MISSING_CONSULTATION_RECORD'
      AND pa.tenant_id = p_tenant_id
      AND pa.created_at BETWEEN p_start_date AND p_end_date
      AND pa.is_deleted = FALSE
    ORDER BY pa.created_at DESC;

    SET p_alerts = v_alerts_array;

    IF p_total_count = 0 THEN
        SET p_message = '상담일지 미작성 알림이 없습니다.';
    END IF;
END //

DELIMITER ;
