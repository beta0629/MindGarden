-- =====================================================
-- 매핑 정보 수정 프로시저 (표준화 버전)
-- 호출: StoredProcedureServiceImpl.updateMappingInfo — IN 6개(p_tenant_id 포함) + OUT 2개
-- 매칭 필드(패키지명·금액·총 회기·잔여 회기)만 고친다.
--   - 재무 거래(financial_transactions)는 쓰지 않는다: 입금 확인된 매칭의 금액 차액 조정 전표는
--     Java MappingPackageLedgerService 가 유일한 writer 다.
--   - Flyway 밖 테이블(mapping_change_history)은 쓰지 않는다.
--   - payment_amount(실제 결제액)는 바꾸지 않는다: 감액 하한(결제액 - 누적 환불액) 기준이다.
--   - START TRANSACTION / COMMIT / ROLLBACK 이 없다: 호출자 트랜잭션(같은 커넥션)에 참여하고
--     커밋·롤백은 호출자가 한다. 실패하면 p_success = FALSE 를 돌려주고 호출자가 롤백한다.
-- UpdateMappingStatistics 는 표준 세트 밖(폐기 검토)이라 호출하지 않는다.
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS UpdateMappingInfo //

CREATE PROCEDURE UpdateMappingInfo(
    IN p_mapping_id BIGINT,
    IN p_new_package_name VARCHAR(255),
    IN p_new_package_price DECIMAL(15,2),
    IN p_new_total_sessions INT,
    IN p_tenant_id VARCHAR(100),
    IN p_updated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
main_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_old_total_sessions INT DEFAULT 0;
    DECLARE v_session_difference INT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('매핑 정보 수정 중 오류 발생: ', v_error_message);
    END;

    SET p_success = FALSE;
    SET p_message = NULL;

    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_message = '테넌트 ID는 필수입니다.';
        LEAVE main_proc;
    END IF;

    -- 2. 매핑 존재 여부 확인 (테넌트 격리)
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;

    IF v_mapping_count = 0 THEN
        SET p_message = '매핑을 찾을 수 없습니다.';
        LEAVE main_proc;
    END IF;

    -- 3. 기존 총 회기 조회 (테넌트 격리)
    SELECT COALESCE(total_sessions, 0)
    INTO v_old_total_sessions
    FROM consultant_client_mappings
    WHERE id = p_mapping_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;

    SET v_session_difference = p_new_total_sessions - v_old_total_sessions;

    -- 4. 매핑 필드만 업데이트 (테넌트 격리)
    UPDATE consultant_client_mappings
    SET
        package_name = p_new_package_name,
        package_price = p_new_package_price,
        total_sessions = p_new_total_sessions,
        remaining_sessions = remaining_sessions + v_session_difference,
        updated_at = NOW(),
        updated_by = p_updated_by,
        version = version + 1
    WHERE id = p_mapping_id
      AND tenant_id = p_tenant_id
      AND is_deleted = FALSE;

    SET p_success = TRUE;
    SET p_message = '매핑 정보가 성공적으로 수정되었습니다.';
END //

DELIMITER ;
