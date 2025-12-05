#!/bin/bash
# 표준화된 프로시저를 개발 DB에 배포하는 스크립트 (DELIMITER 제거 버전)

DEV_SERVER="beta0629.cafe24.com"
DEV_USER="root"
DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

echo "🚀 표준화된 프로시저 배포 시작..."
echo "서버: $DEV_SERVER"
echo "DB: $DB_NAME"
echo ""

# SSH로 접속하여 프로시저 배포
ssh "$DEV_USER@$DEV_SERVER" bash << 'ENDSSH'
set -e

DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

# CheckTimeConflict 프로시저 배포
echo "배포 중: CheckTimeConflict"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
DROP PROCEDURE IF EXISTS CheckTimeConflict;

CREATE PROCEDURE CheckTimeConflict(
    IN p_consultant_id BIGINT,
    IN p_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    IN p_exclude_schedule_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_has_conflict BOOLEAN,
    OUT p_conflict_reason VARCHAR(255)
)
BEGIN
    DECLARE v_conflict_count INT DEFAULT 0;
    SET p_has_conflict = FALSE;
    SET p_conflict_reason = '';
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '테넌트 ID는 필수입니다.';
    ELSEIF p_consultant_id IS NULL OR p_consultant_id <= 0 THEN
        SET p_has_conflict = TRUE;
        SET p_conflict_reason = '상담사 ID는 필수입니다.';
    ELSE
        SELECT COUNT(*) INTO v_conflict_count
        FROM schedules 
        WHERE consultant_id = p_consultant_id 
          AND tenant_id = p_tenant_id
          AND date = p_date
          AND status NOT IN ('CANCELLED', 'COMPLETED')
          AND is_deleted = FALSE
          AND (p_exclude_schedule_id IS NULL OR id != p_exclude_schedule_id)
          AND (
              (p_start_time >= start_time AND p_start_time < end_time) OR
              (p_end_time > start_time AND p_end_time <= end_time) OR
              (p_start_time < start_time AND p_end_time > end_time)
          );
        IF v_conflict_count > 0 THEN
            SET p_has_conflict = TRUE;
            SET p_conflict_reason = '기존 스케줄과 시간이 겹칩니다.';
        END IF;
    END IF;
END
SQL
echo "✅ CheckTimeConflict 배포 완료"

# GetRefundableSessions 프로시저 배포
echo "배포 중: GetRefundableSessions"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
DROP PROCEDURE IF EXISTS GetRefundableSessions;

