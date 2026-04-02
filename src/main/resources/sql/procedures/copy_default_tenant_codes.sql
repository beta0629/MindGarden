-- ============================================
-- CopyDefaultTenantCodes 프로시저
-- ============================================
-- 목적: 새 테넌트 생성 시 기본 테넌트 코드 자동 복사
-- 작성일: 2025-11-26
-- ============================================

DROP PROCEDURE IF EXISTS CopyDefaultTenantCodes;

CREATE PROCEDURE CopyDefaultTenantCodes(
    IN p_tenant_id VARCHAR(64),
    IN p_source_tenant_id VARCHAR(64),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_copied_count INT DEFAULT 0;
    DECLARE v_tenant_code_groups TEXT DEFAULT '';
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('테넌트 코드 복사 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 테넌트별 코드 그룹 목록 (V53에서 정의된 TENANT 타입)
    SET v_tenant_code_groups = 'CONSULTATION_PACKAGE,PACKAGE_TYPE,PAYMENT_METHOD,SPECIALTY,CONSULTATION_TYPE,MAPPING_STATUS,RESPONSIBILITY,CONSULTANT_GRADE';
    
    -- 기본 테넌트 코드 복사 (소스 테넌트에서 새 테넌트로)
    INSERT INTO common_codes (
        code_group,
        code_value,
        korean_name,
        code_label,
        code_description,
        sort_order,
        is_active,
        color_code,
        icon,
        parent_code_group,
        parent_code_value,
        extra_data,
        tenant_id,
        created_at,
        updated_at,
        created_by,
        updated_by,
        is_deleted,
        version
    )
    SELECT 
        cc.code_group,
        cc.code_value,
        cc.korean_name,
        cc.code_label,
        cc.code_description,
        cc.sort_order,
        cc.is_active,
        cc.color_code,
        cc.icon,
        cc.parent_code_group,
        cc.parent_code_value,
        cc.extra_data,
        p_tenant_id,  -- 새 테넌트 ID로 설정
        NOW(),
        NOW(),
        'SYSTEM_AUTO_COPY',
        'SYSTEM_AUTO_COPY',
        FALSE,
        0
    FROM common_codes cc
    INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
    WHERE cc.tenant_id = p_source_tenant_id
    AND cgm.code_type = 'TENANT'
    AND cc.is_deleted = FALSE
    AND cc.is_active = TRUE
    AND FIND_IN_SET(cc.code_group, v_tenant_code_groups) > 0;
    
    -- 복사된 레코드 수 확인
    SET v_copied_count = ROW_COUNT();
    
    -- 복사된 코드가 없는 경우 기본 코드 생성
    IF v_copied_count = 0 THEN
        -- 기본 상담 패키지 코드 생성
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        ) VALUES 
        ('CONSULTATION_PACKAGE', 'INDIVIDUAL', '개인상담', '개인상담', '1:1 개인 심리상담', 
         JSON_OBJECT('price', 80000, 'sessions', 20, 'duration', 50, 'unit', '회'), 
         1, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'FAMILY', '가족상담', '가족상담', '가족 단위 상담', 
         JSON_OBJECT('price', 120000, 'sessions', 20, 'duration', 60, 'unit', '회'), 
         2, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'GROUP', '집단상담', '집단상담', '그룹 심리상담', 
         JSON_OBJECT('price', 50000, 'sessions', 20, 'duration', 90, 'unit', '회'), 
         3, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        
        -- 기본 단회기 패키지 생성 (표준화 2025-12-08: 테넌트 생성 시 기본 단회기 패키지 자동 등록)
        ('CONSULTATION_PACKAGE', 'SINGLE_75000', '단회기 75,000원', '단회기 75,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 75000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         4, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_80000', '단회기 80,000원', '단회기 80,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         5, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_85000', '단회기 85,000원', '단회기 85,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 85000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         6, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_90000', '단회기 90,000원', '단회기 90,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 90000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         7, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_95000', '단회기 95,000원', '단회기 95,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 95000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         8, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_PACKAGE', 'SINGLE_100000', '단회기 100,000원', '단회기 100,000원', '1회기 상담 패키지', 
         JSON_OBJECT('price', 100000, 'duration', 50, 'unit', '회', 'sessions', 1), 
         9, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        
        -- 기본 패키지 타입 코드 생성
        ('PACKAGE_TYPE', 'INDIVIDUAL', '개인 상담', '개인 상담', '1:1 개인 상담', NULL, 1, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('PACKAGE_TYPE', 'GROUP', '그룹 상담', '그룹 상담', '그룹 상담', NULL, 2, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        
        -- 기본 결제 방법 코드 생성
        ('PAYMENT_METHOD', 'CASH', '현금', '현금', '현금 결제', NULL, 1, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('PAYMENT_METHOD', 'CARD', '카드', '카드', '카드 결제', NULL, 2, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('PAYMENT_METHOD', 'TRANSFER', '계좌이체', '계좌이체', '계좌이체 결제', NULL, 3, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        
        -- 기본 전문분야 코드 생성
        ('SPECIALTY', 'GENERAL', '일반 상담', '일반 상담', '일반적인 심리 상담', NULL, 1, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('SPECIALTY', 'FAMILY', '가족 상담', '가족 상담', '가족 관계 상담', NULL, 2, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        
        -- 기본 상담 유형 코드 생성 (회기 유형; 대면/비대면/전화는 consultation_method)
        ('CONSULTATION_TYPE', 'INDIVIDUAL', '개인상담', '개인상담', '1:1 개인 심리상담',
         JSON_OBJECT('durationMinutes', 50), 1, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_TYPE', 'FAMILY', '가족상담', '가족상담', '가족 단위 상담',
         JSON_OBJECT('durationMinutes', 100), 2, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_TYPE', 'COUPLE', '부부상담', '부부상담', '부부 상담',
         JSON_OBJECT('durationMinutes', 80), 3, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_TYPE', 'INITIAL', '초기상담', '초기상담', '초기 상담',
         JSON_OBJECT('durationMinutes', 60), 4, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0),
        ('CONSULTATION_TYPE', 'GROUP', '집단상담', '집단상담', '집단·그룹 상담',
         JSON_OBJECT('durationMinutes', 90), 5, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0);
        
        SET v_copied_count = ROW_COUNT();
        SET p_message = CONCAT('기본 테넌트 코드 생성 완료: ', v_copied_count, '개 (단회기 패키지 포함)');
    ELSE
        -- 복사된 코드가 있어도 단회기 패키지가 없으면 추가
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_75000', '단회기 75,000원', '단회기 75,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 75000, 'duration', 50, 'unit', '회', 'sessions', 1),
            4, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_75000'
        );
        
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_80000', '단회기 80,000원', '단회기 80,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회', 'sessions', 1),
            5, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_80000'
        );
        
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_85000', '단회기 85,000원', '단회기 85,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 85000, 'duration', 50, 'unit', '회', 'sessions', 1),
            6, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_85000'
        );
        
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_90000', '단회기 90,000원', '단회기 90,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 90000, 'duration', 50, 'unit', '회', 'sessions', 1),
            7, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_90000'
        );
        
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_95000', '단회기 95,000원', '단회기 95,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 95000, 'duration', 50, 'unit', '회', 'sessions', 1),
            8, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_95000'
        );
        
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            extra_data, sort_order, is_active, tenant_id, created_at, updated_at,
            created_by, updated_by, is_deleted, version
        )
        SELECT 
            'CONSULTATION_PACKAGE', 'SINGLE_100000', '단회기 100,000원', '단회기 100,000원', '1회기 상담 패키지',
            JSON_OBJECT('price', 100000, 'duration', 50, 'unit', '회', 'sessions', 1),
            9, TRUE, p_tenant_id, NOW(), NOW(), 'SYSTEM_AUTO_COPY', 'SYSTEM_AUTO_COPY', FALSE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM common_codes 
            WHERE tenant_id = p_tenant_id 
            AND code_group = 'CONSULTATION_PACKAGE' 
            AND code_value = 'SINGLE_100000'
        );
        
        SET p_message = CONCAT('테넌트 코드 복사 완료: ', v_copied_count, '개 (단회기 패키지 확인 및 추가 완료)');
    END IF;
    
    SET p_success = TRUE;
    COMMIT;
END;
