-- ============================================
-- 온보딩 승인 시 테넌트 관리자 계정 생성 프로시저
-- ============================================
-- 목적: 온보딩 승인 시 테넌트 관리자 계정 자동 생성
-- 작성일: 2025-11-24
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

DELIMITER //

-- ============================================
-- 테넌트 관리자 계정 생성 프로시저
-- ============================================
CREATE PROCEDURE CreateTenantAdminAccount(
    IN p_tenant_id VARCHAR(64),
    IN p_contact_email VARCHAR(100),
    IN p_tenant_name VARCHAR(255),
    IN p_admin_password_hash VARCHAR(100),  -- BCrypt 해시된 비밀번호 (Java에서 전달)
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_user_id BIGINT;
    DECLARE v_username VARCHAR(50);
    DECLARE v_existing_user_count INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('관리자 계정 생성 중 오류 발생: ', v_error_message);
    END;
    
    -- 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID가 없습니다.';
    ELSEIF p_contact_email IS NULL OR p_contact_email = '' THEN
        SET p_success = FALSE;
        SET p_message = '연락 이메일이 없습니다.';
    ELSEIF p_admin_password_hash IS NULL OR p_admin_password_hash = '' THEN
        SET p_success = FALSE;
        SET p_message = '비밀번호 해시가 없습니다.';
    ELSE
    
    -- 이메일 정규화 (소문자 변환)
    SET p_contact_email = LOWER(TRIM(p_contact_email));
    
    -- 사용자명 생성 (이메일의 로컬 파트 사용)
    SET v_username = SUBSTRING_INDEX(p_contact_email, '@', 1);
    
    -- 같은 테넌트에 이미 ADMIN 역할의 사용자가 있는지 확인
    SELECT COUNT(*) INTO v_existing_user_count
    FROM users
    WHERE tenant_id = p_tenant_id
        AND email = p_contact_email
        AND role = 'ADMIN'
        AND (is_deleted IS NULL OR is_deleted = FALSE);
    
        IF v_existing_user_count > 0 THEN
            SET p_success = TRUE;
            SET p_message = CONCAT('이미 해당 테넌트에 관리자 계정이 존재합니다: ', p_contact_email);
        ELSE
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
                p_contact_email,
                v_username,
                p_admin_password_hash,  -- BCrypt 해시된 비밀번호
                CONCAT(p_tenant_name, ' 관리자'),
                'ADMIN',
                TRUE,
                TRUE,  -- 온보딩 시 이메일 인증 완료
                FALSE,
                NOW(),
                NOW(),
                p_approved_by,
                p_approved_by,
                FALSE,
                0
            );
            
            SET v_user_id = LAST_INSERT_ID();
            
            -- 관리자 역할 할당 (tenant_roles에서 "관리자" 역할 찾기)
            -- role_name이 "관리자"이거나 role_code가 "ADMIN"인 역할 찾기
            SET @v_admin_role_id = NULL;
            SELECT id INTO @v_admin_role_id
            FROM tenant_roles
            WHERE tenant_id = p_tenant_id
                AND (
                    role_name = '관리자' 
                    OR role_code = 'ADMIN'
                    OR (role_name LIKE '%관리자%' AND is_default = TRUE)
                )
                AND (is_deleted IS NULL OR is_deleted = FALSE)
            ORDER BY is_default DESC, created_at ASC
            LIMIT 1;
            
            -- 역할 할당 (역할이 있는 경우에만)
            IF @v_admin_role_id IS NOT NULL THEN
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
                    @v_admin_role_id,
                    NULL,  -- 전체 브랜치
                    CURDATE(),
                    NULL,  -- 무기한
                    TRUE,
                    p_approved_by,
                    '온보딩 승인 시 자동 할당',
                    NOW(),
                    NOW(),
                    FALSE,
                    0
                );
                
                SET p_message = CONCAT('관리자 계정 생성 및 역할 할당 완료: ', p_contact_email, ' (userId: ', v_user_id, ', roleId: ', @v_admin_role_id, ')');
            ELSE
                SET p_message = CONCAT('관리자 계정 생성 완료 (역할 할당 실패 - 역할을 찾을 수 없음): ', p_contact_email, ' (userId: ', v_user_id, ')');
            END IF;
            
            SET p_success = TRUE;
        END IF;
    END IF;
END //

DELIMITER ;

