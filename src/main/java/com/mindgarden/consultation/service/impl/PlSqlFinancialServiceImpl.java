package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.service.PlSqlFinancialService;
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
        
        try {
            String sql = "CALL GetBranchFinancialBreakdown(?, ?)";
            
            List<Map<String, Object>> branchData = jdbcTemplate.query(sql, 
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
            
            Map<String, Object> result = new HashMap<>();
            result.put("branchData", branchData);
            result.put("period", Map.of("startDate", startDate, "endDate", endDate));
            
            log.info("✅ 지점별 재무 상세 조회 완료: {} 지점", branchData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 지점별 재무 상세 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("지점별 재무 상세 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyFinancialTrend(LocalDate startDate, LocalDate endDate) {
        log.info("📈 월별 재무 추이 분석: {} ~ {}", startDate, endDate);
        
        try {
            String sql = "CALL GetMonthlyFinancialTrend(?, ?)";
            
            List<Map<String, Object>> trendData = jdbcTemplate.query(sql,
                new Object[]{startDate, endDate},
                (rs, rowNum) -> {
                    Map<String, Object> month = new HashMap<>();
                    month.put("month", rs.getString("month"));
                    month.put("monthlyRevenue", rs.getLong("monthly_revenue"));
                    month.put("monthlyExpenses", rs.getLong("monthly_expenses"));
                    month.put("monthlyProfit", rs.getLong("monthly_profit"));
                    month.put("transactionCount", rs.getInt("transaction_count"));
                    return month;
                });
            
            Map<String, Object> result = new HashMap<>();
            result.put("trendData", trendData);
            result.put("period", Map.of("startDate", startDate, "endDate", endDate));
            
            log.info("✅ 월별 재무 추이 분석 완료: {} 개월", trendData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 월별 재무 추이 분석 실패: {}", e.getMessage(), e);
            throw new RuntimeException("월별 재무 추이 분석에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryFinancialBreakdown(LocalDate startDate, LocalDate endDate) {
        log.info("📊 카테고리별 재무 분석: {} ~ {}", startDate, endDate);
        
        try {
            String sql = "CALL GetCategoryFinancialBreakdown(?, ?)";
            
            List<Map<String, Object>> categoryData = jdbcTemplate.query(sql,
                new Object[]{startDate, endDate},
                (rs, rowNum) -> {
                    Map<String, Object> category = new HashMap<>();
                    category.put("category", rs.getString("category"));
                    category.put("transactionType", rs.getString("transaction_type"));
                    category.put("transactionCount", rs.getInt("transaction_count"));
                    category.put("totalAmount", rs.getLong("total_amount"));
                    category.put("averageAmount", rs.getBigDecimal("average_amount"));
                    return category;
                });
            
            Map<String, Object> result = new HashMap<>();
            result.put("categoryData", categoryData);
            result.put("period", Map.of("startDate", startDate, "endDate", endDate));
            
            log.info("✅ 카테고리별 재무 분석 완료: {} 카테고리", categoryData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 카테고리별 재무 분석 실패: {}", e.getMessage(), e);
            throw new RuntimeException("카테고리별 재무 분석에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateMonthlyFinancialReport(int year, int month, String branchCode) {
        log.info("📅 월별 재무 보고서 생성: {}-{}, 지점={}", year, month, branchCode);
        
        try {
            // 직접 SQL 쿼리로 수정 (INCOME 타입 사용)
            String sql = """
                SELECT 
                    ? AS report_year,
                    ? AS report_month,
                    ? AS branch_code,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_revenue,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expenses,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                             SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
                    COUNT(*) AS total_transactions,
                    COUNT(DISTINCT DATE(ft.transaction_date)) AS active_days
                FROM financial_transactions ft
                WHERE ft.transaction_date BETWEEN DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
                    AND LAST_DAY(DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')))
                    AND (? IS NULL OR ft.branch_code = ?)
                    AND ft.is_deleted = FALSE
                """;
            
            List<Map<String, Object>> reportData = jdbcTemplate.query(sql,
                new Object[]{year, month, branchCode, year, month, year, month, branchCode, branchCode},
                (rs, rowNum) -> {
                    Map<String, Object> report = new HashMap<>();
                    report.put("reportYear", rs.getInt("report_year"));
                    report.put("reportMonth", rs.getInt("report_month"));
                    report.put("branchCode", rs.getString("branch_code"));
                    report.put("totalRevenue", rs.getLong("total_revenue"));
                    report.put("totalExpenses", rs.getLong("total_expenses"));
                    report.put("netProfit", rs.getLong("net_profit"));
                    report.put("totalTransactions", rs.getInt("total_transactions"));
                    report.put("activeDays", rs.getInt("active_days"));
                    return report;
                });
            
            // 카테고리별 지출 분석 데이터 추가
            List<Map<String, Object>> categoryAnalysis = getCategoryExpenseAnalysis(year, month, branchCode);
            
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
        
        try {
            String sql = "CALL GenerateQuarterlyFinancialReport(?, ?, ?)";
            
            List<Map<String, Object>> reportData = jdbcTemplate.query(sql,
                new Object[]{year, quarter, branchCode},
                (rs, rowNum) -> {
                    Map<String, Object> report = new HashMap<>();
                    report.put("reportYear", rs.getInt("report_year"));
                    report.put("reportQuarter", rs.getInt("report_quarter"));
                    report.put("branchCode", rs.getString("branch_code"));
                    report.put("totalRevenue", rs.getLong("total_revenue"));
                    report.put("totalExpenses", rs.getLong("total_expenses"));
                    report.put("netProfit", rs.getLong("net_profit"));
                    report.put("totalTransactions", rs.getInt("total_transactions"));
                    report.put("activeMonths", rs.getInt("active_months"));
                    return report;
                });
            
            Map<String, Object> result = new HashMap<>();
            result.put("reportData", reportData);
            result.put("reportType", "quarterly");
            result.put("period", String.format("%d-Q%d", year, quarter));
            
            log.info("✅ 분기별 재무 보고서 생성 완료: {} 건", reportData.size());
            return result;
            
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
            String sql = "CALL GenerateYearlyFinancialReport(?, ?)";
            
            List<Map<String, Object>> reportData = jdbcTemplate.query(sql,
                new Object[]{year, branchCode},
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
        
        try {
            String sql = "CALL CalculateFinancialKPIs(?, ?, ?)";
            
            List<Map<String, Object>> kpiData = jdbcTemplate.query(sql,
                new Object[]{startDate, endDate, branchCode},
                (rs, rowNum) -> {
                    Map<String, Object> kpi = new HashMap<>();
                    kpi.put("totalRevenue", rs.getLong("total_revenue"));
                    kpi.put("totalExpenses", rs.getLong("total_expenses"));
                    kpi.put("netProfit", rs.getLong("net_profit"));
                    kpi.put("totalTransactions", rs.getInt("total_transactions"));
                    kpi.put("profitMargin", rs.getBigDecimal("profit_margin"));
                    kpi.put("avgTransactionValue", rs.getBigDecimal("avg_transaction_value"));
                    kpi.put("periodStart", rs.getDate("period_start"));
                    kpi.put("periodEnd", rs.getDate("period_end"));
                    return kpi;
                });
            
            Map<String, Object> result = new HashMap<>();
            result.put("kpiData", kpiData);
            result.put("period", Map.of("startDate", startDate, "endDate", endDate));
            
            log.info("✅ 재무 성과 지표 계산 완료: {} 건", kpiData.size());
            return result;
            
        } catch (Exception e) {
            log.error("❌ 재무 성과 지표 계산 실패: {}", e.getMessage(), e);
            throw new RuntimeException("재무 성과 지표 계산에 실패했습니다.", e);
        }
    }
    
    /**
     * 지점별 재무 상세 데이터 조회 (내부 메서드)
     */
    private List<Map<String, Object>> getBranchFinancialBreakdownData(LocalDate startDate, LocalDate endDate) {
        // 직접 SQL 쿼리로 수정 (INCOME 타입 사용)
        String sql = """
            SELECT 
                cc.code_value AS branch_code,
                cc.code_label AS branch_name,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS revenue,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS expenses,
                COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END) - 
                         SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS net_profit,
                COUNT(ft.id) AS transaction_count
            FROM common_codes cc
            LEFT JOIN financial_transactions ft ON cc.code_value = ft.branch_code
                AND ft.transaction_date BETWEEN ? AND ?
                AND ft.is_deleted = FALSE
            WHERE cc.code_group = 'BRANCH' 
            AND cc.is_active = TRUE
            GROUP BY cc.code_value, cc.code_label
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
     */
    private List<Map<String, Object>> getCategoryExpenseAnalysis(int year, int month, String branchCode) {
        log.info("📊 카테고리별 지출 분석 조회: {}-{}, 지점={}", year, month, branchCode);
        
        try {
            String sql = """
                SELECT 
                    ft.category,
                    COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_amount,
                    COUNT(CASE WHEN ft.transaction_type = 'EXPENSE' THEN 1 END) AS transaction_count,
                    COALESCE(AVG(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount END), 0) AS avg_amount
                FROM financial_transactions ft
                WHERE ft.transaction_date BETWEEN DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')) 
                    AND LAST_DAY(DATE(CONCAT(?, '-', LPAD(?, 2, '0'), '-01')))
                    AND (? IS NULL OR ft.branch_code = ?)
                    AND ft.is_deleted = FALSE
                    AND ft.transaction_type = 'EXPENSE'
                GROUP BY ft.category
                HAVING total_amount > 0
                ORDER BY total_amount DESC
                """;
            
            return jdbcTemplate.query(sql,
                new Object[]{year, month, year, month, branchCode, branchCode},
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
