-- SyncAllMappings: Java(PlSqlMappingSyncServiceImpl)와 동일 시그니처로 정합.
-- 레거시 3-OUT 전용 정의(production_mapping_procedures.sql 등)와 달리
-- IN p_tenant_id, IN p_synced_by + OUT 3개. 배포 후 검증: SHOW CREATE PROCEDURE SyncAllMappings;
-- (동일 저장소: database/schema/procedures_standardized/SyncAllMappings_standardized.sql)

DROP PROCEDURE IF EXISTS SyncAllMappings;

DELIMITER $$

CREATE PROCEDURE SyncAllMappings(
    IN p_tenant_id VARCHAR(100),
    IN p_synced_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_sync_results JSON
)
proc: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_mappings INT DEFAULT 0;
    DECLARE v_valid_mappings INT DEFAULT 0;
    DECLARE v_invalid_mappings INT DEFAULT 0;
    DECLARE v_fixed_mappings INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;

    DECLARE v_mapping_id BIGINT DEFAULT 0;
    DECLARE v_val_success BOOLEAN;
    DECLARE v_val_message TEXT;
    DECLARE v_val_json JSON;
    DECLARE v_consultant_id BIGINT;
    DECLARE v_client_id BIGINT;
    DECLARE v_actual_used INT DEFAULT 0;

    DECLARE mapping_cursor CURSOR FOR
        SELECT id FROM consultant_client_mappings
        WHERE tenant_id = p_tenant_id
          AND status IN ('ACTIVE', 'COMPLETED')
          AND is_deleted = FALSE;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('전체 동기화 중 오류 발생: ', v_error_message);
        SET p_sync_results = JSON_OBJECT('error', v_error_message);
    END;

    START TRANSACTION;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_sync_results = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
        ROLLBACK;
        LEAVE proc;
    END IF;

    SELECT COUNT(*) INTO v_total_mappings
    FROM consultant_client_mappings
    WHERE tenant_id = p_tenant_id
      AND status IN ('ACTIVE', 'COMPLETED')
      AND is_deleted = FALSE;

    OPEN mapping_cursor;

    read_loop: LOOP
        FETCH mapping_cursor INTO v_mapping_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL ValidateMappingIntegrity(
            v_mapping_id,
            p_tenant_id,
            v_val_success,
            v_val_message,
            v_val_json
        );

        IF v_val_success THEN
            SET v_valid_mappings = v_valid_mappings + 1;
        ELSE
            SET v_invalid_mappings = v_invalid_mappings + 1;

            SELECT consultant_id, client_id
            INTO v_consultant_id, v_client_id
            FROM consultant_client_mappings
            WHERE id = v_mapping_id
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;

            SELECT COUNT(*) INTO v_actual_used
            FROM schedules
            WHERE consultant_id = v_consultant_id
              AND client_id = v_client_id
              AND tenant_id = p_tenant_id
              AND status IN ('COMPLETED', 'BOOKED')
              AND is_deleted = FALSE;

            UPDATE consultant_client_mappings
            SET
                used_sessions = v_actual_used,
                remaining_sessions = total_sessions - v_actual_used,
                updated_at = NOW(),
                updated_by = p_synced_by
            WHERE id = v_mapping_id
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;

            SET v_fixed_mappings = v_fixed_mappings + 1;
        END IF;
    END LOOP;

    CLOSE mapping_cursor;

    SET p_sync_results = JSON_OBJECT(
        'total_mappings', v_total_mappings,
        'valid_mappings', v_valid_mappings,
        'invalid_mappings', v_invalid_mappings,
        'fixed_mappings', v_fixed_mappings,
        'sync_timestamp', NOW()
    );

    SET p_success = TRUE;
    SET p_message = CONCAT('전체 동기화 완료. 총 ', v_total_mappings, '개 매핑 중 ', v_valid_mappings, '개 유효, ', v_fixed_mappings, '개 수정');

    COMMIT;

END proc$$

DELIMITER ;
