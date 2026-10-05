-- =====================================================
-- 매핑 정보 수정 프로시저 (표준화 버전)
-- 호출: StoredProcedureServiceImpl.updateMappingInfo — IN 6개(p_tenant_id 포함) + OUT 2개
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
    DECLARE v_old_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_old_total_sessions INT DEFAULT 0;
    DECLARE v_consultant_id BIGINT DEFAULT 0;
    DECLARE v_client_id BIGINT DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_price_difference DECIMAL(15,2) DEFAULT 0;
    DECLARE v_session_difference INT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('매핑 정보 수정 중 오류 발생: ', v_error_message);
    END;

    START TRANSACTION;

    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        ROLLBACK;
        LEAVE main_proc;
    END IF;

    -- 2. 기존 매핑 정보 조회 (테넌트 격리)
    SELECT 
        package_price,
        total_sessions,
        consultant_id,
        client_id,
        payment_amount
    INTO 
        v_old_package_price,
        v_old_total_sessions,
        v_consultant_id,
        v_client_id,
        v_payment_amount
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 3. 매핑 존재 여부 확인
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;

    IF v_mapping_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑을 찾을 수 없습니다.';
        ROLLBACK;
        LEAVE main_proc;
    ELSE
        -- 3. 가격 및 세션 차이 계산
        SET v_price_difference = p_new_package_price - v_old_package_price;
        SET v_session_difference = p_new_total_sessions - v_old_total_sessions;

        -- 4. 매핑 정보 업데이트 (테넌트 격리)
        UPDATE consultant_client_mappings 
        SET 
            package_name = p_new_package_name,
            package_price = p_new_package_price,
            total_sessions = p_new_total_sessions,
            remaining_sessions = remaining_sessions + v_session_difference,
            payment_amount = p_new_package_price,
            updated_at = NOW(),
            updated_by = p_updated_by,
            version = version + 1
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;

        -- 5. 매핑 변경 이력 기록
        INSERT INTO mapping_change_history (
            mapping_id,
            change_type,
            old_value,
            new_value,
            description,
            changed_at,
            changed_by
        ) VALUES (
            p_mapping_id,
            'PACKAGE_UPDATE',
            CONCAT('패키지: ', v_old_package_price, '원, 세션: ', v_old_total_sessions, '회'),
            CONCAT('패키지: ', p_new_package_price, '원, 세션: ', p_new_total_sessions, '회'),
            '패키지 정보 수정',
            NOW(),
            p_updated_by
        );

        -- 6. ERP 재무 거래 데이터 동기화 (테넌트 격리)
        -- 6-1. 기존 INCOME 거래 삭제 (논리 삭제 - 여러 개일 수 있으므로 모두 처리)
        UPDATE financial_transactions 
        SET 
            is_deleted = TRUE,
            description = CONCAT('패키지 수정으로 인한 삭제 - ', description),
            updated_at = NOW(),
            updated_by = p_updated_by
        WHERE 
            related_entity_type = 'CONSULTANT_CLIENT_MAPPING' 
            AND related_entity_id = p_mapping_id
            AND tenant_id = p_tenant_id
            AND transaction_type = 'INCOME'
            AND category = 'CONSULTATION'
            AND is_deleted = FALSE;
        
        -- 6-2. 새로운 패키지 금액으로 수입 거래 생성
        INSERT INTO financial_transactions (
            transaction_type,
            category,
            subcategory,
            amount,
            description,
            related_entity_id,
            related_entity_type,
            tenant_id,
            transaction_date,
            status,
            is_deleted,
            tax_included,
            created_at,
            updated_at,
            created_by
        ) VALUES (
            'INCOME',
            'CONSULTATION',
            'PACKAGE_SALE',
            p_new_package_price,
            CONCAT('상담료 입금 확인 - ', p_new_package_name, ' (', p_new_package_price, '원) - 패키지 수정: ', v_old_package_price, '원 → ', p_new_package_price, '원'),
            p_mapping_id,
            'CONSULTANT_CLIENT_MAPPING',
            p_tenant_id,
            NOW(),
            'COMPLETED',
            FALSE,
            FALSE,
            NOW(),
            NOW(),
            p_updated_by
        );

        COMMIT;
        SET p_success = TRUE;
        SET p_message = '매핑 정보가 성공적으로 수정되었습니다.';
    END IF;
END //

DELIMITER ;
