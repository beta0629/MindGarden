package com.coresolution.consultation.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 급여관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlSqlSalaryManagementServiceImpl implements PlSqlSalaryManagementService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> processIntegratedSalaryCalculation(
            Long consultantId, 
            LocalDate periodStart, 
            LocalDate periodEnd, 
            String triggeredBy) {
        
        log.info("💰 PL/SQL 통합 급여 계산 시작: ConsultantID={}, Period={} ~ {}", 
                consultantId, periodStart, periodEnd);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessIntegratedSalaryCalculation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            connection.createStatement().execute("SET character_set_client = utf8mb4");
            connection.createStatement().execute("SET character_set_connection = utf8mb4");
            connection.createStatement().execute("SET character_set_results = utf8mb4");
            
            // IN 파라미터 설정
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId); // p_tenant_id 추가
            stmt.setString(5, triggeredBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(6, java.sql.Types.BIGINT);    // calculation_id
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // tax_amount
            stmt.registerOutParameter(10, java.sql.Types.BIGINT);    // erp_sync_id
            stmt.registerOutParameter(11, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(12, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("calculationId", stmt.getLong(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("erpSyncId", stmt.getLong(10));
            result.put("success", stmt.getBoolean(11));
            result.put("message", stmt.getString(12));
            
            log.info("✅ PL/SQL 통합 급여 계산 완료: CalculationID={}, GrossSalary={}, NetSalary={}", 
                    result.get("calculationId"), result.get("grossSalary"), result.get("netSalary"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 계산 오류", e);
            result.put("success", false);
            result.put("message", "급여 계산 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> approveSalaryWithErpSync(Long calculationId, String approvedBy) {
        
        log.info("✅ PL/SQL 급여 승인 시작: CalculationID={}, ApprovedBy={}", calculationId, approvedBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ApproveSalaryWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, approvedBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 승인 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 승인 오류", e);
            result.put("success", false);
            result.put("message", "급여 승인 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> processSalaryPaymentWithErpSync(Long calculationId, String paidBy) {
        
        log.info("💳 PL/SQL 급여 지급 시작: CalculationID={}, PaidBy={}", calculationId, paidBy);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessSalaryPaymentWithErpSync(?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setLong(1, calculationId);
            stmt.setString(2, paidBy);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);  // success
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);  // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(3));
            result.put("message", stmt.getString(4));
            
            log.info("✅ PL/SQL 급여 지급 완료: Success={}", result.get("success"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 급여 지급 오류", e);
            result.put("success", false);
            result.put("message", "급여 지급 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 통합 급여 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Map<String, Object> getIntegratedSalaryStatistics(
            String branchCode, 
            LocalDate startDate, 
            LocalDate endDate) {
        
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 PL/SQL 통합 급여 통계 조회: tenantId={}, Period={} ~ {}", 
                tenantId, startDate, endDate);
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GetIntegratedSalaryStatistics(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // IN 파라미터 설정
            stmt.setString(1, tenantId); // p_tenant_id (첫 번째 파라미터)
            stmt.setDate(2, java.sql.Date.valueOf(startDate));
            stmt.setDate(3, java.sql.Date.valueOf(endDate));
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(4, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(5, java.sql.Types.VARCHAR);   // message
            stmt.registerOutParameter(6, java.sql.Types.INTEGER);   // total_calculations
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // total_gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // total_net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // total_tax_amount
            stmt.registerOutParameter(10, java.sql.Types.DECIMAL);   // average_salary
            stmt.registerOutParameter(11, java.sql.Types.DECIMAL);   // erp_sync_success_rate
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(4));
            result.put("message", stmt.getString(5));
            result.put("totalCalculations", stmt.getInt(6));
            result.put("totalGrossSalary", stmt.getBigDecimal(7));
            result.put("totalNetSalary", stmt.getBigDecimal(8));
            result.put("totalTaxAmount", stmt.getBigDecimal(9));
            result.put("averageSalary", stmt.getBigDecimal(10));
            result.put("erpSyncSuccessRate", stmt.getBigDecimal(11));
            
            log.info("✅ PL/SQL 통합 급여 통계 조회 완료: TotalCalculations={}, TotalNetSalary={}", 
                    result.get("totalCalculations"), result.get("totalNetSalary"));
            
        } catch (SQLException e) {
            log.error("❌ PL/SQL 통합 급여 통계 조회 오류", e);
            result.put("success", false);
            result.put("message", "급여 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public boolean isProcedureAvailable() {
        try {
            // 프로시저 존재 여부 확인
            String sql = "SELECT COUNT(*) FROM information_schema.routines " +
                        "WHERE routine_schema = DATABASE() " +
                        "AND routine_name = 'CalculateSalaryPreview' " +
                        "AND routine_type = 'PROCEDURE'";
            
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
            
        } catch (Exception e) {
            log.error("PL/SQL 프로시저 사용 가능 여부 확인 오류", e);
            return false;
        }
    }
    
    @Override
    public Map<String, Object> calculateSalaryPreview(Long consultantId, LocalDate periodStart, LocalDate periodEnd) {
        log.info("💰 PL/SQL 급여 미리보기 계산: ConsultantID={}, Period={} ~ {}", 
                consultantId, periodStart, periodEnd);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL CalculateSalaryPreview(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            connection.createStatement().execute("SET character_set_client = utf8mb4");
            connection.createStatement().execute("SET character_set_connection = utf8mb4");
            connection.createStatement().execute("SET character_set_results = utf8mb4");
            
            // IN 파라미터 설정 (1~4)
            stmt.setLong(1, consultantId);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId);
            
            // OUT 파라미터 등록 (5~10: success, message, gross_salary, net_salary, tax_amount, consultation_count)
            stmt.registerOutParameter(5, java.sql.Types.BOOLEAN);   // p_success
            stmt.registerOutParameter(6, java.sql.Types.VARCHAR);   // p_message
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);   // p_gross_salary
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);   // p_net_salary
            stmt.registerOutParameter(9, java.sql.Types.DECIMAL);   // p_tax_amount
            stmt.registerOutParameter(10, java.sql.Types.INTEGER);  // p_consultation_count
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(5));
            result.put("message", stmt.getString(6));
            result.put("grossSalary", stmt.getBigDecimal(7));
            result.put("netSalary", stmt.getBigDecimal(8));
            result.put("taxAmount", stmt.getBigDecimal(9));
            result.put("consultationCount", stmt.getInt(10));
            
            log.info("✅ PL/SQL 급여 미리보기 완료: ConsultantID={}, GrossSalary={}, NetSalary={}, ConsultationCount={}", 
                    consultantId, result.get("grossSalary"), result.get("netSalary"), result.get("consultationCount"));

        } catch (Exception e) {
            log.error("❌ PL/SQL 급여 미리보기 중 오류 발생: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "급여 미리보기 중 오류가 발생했습니다: " + e.getMessage());
        }
        return result;
    }
}
