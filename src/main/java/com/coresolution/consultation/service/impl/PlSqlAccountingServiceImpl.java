package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlAccountingService;
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
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ValidateIntegratedAmount(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setLong(1, mappingId);
            stmt.setBigDecimal(2, inputAmount);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(3, java.sql.Types.BOOLEAN);    // is_valid
            stmt.registerOutParameter(4, java.sql.Types.VARCHAR);    // validation_message
            stmt.registerOutParameter(5, java.sql.Types.DECIMAL);    // recommended_amount
            stmt.registerOutParameter(6, java.sql.Types.LONGVARCHAR); // amount_breakdown (JSON)
            stmt.registerOutParameter(7, java.sql.Types.DECIMAL);    // consistency_score
            stmt.registerOutParameter(8, java.sql.Types.BOOLEAN);    // success
            stmt.registerOutParameter(9, java.sql.Types.VARCHAR);    // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("isValid", stmt.getBoolean(3));
            result.put("validationMessage", stmt.getString(4));
            result.put("recommendedAmount", stmt.getBigDecimal(5));
            result.put("amountBreakdown", stmt.getString(6));
            result.put("consistencyScore", stmt.getBigDecimal(7));
            result.put("success", stmt.getBoolean(8));
            result.put("message", stmt.getString(9));
            
            log.info("✅ PL/SQL 통합 금액 검증 완료: Success={}, Valid={}, Score={}", 
                stmt.getBoolean(8), stmt.getBoolean(3), stmt.getBigDecimal(7));
            
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
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL GetConsolidatedFinancialData(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setDate(1, java.sql.Date.valueOf(startDate));
            stmt.setDate(2, java.sql.Date.valueOf(endDate));
            stmt.setString(3, branchCodes);
            
            // OUT 파라미터 등록 (순서: 4, 5, 6, 7, 8, 9, 10, 11, 12)
            stmt.registerOutParameter(4, java.sql.Types.DECIMAL);    // total_revenue
            stmt.registerOutParameter(5, java.sql.Types.DECIMAL);    // total_expenses
            stmt.registerOutParameter(6, java.sql.Types.DECIMAL);    // net_profit
            stmt.registerOutParameter(7, java.sql.Types.INTEGER);    // total_transactions
            stmt.registerOutParameter(8, java.sql.Types.INTEGER);    // branch_count
            stmt.registerOutParameter(9, java.sql.Types.LONGVARCHAR); // financial_summary (JSON)
            stmt.registerOutParameter(10, java.sql.Types.LONGVARCHAR); // branch_breakdown (JSON)
            stmt.registerOutParameter(11, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(12, java.sql.Types.VARCHAR);   // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출 (인덱스 4-11)
            result.put("totalRevenue", stmt.getBigDecimal(4));
            result.put("totalExpenses", stmt.getBigDecimal(5));
            result.put("netProfit", stmt.getBigDecimal(6));
            result.put("totalTransactions", stmt.getInt(7));
            result.put("branchCount", stmt.getInt(8));
            result.put("financialSummary", stmt.getString(9));
            result.put("branchBreakdown", stmt.getString(10));
            result.put("success", stmt.getBoolean(11));
            result.put("message", stmt.getString(12));
            
            log.info("✅ PL/SQL 전사 통합 재무 현황 조회 완료: Success={}, Revenue={}, Profit={}", 
                stmt.getBoolean(11), stmt.getBigDecimal(4), stmt.getBigDecimal(6));
            
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
        
        Map<String, Object> result = new HashMap<>();
        
        try (Connection connection = jdbcTemplate.getDataSource().getConnection();
             CallableStatement stmt = connection.prepareCall(
                 "{CALL ProcessDiscountAccounting(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            
            // UTF-8 인코딩 설정
            setUtf8Encoding(connection);
            
            // IN 파라미터 설정
            stmt.setLong(1, mappingId);
            stmt.setString(2, discountCode);
            stmt.setBigDecimal(3, originalAmount);
            stmt.setBigDecimal(4, discountAmount);
            stmt.setBigDecimal(5, finalAmount);
            stmt.setString(6, discountType);
            
            // OUT 파라미터 등록
            stmt.registerOutParameter(7, java.sql.Types.BIGINT);     // accounting_id
            stmt.registerOutParameter(8, java.sql.Types.VARCHAR);    // erp_transaction_id
            stmt.registerOutParameter(9, java.sql.Types.LONGVARCHAR); // accounting_summary (JSON)
            stmt.registerOutParameter(10, java.sql.Types.BOOLEAN);   // success
            stmt.registerOutParameter(11, java.sql.Types.VARCHAR);   // message
            
            // 프로시저 실행
            stmt.execute();
            
            // 결과 추출
            result.put("accountingId", stmt.getLong(7));
            result.put("erpTransactionId", stmt.getString(8));
            result.put("accountingSummary", stmt.getString(9));
            result.put("success", stmt.getBoolean(10));
            result.put("message", stmt.getString(11));
            
            log.info("✅ PL/SQL 할인 회계 처리 완료: Success={}, AccountingID={}, ERPTransactionID={}", 
                stmt.getBoolean(10), stmt.getLong(7), stmt.getString(8));
            
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
            stmt.setString(4, branchCode);
            
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
