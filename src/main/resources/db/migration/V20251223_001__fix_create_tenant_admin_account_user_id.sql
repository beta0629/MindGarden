-- V20251223_001: CreateTenantAdminAccount 프로시저 수정 - username을 user_id로 변경
-- 목적: users 테이블이 username이 아닌 user_id를 사용하므로 프로시저 수정
-- 문제: 프로시저가 username 컬럼을 사용하여 INSERT 실패
-- 해결: user_id 컬럼을 사용하도록 수정

DELIMITER //

DROP PROCEDURE IF EXISTS CreateTenantAdminAccount //

CREATE PROCEDURE CreateTenantAdminAccount(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_user_count INT DEFAULT 0;
    DECLARE v_user_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('관리자 계정 생성 중 오류: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    START TRANSACTION;
    
    -- 이미 계정이 있는지 확인
    SELECT COUNT(*) INTO v_user_count
    FROM users
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
        AND email COLLATE utf8mb4_unicode_ci = p_contact_email COLLATE utf8mb4_unicode_ci
        AND (is_deleted IS NULL OR is_deleted = FALSE);
    
    IF v_user_count > 0 THEN
        SET p_success = TRUE;
        SET p_message = '관리자 계정이 이미 존재합니다.';
        COMMIT;
    ELSE
        -- user_id 생성 (email의 @ 앞부분 사용)
        SET v_user_id = LOWER(SUBSTRING_INDEX(p_contact_email, '@', 1));
        
        -- user_id 중복 체크 및 고유성 보장
        SET @counter = 1;
        WHILE EXISTS (
            SELECT 1 FROM users
            WHERE user_id COLLATE utf8mb4_unicode_ci = v_user_id COLLATE utf8mb4_unicode_ci
                AND (is_deleted IS NULL OR is_deleted = FALSE)
        ) AND @counter <= 1000 DO
            SET v_user_id = CONCAT(LOWER(SUBSTRING_INDEX(p_contact_email, '@', 1)), @counter);
            SET @counter = @counter + 1;
        END WHILE;
        
        -- 1000번 시도 후에도 중복이면 UUID 기반으로 변경
        IF @counter > 1000 THEN
            SET v_user_id = CONCAT('admin-', REPLACE(UUID(), '-', ''), '-', SUBSTRING(p_tenant_id, 1, 8));
        END IF;
        
        -- 관리자 계정 생성
        INSERT INTO users (
            user_id, tenant_id, email, password, name, role,
            is_active, is_email_verified, is_social_account,
            created_at, updated_at, created_by, updated_by, is_deleted, version
        ) VALUES (
            v_user_id, p_tenant_id, p_contact_email, p_admin_password_hash,
            CONCAT(p_tenant_name, ' 관리자'), 'ADMIN',
            TRUE, TRUE, FALSE,
            NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('관리자 계정이 생성되었습니다. (user_id: ', v_user_id, ')');
        
        COMMIT;
    END IF;
END //

DELIMITER ;

