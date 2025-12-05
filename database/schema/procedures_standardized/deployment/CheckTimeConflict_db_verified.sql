-- CheckTimeConflict 프로시저 (배포용 - DB 스키마 확인 후 작성)
DROP PROCEDURE IF EXISTS CheckTimeConflict;
CREATE PROCEDURE CheckTimeConflict(
    IN p_consultant_id BIGINT,
    IN p_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_exclude_schedule_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_has_conflict BOOLEAN,
    OUT p_conflict_reason VARCHAR(255)
)
BEGIN
    DECLARE v_conflict_count INT DEFAULT 0;
    SET p_has_conflict = FALSE;
    SET p_conflict_reason = '';
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '테넌트 ID는 필수입니다.';
    ELSEIF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '상담사 ID는 필수입니다.';
    ELSE
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedules 
        WHERE consultant_id = p_consultant_id 
          AND tenant_id = p_tenant_id
          AND date = p_date
          AND status NOT IN ('CANCELLED', 'COMPLETED')
          AND is_deleted = FALSE
          AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
          AND (
              (p_start_time >= start_time AND p_start_time < end_time) OR
              (p_end_time > start_time AND p_end_time <= end_time) OR
              (p_start_time < start_time AND p_end_time > end_time)
          );
        IF v_conflict_count > 0 THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '기존 스케줄과 시간이 겹칩니다.';
        END IF;
    END IF;
END;

