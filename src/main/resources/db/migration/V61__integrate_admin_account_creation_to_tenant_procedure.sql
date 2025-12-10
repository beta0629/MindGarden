-- ============================================
-- V61: CreateOrActivateTenant 프로시저에 관리자 계정 생성 통합
-- ============================================
-- 목적: 테넌트 생성 시 관리자 계정도 함께 생성하도록 프로시저 통합
--      자동 승인 시나리오 대비 및 코드 단순화
-- 작성일: 2025-12-09
-- ============================================

DELIMITER //

-- CreateOrActivateTenant 프로시저 업데이트
-- 관리자 계정 생성 로직 통합
DROP PROCEDURE IF EXISTS CreateOrActivateTenant //

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,  -- 옵셔널: 관리자 이메일 (NULL 가능)
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,  -- 옵셔널: BCrypt 해시된 비밀번호 (NULL 가능)
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_domain VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_settings_json JSON DEFAULT NULL;
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_consultation_enabled BOOLEAN DEFAULT FALSE;
    DECLARE v_academy_enabled BOOLEAN DEFAULT FALSE;
    DECLARE v_user_id BIGINT;
    DECLARE v_user_id_string VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_username VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_existing_user_count INT;
    DECLARE v_admin_role_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_admin_success BOOLEAN DEFAULT FALSE;
    DECLARE v_admin_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_result_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '';
    DECLARE v_user_id_suffix INT DEFAULT 1;
    
    -- 에러 핸들러: 코드 복사나 사용자 생성 실패는 치명적이지 않으므로 CONTINUE 사용
    -- 단, 테넌트 생성 자체가 실패한 경우에만 ROLLBACK
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        -- 테넌트 INSERT 실패만 치명적 오류로 처리
        -- CopyDefaultTenantCodes나 CreateDefaultTenantUsers 실패는 무시
        IF v_error_message LIKE '%INSERT INTO tenants%' 
           OR v_error_message LIKE '%테넌트 생성%'
           OR v_error_message LIKE '%Duplicate entry%' AND v_error_message LIKE '%tenant_id%' THEN
            ROLLBACK;
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 중 오류 발생: ', v_error_message);
        END IF;
        -- 그 외 오류는 무시하고 계속 진행 (코드 복사나 사용자 생성 실패는 치명적이지 않음)
    END;
    
    START TRANSACTION;
    
    -- 업종별 기능 활성화 설정
    IF p_business_type = 'CONSULTATION' THEN
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    ELSEIF p_business_type = 'ACADEMY' THEN
        SET v_consultation_enabled = FALSE;
        SET v_academy_enabled = TRUE;
    ELSE
        -- 기타 업종은 기본적으로 상담 기능 활성화
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    END IF;
    
    -- 테넌트 존재 확인
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
    
    IF v_exists THEN
        -- 기존 테넌트 활성화
        UPDATE tenants 
        SET status = 'ACTIVE',
            subscription_status = 'ACTIVE',
            updated_at = NOW(),
            updated_by = p_approved_by
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
        
        -- 기존 테넌트 활성화 시에도 관리자 계정 생성 시도 (없는 경우에만)
        IF p_admin_email IS NOT NULL AND p_admin_email != '' 
           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
            
            -- 이메일 정규화
            SET p_admin_email = LOWER(TRIM(p_admin_email));
            
            -- 사용자명 생성
            SET v_username = SUBSTRING_INDEX(p_admin_email, '@', 1);
            
            -- 같은 테넌트에 이미 ADMIN 역할의 사용자가 있는지 확인
            SELECT COUNT(*) INTO v_existing_user_count
            FROM users
            WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                AND email COLLATE utf8mb4_unicode_ci = p_admin_email COLLATE utf8mb4_unicode_ci
                AND role = 'ADMIN'
                AND (is_deleted IS NULL OR is_deleted = FALSE);
            
            IF v_existing_user_count = 0 THEN
                -- 관리자 계정 생성
                INSERT INTO users (
                    tenant_id,
                    email,
                    username,
                    password,
                    name,
                    role,
                    is_active,
                    is_email_verified,
                    is_social_account,
                    created_at,
                    updated_at,
                    created_by,
                    updated_by,
                    is_deleted,
                    version
                ) VALUES (
                    p_tenant_id,
                    p_admin_email,
                    v_username,
                    p_admin_password_hash,
                    CONCAT(p_tenant_name, ' 관리자'),
                    'ADMIN',
                    TRUE,
                    TRUE,
                    FALSE,
                    NOW(),
                    NOW(),
                    p_approved_by,
                    p_approved_by,
                    FALSE,
                    0
                );
                
                SET v_user_id = LAST_INSERT_ID();
                
                -- 관리자 역할 할당
                SET v_admin_role_id = NULL;
                SELECT tenant_role_id INTO v_admin_role_id
                FROM tenant_roles
                WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                    AND (
                        name COLLATE utf8mb4_unicode_ci = '원장'
                        OR name COLLATE utf8mb4_unicode_ci = '관리자'
                        OR name_ko COLLATE utf8mb4_unicode_ci = '원장'
                        OR name_ko COLLATE utf8mb4_unicode_ci = '관리자'
                        OR name COLLATE utf8mb4_unicode_ci LIKE '%관리자%'
                        OR name_ko COLLATE utf8mb4_unicode_ci LIKE '%관리자%'
                    )
                    AND (is_deleted IS NULL OR is_deleted = FALSE)
                    AND (is_active IS NULL OR is_active = TRUE)
                ORDER BY 
                    CASE WHEN name COLLATE utf8mb4_unicode_ci = '원장' OR name_ko COLLATE utf8mb4_unicode_ci = '원장' THEN 1
                         WHEN name COLLATE utf8mb4_unicode_ci = '관리자' OR name_ko COLLATE utf8mb4_unicode_ci = '관리자' THEN 2
                         ELSE 3 END,
                    created_at ASC
                LIMIT 1;
                
                -- 역할 할당 (역할이 있는 경우에만)
                IF v_admin_role_id IS NOT NULL THEN
                    INSERT INTO user_role_assignments (
                        assignment_id,
                        user_id,
                        tenant_id,
                        tenant_role_id,
                        branch_id,
                        effective_from,
                        effective_to,
                        is_active,
                        assigned_by,
                        assignment_reason,
                        created_at,
                        updated_at,
                        is_deleted,
                        version
                    ) VALUES (
                        UUID(),
                        v_user_id,
                        p_tenant_id,
                        v_admin_role_id,
                        NULL,
                        CURDATE(),
                        NULL,
                        TRUE,
                        p_approved_by,
                        '온보딩 승인 시 자동 할당',
                        NOW(),
                        NOW(),
                        FALSE,
                        0
                    );
                    
                    SET v_admin_message = CONCAT('관리자 계정 생성 및 역할 할당 완료: ', p_admin_email);
                ELSE
                    SET v_admin_message = CONCAT('관리자 계정 생성 완료 (역할 할당 실패 - 역할을 찾을 수 없음): ', p_admin_email);
                END IF;
                
                SET v_admin_success = TRUE;
            ELSE
                SET v_admin_success = TRUE;
                SET v_admin_message = CONCAT('이미 해당 테넌트에 관리자 계정이 존재합니다: ', p_admin_email);
            END IF;
        END IF;
        
        IF v_admin_success THEN
            SET p_success = TRUE;
            SET p_message = CONCAT('기존 테넌트 활성화 완료: ', p_tenant_id, ' (', v_admin_message, ')');
        ELSE
            SET p_success = TRUE;
            SET p_message = CONCAT('기존 테넌트 활성화 완료: ', p_tenant_id);
        END IF;
    ELSE
        -- 새 테넌트 생성
        
        -- 서브도메인 생성 (중복 방지)
        SET v_counter = 0;
        SET v_subdomain = LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-'));
        
        -- 서브도메인 중복 체크 및 고유화
        WHILE (SELECT COUNT(*) FROM tenants WHERE settings_json->'$.subdomain' = v_subdomain) > 0 DO
            SET v_counter = v_counter + 1;
            SET v_subdomain = CONCAT(LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-')), '-', v_counter);
        END WHILE;
        
        -- 도메인 설정
        SET v_domain = CONCAT(v_subdomain, '.m-garden.co.kr');
        
        -- settings_json 구성
        SET v_settings_json = JSON_OBJECT(
            'features', JSON_OBJECT(
                'consultation', v_consultation_enabled,
                'academy', v_academy_enabled,
                'wellness', TRUE,
                'payment', TRUE,
                'notification', TRUE
            ),
            'subdomain', v_subdomain,
            'domain', v_domain
        );
        
        INSERT INTO tenants (
            tenant_id,
            name,
            business_type,
            status,
            subscription_status,
            settings_json,
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
            v_settings_json,
            NOW(),
            NOW(),
            p_approved_by,
            p_approved_by,
            FALSE,
            0,
            'ko'
        );
        
        -- 새 테넌트 생성 시 기본 역할(tenant_roles) 자동 생성
        -- 상담소(CONSULTATION) 업종: 원장, 상담사, 내담자, 사무원 (4개)
        IF p_business_type = 'CONSULTATION' THEN
            -- 원장 (ADMIN)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '원장', '원장', 'Principal',
                '상담소 원장 역할', '상담소 원장 역할', 'Principal role for consultation center',
                TRUE, 1, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 상담사 (CONSULTANT)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '상담사', '상담사', 'Consultant',
                '상담사 역할', '상담사 역할', 'Consultant role',
                TRUE, 2, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 내담자 (CLIENT)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '내담자', '내담자', 'Client',
                '내담자 역할', '내담자 역할', 'Client role',
                TRUE, 3, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 사무원 (STAFF)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '사무원', '사무원', 'Staff',
                '사무원 역할', '사무원 역할', 'Staff role',
                TRUE, 4, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
        END IF;
        
        -- 학원(ACADEMY) 업종: 원장, 교사, 학생, 학부모, 사무원 (5개)
        IF p_business_type = 'ACADEMY' THEN
            -- 원장 (DIRECTOR)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '원장', '원장', 'Director',
                '학원 원장 역할', '학원 원장 역할', 'Director role for academy',
                TRUE, 1, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 교사 (TEACHER)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '교사', '교사', 'Teacher',
                '교사 역할', '교사 역할', 'Teacher role',
                TRUE, 2, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 학생 (STUDENT)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '학생', '학생', 'Student',
                '학생 역할', '학생 역할', 'Student role',
                TRUE, 3, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 학부모 (PARENT)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '학부모', '학부모', 'Parent',
                '학부모 역할', '학부모 역할', 'Parent role',
                TRUE, 4, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
            
            -- 사무원 (STAFF)
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, name, name_ko, name_en,
                description, description_ko, description_en,
                is_active, display_order, created_at, updated_at,
                created_by, updated_by, is_deleted, version, lang_code
            ) VALUES (
                UUID(), p_tenant_id, '사무원', '사무원', 'Staff',
                '사무원 역할', '사무원 역할', 'Staff role',
                TRUE, 5, NOW(), NOW(),
                p_approved_by, p_approved_by, FALSE, 0, 'ko'
            );
        END IF;
        
        -- 새 테넌트 생성 시 기본 테넌트 코드 자동 복사
        -- 기존 테넌트에서 기본 코드 복사 (첫 번째 활성 테넌트 사용)
        -- 주의: tenant_common_codes 테이블이 없을 수 있으므로 실패해도 계속 진행
        SET @copy_success = FALSE;
        SET @copy_message = '코드 복사 건너뜀 (테이블 없음)';
        
        -- 프로시저 호출 시도 (실패해도 계속 진행)
        -- 프로시저 내부에서 예외가 발생하면 @copy_success는 FALSE로 유지됨
        CALL CopyDefaultTenantCodes(
            p_tenant_id,
            (SELECT tenant_id FROM tenants WHERE is_deleted = FALSE AND status = 'ACTIVE' LIMIT 1),
            p_approved_by,
            @copy_success,
            @copy_message
        );
        
        -- 새 테넌트 생성 시 기본 사용자 데이터 자동 생성
        -- 주의: 실패해도 계속 진행
        SET @user_success = FALSE;
        SET @user_message = '기본 사용자 생성 건너뜀';
        
        -- 프로시저 호출 시도 (실패해도 계속 진행)
        CALL CreateDefaultTenantUsers(
            p_tenant_id,
            p_business_type,
            p_approved_by,
            @user_success,
            @user_message
        );
        
        -- 관리자 계정 생성 (제공된 경우)
        IF p_admin_email IS NOT NULL AND p_admin_email != '' 
           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
            
            -- 이메일 정규화
            SET p_admin_email = LOWER(TRIM(p_admin_email));
            
            -- 사용자명 생성
            SET v_username = SUBSTRING_INDEX(p_admin_email, '@', 1);
            
            -- 같은 테넌트에 이미 ADMIN 역할의 사용자가 있는지 확인
            SELECT COUNT(*) INTO v_existing_user_count
            FROM users
            WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                AND email COLLATE utf8mb4_unicode_ci = p_admin_email COLLATE utf8mb4_unicode_ci
                AND role = 'ADMIN'
                AND (is_deleted IS NULL OR is_deleted = FALSE);
            
            IF v_existing_user_count = 0 THEN
                -- 관리자 계정 생성
                INSERT INTO users (
                    tenant_id,
                    email,
                    username,
                    password,
                    name,
                    role,
                    is_active,
                    is_email_verified,
                    is_social_account,
                    created_at,
                    updated_at,
                    created_by,
                    updated_by,
                    is_deleted,
                    version
                ) VALUES (
                    p_tenant_id,
                    p_admin_email,
                    v_username,
                    p_admin_password_hash,
                    CONCAT(p_tenant_name, ' 관리자'),
                    'ADMIN',
                    TRUE,
                    TRUE,
                    FALSE,
                    NOW(),
                    NOW(),
                    p_approved_by,
                    p_approved_by,
                    FALSE,
                    0
                );
                
                SET v_user_id = LAST_INSERT_ID();
                
                -- 관리자 역할 할당
                SET v_admin_role_id = NULL;
                SELECT tenant_role_id INTO v_admin_role_id
                FROM tenant_roles
                WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                    AND (
                        name COLLATE utf8mb4_unicode_ci = '원장'
                        OR name COLLATE utf8mb4_unicode_ci = '관리자'
                        OR name_ko COLLATE utf8mb4_unicode_ci = '원장'
                        OR name_ko COLLATE utf8mb4_unicode_ci = '관리자'
                        OR name COLLATE utf8mb4_unicode_ci LIKE '%관리자%'
                        OR name_ko COLLATE utf8mb4_unicode_ci LIKE '%관리자%'
                    )
                    AND (is_deleted IS NULL OR is_deleted = FALSE)
                    AND (is_active IS NULL OR is_active = TRUE)
                ORDER BY 
                    CASE WHEN name COLLATE utf8mb4_unicode_ci = '원장' OR name_ko COLLATE utf8mb4_unicode_ci = '원장' THEN 1
                         WHEN name COLLATE utf8mb4_unicode_ci = '관리자' OR name_ko COLLATE utf8mb4_unicode_ci = '관리자' THEN 2
                         ELSE 3 END,
                    created_at ASC
                LIMIT 1;
                
                -- 역할 할당 (역할이 있는 경우에만)
                IF v_admin_role_id IS NOT NULL THEN
                    INSERT INTO user_role_assignments (
                        assignment_id,
                        user_id,
                        tenant_id,
                        tenant_role_id,
                        branch_id,
                        effective_from,
                        effective_to,
                        is_active,
                        assigned_by,
                        assignment_reason,
                        created_at,
                        updated_at,
                        is_deleted,
                        version
                    ) VALUES (
                        UUID(),
                        v_user_id,
                        p_tenant_id,
                        v_admin_role_id,
                        NULL,
                        CURDATE(),
                        NULL,
                        TRUE,
                        p_approved_by,
                        '온보딩 승인 시 자동 할당',
                        NOW(),
                        NOW(),
                        FALSE,
                        0
                    );
                    
                    SET v_admin_message = CONCAT('관리자 계정 생성 및 역할 할당 완료: ', p_admin_email);
                ELSE
                    SET v_admin_message = CONCAT('관리자 계정 생성 완료 (역할 할당 실패 - 역할을 찾을 수 없음): ', p_admin_email);
                END IF;
                
                SET v_admin_success = TRUE;
            ELSE
                SET v_admin_success = TRUE;
                SET v_admin_message = CONCAT('이미 해당 테넌트에 관리자 계정이 존재합니다: ', p_admin_email);
            END IF;
        END IF;
        
        -- 결과 메시지 구성
        SET p_success = TRUE;
        
        -- 메시지 구성
        SET v_result_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain);
        
        -- 코드 복사 결과 추가 (실패해도 계속 진행)
        IF @copy_success = TRUE THEN
            SET v_result_message = CONCAT(v_result_message, ', 코드 복사: ', IFNULL(@copy_message, '완료'));
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 코드 복사: ', IFNULL(@copy_message, '건너뜀'));
        END IF;
        
        -- 사용자 생성 결과 추가 (실패해도 계속 진행)
        IF @user_success = TRUE THEN
            SET v_result_message = CONCAT(v_result_message, ', 사용자 생성: ', IFNULL(@user_message, '완료'));
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 사용자 생성: ', IFNULL(@user_message, '건너뜀'));
        END IF;
        
        -- 관리자 계정 생성 결과 추가
        IF v_admin_success = TRUE AND v_admin_message != '' THEN
            SET v_result_message = CONCAT(v_result_message, ', ', v_admin_message);
        END IF;
        
        SET v_result_message = CONCAT(v_result_message, '): ', p_tenant_id);
        SET p_message = v_result_message;
    END IF;
    
    COMMIT;
END //

DELIMITER ;

