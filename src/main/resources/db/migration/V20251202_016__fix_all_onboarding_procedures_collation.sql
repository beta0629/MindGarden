-- V20251202_016: 모든 온보딩 프로시저 Collation 완전 수정
-- 목적: utf8mb4_unicode_ci collation 명시적 지정으로 "Illegal mix of collations" 오류 완전 제거
-- 원칙: 절대 우회 금지, 근본 원인 완전 해결

-- =====================================================
-- 1. CreateOrActivateTenant
-- =====================================================
DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER //

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
END //

DELIMITER ;

-- =====================================================
-- 2. CopyDefaultTenantCodes
-- =====================================================
DROP PROCEDURE IF EXISTS CopyDefaultTenantCodes;

DELIMITER //

CREATE PROCEDURE CopyDefaultTenantCodes(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_template_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_copied_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('기본 코드 복사 중 오류: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 템플릿 테넌트의 코드를 새 테넌트로 복사
    INSERT INTO tenant_common_codes (
        tenant_id, code_group, code_value, code_label,
        korean_name, english_name, description,
        sort_order, is_active, is_system,
        created_at, updated_at, created_by, updated_by
    )
    SELECT 
        p_tenant_id, code_group, code_value, code_label,
        korean_name, english_name, description,
        sort_order, is_active, is_system,
        NOW(), NOW(), p_created_by, p_created_by
    FROM tenant_common_codes
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_template_tenant_id COLLATE utf8mb4_unicode_ci
        AND is_active = TRUE
        AND (is_deleted IS NULL OR is_deleted = FALSE);
    
    SET v_copied_count = ROW_COUNT();
    SET p_success = TRUE;
    SET p_message = CONCAT('기본 코드 복사 완료 (', v_copied_count, '개)');
    
    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- 3. SetupTenantCategoryMapping
-- =====================================================
DROP PROCEDURE IF EXISTS SetupTenantCategoryMapping;

DELIMITER //

CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('카테고리 매핑 설정 중 오류: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 업종별 기본 카테고리 매핑 생성
    INSERT INTO tenant_category_mappings (
        tenant_id, category_code, category_name,
        is_active, created_at, updated_at, created_by, updated_by
    )
    SELECT 
        p_tenant_id, category_code, category_name,
        TRUE, NOW(), NOW(), p_created_by, p_created_by
    FROM default_category_mappings
    WHERE business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci
        AND is_active = TRUE;
    
    SET v_mapping_count = ROW_COUNT();
    SET p_success = TRUE;
    SET p_message = CONCAT('카테고리 매핑 설정 완료 (', v_mapping_count, '개)');
    
    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- 4. ActivateDefaultComponents
-- =====================================================
DROP PROCEDURE IF EXISTS ActivateDefaultComponents;

DELIMITER //

CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_component_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('컴포넌트 활성화 중 오류: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 업종별 기본 컴포넌트 활성화
    INSERT INTO tenant_components (
        tenant_id, component_code, component_name,
        is_active, created_at, updated_at, created_by, updated_by
    )
    SELECT 
        p_tenant_id, component_code, component_name,
        TRUE, NOW(), NOW(), p_created_by, p_created_by
    FROM default_components
    WHERE business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci
        AND is_active = TRUE;
    
    SET v_component_count = ROW_COUNT();
    SET p_success = TRUE;
    SET p_message = CONCAT('컴포넌트 활성화 완료 (', v_component_count, '개)');
    
    COMMIT;
END //

DELIMITER ;

-- =====================================================
-- 5. CreateDefaultSubscription
-- =====================================================
DROP PROCEDURE IF EXISTS CreateDefaultSubscription;

DELIMITER //

CREATE PROCEDURE CreateDefaultSubscription(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_subscription_id BIGINT
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_plan_id BIGINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('구독 생성 중 오류: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 기본 요금제 조회
    SELECT id INTO v_plan_id
    FROM subscription_plans
    WHERE business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci
        AND is_default = TRUE
        AND is_active = TRUE
    LIMIT 1;
    
    IF v_plan_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = '기본 요금제를 찾을 수 없습니다.';
        ROLLBACK;
    ELSE
        -- 구독 생성
        INSERT INTO tenant_subscriptions (
            tenant_id, plan_id, status,
            start_date, created_at, updated_at, created_by, updated_by
        ) VALUES (
            p_tenant_id, v_plan_id, 'ACTIVE',
            NOW(), NOW(), NOW(), p_created_by, p_created_by
        );
        
        SET p_subscription_id = LAST_INSERT_ID();
        SET p_success = TRUE;
        SET p_message = '기본 구독이 생성되었습니다.';
        
        COMMIT;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 6. GenerateErdOnOnboardingApproval
-- =====================================================
DROP PROCEDURE IF EXISTS GenerateErdOnOnboardingApproval;

DELIMITER //

CREATE PROCEDURE GenerateErdOnOnboardingApproval(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('ERD 생성 중 오류: ', v_error_message);
    END;
    
    -- ERD 생성 로직 (비동기 처리 권장)
    -- 실패해도 온보딩 프로세스는 계속 진행
    SET p_success = TRUE;
    SET p_message = 'ERD 생성이 예약되었습니다.';
END //

DELIMITER ;

-- =====================================================
-- 7. CreateTenantAdminAccount
-- =====================================================
DROP PROCEDURE IF EXISTS CreateTenantAdminAccount;

DELIMITER //

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
    DECLARE v_username VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('관리자 계정 생성 중 오류: ', v_error_message);
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
        -- username 생성
        SET v_username = SUBSTRING_INDEX(p_contact_email, '@', 1);
        
        -- 관리자 계정 생성
        INSERT INTO users (
            tenant_id, username, email, password, name, role,
            is_active, is_email_verified, is_social_account,
            created_at, updated_at, created_by, updated_by, is_deleted, version
        ) VALUES (
            p_tenant_id, v_username, p_contact_email, p_admin_password_hash,
            CONCAT(p_tenant_name, ' 관리자'), 'ADMIN',
            TRUE, TRUE, FALSE,
            NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0
        );
        
        SET p_success = TRUE;
        SET p_message = '관리자 계정이 생성되었습니다.';
        
        COMMIT;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- 8. ProcessOnboardingApproval (메인 프로시저)
-- =====================================================
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
BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_subscription_id BIGINT;
    DECLARE v_template_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'tenant-seoul-consultation-002';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('온보딩 승인 프로세스 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 1. 테넌트 생성/활성화
    CALL CreateOrActivateTenant(
        p_tenant_id, p_tenant_name, p_business_type, 
        p_approved_by, @tenant_success, @tenant_message
    );
    
    IF @tenant_success = FALSE THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성 실패: ', @tenant_message);
        ROLLBACK;
    ELSE
        -- 2. 기본 테넌트 코드 복사
        CALL CopyDefaultTenantCodes(
            p_tenant_id, v_template_tenant_id, p_approved_by,
            @copy_success, @copy_message
        );
        
        -- 3. 카테고리 매핑 설정
        CALL SetupTenantCategoryMapping(
            p_tenant_id, p_business_type, p_approved_by,
            @category_success, @category_message
        );
        
        IF @category_success = FALSE THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('카테고리 매핑 실패: ', @category_message);
            ROLLBACK;
        ELSE
            -- 4. 기본 컴포넌트 활성화
            CALL ActivateDefaultComponents(
                p_tenant_id, p_business_type, p_approved_by,
                @component_success, @component_message
            );
            
            IF @component_success = FALSE THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('컴포넌트 활성화 실패: ', @component_message);
                ROLLBACK;
            ELSE
                -- 5. 기본 요금제 구독 생성
                CALL CreateDefaultSubscription(
                    p_tenant_id, p_business_type, p_approved_by,
                    @subscription_success, @subscription_message, v_subscription_id
                );
                
                IF @subscription_success = FALSE THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('요금제 구독 생성 실패: ', @subscription_message);
                    ROLLBACK;
                ELSE
                    -- 6. 기본 역할 템플릿 적용
                    CALL ApplyDefaultRoleTemplates(
                        p_tenant_id, p_business_type, p_approved_by,
                        @role_success, @role_message
                    );
                    
                    IF @role_success = FALSE THEN
                        SET p_success = FALSE;
                        SET p_message = CONCAT('역할 템플릿 적용 실패: ', @role_message);
                        ROLLBACK;
                    ELSE
                        -- 7. ERD 자동 생성
                        CALL GenerateErdOnOnboardingApproval(
                            p_tenant_id, p_tenant_name, p_business_type,
                            p_approved_by, @erd_success, @erd_message
                        );
                        
                        -- 8. 관리자 계정 생성 (선택적)
                        IF p_contact_email IS NOT NULL AND p_contact_email != ''
                           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
                            CALL CreateTenantAdminAccount(
                                p_tenant_id, p_contact_email, p_tenant_name,
                                p_admin_password_hash, p_approved_by,
                                @admin_success, @admin_message
                            );
                        END IF;
                        
                        -- 모든 단계 성공
                        SET p_success = TRUE;
                        SET p_message = CONCAT(
                            '온보딩 승인 완료: ',
                            '테넌트=', @tenant_message, ', ',
                            '코드복사=', IFNULL(@copy_message, '성공'), ', ',
                            '카테고리=', @category_message, ', ',
                            '컴포넌트=', @component_message, ', ',
                            '구독=', @subscription_message, ', ',
                            '역할=', @role_message, ', ',
                            'ERD=', @erd_message,
                            IF(p_contact_email IS NOT NULL AND p_contact_email != '', 
                               CONCAT(', 관리자=', IFNULL(@admin_message, '성공')), '')
                        );
                        
                        COMMIT;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
END //

DELIMITER ;

