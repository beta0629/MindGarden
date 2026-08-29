-- =====================================================
-- 급여 확정 전 경고 조회 (hard-block 아님 — 정보만)
-- 정책: SALARY_LATE_NOTES_ADJUSTMENT_PLAN.md
-- - n not COMPLETED, n missing consultation_records, n COMPLETED now vs stored PRIMARY
-- 배포: deployment/GetSalaryPreConfirmWarning_deploy.sql twin
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetSalaryPreConfirmWarning //

CREATE PROCEDURE GetSalaryPreConfirmWarning(
    IN p_consultant_id BIGINT,
    IN p_period_start DATE,
    IN p_period_end DATE,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_not_completed_count INT,
    OUT p_missing_record_count INT,
    OUT p_current_completed_count INT,
    OUT p_stored_completed_count INT,
    OUT p_extra_completed_count INT,
    OUT p_primary_calculation_id BIGINT,
    OUT p_primary_status VARCHAR(20)
)
proc_main: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_adj_completed INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('확정 전 경고 조회 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 DB 오류'));
        SET p_not_completed_count = 0;
        SET p_missing_record_count = 0;
        SET p_current_completed_count = 0;
        SET p_stored_completed_count = 0;
        SET p_extra_completed_count = 0;
        SET p_primary_calculation_id = NULL;
        SET p_primary_status = NULL;
    END;

    SET p_success = FALSE;
    SET p_message = NULL;
    SET p_not_completed_count = 0;
    SET p_missing_record_count = 0;
    SET p_current_completed_count = 0;
    SET p_stored_completed_count = 0;
    SET p_extra_completed_count = 0;
    SET p_primary_calculation_id = NULL;
    SET p_primary_status = NULL;

    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_message = '테넌트 ID는 필수입니다.';
        LEAVE proc_main;
    END IF;

    IF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_message = '상담사 ID는 필수입니다.';
        LEAVE proc_main;
    END IF;

    IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_start > p_period_end THEN
        SET p_message = '유효한 기간을 입력해주세요.';
        LEAVE proc_main;
    END IF;

    SELECT COUNT(*) INTO p_not_completed_count
    FROM schedules s
    WHERE s.consultant_id = p_consultant_id
      AND s.tenant_id = p_tenant_id
      AND s.date BETWEEN p_period_start AND p_period_end
      AND s.is_deleted = FALSE
      AND s.status <> 'COMPLETED';

    SELECT COUNT(*) INTO p_missing_record_count
    FROM schedules s
    LEFT JOIN consultation_records cr
      ON cr.consultation_id = s.id
     AND cr.tenant_id = p_tenant_id
     AND (cr.is_deleted = FALSE OR cr.is_deleted IS NULL)
    WHERE s.consultant_id = p_consultant_id
      AND s.tenant_id = p_tenant_id
      AND s.date BETWEEN p_period_start AND p_period_end
      AND s.is_deleted = FALSE
      AND s.status = 'COMPLETED'
      AND cr.id IS NULL;

    SELECT COUNT(*) INTO p_current_completed_count
    FROM schedules s
    WHERE s.consultant_id = p_consultant_id
      AND s.tenant_id = p_tenant_id
      AND s.date BETWEEN p_period_start AND p_period_end
      AND s.is_deleted = FALSE
      AND s.status = 'COMPLETED';

    SELECT sc.id, sc.status, IFNULL(sc.completed_consultations, 0)
    INTO p_primary_calculation_id, p_primary_status, p_stored_completed_count
    FROM salary_calculations sc
    WHERE sc.consultant_id = p_consultant_id
      AND sc.tenant_id = p_tenant_id
      AND sc.calculation_period = CONCAT(YEAR(p_period_start), '-', LPAD(MONTH(p_period_start), 2, '0'))
      AND sc.is_deleted = FALSE
      AND (sc.calculation_kind = 'PRIMARY' OR sc.calculation_kind IS NULL)
    ORDER BY sc.id ASC
    LIMIT 1;

    IF p_primary_calculation_id IS NOT NULL THEN
        SELECT IFNULL(SUM(IFNULL(adj.completed_consultations, 0)), 0) INTO v_adj_completed
        FROM salary_calculations adj
        WHERE adj.parent_calculation_id = p_primary_calculation_id
          AND adj.tenant_id = p_tenant_id
          AND adj.is_deleted = FALSE
          AND IFNULL(adj.calculation_kind, 'PRIMARY') = 'ADJUSTMENT';
        SET p_stored_completed_count = IFNULL(p_stored_completed_count, 0) + IFNULL(v_adj_completed, 0);
        SET p_extra_completed_count = GREATEST(0, IFNULL(p_current_completed_count, 0) - IFNULL(p_stored_completed_count, 0));
    ELSE
        SET p_stored_completed_count = 0;
        SET p_extra_completed_count = 0;
    END IF;

    SET p_not_completed_count = IFNULL(p_not_completed_count, 0);
    SET p_missing_record_count = IFNULL(p_missing_record_count, 0);
    SET p_current_completed_count = IFNULL(p_current_completed_count, 0);

    SET p_success = TRUE;
    SET p_message = '확정 전 경고 조회가 완료되었습니다.';

END //

DELIMITER ;
