-- 생성 파일 — 직접 고치지 마세요.
-- 생성: scripts/database/sync/flyway-procedure-extract.sh generate
-- 원본: src/main/resources/db/migration/V41__create_missing_onboarding_procedures.sql
-- 용도: 표준 프로시저 배포(개발·운영 db-diff)와 야간 운영→개발 복사 뒤 재적재.
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
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('카테고리 매핑 설정 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- MVP: 카테고리 매핑은 선택적 기능이므로 성공으로 처리
    -- 향후 business_category_items 테이블이 채워지면 실제 매핑 로직 추가
    SET p_success = TRUE;
    SET p_message = '카테고리 매핑 설정 완료 (MVP: 스킵됨)';
    
    COMMIT;
END //

DELIMITER ;
