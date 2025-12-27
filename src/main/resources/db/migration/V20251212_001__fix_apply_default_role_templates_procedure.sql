-- ============================================
-- V20251212_001__fix_apply_default_role_templates_procedure.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V20251212_001__fix_apply_default_role_templates_procedure.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

CREATE PROCEDURE ApplyDefaultRoleTemplates(
    IN p_tenant_id VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
proc_label: BEGIN
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE v_role_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- 주의: ROLLBACK 제거 - Java 코드에서 예외 발생 시 자동 롤백
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('역할 템플릿 적용 중 오류 발생: ', IFNULL(v_error_message, '알 수 없는 오류'));
    END;
    
    -- connection collation 설정 및 초기값 설정
    SET collation_connection = 'utf8mb4_unicode_ci';
    SET p_success = FALSE;
    SET p_message = '프로세스 시작';
    
    -- 주의: START TRANSACTION 제거 - Java 코드에서 @Transactional로 이미 트랜잭션이 시작됨
    
    -- role_templates에서 해당 업종의 템플릿을 직접 INSERT (CURSOR 없이)
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
        role_template_id,
        COALESCE(name_ko, name_en, template_code),
        name_ko,
        name_en,
        COALESCE(description_ko, description_en, ''),
        description_ko,
        description_en,
        TRUE,
        COALESCE(display_order, 0),
        NOW(),
        NOW(),
        p_approved_by,
        p_approved_by,
        FALSE,
        0,
        'ko'
    FROM role_templates
    WHERE BINARY business_type = BINARY p_business_type
        AND is_active = TRUE
        AND is_deleted = FALSE
        AND NOT EXISTS (
            SELECT 1
            FROM tenant_roles
            WHERE BINARY tenant_id = BINARY p_tenant_id
                AND BINARY role_template_id = BINARY role_templates.role_template_id
                AND is_deleted = FALSE
        )
    ORDER BY display_order ASC;
    
    SET v_role_count = ROW_COUNT();
    
    -- 결과 설정
    IF v_role_count > 0 THEN
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 역할 템플릿 적용 완료 (', v_role_count, '개)');
    ELSE
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 역할 템플릿 적용 완료 (0개) - 업종 ', p_business_type, '에 대한 역할 템플릿이 없거나 이미 생성되었습니다.');
    END IF;
    
    -- 주의: COMMIT 제거 - Java 코드에서 @Transactional로 트랜잭션 관리
END;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
