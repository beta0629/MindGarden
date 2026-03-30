-- ============================================
-- CopyDefaultTenantCodes 프로시저 최종 수정
-- ============================================
-- 목적: common_codes 테이블 구조에 맞게 수정 (created_by, updated_by 제거)
-- 작성일: 2025-11-26
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS CopyDefaultTenantCodes //

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
        COALESCE(cc.is_active, 1) AS is_active,  -- NULL인 경우 TRUE(1)로 처리
        cc.color_code,
        cc.icon,
        cc.parent_code_group,
        cc.parent_code_value,
        cc.extra_data,
        p_tenant_id,  -- 새 테넌트 ID로 설정
        NOW(),
        NOW(),
        0,  -- is_deleted = FALSE
        0   -- version = 0
    FROM common_codes cc
    INNER JOIN code_group_metadata cgm ON cc.code_group = cgm.group_name
    WHERE cc.tenant_id = p_source_tenant_id
    AND cgm.code_type = 'TENANT'
    AND COALESCE(cc.is_deleted, 0) = 0  -- NULL인 경우 FALSE(0)로 처리
    AND FIND_IN_SET(cc.code_group, v_tenant_code_groups) > 0;
    
    -- 복사된 레코드 수 확인
    SET v_copied_count = ROW_COUNT();
    
    -- 복사된 코드가 없는 경우 기본 코드 생성
    IF v_copied_count = 0 THEN
        -- 기본 상담 패키지 코드 생성
        INSERT INTO common_codes (
            code_group, code_value, korean_name, code_label, code_description,
            sort_order, is_active, tenant_id, created_at, updated_at,
            is_deleted, version
        ) VALUES 
        ('CONSULTATION_PACKAGE', 'BASIC', '기본 패키지', '기본 패키지', '기본 상담 패키지', 1, 1, p_tenant_id, NOW(), NOW(), 0, 0),
        ('CONSULTATION_PACKAGE', 'PREMIUM', '프리미엄 패키지', '프리미엄 패키지', '프리미엄 상담 패키지', 2, 1, p_tenant_id, NOW(), NOW(), 0, 0),
        
        -- 기본 패키지 타입 코드 생성
        ('PACKAGE_TYPE', 'INDIVIDUAL', '개인 상담', '개인 상담', '1:1 개인 상담', 1, 1, p_tenant_id, NOW(), NOW(), 0, 0),
        ('PACKAGE_TYPE', 'GROUP', '그룹 상담', '그룹 상담', '그룹 상담', 2, 1, p_tenant_id, NOW(), NOW(), 0, 0),
        
        -- 기본 결제 방법 코드 생성
        ('PAYMENT_METHOD', 'CARD', '카드 결제', '카드 결제', '신용카드/체크카드 결제', 1, 1, p_tenant_id, NOW(), NOW(), 0, 0),
        ('PAYMENT_METHOD', 'TRANSFER', '계좌 이체', '계좌 이체', '무통장 입금', 2, 1, p_tenant_id, NOW(), NOW(), 0, 0);
        
        SET v_copied_count = ROW_COUNT();
        SET p_success = TRUE;
        SET p_message = CONCAT('기본 테넌트 코드 생성 완료: ', v_copied_count, '개');
    ELSE
        SET p_success = TRUE;
        SET p_message = CONCAT('테넌트 코드 복사 완료: ', v_copied_count, '개');
    END IF;
    
    COMMIT;
END //

DELIMITER ;

-- 완료 메시지
SELECT 'CopyDefaultTenantCodes 프로시저 최종 수정 완료 (테이블 구조 맞춤)' AS message;
