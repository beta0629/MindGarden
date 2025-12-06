package com.coresolution.consultation.service.impl;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.PlSqlFinancialService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PL/SQL 기반 재무 서비스 구현
 * 복잡한 재무 계산을 PL/SQL 프로시저로 처리하여 성능 향상
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PlSqlFinancialServiceImpl implements PlSqlFinancialService {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getConsolidatedFinancialData(LocalDate startDate, LocalDate endDate) {
        log.info("🏭 PL/SQL 통합 재무 현황 조회: {} ~ {}", startDate, endDate);
        
        try {
            // 직접 SQL 쿼리로 통합 재무 데이터 조회
            String sql = """
                SELECT 
                    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) as totalRevenue,
                    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) as totalExpenses,
                    COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) - 
                             SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) as netProfit,
                    COUNT(*) as totalTransactions,
                    COUNT(DISTINCT branch_code) as branchCount
                FROM financial_transactions 
                WHERE transaction_date BETWEEN ? AND ? 
                AND is_deleted = FALSE
                """;
            
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, startDate, endDate);
            
            // 지점별 상세 데이터 조회
            List<Map<String, Object>> branchBreakdown = getBranchFinancialBreakdownData(startDate, endDate);
            result.put("branchBreakdown", branchBreakdown);
            
            // 카테고리별 지출 분석 데이터 추가
            List<Map<String, Object>> categoryBreakdown = getCategoryExpenseAnalysisForConsolidated(startDate, endDate);
            result.put("categoryBreakdown", categoryBreakdown);
            
            log.info("✅ 통합 재무 현황 조회 완료: 수익={}, 지출={}, 순이익={}", 
                result.get("totalRevenue"), result.get("totalExpenses"), result.get("netProfit"));
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 통합 재무 현황 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("통합 재무 현황 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBranchFinancialBreakdown(LocalDate startDate, LocalDate endDate) {
        log.info("🏢 지점별 재무 상세 조회: {} ~ {}", startDate, endDate);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // 표준화된 프로시저는 JSON을 반환하므로 CallableStatement 사용
            return jdbcTemplate.execute(
                (Connection connection) -> connection.prepareCall("{CALL GetBranchFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}"),
                (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
                    callableStatement.setString(1, tenantId);
                    callableStatement.setDate(2, java.sql.Date.valueOf(startDate));
                    callableStatement.setDate(3, java.sql.Date.valueOf(endDate));
                    callableStatement.registerOutParameter(4, Types.BOOLEAN); // p_success
                    callableStatement.registerOutParameter(5, Types.VARCHAR); // p_message
                    callableStatement.registerOutParameter(6, Types.LONGVARCHAR); // p_breakdown_data (JSON)
                    
                    callableStatement.execute();
                    
                    Boolean success = callableStatement.getBoolean(4);
                    String message = callableStatement.getString(5);
                    String breakdownDataJson = callableStatement.getString(6);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", success);
                    result.put("message", message);
                    result.put("breakdownData", breakdownDataJson); // JSON 문자열
                    result.put("period", Map.of("startDate", startDate, "endDate", endDate));
                    
                    log.info("✅ 지점별 재무 상세 조회 완료: success={}", success);
                    return result;
                }
            );
            
        } catch (Exception e) {
            log.error("❌ 지점별 재무 상세 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("지점별 재무 상세 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyFinancialTrend(LocalDate startDate, LocalDate endDate) {
        log.info("📈 월별 재무 추이 분석: {} ~ {}", startDate, endDate);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // 표준화된 프로시저는 JSON을 반환하므로 CallableStatement 사용
            return jdbcTemplate.execute(
                (Connection connection) -> connection.prepareCall("{CALL GetMonthlyFinancialTrend(?, ?, ?, @p_success, @p_message, @p_trend_data)}"),
                (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
                    callableStatement.setString(1, tenantId);
                    callableStatement.setDate(2, java.sql.Date.valueOf(startDate));
                    callableStatement.setDate(3, java.sql.Date.valueOf(endDate));
                    callableStatement.registerOutParameter(4, Types.BOOLEAN); // p_success
                    callableStatement.registerOutParameter(5, Types.VARCHAR); // p_message
                    callableStatement.registerOutParameter(6, Types.LONGVARCHAR); // p_trend_data (JSON)
                    
                    callableStatement.execute();
                    
                    Boolean success = callableStatement.getBoolean(4);
                    String message = callableStatement.getString(5);
                    String trendDataJson = callableStatement.getString(6);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", success);
                    result.put("message", message);
                    result.put("trendData", trendDataJson); // JSON 문자열
                    result.put("period", Map.of("startDate", startDate, "endDate", endDate));
                    
                    log.info("✅ 월별 재무 추이 분석 완료: success={}", success);
                    return result;
                }
            );
            
        } catch (Exception e) {
            log.error("❌ 월별 재무 추이 분석 실패: {}", e.getMessage(), e);
            throw new RuntimeException("월별 재무 추이 분석에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryFinancialBreakdown(LocalDate startDate, LocalDate endDate) {
        log.info("📊 카테고리별 재무 분석: {} ~ {}", startDate, endDate);
        
        // 테넌트 ID 가져오기
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // 표준화된 프로시저는 JSON을 반환하므로 CallableStatement 사용
            return jdbcTemplate.execute(
                (Connection connection) -> connection.prepareCall("{CALL GetCategoryFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}"),
                (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
                    callableStatement.setString(1, tenantId);
                    callableStatement.setDate(2, java.sql.Date.valueOf(startDate));
                    callableStatement.setDate(3, java.sql.Date.valueOf(endDate));
                    callableStatement.registerOutParameter(4, Types.BOOLEAN); // p_success
                    callableStatement.registerOutParameter(5, Types.VARCHAR); // p_message
                    callableStatement.registerOutParameter(6, Types.LONGVARCHAR); // p_breakdown_data (JSON)
                    
                    callableStatement.execute();
                    
                    Boolean success = callableStatement.getBoolean(4);
                    String message = callableStatement.getString(5);
                    String breakdownDataJson = callableStatement.getString(6);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", success);
                    result.put("message", message);
                    result.put("categoryData", breakdownDataJson); // JSON 문자열
                    result.put("period", Map.of("startDate", startDate, "endDate", endDate));
                    
                    log.info("✅ 카테고리별 재무 분석 완료: success={}", success);
                    return result;
                }
            );
            
        } catch (Exception e) {
            log.error("❌ 카테고리별 재무 분석 실패: {}", e.getMessage(), e);
            throw new RuntimeException("카테고리별 재무 분석에 실패했습니다.", e);
        }
    }
    
    /**
     * 월별 재무 보고서 생성
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateMonthlyFinancialReport(int year, int month, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = com.coresolution.core.context.TenantContextHolder.getRequiredTenantId();
        log.info("📅 월별 재무 보고서 생성: {}-{}, tenantId={}", year, month, tenantId);
        
        try {
            // 표준화 2025-12-06: branchCode 필터링 제거, tenantId 기반으로만 조회
            String sql = """
                SELECT 
                    ? AS report_year,
                    ? AS report_month,
                    NULL AS branch_code,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                             SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
                    COUNT(*) AS total_transactions,
                    COUNT(DISTINCT DATE(ft.transaction_date)) AS active_days
                FROM financial_transactions ft
                WHERE ft.tenant_id = ?
                    AND ft.transaction_date BETWEEN DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
                    AND LAST_DAY(DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')))
                    AND ft.is_deleted = FALSE
                """;
            
            List<Map<String, Object>> reportData = jdbcTemplate.query(sql,
                new Object[]{year, month, tenantId, year, month, year, month},
                (rs, rowNum) -> {
                    Map<String, Object> report = new HashMap<>();
                    report.put("reportYear", rs.getInt("report_year"));
                    report.put("reportMonth", rs.getInt("report_month"));
                    report.put("tenantId", tenantId);
                    report.put("totalRevenue", rs.getLong("total_revenue"));
                    report.put("totalExpenses", rs.getLong("total_expenses"));
                    report.put("netProfit", rs.getLong("net_profit"));
                    report.put("totalTransactions", rs.getInt("total_transactions"));
                    report.put("activeDays", rs.getInt("active_days"));
                    return report;
                });
            
            // 카테고리별 지출 분석 데이터 추가
            List<Map<String, Object>> categoryAnalysis = getCategoryExpenseAnalysis(year, month, null); // branchCode 무시
            
            Map<String, Object> result = new HashMap<>();
            result.put("reportData", reportData);
            result.put("categoryAnalysis", categoryAnalysis);
            result.put("reportType", "monthly");
            result.put("period", String.format("%d-%02d", year, month));
            
            log.info("✅ 월별 재무 보고서 생성 완료: {} 건", reportData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 월별 재무 보고서 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("월별 재무 보고서 생성에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateQuarterlyFinancialReport(int year, int quarter, String branchCode) {
        log.info("📊 분기별 재무 보고서 생성: {}-Q{}, 지점={}", year, quarter, branchCode);
        
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // 표준화된 프로시저는 JSON을 반환하므로 CallableStatement 사용
            return jdbcTemplate.execute(
                (Connection connection) -> connection.prepareCall("{CALL GenerateQuarterlyFinancialReport(?, ?, ?, @p_success, @p_message, @p_report_data)}"),
                (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
                    callableStatement.setInt(1, year);
                    callableStatement.setInt(2, quarter);
                    callableStatement.setString(3, tenantId);
                    callableStatement.registerOutParameter(4, Types.BOOLEAN); // p_success
                    callableStatement.registerOutParameter(5, Types.VARCHAR); // p_message
                    callableStatement.registerOutParameter(6, Types.LONGVARCHAR); // p_report_data (JSON)
                    
                    callableStatement.execute();
                    
                    Boolean success = callableStatement.getBoolean(4);
                    String message = callableStatement.getString(5);
                    String reportDataJson = callableStatement.getString(6);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", success);
                    result.put("message", message);
                    result.put("reportData", reportDataJson); // JSON 문자열
                    result.put("reportType", "quarterly");
                    result.put("period", String.format("%d-Q%d", year, quarter));
                    
                    log.info("✅ 분기별 재무 보고서 생성 완료: success={}", success);
                    return result;
                }
            );
            
        } catch (Exception e) {
            log.error("❌ 분기별 재무 보고서 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("분기별 재무 보고서 생성에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateYearlyFinancialReport(int year, String branchCode) {
        log.info("📊 연도별 재무 보고서 생성: {}, 지점={}", year, branchCode);
        
        try {
            // 프로시저 의존성 제거 - 직접 SQL 쿼리 사용
            String sql = """
                SELECT 
                    ? AS report_year,
                    COALESCE(b.branch_code, 'ALL') AS branch_code,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                             SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
                    COUNT(ft.id) AS total_transactions,
                    COUNT(DISTINCT MONTH(ft.transaction_date)) AS active_months,
                    COUNT(DISTINCT ft.branch_code) AS active_branches
                FROM branches b
                LEFT JOIN financial_transactions ft ON b.branch_code = ft.branch_code
                    AND YEAR(ft.transaction_date) = ?
                    AND ft.is_deleted = FALSE
                WHERE b.is_deleted = FALSE 
                AND b.branch_status = 'ACTIVE'
                AND (? IS NULL OR b.branch_code = ?)
                GROUP BY b.branch_code
                ORDER BY total_revenue DESC
                """;
            
            List<Map<String, Object>> reportData = jdbcTemplate.query(sql,
                new Object[]{year, year, branchCode, branchCode},
                (rs, rowNum) -> {
                    Map<String, Object> report = new HashMap<>();
                    report.put("reportYear", rs.getInt("report_year"));
                    report.put("branchCode", rs.getString("branch_code"));
                    report.put("totalRevenue", rs.getLong("total_revenue"));
                    report.put("totalExpenses", rs.getLong("total_expenses"));
                    report.put("netProfit", rs.getLong("net_profit"));
                    report.put("totalTransactions", rs.getInt("total_transactions"));
                    report.put("activeMonths", rs.getInt("active_months"));
                    report.put("activeBranches", rs.getInt("active_branches"));
                    return report;
                });
            
            Map<String, Object> result = new HashMap<>();
            result.put("reportData", reportData);
            result.put("reportType", "yearly");
            result.put("period", String.valueOf(year));
            
            log.info("✅ 연도별 재무 보고서 생성 완료: {} 건", reportData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 연도별 재무 보고서 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("연도별 재무 보고서 생성에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> calculateFinancialKPIs(LocalDate startDate, LocalDate endDate, String branchCode) {
        log.info("📊 재무 성과 지표 계산: {} ~ {}, 지점={}", startDate, endDate, branchCode);
        
        // 테넌트 ID 가져오기 (branchCode 파라미터는 더 이상 사용하지 않음)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        try {
            // 표준화된 프로시저는 OUT 파라미터로 결과를 반환하므로 CallableStatement 사용
            return jdbcTemplate.execute(
                (Connection connection) -> connection.prepareCall("{CALL CalculateFinancialKPIs(?, ?, ?, @p_success, @p_message, @p_total_revenue, @p_total_expenses, @p_net_profit, @p_total_transactions, @p_profit_margin, @p_avg_transaction_value)}"),
                (CallableStatementCallback<Map<String, Object>>) callableStatement -> {
                    callableStatement.setString(1, tenantId);
                    callableStatement.setDate(2, java.sql.Date.valueOf(startDate));
                    callableStatement.setDate(3, java.sql.Date.valueOf(endDate));
                    callableStatement.registerOutParameter(4, Types.BOOLEAN); // p_success
                    callableStatement.registerOutParameter(5, Types.VARCHAR); // p_message
                    callableStatement.registerOutParameter(6, Types.DECIMAL); // p_total_revenue
                    callableStatement.registerOutParameter(7, Types.DECIMAL); // p_total_expenses
                    callableStatement.registerOutParameter(8, Types.DECIMAL); // p_net_profit
                    callableStatement.registerOutParameter(9, Types.INTEGER); // p_total_transactions
                    callableStatement.registerOutParameter(10, Types.DECIMAL); // p_profit_margin
                    callableStatement.registerOutParameter(11, Types.DECIMAL); // p_avg_transaction_value
                    
                    callableStatement.execute();
                    
                    Boolean success = callableStatement.getBoolean(4);
                    String message = callableStatement.getString(5);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", success);
                    result.put("message", message);
                    result.put("totalRevenue", callableStatement.getBigDecimal(6));
                    result.put("totalExpenses", callableStatement.getBigDecimal(7));
                    result.put("netProfit", callableStatement.getBigDecimal(8));
                    result.put("totalTransactions", callableStatement.getInt(9));
                    result.put("profitMargin", callableStatement.getBigDecimal(10));
                    result.put("avgTransactionValue", callableStatement.getBigDecimal(11));
                    result.put("period", Map.of("startDate", startDate, "endDate", endDate));
                    
                    log.info("✅ 재무 성과 지표 계산 완료: success={}", success);
                    return result;
                }
            );
            
        } catch (Exception e) {
            log.error("❌ 재무 성과 지표 계산 실패: {}", e.getMessage(), e);
            throw new RuntimeException("재무 성과 지표 계산에 실패했습니다.", e);
        }
    }
    
    /**
     * 지점별 재무 상세 데이터 조회 (내부 메서드)
     */
    private List<Map<String, Object>> getBranchFinancialBreakdownData(LocalDate startDate, LocalDate endDate) {
        // branches 테이블에서 지점 데이터 조회하도록 수정
        String sql = """
            SELECT 
                b.branch_code,
                b.branch_name,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS revenue,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS expenses,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                         SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
                COUNT(ft.id) AS transaction_count
            FROM branches b
            LEFT JOIN financial_transactions ft ON b.branch_code = ft.branch_code
                AND ft.transaction_date BETWEEN ? AND ?
                AND ft.is_deleted = FALSE
            WHERE b.is_deleted = FALSE 
            AND b.branch_status = 'ACTIVE'
            GROUP BY b.branch_code, b.branch_name
            ORDER BY revenue DESC
            """;
        
        return jdbcTemplate.query(sql,
            new Object[]{startDate, endDate},
            (rs, rowNum) -> {
                Map<String, Object> branch = new HashMap<>();
                branch.put("branchCode", rs.getString("branch_code"));
                branch.put("branchName", rs.getString("branch_name"));
                branch.put("revenue", rs.getLong("revenue"));
                branch.put("expenses", rs.getLong("expenses"));
                branch.put("netProfit", rs.getLong("net_profit"));
                branch.put("transactionCount", rs.getInt("transaction_count"));
                return branch;
            });
    }
    
    /**
     * 카테고리별 지출 분석 데이터 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    private List<Map<String, Object>> getCategoryExpenseAnalysis(int year, int month, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        String tenantId = com.coresolution.core.context.TenantContextHolder.getRequiredTenantId();
        log.info("📊 카테고리별 지출 분석 조회: {}-{}, tenantId={}", year, month, tenantId);
        
        try {
            // 표준화 2025-12-06: branchCode 필터링 제거, tenantId 기반으로만 조회
            String sql = """
                SELECT 
                    ft.category,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_amount,
                    COUNT(CASE WHEN ft.transaction_type = 'EXPENSE' THEN 1 END) AS transaction_count,
                    COALESCE(AVG(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount END), 0) AS avg_amount
                FROM financial_transactions ft
                WHERE ft.tenant_id = ?
                    AND ft.transaction_date BETWEEN DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
                    AND LAST_DAY(DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')))
                    AND ft.is_deleted = FALSE
                    AND ft.transaction_type = 'EXPENSE'
                GROUP BY ft.category
                HAVING total_amount > 0
                ORDER BY total_amount DESC
                """;
            
            return jdbcTemplate.query(sql,
                new Object[]{tenantId, year, month, year, month},
                (rs, rowNum) -> {
                    Map<String, Object> category = new HashMap<>();
                    category.put("category", rs.getString("category"));
                    category.put("totalAmount", rs.getLong("total_amount"));
                    category.put("transactionCount", rs.getInt("transaction_count"));
                    category.put("avgAmount", rs.getLong("avg_amount"));
                    return category;
                });
                
        } catch (Exception e) {
            log.error("❌ 카테고리별 지출 분석 조회 실패: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * 통합 재무현황용 카테고리별 지출 분석 데이터 조회
     */
    private List<Map<String, Object>> getCategoryExpenseAnalysisForConsolidated(LocalDate startDate, LocalDate endDate) {
        log.info("📊 통합 재무현황 카테고리별 지출 분석 조회: {} ~ {}", startDate, endDate);
        
        try {
            String sql = """
                SELECT 
                    ft.category,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_amount,
                    COUNT(CASE WHEN ft.transaction_type = 'EXPENSE' THEN 1 END) AS transaction_count,
                    COALESCE(AVG(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount END), 0) AS avg_amount
                FROM financial_transactions ft
                WHERE ft.transaction_date BETWEEN ? AND ?
                    AND ft.is_deleted = FALSE
                    AND ft.transaction_type = 'EXPENSE'
                GROUP BY ft.category
                HAVING total_amount > 0
                ORDER BY total_amount DESC
                """;
            
            return jdbcTemplate.query(sql,
                new Object[]{startDate, endDate},
                (rs, rowNum) -> {
                    Map<String, Object> category = new HashMap<>();
                    category.put("category", rs.getString("category"));
                    category.put("amount", rs.getLong("total_amount"));
                    category.put("transactionCount", rs.getInt("transaction_count"));
                    category.put("avgAmount", rs.getLong("avg_amount"));
                    return category;
                });
                
        } catch (Exception e) {
            log.error("❌ 통합 재무현황 카테고리별 지출 분석 조회 실패: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}
