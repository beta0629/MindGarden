-- ApplyDefaultRoleTemplates 재생성 (권한 그룹, Flyway + MySQL 8)
DROP PROCEDURE IF EXISTS ApplyDefaultRoleTemplates;

DELIMITER $$

CREATE PROCEDURE ApplyDefaultRoleTemplates(
    IN p_tenant_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_template_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_tenant_role_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_role_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_role_name_ko VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_role_name_en VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_template_code VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_is_admin_role BOOLEAN DEFAULT FALSE;
    DECLARE v_count INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    -- 커서: 해당 업종의 기본 템플릿 조회 (is_admin_role 포함)
    DECLARE cur_templates CURSOR FOR
        SELECT rt.role_template_id, rt.name, rt.name_ko, rt.name_en, rt.template_code, 
               COALESCE(rt.is_admin_role, FALSE) as is_admin_role
        FROM role_templates rt
        INNER JOIN role_template_mappings rtm ON rt.role_template_id = rtm.role_template_id
        WHERE rtm.business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci
            AND rtm.is_default = TRUE
            AND rt.is_active = TRUE
        ORDER BY rt.display_order ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('역할 템플릿 적용 중 오류: ', p_message);
    END;

    -- 이미 역할이 존재하는지 확인 (중복 생성 방지)
    SELECT COUNT(*) INTO v_count FROM tenant_roles WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci;
    
    IF v_count > 0 THEN
        SET p_success = TRUE;
        SET p_message = '이미 역할이 존재하여 생략됨';
    ELSE
        SET v_count = 0; -- 카운터 초기화
        OPEN cur_templates;
        
        read_loop: LOOP
            FETCH cur_templates INTO v_template_id, v_role_name, v_role_name_ko, v_role_name_en, v_template_code, v_is_admin_role;
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- 테넌트 역할 생성
            SET v_tenant_role_id = UUID();
            INSERT INTO tenant_roles (
                tenant_role_id, tenant_id, role_template_id, name,
                name_ko, name_en, description, description_ko, description_en,
                is_active, display_order, created_at, updated_at, created_by, updated_by
            )
            SELECT 
                v_tenant_role_id, p_tenant_id, v_template_id, rt.name,
                rt.name_ko, rt.name_en, rt.description, rt.description_ko, rt.description_en,
                1, rt.display_order, NOW(), NOW(), p_created_by, p_created_by
            FROM role_templates rt
            WHERE rt.role_template_id = v_template_id;
            
            -- 권한 복제
            INSERT INTO role_permissions (
                tenant_role_id, permission_code, role_name, is_active,
                policy_json, scope, granted_by, created_at, updated_at
            )
            SELECT 
                v_tenant_role_id, rtp.permission_code, v_role_name, 1,
                JSON_OBJECT('scope', rtp.scope), rtp.scope, p_created_by, NOW(), NOW()
            FROM role_template_permissions rtp
            WHERE rtp.role_template_id = v_template_id;
            
            -- 관리자 역할인 경우 권한 그룹 자동 할당 (프로시저 내에서 직접 처리)
            -- 관리자 역할 판단: is_admin_role = TRUE이거나 display_order = 1 (방어 코드)
            IF (v_is_admin_role = TRUE OR v_count = 0) THEN
                
                -- 모든 최상위 권한 그룹 할당 (방어 코드 포함)
                INSERT IGNORE INTO role_permission_groups (
                    tenant_id, tenant_role_id, permission_group_code, access_level, 
                    is_active, granted_at, granted_by, created_at, updated_at
                )
                SELECT 
                    p_tenant_id, v_tenant_role_id, pg.group_code, 'FULL',
                    true, NOW(), p_created_by, NOW(), NOW()
                FROM permission_groups pg
                WHERE pg.parent_group_code IS NULL 
                    AND pg.is_active = true
                    AND (pg.tenant_id IS NULL OR pg.tenant_id = p_tenant_id);
            END IF;
            
            SET v_count = v_count + 1;
            
        END LOOP;
        
        CLOSE cur_templates;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 역할 템플릿 적용 완료 (', v_count, '개)');
    END IF;

END$$

DELIMITER ;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
