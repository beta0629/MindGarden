-- CreateOrActivateTenant 재생성 v2 (Flyway + MySQL 8)
DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER $$

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_tenant_count INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성/활성화 중 오류: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 테넌트 존재 여부 확인
    SELECT COUNT(*) INTO v_tenant_count
    FROM tenants
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
    
    IF v_tenant_count > 0 THEN
        -- 기존 테넌트 활성화
        UPDATE tenants
        SET status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_created_by
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
        
        SET p_success = TRUE;
        SET p_message = '기존 테넌트가 활성화되었습니다.';
    ELSE
        -- 새 테넌트 생성
        INSERT INTO tenants (
            tenant_id, name, business_type, status,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            p_tenant_id, p_tenant_name, p_business_type, 'ACTIVE',
            NOW(), NOW(), p_created_by, p_created_by
        );
        
        SET p_success = TRUE;
        SET p_message = '새 테넌트가 생성되었습니다.';
    END IF;
    
    COMMIT;
END$$

DELIMITER ;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
