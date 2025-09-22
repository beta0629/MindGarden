package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * HQ 마스터용 ERP 관리 컨트롤러
 * 지점별 재무관리 및 통합 재무현황 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/hq/erp")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HQ_MASTER') or hasRole('SUPER_HQ_ADMIN') or hasRole('HQ_ADMIN') or hasRole('ADMIN')")
public class HQErpController {
    
    private final FinancialTransactionService financialTransactionService;
    private final CommonCodeService commonCodeService;
    private final UserService userService;
    
    /**
     * 지점별 재무 현황 조회
     */
    @GetMapping("/branch-financial")
    public ResponseEntity<Map<String, Object>> getBranchFinancialData(
            @RequestParam String branchCode,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String transactionType) {
        
        try {
            log.info("🏢 지점별 재무 현황 조회: 지점={}, 시작일={}, 종료일={}, 카테고리={}, 유형={}", 
                    branchCode, startDate, endDate, category, transactionType);
            
            // 날짜 범위 설정 (기본: 현재 월)
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : 
                LocalDate.now().withDayOfMonth(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : 
                LocalDate.now();
            
            // 지점별 재무 데이터 조회
            Map<String, Object> financialData = financialTransactionService
                .getBranchFinancialData(branchCode, start, end, category, transactionType);
            
            log.info("✅ 지점별 재무 현황 조회 완료: 지점={}", branchCode);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", financialData,
                "branchCode", branchCode,
                "period", Map.of(
                    "startDate", start.format(DateTimeFormatter.ISO_LOCAL_DATE),
                    "endDate", end.format(DateTimeFormatter.ISO_LOCAL_DATE)
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 지점별 재무 현황 조회 실패: 지점={}, 오류={}", branchCode, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "지점별 재무 현황 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 전사 통합 재무 현황 조회
     */
    @GetMapping("/consolidated")
    public ResponseEntity<Map<String, Object>> getConsolidatedFinancialData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        try {
            log.info("🏭 전사 통합 재무 현황 조회: 시작일={}, 종료일={}", startDate, endDate);
            
            // 날짜 범위 설정 (기본: 현재 월)
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : 
                LocalDate.now().withDayOfMonth(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : 
                LocalDate.now();
            
            // 모든 지점 목록 조회
            var branches = commonCodeService.getCodesByGroup("BRANCH");
            
            // 각 지점별 재무 데이터 조회 및 통합
            Map<String, Object> consolidatedData = new HashMap<>();
            long totalRevenue = 0;
            long totalExpenses = 0;
            int totalTransactions = 0;
            
            Map<String, Map<String, Object>> branchBreakdown = new HashMap<>();
            
            for (var branch : branches) {
                try {
                    Map<String, Object> branchData = financialTransactionService
                        .getBranchFinancialData(branch.getCodeValue(), start, end, null, null);
                    
                    @SuppressWarnings("unchecked")
                    Map<String, Object> summary = (Map<String, Object>) branchData.get("summary");
                    
                    if (summary != null) {
                        long branchRevenue = ((Number) summary.getOrDefault("totalRevenue", 0)).longValue();
                        long branchExpenses = ((Number) summary.getOrDefault("totalExpenses", 0)).longValue();
                        int branchTransactions = ((Number) summary.getOrDefault("transactionCount", 0)).intValue();
                        
                        totalRevenue += branchRevenue;
                        totalExpenses += branchExpenses;
                        totalTransactions += branchTransactions;
                        
                        branchBreakdown.put(branch.getCodeValue(), Map.of(
                            "branchName", branch.getCodeLabel(),
                            "revenue", branchRevenue,
                            "expenses", branchExpenses,
                            "netProfit", branchRevenue - branchExpenses,
                            "transactionCount", branchTransactions
                        ));
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 지점 {} 재무 데이터 조회 실패: {}", branch.getCodeValue(), e.getMessage());
                    // 개별 지점 오류는 무시하고 계속 진행
                }
            }
            
            consolidatedData.put("totalSummary", Map.of(
                "totalRevenue", totalRevenue,
                "totalExpenses", totalExpenses,
                "netProfit", totalRevenue - totalExpenses,
                "totalTransactions", totalTransactions,
                "branchCount", branches.size()
            ));
            consolidatedData.put("branchBreakdown", branchBreakdown);
            
            log.info("✅ 전사 통합 재무 현황 조회 완료: 총수익={}, 총지출={}, 순이익={}", 
                    totalRevenue, totalExpenses, (totalRevenue - totalExpenses));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", consolidatedData,
                "period", Map.of(
                    "startDate", start.format(DateTimeFormatter.ISO_LOCAL_DATE),
                    "endDate", end.format(DateTimeFormatter.ISO_LOCAL_DATE)
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 전사 통합 재무 현황 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "전사 통합 재무 현황 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 재무 보고서 데이터 조회
     */
    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getFinancialReports(
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String branchCode) {
        
        try {
            log.info("📊 재무 보고서 조회: 유형={}, 기간={}, 지점={}", reportType, period, branchCode);
            
            // 기본값 설정
            String type = reportType != null ? reportType : "monthly";
            String targetPeriod = period != null ? period : LocalDate.now().format(DateTimeFormatter.of("yyyy-MM"));
            
            Map<String, Object> reportData = new HashMap<>();
            
            switch (type) {
                case "monthly":
                    reportData = generateMonthlyReport(targetPeriod, branchCode);
                    break;
                case "quarterly":
                    reportData = generateQuarterlyReport(targetPeriod, branchCode);
                    break;
                case "yearly":
                    reportData = generateYearlyReport(targetPeriod, branchCode);
                    break;
                default:
                    reportData = generateMonthlyReport(targetPeriod, branchCode);
            }
            
            log.info("✅ 재무 보고서 조회 완료: 유형={}, 기간={}", type, targetPeriod);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", reportData,
                "reportType", type,
                "period", targetPeriod
            ));
            
        } catch (Exception e) {
            log.error("❌ 재무 보고서 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "재무 보고서 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 월별 보고서 생성
     */
    private Map<String, Object> generateMonthlyReport(String period, String branchCode) {
        // TODO: 실제 월별 보고서 로직 구현
        Map<String, Object> report = new HashMap<>();
        report.put("type", "monthly");
        report.put("period", period);
        report.put("summary", Map.of(
            "totalRevenue", 0L,
            "totalExpenses", 0L,
            "netProfit", 0L,
            "transactionCount", 0
        ));
        report.put("dailyBreakdown", List.of());
        report.put("categoryBreakdown", List.of());
        return report;
    }
    
    /**
     * 분기별 보고서 생성
     */
    private Map<String, Object> generateQuarterlyReport(String period, String branchCode) {
        // TODO: 실제 분기별 보고서 로직 구현
        Map<String, Object> report = new HashMap<>();
        report.put("type", "quarterly");
        report.put("period", period);
        report.put("summary", Map.of(
            "totalRevenue", 0L,
            "totalExpenses", 0L,
            "netProfit", 0L,
            "transactionCount", 0
        ));
        report.put("monthlyBreakdown", List.of());
        report.put("categoryBreakdown", List.of());
        return report;
    }
    
    /**
     * 연별 보고서 생성
     */
    private Map<String, Object> generateYearlyReport(String period, String branchCode) {
        // TODO: 실제 연별 보고서 로직 구현
        Map<String, Object> report = new HashMap<>();
        report.put("type", "yearly");
        report.put("period", period);
        report.put("summary", Map.of(
            "totalRevenue", 0L,
            "totalExpenses", 0L,
            "netProfit", 0L,
            "transactionCount", 0
        ));
        report.put("quarterlyBreakdown", List.of());
        report.put("categoryBreakdown", List.of());
        return report;
    }
}
