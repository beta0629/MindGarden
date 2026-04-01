-- Align ProcessOnboardingApproval first parameter with onboarding_request.id (BIGINT, V47/V58).
DROP PROCEDURE IF EXISTS ProcessOnboardingApproval;

DELIMITER $$

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BIGINT,
    IN p_tenant_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_decision_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
    DECLARE v_error_code INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_result_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_step VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_code = MYSQL_ERRNO,
            v_error_message = MESSAGE_TEXT;

        IF v_error_code = 1205 THEN
            SET p_message = CONCAT('Lock wait timeout exceeded (', v_step, ' 단계에서 발생)');
        ELSEIF v_error_code = 1213 THEN
            SET p_message = CONCAT('Deadlock found (', v_step, ' 단계에서 발생)');
        ELSEIF v_error_code = 1062 THEN
            SET p_message = CONCAT('Duplicate entry (', v_step, ' 단계에서 발생): ', v_error_message);
        ELSEIF v_error_code = 1452 THEN
            SET p_message = CONCAT('Foreign key constraint fails (', v_step, ' 단계에서 발생): ', v_error_message);
        ELSE
            SET p_message = CONCAT('오류 발생 (', v_step, ' 단계): [', v_error_code, '] ', IFNULL(v_error_message, '알 수 없는 오류'));
        END IF;

        SET p_success = FALSE;
    END;

    SET p_success = FALSE;
    SET p_message = '프로세스 시작';

    SET v_step = '테넌트 생성/활성화';
    SET @tenant_success = NULL;
    SET @tenant_message = NULL;

    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type,
        p_approved_by, NULL, NULL, p_subdomain, @tenant_success, @tenant_message
    );

    IF @tenant_success IS NULL THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@tenant_message, '메시지 없음'), ')');
        LEAVE proc_label;
    ELSEIF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', IFNULL(@tenant_message, '알 수 없는 오류'));
        LEAVE proc_label;
    ELSE
        SET v_result_message = CONCAT(v_result_message, '테넌트=OK');

        SET v_step = '역할 템플릿 적용';
        SET @role_success = NULL;
        SET @role_message = NULL;

        CALL ApplyDefaultRoleTemplates(
            p_tenant_id, p_business_type, p_approved_by,
            @role_success, @role_message
        );

        IF @role_success IS NULL THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@role_message, '메시지 없음'), ')');
            LEAVE proc_label;
        ELSEIF @role_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: ', IFNULL(@role_message, '알 수 없는 오류'));
            LEAVE proc_label;
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 역할=OK');

            SET v_step = '관리자 계정 생성';
            IF p_contact_email IS NOT NULL AND p_contact_email != ''
               AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                SET @admin_success = NULL;
                SET @admin_message = NULL;

                CALL CreateTenantAdminAccount(
                    p_tenant_id, p_contact_email, p_tenant_name,
                    p_admin_password_hash, p_approved_by,
                    @admin_success, @admin_message
                );

                IF @admin_success IS NULL THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다. (', IFNULL(@admin_message, '메시지 없음'), ')');
                    LEAVE proc_label;
                ELSEIF @admin_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: ', IFNULL(@admin_message, '알 수 없는 오류'));
                    LEAVE proc_label;
                ELSE
                    SET v_result_message = CONCAT(v_result_message, ', 관리자=OK');
                END IF;
            ELSE
                SET p_success = FALSE;
                SET p_message = '관리자 계정 생성 실패: 이메일 또는 비밀번호 해시가 제공되지 않았습니다.';
                LEAVE proc_label;
            END IF;

            SET p_success = TRUE;
            SET p_message = CONCAT('온보딩 승인 완료: ', v_result_message);
        END IF;
    END IF;
END proc_label$$

DELIMITER ;
