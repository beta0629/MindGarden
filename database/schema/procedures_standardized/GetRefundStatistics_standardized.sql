-- =====================================================
-- 환불 통계 조회 프로시저 (표준화 버전)
-- =====================================================
DELIMITER //

DROP PROCEDURE IF EXISTS GetRefundStatistics //

CREATE PROCEDURE GetRefundStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_statistics JSON
)
BEGIN
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_total_refund_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_refund_sessions INT DEFAULT 0;
    DECLARE v_avg_refund_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_total_used_sessions INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('환불 통계 조회 중 오류 발생: ', v_error_message);
        SET p_statistics = JSON_OBJECT('error', v_error_message);
    END;
    
    -- 1. 입력값 검증
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_statistics = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
    ELSEIF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_statistics = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
    ELSE
    
    -- 2. 환불 통계 계산 (테넌트 격리)
    -- 주의: session_usage_logs 테이블에 amount 컬럼이 없으므로 package_price를 사용
    SELECT 
        COUNT(*),
        COALESCE(SUM(ABS(sul.package_price)), 0),
        COALESCE(SUM(ABS(sul.additional_sessions)), 0),
        COALESCE(AVG(ABS(sul.package_price)), 0)
    INTO 
        v_total_refunds,
        v_total_refund_amount,
        v_total_refund_sessions,
        v_avg_refund_amount
    FROM session_usage_logs sul
    JOIN consultant_client_mappings ccm ON sul.mapping_id = ccm.id
    WHERE sul.action_type = 'REFUND'
      AND ccm.tenant_id = p_tenant_id
      AND DATE(sul.created_at) BETWEEN p_start_date AND p_end_date
      AND ccm.is_deleted = FALSE;
    
    -- 3. 전체 사용 회기 수 계산 (환불률 계산용, 테넌트 격리)
    SELECT COALESCE(SUM(used_sessions), 0)
    INTO v_total_used_sessions
    FROM consultant_client_mappings 
    WHERE tenant_id = p_tenant_id
      AND created_at BETWEEN p_start_date AND p_end_date
      AND is_deleted = FALSE;
    
    -- 4. 결과 생성
    SET p_statistics = JSON_OBJECT(
        'tenant_id', p_tenant_id,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'total_refunds', v_total_refunds,
        'total_refund_amount', v_total_refund_amount,
        'total_refund_sessions', v_total_refund_sessions,
        'avg_refund_amount', v_avg_refund_amount,
        'refund_rate', CASE 
            WHEN (v_total_refund_sessions + v_total_used_sessions) > 0 THEN 
                ROUND((v_total_refund_sessions * 100.0 / (v_total_refund_sessions + v_total_used_sessions)), 2)
            ELSE 0 
        END
    );
    
    SET p_success = TRUE;
    SET p_message = '환불 통계 조회 완료';
    END IF;
    
END //

DELIMITER ;

