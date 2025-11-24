-- ============================================
-- SetupTenantCategoryMapping 프로시저 업데이트
-- 카테고리 매핑 실제 구현
-- ============================================
-- 목적: 테넌트 생성 시 카테고리 정보를 tenant_category_mappings에 저장
-- 작성일: 2025-11-24
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS SetupTenantCategoryMapping //

CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_category_item_id VARCHAR(36);
    DECLARE v_category_item_count INT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('카테고리 매핑 설정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- business_type으로 카테고리 아이템 찾기
    -- business_category_items 테이블에서 business_type이 일치하는 활성화된 아이템 조회
    SELECT 
        item_id,
        COUNT(*) 
    INTO 
        v_category_item_id,
        v_category_item_count
    FROM business_category_items
    WHERE business_type = p_business_type
        AND (is_active IS NULL OR is_active = TRUE)
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    ORDER BY display_order ASC, created_at ASC
    LIMIT 1;
    
    -- 카테고리 아이템이 있는 경우에만 매핑 생성
    IF v_category_item_id IS NOT NULL AND v_category_item_count > 0 THEN
        -- 기존 매핑 확인
        SELECT COUNT(*) INTO v_mapping_count
        FROM tenant_category_mappings
        WHERE tenant_id = p_tenant_id
            AND category_item_id = v_category_item_id
            AND (is_deleted IS NULL OR is_deleted = FALSE);
        
        IF v_mapping_count = 0 THEN
            -- 카테고리 매핑 생성
            INSERT INTO tenant_category_mappings (
                tenant_id,
                category_item_id,
                is_primary,
                created_at,
                updated_at,
                created_by,
                updated_by,
                is_deleted,
                version
            ) VALUES (
                p_tenant_id,
                v_category_item_id,
                TRUE,  -- 첫 번째 매핑을 primary로 설정
                NOW(),
                NOW(),
                p_approved_by,
                p_approved_by,
                FALSE,
                0
            )
            ON DUPLICATE KEY UPDATE
                updated_at = NOW(),
                updated_by = p_approved_by,
                is_deleted = FALSE;
            
            SET p_success = TRUE;
            SET p_message = CONCAT('카테고리 매핑 설정 완료: business_type=', p_business_type, ', category_item_id=', v_category_item_id);
        ELSE
            SET p_success = TRUE;
            SET p_message = CONCAT('카테고리 매핑이 이미 존재합니다: business_type=', p_business_type);
        END IF;
    ELSE
        -- 카테고리 아이템이 없는 경우 (경고만, 실패는 아님)
        SET p_success = TRUE;
        SET p_message = CONCAT('카테고리 매핑 스킵: business_type=', p_business_type, '에 해당하는 카테고리 아이템이 없습니다');
    END IF;
    
    COMMIT;
END //

DELIMITER ;

