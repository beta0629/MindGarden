-- 매핑 수정 관련 레거시 MySQL 프로시저 (Java 미호출 · 폐기 검토 대상)
-- UpdateMappingInfo 는 procedures_standardized/UpdateMappingInfo_standardized.sql 이 원본이다.

DELIMITER //

-- 기존 프로시저 삭제 (있다면)
DROP PROCEDURE IF EXISTS UpdateMappingStatistics //
DROP PROCEDURE IF EXISTS CheckMappingUpdatePermission //

-- 매핑 통계 업데이트 프로시저
CREATE PROCEDURE UpdateMappingStatistics(
    IN p_mapping_id BIGINT,
    IN p_consultant_id BIGINT,
    IN p_client_id BIGINT,
    IN p_tenant_id VARCHAR(100)
)
main_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_remaining_sessions INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        -- 통계 업데이트 실패는 로그만 남기고 롤백하지 않음 (호출한 프로시저의 트랜잭션에 영향 없음)
    END;
    
    -- 매핑 정보 조회 (테넌트 격리)
    SELECT package_price, total_sessions, used_sessions, remaining_sessions
    INTO v_package_price, v_total_sessions, v_used_sessions, v_remaining_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;

    -- 상담사별 통계 업데이트 (테이블이 있다면, 테넌트 격리)
    INSERT IGNORE INTO consultant_statistics (
        consultant_id,
        tenant_id,
        total_revenue,
        total_sessions,
        used_sessions,
        remaining_sessions,
        last_updated
    ) VALUES (
        p_consultant_id,
        p_tenant_id,
        v_package_price,
        v_total_sessions,
        v_used_sessions,
        v_remaining_sessions,
        NOW()
    ) ON DUPLICATE KEY UPDATE
        total_revenue = total_revenue + v_package_price,
        total_sessions = total_sessions + v_total_sessions,
        used_sessions = used_sessions + v_used_sessions,
        remaining_sessions = remaining_sessions + v_remaining_sessions,
        last_updated = NOW();
END //

-- 매핑 수정 권한 확인 프로시저
CREATE PROCEDURE CheckMappingUpdatePermission(
    IN p_mapping_id BIGINT,
    IN p_user_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    IN p_user_role VARCHAR(50),
    OUT p_can_update BOOLEAN,
    OUT p_reason VARCHAR(500)
)
main_proc: BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_used_sessions INT DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_can_update = FALSE;
        SET p_reason = CONCAT('권한 확인 중 오류 발생: ', v_error_message);
    END;
    
    -- 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_can_update = FALSE;
        SET p_reason = '테넌트 ID는 필수입니다.';
        LEAVE main_proc;
    END IF;
    
    -- 매핑 상태 조회 (테넌트 격리)
    SELECT status, payment_status, used_sessions
    INTO v_mapping_status, v_payment_status, v_used_sessions
    FROM consultant_client_mappings 
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;
    
    -- 매핑 존재 여부 확인
    SELECT COUNT(*) INTO v_mapping_count
    FROM consultant_client_mappings
    WHERE id = p_mapping_id 
      AND tenant_id = p_tenant_id 
      AND is_deleted = FALSE;

    SET p_can_update = FALSE;
    
    -- 권한 확인 로직
    IF v_mapping_count = 0 THEN
        SET p_reason = '매핑을 찾을 수 없습니다.';
    ELSEIF v_mapping_status = 'CANCELLED' THEN
        SET p_reason = '취소된 매핑은 수정할 수 없습니다.';
    ELSEIF v_mapping_status = 'TERMINATED' THEN
        SET p_reason = '종료된 매핑은 수정할 수 없습니다.';
    ELSEIF v_used_sessions > 0 THEN
        SET p_reason = '이미 사용된 세션이 있는 매핑은 수정할 수 없습니다.';
    ELSEIF p_user_role NOT IN ('ADMIN', 'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER') THEN
        SET p_reason = '매핑 수정 권한이 없습니다.';
    ELSE
        SET p_can_update = TRUE;
        SET p_reason = '수정 가능합니다.';
    END IF;
END //

DELIMITER ;

-- 테이블 생성 (필요한 경우)
CREATE TABLE IF NOT EXISTS mapping_change_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mapping_id BIGINT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    INDEX idx_mapping_id (mapping_id),
    INDEX idx_change_type (change_type)
);

CREATE TABLE IF NOT EXISTS consultant_statistics (
    consultant_id BIGINT PRIMARY KEY,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_sessions INT DEFAULT 0,
    used_sessions INT DEFAULT 0,
    remaining_sessions INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- branch_statistics 테이블은 테넌트 기반 시스템으로 전환되어 더 이상 사용하지 않음
-- 통계는 tenant_id 기반으로 관리됨
