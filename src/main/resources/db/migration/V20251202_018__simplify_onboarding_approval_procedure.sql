-- V20251202_018: ProcessOnboardingApproval 프로시저 단순화
-- 목적: 필수 프로시저만 실행하고 나머지는 선택적 처리
-- 원칙: 역할 생성과 관리자 계정 생성만 필수, 나머지는 실패해도 진행

DROP PROCEDURE IF EXISTS ProcessOnboardingApproval;

DELIMITER //

CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BINARY(16),
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_decision_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_result_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 프로세스 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '프로세스 시작';
    
    START TRANSACTION;
    
    -- 1. 테넌트 생성/활성화 (필수)
    -- CreateOrActivateTenant는 8개 파라미터 (V62 버전)를 사용
    -- 관리자 계정은 별도 프로시저로 생성하므로 NULL 전달
    SET @tenant_success = NULL;
    SET @tenant_message = NULL;
    
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, NULL, NULL, @tenant_success, @tenant_message
    );
    
    -- 변수 값 확인 및 처리
    IF @tenant_success IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 생성 실패: 프로시저가 성공 값을 반환하지 않았습니다.';
        ROLLBACK;
        LEAVE proc_label;
    ELSEIF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', IFNULL(@tenant_message, '알 수 없는 오류'));
        ROLLBACK;
        LEAVE proc_label;
    ELSE
        SET v_result_message = CONCAT(v_result_message, '테넌트=OK');
        
        -- 2. 기본 역할 템플릿 적용 (필수)
        SET @role_success = NULL;
        SET @role_message = NULL;
        
        CALL ApplyDefaultRoleTemplates(
            p_tenant_id, p_business_type, p_approved_by,
            @role_success, @role_message
        );
        
        IF @role_success IS NULL OR @role_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('역할 템플릿 적용 실패: ', IFNULL(@role_message, '알 수 없는 오류'));
            ROLLBACK;
            LEAVE proc_label;
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 역할=OK');
            
            -- 3. 관리자 계정 생성 (필수)
            IF p_contact_email IS NOT NULL AND p_contact_email != ''
               AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                SET @admin_success = NULL;
                SET @admin_message = NULL;
                
                CALL CreateTenantAdminAccount(
                    p_tenant_id, p_contact_email, p_tenant_name,
                    p_admin_password_hash, p_approved_by,
                    @admin_success, @admin_message
                );
                
                IF @admin_success IS NULL OR @admin_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('관리자 계정 생성 실패: ', IFNULL(@admin_message, '알 수 없는 오류'));
                    ROLLBACK;
                    LEAVE proc_label;
                ELSE
                    SET v_result_message = CONCAT(v_result_message, ', 관리자=OK');
                END IF;
            END IF;
            
            -- 모든 필수 단계 성공
            SET p_success = TRUE;
            SET p_message = CONCAT('온보딩 승인 완료: ', v_result_message);
            COMMIT;
        END IF;
    END IF;
END //

DELIMITER ;

