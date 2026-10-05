-- CreateTenantAdminAccount. PlSqlInitializer 가 기동 때마다 이 파일을 강제 적용한다.
-- 적용된 Flyway V20251223_001 은 수정하지 않는다. 그 파일의 p_contact_email 은 VARCHAR(100) 이고
-- 이메일 로컬 파트로 user_id 를 만든다. 암호문에는 @ 가 없어 그 방식으로는 user_id 가 깨진다.
-- p_contact_email: Java safeEncrypt 결과. users.email VARCHAR(512) NOT NULL (V20260614_002).
-- p_admin_user_id: TenantAdminUserIdAllocator 가 만든 베이스. 이메일 로컬 파트가 아니다.
-- users.user_id VARCHAR(50). 유일성은 (tenant_id, user_id) — V20261011_001 UK_users_tenant_user_id.
-- 중복 판정은 soft-delete 를 빼지 않는다. UNIQUE 가 삭제 행을 포함하기 때문이다.
-- 이 파일은 암호화를 구현하지 않는다. 받은 이메일을 그대로 users.email 에 넣는다.

DROP PROCEDURE IF EXISTS CreateTenantAdminAccount;

DELIMITER $$

CREATE PROCEDURE CreateTenantAdminAccount(
    IN p_tenant_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_user_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_user_count INT DEFAULT 0;
    DECLARE v_user_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('관리자 계정 생성 중 오류: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;

    IF p_admin_user_id IS NULL OR p_admin_user_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '관리자 계정 생성 실패: user_id 가 제공되지 않았습니다.';
    ELSE
        SELECT COUNT(*) INTO v_user_count
        FROM users
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
            AND email COLLATE utf8mb4_unicode_ci = p_contact_email COLLATE utf8mb4_unicode_ci
            AND (is_deleted IS NULL OR is_deleted = FALSE);

        IF v_user_count > 0 THEN
            SET p_success = TRUE;
            SET p_message = '관리자 계정이 이미 존재합니다.';
        ELSE
            SET v_user_id = p_admin_user_id;

            SET @counter = 1;
            WHILE EXISTS (
                SELECT 1 FROM users
                WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                    AND user_id COLLATE utf8mb4_unicode_ci = v_user_id COLLATE utf8mb4_unicode_ci
            ) AND @counter <= 1000 DO
                IF CHAR_LENGTH(CONCAT(p_admin_user_id, @counter)) <= 50 THEN
                    SET v_user_id = CONCAT(p_admin_user_id, @counter);
                ELSE
                    SET v_user_id = LEFT(CONCAT('adm-', REPLACE(UUID(), '-', '')), 50);
                END IF;
                SET @counter = @counter + 1;
            END WHILE;

            IF @counter > 1000 THEN
                SET v_user_id = LEFT(CONCAT('adm-', REPLACE(UUID(), '-', '')), 50);
            END IF;

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
        END IF;
    END IF;
END$$

DELIMITER ;
