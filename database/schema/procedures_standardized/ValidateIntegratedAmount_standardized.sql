-- =====================================================
-- 통합 금액 검증 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS ValidateIntegratedAmount //

CREATE PROCEDURE ValidateIntegratedAmount(
    IN p_mapping_id BIGINT,
    IN p_input_amount DECIMAL(15,2),
    IN p_tenant_id VARCHAR(100),
    OUT p_is_valid BOOLEAN,
    OUT p_validation_message TEXT,
    OUT p_recommended_amount DECIMAL(15,2),
    OUT p_amount_breakdown JSON,
    OUT p_consistency_score DECIMAL(5,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_erp_total_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_price_per_session DECIMAL(10,2) DEFAULT 0;
    DECLARE v_total_sessions INT DEFAULT 0;
    DECLARE v_difference DECIMAL(15,2) DEFAULT 0;
    DECLARE v_consistency_issues INT DEFAULT 0;
    DECLARE v_breakdown JSON;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('금액 검증 중 오류 발생: ', v_error_message);
        SET p_is_valid = FALSE;
        SET p_validation_message = '검증 중 오류가 발생했습니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
    END;
    
    START TRANSACTION;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_is_valid = FALSE;
        SET p_validation_message = '테넌트 ID가 필요합니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
        ROLLBACK;
    ELSEIF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_is_valid = FALSE;
        SET p_validation_message = '매핑 ID가 필요합니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
        ROLLBACK;
    ELSEIF p_input_amount IS NULL OR p_input_amount < 0 THEN
        SET p_success = FALSE;
        SET p_message = '입력 금액은 0 이상이어야 합니다.';
        SET p_is_valid = FALSE;
        SET p_validation_message = '입력 금액이 유효하지 않습니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
        ROLLBACK;
    ELSE
    
        -- 2. 매핑 존재 여부 확인 (테넌트 격리)
        SELECT COUNT(*) INTO v_mapping_count
        FROM consultant_client_mappings
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        IF v_mapping_count = 0 THEN
            SET p_success = FALSE;
            SET p_message = '매핑을 찾을 수 없습니다.';
            SET p_is_valid = FALSE;
            SET p_validation_message = '매핑을 찾을 수 없습니다.';
            SET p_recommended_amount = 0;
            SET p_amount_breakdown = NULL;
            SET p_consistency_score = 0;
            ROLLBACK;
        ELSE
            -- 3. 매핑 정보 조회 (테넌트 격리)
            SELECT 
        COALESCE(package_price, 0),
        COALESCE(payment_amount, 0),
        COALESCE(total_sessions, 0)
            INTO v_package_price, v_payment_amount, v_total_sessions
            FROM consultant_client_mappings 
            WHERE id = p_mapping_id 
              AND tenant_id = p_tenant_id 
              AND is_deleted = FALSE;
            
            -- 4. ERP 거래 총액 계산 (테넌트 격리)
            SELECT COALESCE(SUM(amount), 0)
            INTO v_erp_total_amount
            FROM financial_transactions 
            WHERE related_entity_id = p_mapping_id 
              AND related_entity_type = 'CONSULTANT_CLIENT_MAPPING'
              AND transaction_type = 'INCOME'
              AND tenant_id = p_tenant_id
              AND is_deleted = FALSE;
            
            -- 5. 회기당 단가 계산
            IF v_total_sessions > 0 THEN
                SET v_price_per_session = v_package_price / v_total_sessions;
            ELSE
                SET v_price_per_session = 0;
            END IF;
            
            -- 6. 금액 차이 계산
            SET v_difference = ABS(p_input_amount - v_payment_amount);
            
            -- 7. 일관성 검증
            SET v_consistency_issues = 0;
            
            -- 패키지 가격과 결제 금액 일치 여부
            IF ABS(v_package_price - v_payment_amount) > 0.01 THEN
                SET v_consistency_issues = v_consistency_issues + 1;
            END IF;
            
            -- ERP 총액과 결제 금액 일치 여부
            IF ABS(v_erp_total_amount - v_payment_amount) > 0.01 THEN
                SET v_consistency_issues = v_consistency_issues + 1;
            END IF;
            
            -- 입력 금액과 결제 금액 일치 여부
            IF ABS(p_input_amount - v_payment_amount) > 0.01 THEN
                SET v_consistency_issues = v_consistency_issues + 1;
            END IF;
            
            -- 8. 일관성 점수 계산 (0-100, 100이 가장 일관성 높음)
            SET p_consistency_score = GREATEST(0, 100 - (v_consistency_issues * 33.33));
            
            -- 9. 검증 결과 설정
            IF v_consistency_issues = 0 AND ABS(p_input_amount - v_payment_amount) <= 0.01 THEN
                SET p_is_valid = TRUE;
                SET p_validation_message = '금액이 일관성 있게 검증되었습니다.';
                SET p_recommended_amount = v_payment_amount;
            ELSE
                SET p_is_valid = FALSE;
                SET p_validation_message = CONCAT('금액 불일치가 발견되었습니다. (차이: ', v_difference, '원)');
                SET p_recommended_amount = v_payment_amount;
            END IF;
            
            -- 10. 상세 내역 JSON 생성
            SET v_breakdown = JSON_OBJECT(
                'package_price', v_package_price,
                'payment_amount', v_payment_amount,
                'erp_total_amount', v_erp_total_amount,
                'input_amount', p_input_amount,
                'difference', v_difference,
                'total_sessions', v_total_sessions,
                'price_per_session', v_price_per_session,
                'consistency_issues', v_consistency_issues
            );
            
            SET p_amount_breakdown = v_breakdown;
            SET p_success = TRUE;
            SET p_message = '금액 검증이 완료되었습니다.';
            
            COMMIT;
        END IF;
    END IF;
    
END //

DELIMITER ;

