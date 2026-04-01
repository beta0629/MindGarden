-- ============================================
-- V20251222_001__create_create_or_activate_tenant_procedure.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V20251222_001__create_create_or_activate_tenant_procedure.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

DROP PROCEDURE IF EXISTS CreateOrActivateTenant;

DELIMITER $$

CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_subdomain VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
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
    DECLARE v_duplicate_check INT DEFAULT 0;
    
    -- 치명적 오류 시 롤백 및 종료
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 생성/활성화 중 치명적 오류 발생: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '';
    
    -- ============================================
    -- 1. 필수 파라미터 검증 (방어 로직)
    -- ============================================
    IF p_tenant_id IS NULL OR TRIM(p_tenant_id) = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        LEAVE proc_label;
    END IF;
    
    IF p_tenant_name IS NULL OR TRIM(p_tenant_name) = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 이름은 필수입니다.';
        LEAVE proc_label;
    END IF;
    
    IF p_business_type IS NULL OR TRIM(p_business_type) = '' THEN
        SET p_success = FALSE;
        SET p_message = '업종 타입은 필수입니다.';
        LEAVE proc_label;
    END IF;
    
    IF p_approved_by IS NULL OR TRIM(p_approved_by) = '' THEN
        SET p_success = FALSE;
        SET p_message = '승인자 정보는 필수입니다.';
        LEAVE proc_label;
    END IF;
    
    -- tenant_id 중복 체크 (방어 로직)
    SELECT COUNT(*) INTO v_duplicate_check
    FROM tenants
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
      AND is_deleted = FALSE;
    
    IF v_duplicate_check > 0 THEN
        -- 기존 테넌트가 있는 경우는 활성화로 처리 (정상 케이스)
        -- 이미 ACTIVE 상태인 경우도 성공으로 처리 (중복 호출 방지)
        SELECT COUNT(*) INTO v_duplicate_check
        FROM tenants
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
          AND status = 'ACTIVE'
          AND is_deleted = FALSE;
        
        IF v_duplicate_check > 0 THEN
            -- 이미 활성화된 테넌트는 성공으로 처리 (중복 호출 허용)
            SET p_success = TRUE;
            SET p_message = CONCAT('테넌트가 이미 활성화되어 있습니다: ', p_tenant_id);
            LEAVE proc_label;
        END IF;
    END IF;
    
    -- 주의: START TRANSACTION 제거 - Java 코드에서 @Transactional로 이미 트랜잭션이 시작됨
    
    IF p_business_type = 'CONSULTATION' THEN
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    ELSEIF p_business_type = 'ACADEMY' THEN
        SET v_consultation_enabled = FALSE;
        SET v_academy_enabled = TRUE;
    ELSE
        SET v_consultation_enabled = TRUE;
        SET v_academy_enabled = FALSE;
    END IF;
    
    SELECT COUNT(*) > 0 INTO v_exists
    FROM tenants
    WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
    
    IF v_exists THEN
        SELECT settings_json INTO v_settings_json
        FROM tenants
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
        
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSE
            IF v_settings_json IS NULL OR JSON_EXTRACT(v_settings_json, '$.subdomain') IS NULL THEN
                SET v_subdomain = LOWER(p_tenant_name);
                SET v_subdomain = REPLACE(v_subdomain, ' ', '-');
                SET v_subdomain = REPLACE(v_subdomain, '가든', 'garden');
                SET v_subdomain = REPLACE(v_subdomain, '마인드', 'mind');
                SET v_subdomain = REPLACE(v_subdomain, '상담', 'consultation');
                SET v_subdomain = REPLACE(v_subdomain, '학원', 'academy');
                SET v_subdomain = REGEXP_REPLACE(v_subdomain, '[^a-z0-9-]', '');
                IF LENGTH(v_subdomain) > 63 THEN
                    SET v_subdomain = LEFT(v_subdomain, 63);
                END IF;
                IF v_subdomain = '' OR v_subdomain IS NULL THEN
                    SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8));
                END IF;
                
                -- 서브도메인 중복 체크 및 고유화
                SET v_counter = 0;
                WHILE EXISTS (
                    SELECT 1 FROM tenants
                    WHERE (subdomain = v_subdomain OR JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain)
                    AND is_deleted = FALSE
                    AND tenant_id != p_tenant_id
                ) AND v_counter < 100 DO
                    SET v_counter = v_counter + 1;
                    SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
                END WHILE;
                
                -- 100번 시도 후에도 중복이면 UUID 기반으로 변경
                IF v_counter >= 100 THEN
                    SET v_subdomain = CONCAT('tenant-', SUBSTRING(p_tenant_id, 1, 8), '-', v_counter);
                END IF;
            ELSE
                SET v_subdomain = JSON_UNQUOTE(JSON_EXTRACT(v_settings_json, '$.subdomain'));
            END IF;
        END IF;
        
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
        IF v_settings_json IS NULL THEN
            SET v_settings_json = JSON_OBJECT('subdomain', v_subdomain, 'domain', v_domain);
        ELSE
            SET v_settings_json = JSON_SET(v_settings_json, '$.subdomain', v_subdomain, '$.domain', v_domain);
        END IF;
        
        UPDATE tenants 
        SET status = 'ACTIVE',
            subscription_status = 'ACTIVE',
            settings_json = v_settings_json,
            subdomain = v_subdomain,
            updated_at = NOW(),
            updated_by = p_approved_by
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
        
        IF p_admin_email IS NOT NULL AND p_admin_email != '' 
           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
            SET p_admin_email = LOWER(TRIM(p_admin_email));
            SET v_username = SUBSTRING_INDEX(p_admin_email, '@', 1);
            
            SELECT COUNT(*) INTO v_existing_user_count
            FROM users
            WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                AND email COLLATE utf8mb4_unicode_ci = p_admin_email COLLATE utf8mb4_unicode_ci
                AND role = 'ADMIN'
                AND (is_deleted IS NULL OR is_deleted = FALSE);
            
            IF v_existing_user_count = 0 THEN
                SET v_user_id_string = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    SUBSTRING_INDEX(p_admin_email, '@', 1), 
                    '.', ''), '-', ''), '_', ''), '+', ''), ' ', ''));
                
                IF v_user_id_string = '' OR v_user_id_string IS NULL THEN
                    SET v_user_id_string = 'admin';
                END IF;
                
                -- user_id 중복 체크 및 고유성 보장 (V62 형식 사용)
                SET v_user_id_suffix = 1;
                WHILE EXISTS (
                    SELECT 1 FROM users
                    WHERE user_id COLLATE utf8mb4_unicode_ci = v_user_id_string COLLATE utf8mb4_unicode_ci
                      AND (is_deleted IS NULL OR is_deleted = FALSE)
                ) AND v_user_id_suffix <= 1000 DO
                    SET v_user_id_string = CONCAT(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        SUBSTRING_INDEX(p_admin_email, '@', 1), 
                        '.', ''), '-', ''), '_', ''), '+', ''), ' ', '')), v_user_id_suffix);
                    SET v_user_id_suffix = v_user_id_suffix + 1;
                END WHILE;
                
                -- 1000번 시도 후에도 중복이면 UUID 기반으로 변경
                IF v_user_id_suffix > 1000 THEN
                    SET v_user_id_string = CONCAT('admin-', REPLACE(UUID(), '-', ''), '-', SUBSTRING(p_tenant_id, 1, 8));
                END IF;

                INSERT INTO users (
                    user_id, tenant_id, email, password, name, role,
                    is_active, is_email_verified, is_social_account,
                    created_at, updated_at, created_by, updated_by, is_deleted, version
                ) VALUES (
                    v_user_id_string, p_tenant_id, p_admin_email, p_admin_password_hash,
                    CONCAT(p_tenant_name, ' 관리자'), 'ADMIN', TRUE, TRUE, FALSE,
                    NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0
                );
                
                SET v_user_id = LAST_INSERT_ID();
                
                IF v_user_id = 0 OR v_user_id IS NULL THEN
                    SET v_admin_success = FALSE;
                    SET v_admin_message = CONCAT('관리자 계정 생성 실패: INSERT 후 user_id를 가져올 수 없음 (user_id: ', v_user_id_string, ')');
                ELSE
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
                    
                    IF v_admin_role_id IS NOT NULL THEN
                        INSERT INTO user_role_assignments (
                            assignment_id, user_id, tenant_id, tenant_role_id, branch_id,
                            effective_from, effective_to, is_active, assigned_by,
                            assignment_reason, created_at, updated_at, is_deleted, version
                        ) VALUES (
                            UUID(), v_user_id, p_tenant_id, v_admin_role_id, NULL,
                            CURDATE(), NULL, TRUE, p_approved_by,
                            '온보딩 승인 시 자동 할당', NOW(), NOW(), FALSE, 0
                        );
                        SET v_admin_message = CONCAT('관리자 계정 생성 및 역할 할당 완료: ', p_admin_email);
                    ELSE
                        SET v_admin_message = CONCAT('관리자 계정 생성 완료 (역할 할당 실패 - 역할을 찾을 수 없음): ', p_admin_email);
                    END IF;
                    SET v_admin_success = TRUE;
                END IF;
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
            IF v_admin_message != '' AND v_admin_message IS NOT NULL THEN
                SET p_message = CONCAT('기존 테넌트 활성화 완료: ', p_tenant_id, ' (', v_admin_message, ')');
            ELSE
                SET p_message = CONCAT('기존 테넌트 활성화 완료: ', p_tenant_id, ' (관리자 계정 생성 실패 - 오류 메시지 없음)');
            END IF;
        END IF;
    ELSE
        IF p_subdomain IS NOT NULL AND p_subdomain != '' THEN
            SET v_subdomain = LOWER(TRIM(p_subdomain));
        ELSE
            SET v_counter = 0;
            SET v_subdomain = LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-'));
            WHILE (SELECT COUNT(*) FROM tenants WHERE (subdomain = v_subdomain OR JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain) AND is_deleted = FALSE) > 0 DO
                SET v_counter = v_counter + 1;
                SET v_subdomain = CONCAT(LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-')), '-', v_counter);
            END WHILE;
        END IF;
        
        SET v_counter = 0;
        WHILE (SELECT COUNT(*) FROM tenants WHERE (subdomain = v_subdomain OR JSON_EXTRACT(COALESCE(settings_json, '{}'), '$.subdomain') = v_subdomain) AND is_deleted = FALSE AND tenant_id != p_tenant_id) > 0 DO
            SET v_counter = v_counter + 1;
            SET v_subdomain = CONCAT(v_subdomain, '-', v_counter);
        END WHILE;
        
        SET v_domain = CONCAT(v_subdomain, '.dev.core-solution.co.kr');
        
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
            tenant_id, name, business_type, status, subscription_status,
            settings_json, subdomain, created_at, updated_at,
            created_by, updated_by, is_deleted, version, lang_code
        ) VALUES (
            p_tenant_id, p_tenant_name, p_business_type, 'ACTIVE', 'ACTIVE',
            v_settings_json, v_subdomain, NOW(), NOW(),
            p_approved_by, p_approved_by, FALSE, 0, 'ko'
        );
        
        IF p_business_type = 'CONSULTATION' THEN
            INSERT INTO tenant_roles (tenant_role_id, tenant_id, name, name_ko, name_en, description, description_ko, description_en, is_active, display_order, created_at, updated_at, created_by, updated_by, is_deleted, version, lang_code) VALUES
            (UUID(), p_tenant_id, '원장', '원장', 'Principal', '상담소 원장 역할', '상담소 원장 역할', 'Principal role for consultation center', TRUE, 1, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '상담사', '상담사', 'Consultant', '상담사 역할', '상담사 역할', 'Consultant role', TRUE, 2, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '내담자', '내담자', 'Client', '내담자 역할', '내담자 역할', 'Client role', TRUE, 3, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '사무원', '사무원', 'Staff', '사무원 역할', '사무원 역할', 'Staff role', TRUE, 4, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko');
        END IF;
        
        IF p_business_type = 'ACADEMY' THEN
            INSERT INTO tenant_roles (tenant_role_id, tenant_id, name, name_ko, name_en, description, description_ko, description_en, is_active, display_order, created_at, updated_at, created_by, updated_by, is_deleted, version, lang_code) VALUES
            (UUID(), p_tenant_id, '원장', '원장', 'Director', '학원 원장 역할', '학원 원장 역할', 'Director role for academy', TRUE, 1, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '교사', '교사', 'Teacher', '교사 역할', '교사 역할', 'Teacher role', TRUE, 2, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '학생', '학생', 'Student', '학생 역할', '학생 역할', 'Student role', TRUE, 3, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '학부모', '학부모', 'Parent', '학부모 역할', '학부모 역할', 'Parent role', TRUE, 4, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko'),
            (UUID(), p_tenant_id, '사무원', '사무원', 'Staff', '사무원 역할', '사무원 역할', 'Staff role', TRUE, 5, NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0, 'ko');
        END IF;
        
        -- 기본 코드 복사 (실패해도 계속 진행)
        SET @copy_success = FALSE;
        SET @copy_message = '코드 복사 건너뜀 (테이블 없음)';
        CALL CopyDefaultTenantCodes(
            p_tenant_id,
            (SELECT tenant_id FROM tenants WHERE is_deleted = FALSE AND status = 'ACTIVE' LIMIT 1),
            p_approved_by,
            @copy_success,
            @copy_message
        );
        
        -- 기본 사용자 생성 (실패해도 계속 진행)
        SET @user_success = FALSE;
        SET @user_message = '기본 사용자 생성 건너뜀';
        CALL CreateDefaultTenantUsers(
            p_tenant_id,
            p_business_type,
            p_approved_by,
            @user_success,
            @user_message
        );
        
        IF p_admin_email IS NOT NULL AND p_admin_email != '' 
           AND p_admin_password_hash IS NOT NULL AND p_admin_password_hash != '' THEN
            SET p_admin_email = LOWER(TRIM(p_admin_email));
            SET v_username = SUBSTRING_INDEX(p_admin_email, '@', 1);
            
            SELECT COUNT(*) INTO v_existing_user_count
            FROM users
            WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
                AND email COLLATE utf8mb4_unicode_ci = p_admin_email COLLATE utf8mb4_unicode_ci
                AND role = 'ADMIN'
                AND (is_deleted IS NULL OR is_deleted = FALSE);
            
            IF v_existing_user_count = 0 THEN
                SET v_user_id_string = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    SUBSTRING_INDEX(p_admin_email, '@', 1), 
                    '.', ''), '-', ''), '_', ''), '+', ''), ' ', ''));
                
                IF v_user_id_string = '' OR v_user_id_string IS NULL THEN
                    SET v_user_id_string = 'admin';
                END IF;
                
                -- user_id 중복 체크 및 고유성 보장 (V62 형식 사용)
                SET v_user_id_suffix = 1;
                WHILE EXISTS (
                    SELECT 1 FROM users
                    WHERE user_id COLLATE utf8mb4_unicode_ci = v_user_id_string COLLATE utf8mb4_unicode_ci
                      AND (is_deleted IS NULL OR is_deleted = FALSE)
                ) AND v_user_id_suffix <= 1000 DO
                    SET v_user_id_string = CONCAT(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        SUBSTRING_INDEX(p_admin_email, '@', 1), 
                        '.', ''), '-', ''), '_', ''), '+', ''), ' ', '')), v_user_id_suffix);
                    SET v_user_id_suffix = v_user_id_suffix + 1;
                END WHILE;
                
                -- 1000번 시도 후에도 중복이면 UUID 기반으로 변경
                IF v_user_id_suffix > 1000 THEN
                    SET v_user_id_string = CONCAT('admin-', REPLACE(UUID(), '-', ''), '-', SUBSTRING(p_tenant_id, 1, 8));
                END IF;

                INSERT INTO users (
                    user_id, tenant_id, email, password, name, role,
                    is_active, is_email_verified, is_social_account,
                    created_at, updated_at, created_by, updated_by, is_deleted, version
                ) VALUES (
                    v_user_id_string, p_tenant_id, p_admin_email, p_admin_password_hash,
                    CONCAT(p_tenant_name, ' 관리자'), 'ADMIN', TRUE, TRUE, FALSE,
                    NOW(), NOW(), p_approved_by, p_approved_by, FALSE, 0
                );
                
                SET v_user_id = LAST_INSERT_ID();
                
                IF v_user_id = 0 OR v_user_id IS NULL THEN
                    SET v_admin_success = FALSE;
                    SET v_admin_message = CONCAT('관리자 계정 생성 실패: INSERT 후 user_id를 가져올 수 없음 (user_id: ', v_user_id_string, ')');
                ELSE
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
                    
                    IF v_admin_role_id IS NOT NULL THEN
                        INSERT INTO user_role_assignments (
                            assignment_id, user_id, tenant_id, tenant_role_id, branch_id,
                            effective_from, effective_to, is_active, assigned_by,
                            assignment_reason, created_at, updated_at, is_deleted, version
                        ) VALUES (
                            UUID(), v_user_id, p_tenant_id, v_admin_role_id, NULL,
                            CURDATE(), NULL, TRUE, p_approved_by,
                            '온보딩 승인 시 자동 할당', NOW(), NOW(), FALSE, 0
                        );
                        SET v_admin_message = CONCAT('관리자 계정 생성 및 역할 할당 완료: ', p_admin_email);
                    ELSE
                        SET v_admin_message = CONCAT('관리자 계정 생성 완료 (역할 할당 실패 - 역할을 찾을 수 없음): ', p_admin_email);
                    END IF;
                    SET v_admin_success = TRUE;
                END IF;
            ELSE
                SET v_admin_success = TRUE;
                SET v_admin_message = CONCAT('이미 해당 테넌트에 관리자 계정이 존재합니다: ', p_admin_email);
            END IF;
        END IF;
        
        SET p_success = TRUE;
        SET v_result_message = CONCAT('테넌트 생성 완료 (서브도메인: ', v_subdomain);
        
        IF @copy_success = TRUE THEN
            SET v_result_message = CONCAT(v_result_message, ', 코드 복사: ', IFNULL(@copy_message, '완료'));
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 코드 복사: ', IFNULL(@copy_message, '건너뜀'));
        END IF;
        
        IF @user_success = TRUE THEN
            SET v_result_message = CONCAT(v_result_message, ', 사용자 생성: ', IFNULL(@user_message, '완료'));
        ELSE
            SET v_result_message = CONCAT(v_result_message, ', 사용자 생성: ', IFNULL(@user_message, '건너뜀'));
        END IF;
        
        IF v_admin_message != '' AND v_admin_message IS NOT NULL THEN
            SET v_result_message = CONCAT(v_result_message, ', ', v_admin_message);
        ELSEIF v_admin_success = FALSE THEN
            SET v_result_message = CONCAT(v_result_message, ', 관리자 계정 생성 실패 - 오류 메시지 없음');
        END IF;
        
        SET v_result_message = CONCAT(v_result_message, '): ', p_tenant_id);
        SET p_message = v_result_message;
    END IF;
    
    -- 최종 검증: 테넌트가 정상적으로 생성/활성화되었는지 확인
    IF p_success = TRUE THEN
        SELECT COUNT(*) INTO v_duplicate_check
        FROM tenants
        WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
          AND status = 'ACTIVE'
          AND is_deleted = FALSE;
        
        IF v_duplicate_check = 0 THEN
            -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
            SET p_success = FALSE;
            SET p_message = CONCAT('테넌트 생성/활성화 검증 실패: ', p_tenant_id, '가 ACTIVE 상태로 설정되지 않았습니다.');
            LEAVE proc_label;
        END IF;
    END IF;
    
    -- 주의: COMMIT/ROLLBACK 제거 - Java 코드에서 @Transactional로 트랜잭션 관리
END$$

DELIMITER ;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
