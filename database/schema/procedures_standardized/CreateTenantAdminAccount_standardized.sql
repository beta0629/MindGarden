-- 생성 파일 — 직접 고치지 마세요.
-- 생성: scripts/database/sync/flyway-procedure-extract.sh generate
-- 원본: src/main/resources/sql/procedures/create_tenant_admin_account.sql
-- 용도: 표준 프로시저 배포(개발·운영 db-diff)와 야간 운영→개발 복사 뒤 재적재.
DELIMITER //

DROP PROCEDURE IF EXISTS CreateTenantAdminAccount //

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
END //

DELIMITER ;