CREATE PROCEDURE GetRefundableSessions(
    IN p_mapping_id BIGINT,
    IN p_tenant_id VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_refundable_sessions INT,
    OUT p_max_refund_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_current_total INT DEFAULT 0;
    DECLARE v_current_remaining INT DEFAULT 0;
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_mapping_status VARCHAR(50) DEFAULT '';
    DECLARE v_payment_status VARCHAR(50) DEFAULT '';
    DECLARE v_session_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_mapping_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_message = '환불 가능 회기 조회 중 오류 발생';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    END;
    
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSEIF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_refundable_sessions = 0;
        SET p_max_refund_amount = 0;
    ELSE
        SELECT COUNT(*) INTO v_mapping_count
        FROM consultant_client_mappings
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        SELECT 
            total_sessions, 
            remaining_sessions, 
            package_price,
            status,
            payment_status
        INTO 
            v_current_total, 
            v_current_remaining, 
            v_package_price,
            v_mapping_status,
            v_payment_status
        FROM consultant_client_mappings 
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        IF v_mapping_count = 0 THEN
            SET p_success = FALSE;
            SET p_message = '매핑을 찾을 수 없습니다.';
            SET p_refundable_sessions = 0;
            SET p_max_refund_amount = 0;
        ELSEIF v_mapping_status = 'TERMINATED' THEN
            SET p_success = FALSE;
            SET p_message = '이미 종료된 매핑입니다.';
            SET p_refundable_sessions = 0;
            SET p_max_refund_amount = 0;
        ELSEIF v_payment_status != 'CONFIRMED' THEN
            SET p_success = FALSE;
            SET p_message = '결제가 확인되지 않은 매핑입니다.';
            SET p_refundable_sessions = 0;
            SET p_max_refund_amount = 0;
        ELSE
            SET p_refundable_sessions = v_current_remaining;
            
            IF v_current_total > 0 AND v_package_price > 0 THEN
                SET v_session_price = v_package_price / v_current_total;
                SET p_max_refund_amount = v_session_price * v_current_remaining;
            ELSE
                SET p_max_refund_amount = 0;
            END IF;
            
            SET p_success = TRUE;
            SET p_message = CONCAT('환불 가능 회기: ', p_refundable_sessions, '회기, 최대 환불 금액: ', p_max_refund_amount, '원');
        END IF;
    END IF;
END
SQL
echo "✅ GetRefundableSessions 배포 완료"

# GetRefundStatistics 프로시저 배포
echo "배포 중: GetRefundStatistics"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
DROP PROCEDURE IF EXISTS GetRefundStatistics;

CREATE PROCEDURE GetRefundStatistics(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_statistics JSON
)
BEGIN
    DECLARE v_total_refunds INT DEFAULT 0;
    DECLARE v_total_refund_amount DECIMAL(15,2) DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_message = '환불 통계 조회 중 오류 발생';
        SET p_statistics = JSON_OBJECT('error', '오류 발생');
    END;
    
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_statistics = JSON_OBJECT('error', '테넌트 ID가 필요합니다.');
    ELSEIF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_statistics = JSON_OBJECT('error', '유효한 기간이 필요합니다.');
    ELSE
        SELECT 
            COUNT(*),
            COALESCE(SUM(refund_amount), 0)
        INTO 
            v_total_refunds,
            v_total_refund_amount
        FROM financial_transactions 
        WHERE tenant_id = p_tenant_id
          AND transaction_type = 'REFUND'
          AND transaction_date BETWEEN p_start_date AND p_end_date
          AND is_deleted = FALSE;
        
        SET p_statistics = JSON_OBJECT(
            'totalRefunds', v_total_refunds,
            'totalRefundAmount', v_total_refund_amount,
            'startDate', p_start_date,
            'endDate', p_end_date
        );
        
        SET p_success = TRUE;
        SET p_message = CONCAT('환불 통계 조회 완료: 총 ', v_total_refunds, '건, 총 환불 금액: ', v_total_refund_amount, '원');
    END IF;
END
SQL
echo "✅ GetRefundStatistics 배포 완료"

# ValidateIntegratedAmount 프로시저 배포
echo "배포 중: ValidateIntegratedAmount"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
DROP PROCEDURE IF EXISTS ValidateIntegratedAmount;

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
    DECLARE v_package_price DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_difference DECIMAL(15,2) DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_message = '금액 검증 중 오류 발생';
        SET p_is_valid = FALSE;
        SET p_validation_message = '검증 중 오류가 발생했습니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
    END;
    
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_is_valid = FALSE;
        SET p_validation_message = '테넌트 ID가 필요합니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
    ELSEIF p_mapping_id IS NULL OR p_mapping_id <= 0 THEN
        SET p_success = FALSE;
        SET p_message = '매핑 ID는 필수입니다.';
        SET p_is_valid = FALSE;
        SET p_validation_message = '매핑 ID가 필요합니다.';
        SET p_recommended_amount = 0;
        SET p_amount_breakdown = NULL;
        SET p_consistency_score = 0;
    ELSE
        SELECT 
            package_price,
            payment_amount
        INTO 
            v_package_price,
            v_payment_amount
        FROM consultant_client_mappings 
        WHERE id = p_mapping_id 
          AND tenant_id = p_tenant_id 
          AND is_deleted = FALSE;
        
        IF v_package_price IS NULL THEN
            SET p_success = FALSE;
            SET p_message = '매핑을 찾을 수 없습니다.';
            SET p_is_valid = FALSE;
            SET p_validation_message = '매핑을 찾을 수 없습니다.';
            SET p_recommended_amount = 0;
            SET p_amount_breakdown = NULL;
            SET p_consistency_score = 0;
        ELSE
            SET v_difference = ABS(p_input_amount - v_package_price);
            
            IF v_difference < 0.01 THEN
                SET p_is_valid = TRUE;
                SET p_validation_message = '금액이 일치합니다.';
                SET p_consistency_score = 100.00;
            ELSE
                SET p_is_valid = FALSE;
                SET p_validation_message = CONCAT('금액이 일치하지 않습니다. 차이: ', v_difference, '원');
                SET p_consistency_score = GREATEST(0, 100 - (v_difference / v_package_price * 100));
            END IF;
            
            SET p_recommended_amount = v_package_price;
            SET p_amount_breakdown = JSON_OBJECT(
                'packagePrice', v_package_price,
                'inputAmount', p_input_amount,
                'difference', v_difference
            );
            SET p_success = TRUE;
            SET p_message = '금액 검증 완료';
        END IF;
    END IF;
END
SQL
echo "✅ ValidateIntegratedAmount 배포 완료"

# GetConsolidatedFinancialData 프로시저 배포
echo "배포 중: GetConsolidatedFinancialData"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
DROP PROCEDURE IF EXISTS GetConsolidatedFinancialData;

CREATE PROCEDURE GetConsolidatedFinancialData(
    IN p_tenant_id VARCHAR(100),
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_total_revenue DECIMAL(15,2),
    OUT p_total_expenses DECIMAL(15,2),
    OUT p_net_profit DECIMAL(15,2),
    OUT p_total_transactions INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_success = FALSE;
        SET p_message = '재무 데이터 조회 중 오류 발생';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
    END;
    
    IF p_tenant_id IS NULL OR p_tenant_id = '' THEN
        SET p_success = FALSE;
        SET p_message = '테넌트 ID는 필수입니다.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
    ELSEIF p_start_date IS NULL OR p_end_date IS NULL OR p_start_date > p_end_date THEN
        SET p_success = FALSE;
        SET p_message = '유효한 기간을 입력해주세요.';
        SET p_total_revenue = 0;
        SET p_total_expenses = 0;
        SET p_net_profit = 0;
        SET p_total_transactions = 0;
    ELSE
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) - 
                     SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0),
            COUNT(*)
        INTO 
            p_total_revenue,
            p_total_expenses,
            p_net_profit,
            p_total_transactions
        FROM financial_transactions 
        WHERE tenant_id = p_tenant_id
          AND transaction_date BETWEEN p_start_date AND p_end_date
          AND is_deleted = FALSE;
        
        SET p_success = TRUE;
        SET p_message = CONCAT('재무 데이터 조회 완료: 수익=', p_total_revenue, ', 지출=', p_total_expenses, ', 순이익=', p_net_profit);
    END IF;
END
SQL
echo "✅ GetConsolidatedFinancialData 배포 완료"

echo ""
echo "🔍 배포된 프로시저 확인..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '$DB_NAME' AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME IN ('CheckTimeConflict', 'GetRefundableSessions', 'GetRefundStatistics', 'ValidateIntegratedAmount', 'GetConsolidatedFinancialData') ORDER BY ROUTINE_NAME;" 2>&1 | grep -v "Warning\|ROUTINE_NAME"

ENDSSH

echo ""
echo "✅ 프로시저 배포 완료!"

