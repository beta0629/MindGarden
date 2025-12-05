package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlAccountingService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 통합회계 관리 서비스 구현체
 * 복잡한 회계 로직을 PL/SQL로 처리하여 성능 향상 및 데이터 일관성 보장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlSqlAccountingServiceImpl implements PlSqlAccountingService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    public Map<String, Object> validateIntegratedAmount(Long mappingId, BigDecimal inputAmount) {
        log.info("🔍 PL/SQL 통합 금액 검증 시작: MappingID={}, InputAmount={}", mappingId, inputAmount);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ValidateIntegratedAmount(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setLong(1, mappingId);
            stmt.setBigDecimal(2, inputAmount);
            stmt.setString(3, tenantId); // p_tenant_id 추가
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(4, java.sql.Types.BOOLEAN);    // is_valid
            stmt.registerOutParameter(5, java.sql.Types.VARCHAR);    // validation_message
            stmt.registerOutParameter(6, java.sql.Types.DECIMAL);    // recommended_amount
            stmt.registerOutParameter(7, java.sql.Types.LONGVARCHAR); // amount_breakdown (JSON)
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);    // consistency_score
            stmt.registerOutParameter(9, java.sql.Types.BOOLEAN);    // success
            stmt.registerOutParameter(10, java.sql.Types.VARCHAR);    // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("isValid", stmt.getBoolean(4));
            result.put("validationMessage", stmt.getString(5));
            result.put("recommendedAmount", stmt.getBigDecimal(6));
            result.put("amountBreakdown", stmt.getString(7));
            result.put("consistencyScore", stmt.getBigDecimal(8));
            result.put("success", stmt.getBoolean(9));
            result.put("message", stmt.getString(10));
            
            log.info("✅ PL/SQL 통합 금액 검증 완료: Success={}, Valid={}, Score={}", 
                stmt.getBoolean(9), stmt.getBoolean(4), stmt.getBigDecimal(8));
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 통합 금액 검증 실패: MappingID={}", mappingId, e);
            result.put("success", false);
            result.put("message", "금액 검증 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> getConsolidatedFinancialData(LocalDate startDate, LocalDate endDate, String branchCodes) {
        log.info("🏭 PL/SQL 전사 통합 재무 현황 조회: StartDate={}, EndDate={}, BranchCodes={}", 
            startDate, endDate, branchCodes);
        
        // 테넌트 ID 가져오기 (branchCodes 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GetConsolidatedFinancialData(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setString(1, tenantId); // p_tenant_id (첫 번째 파라미터)
            stmt.setDate(2, java.sql.Date.valueOf(startDate));
            stmt.setDate(3, java.sql.Date.valueOf(endDate));
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(4, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(5, java.sql.Types.VARCHAR);   // message
            stmt.registerOutParameter(6, java.sql.Types.DECIMAL);    // total_revenue
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);    // total_expenses
            stmt.registerOutParameter(8, java.sql.Types.DECIMAL);    // net_profit
            stmt.registerOutParameter(9, java.sql.Types.INTEGER);    // total_transactions
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(4));
            result.put("message", stmt.getString(5));
            result.put("totalRevenue", stmt.getBigDecimal(6));
            result.put("totalExpenses", stmt.getBigDecimal(7));
            result.put("netProfit", stmt.getBigDecimal(8));
            result.put("totalTransactions", stmt.getInt(9));
            
            log.info("✅ PL/SQL 전사 통합 재무 현황 조회 완료: Success={}, Revenue={}, Profit={}", 
                stmt.getBoolean(4), stmt.getBigDecimal(6), stmt.getBigDecimal(8));
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 전사 통합 재무 현황 조회 실패: StartDate={}, EndDate={}", startDate, endDate, e);
            result.put("success", false);
            result.put("message", "통합 재무 현황 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> processDiscountAccounting(
        Long mappingId, 
        String discountCode, 
        BigDecimal originalAmount, 
        BigDecimal discountAmount, 
        BigDecimal finalAmount, 
        String discountType
    ) {
        log.info("💰 PL/SQL 할인 회계 처리 시작: MappingID={}, DiscountCode={}, Original={}, Final={}", 
            mappingId, discountCode, originalAmount, finalAmount);
        
        // 테넌트 ID 및 생성자 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String createdBy = TenantContextHolder.getTenantId(); // TODO: 실제 사용자 ID로 변경 필요
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessDiscountAccounting(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setLong(1, mappingId);
            stmt.setString(2, discountCode);
            stmt.setBigDecimal(3, originalAmount);
            stmt.setBigDecimal(4, discountAmount);
            stmt.setBigDecimal(5, finalAmount);
            stmt.setString(6, discountType);
            stmt.setString(7, tenantId); // p_tenant_id 추가
            stmt.setString(8, createdBy); // p_created_by 추가
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(9, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(10, java.sql.Types.VARCHAR);   // message
            stmt.registerOutParameter(11, java.sql.Types.BIGINT);     // accounting_id
            stmt.registerOutParameter(12, java.sql.Types.VARCHAR);    // erp_transaction_id
            stmt.registerOutParameter(13, java.sql.Types.LONGVARCHAR); // accounting_summary (JSON)
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("success", stmt.getBoolean(9));
            result.put("message", stmt.getString(10));
            result.put("accountingId", stmt.getLong(11));
            result.put("erpTransactionId", stmt.getString(12));
            result.put("accountingSummary", stmt.getString(13));
            
            log.info("✅ PL/SQL 할인 회계 처리 완료: Success={}, AccountingID={}, ERPTransactionID={}", 
                stmt.getBoolean(9), stmt.getLong(11), stmt.getString(12));
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 할인 회계 처리 실패: MappingID={}, DiscountCode={}", mappingId, discountCode, e);
            result.put("success", false);
            result.put("message", "할인 회계 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> generateFinancialReport(
        String reportType, 
        LocalDate periodStart, 
        LocalDate periodEnd, 
        String branchCode
    ) {
        log.info("📊 PL/SQL 재무 보고서 생성: Type={}, Start={}, End={}, Branch={}", 
            reportType, periodStart, periodEnd, branchCode);
        
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GenerateFinancialReport(?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setString(1, reportType);
            stmt.setDate(2, java.sql.Date.valueOf(periodStart));
            stmt.setDate(3, java.sql.Date.valueOf(periodEnd));
            stmt.setString(4, tenantId); // p_tenant_id 추가
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(5, java.sql.Types.LONGVARCHAR); // report_data (JSON)
            stmt.registerOutParameter(6, java.sql.Types.BOOLEAN);     // success
            stmt.registerOutParameter(7, java.sql.Types.VARCHAR);     // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("reportData", stmt.getString(5));
            result.put("success", stmt.getBoolean(6));
            result.put("message", stmt.getString(7));
            
            log.info("✅ PL/SQL 재무 보고서 생성 완료: Success={}, Type={}", 
                stmt.getBoolean(6), reportType);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 재무 보고서 생성 실패: Type={}, Start={}, End={}", 
                reportType, periodStart, periodEnd, e);
            result.put("success", false);
            result.put("message", "재무 보고서 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> checkPlSqlStatus() {
        log.info("🔍 PL/SQL 프로시저 상태 확인");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 프로시저 존재 여부 확인
            String checkProcedure = """
                SELECT COUNT(*) as procedure_count
                FROM information_schema.routines 
                WHERE routine_schema = DATABASE() 
                AND routine_name IN ('ValidateIntegratedAmount', 'GetConsolidatedFinancialData', 'ProcessDiscountAccounting', 'GenerateFinancialReport')
                AND routine_type = 'PROCEDURE'
            """;
            
            Integer procedureCount = jdbcTemplate.queryForObject(checkProcedure, Integer.class);
            
            result.put("success", true);
            result.put("procedureCount", procedureCount);
            result.put("expectedCount", 4);
            result.put("allProceduresAvailable", procedureCount != null && procedureCount == 4);
            result.put("message", procedureCount != null && procedureCount == 4 ? 
                "모든 PL/SQL 프로시저가 정상적으로 설치되어 있습니다." : 
                "일부 PL/SQL 프로시저가 누락되었습니다.");
            
            log.info("✅ PL/SQL 프로시저 상태 확인 완료: Count={}/4", procedureCount);
            
        } catch (Exception e) {
            log.error("❌ PL/SQL 프로시저 상태 확인 실패", e);
            result.put("success", false);
            result.put("message", "PL/SQL 프로시저 상태 확인 중 오류가 발생했습니다: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * UTF-8 인코딩 설정
     */
    private void setUtf8Encoding(Connection connection) throws Exception {
        connection.createStatement().execute("SET character_set_client = utf8mb4");
        connection.createStatement().execute("SET character_set_connection = utf8mb4");
        connection.createStatement().execute("SET character_set_results = utf8mb4");
    }
}
