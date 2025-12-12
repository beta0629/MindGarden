-- V20251212_001: ApplyDefaultRoleTemplates 프로시저 실제 역할 생성 로직 추가
-- 목적: role_templates 테이블에서 템플릿을 조회하여 tenant_roles에 실제 역할 생성

DROP PROCEDURE IF EXISTS ApplyDefaultRoleTemplates;

DELIMITER //

CREATE PROCEDURE ApplyDefaultRoleTemplates(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_template_id VARCHAR(36);
    DECLARE v_template_code VARCHAR(100);
    DECLARE v_name_ko VARCHAR(255);
    DECLARE v_name_en VARCHAR(255);
    DECLARE v_description_ko TEXT;
    DECLARE v_description_en TEXT;
    DECLARE v_display_order INT;
    DECLARE v_role_count INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE template_cursor CURSOR FOR
        SELECT 
            role_template_id,
            template_code,
            name_ko,
            name_en,
            description_ko,
            description_en,
            display_order
        FROM role_templates
        WHERE business_type = p_business_type
            AND is_active = TRUE
            AND is_deleted = FALSE
        ORDER BY display_order ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('역할 템플릿 적용 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    -- 초기값 설정
    SET p_success = FALSE;
    SET p_message = '프로세스 시작';
    
    START TRANSACTION;
    
    -- role_templates에서 해당 업종의 템플릿 조회 및 tenant_roles에 생성
    OPEN template_cursor;
    
    template_loop: LOOP
        FETCH template_cursor INTO
            v_template_id,
            v_template_code,
            v_name_ko,
            v_name_en,
            v_description_ko,
            v_description_en,
            v_display_order;
        
        IF done THEN
            LEAVE template_loop;
        END IF;
        
        -- tenant_roles에 역할 생성 (중복 체크)
        INSERT INTO tenant_roles (
            tenant_role_id,
            tenant_id,
            role_template_id,
            name,
            name_ko,
            name_en,
            description,
            description_ko,
            description_en,
            is_active,
            display_order,
            created_at,
            updated_at,
            created_by,
            updated_by,
            is_deleted,
            version,
            lang_code
        )
        SELECT
            UUID(),
            p_tenant_id,
            v_template_id,
            COALESCE(v_name_ko, v_name_en, v_template_code),
            v_name_ko,
            v_name_en,
            COALESCE(v_description_ko, v_description_en, ''),
            v_description_ko,
            v_description_en,
            TRUE,
            COALESCE(v_display_order, 0),
            NOW(),
            NOW(),
            p_approved_by,
            p_approved_by,
            FALSE,
            0,
            'ko'
        WHERE NOT EXISTS (
            SELECT 1
            FROM tenant_roles
            WHERE tenant_id = p_tenant_id
                AND role_template_id = v_template_id
                AND is_deleted = FALSE
        );
        
        SET v_role_count = v_role_count + 1;
    END LOOP;
    
    CLOSE template_cursor;
    
    -- 결과 설정
    IF v_role_count > 0 THEN
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 역할 템플릿 적용 완료 (', v_role_count, '개)');
    ELSE
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 역할 템플릿 적용 완료 (0개) - 업종 ', p_business_type, '에 대한 역할 템플릿이 없습니다.');
    END IF;
    
    COMMIT;
END //

DELIMITER ;

