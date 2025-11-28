-- ============================================
-- CreateOrActivateTenant 프로시저 수정 (v2)
-- ============================================
-- 목적: tenants 테이블 구조에 맞게 수정
-- 작성일: 2025-11-26
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS CreateOrActivateTenant //

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_error_message VARCHAR(500);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 테넌트 존재 확인
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id = p_tenant_id;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        UPDATE tenants
        SET 
            status = 'ACTIVE',
            subscription_status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_approved_by,
            is_deleted = FALSE
        WHERE tenant_id = p_tenant_id;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 활성화 완료: ', p_tenant_id);
    ELSE
        -- 새 테넌트 생성
        INSERT INTO tenants (
            tenant_id,
            name,
            business_type,
            status,
            subscription_status,
            created_at,
            updated_at,
            created_by,
            updated_by,
            is_deleted,
            version,
            lang_code
        ) VALUES (
            p_tenant_id,
            p_tenant_name,
            p_business_type,
            'ACTIVE',
            'ACTIVE',
            NOW(),
            NOW(),
            p_approved_by,
            p_approved_by,
            0,
            0,
            'ko'
        );
        
        -- 기본 테넌트 코드 복사 시도
        CALL CopyDefaultTenantCodes(
            p_tenant_id,
            'tenant-seoul-consultation-002',
            p_approved_by,
            @copy_success,
            @copy_message
        );
        
        IF @copy_success = TRUE THEN
            SET p_success = TRUE;
            SET p_message = CONCAT('테넌트 생성 완료 (코드 복사 성공): ', p_tenant_id);
        ELSE
            SET p_success = TRUE;  -- 코드 복사 실패해도 테넌트 생성은 성공으로 처리
            SET p_message = CONCAT('테넌트 생성 완료 (코드 복사 실패: ', @copy_message, '): ', p_tenant_id);
        END IF;
    END IF;
    
    COMMIT;
END //

DELIMITER ;

-- 완료 메시지
SELECT 'CreateOrActivateTenant 프로시저 수정 완료 (v2)' AS message;
