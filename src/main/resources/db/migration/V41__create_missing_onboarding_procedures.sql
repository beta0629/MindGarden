-- ============================================
-- V41__create_missing_onboarding_procedures.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V41__create_missing_onboarding_procedures.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

DROP PROCEDURE IF EXISTS SetupTenantCategoryMapping;

-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

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
END;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
