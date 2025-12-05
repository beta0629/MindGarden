package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.FinancialTransactionService;
import com.coresolution.consultation.service.PlSqlFinancialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
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
@RequestMapping("/api/v1/hq/erp") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class HQErpController {
    
    private final FinancialTransactionService financialTransactionService;
    private final CommonCodeService commonCodeService;
    private final PlSqlFinancialService plSqlFinancialService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 지점별 재무 현황 조회
     */
    @GetMapping("/branch-financial")
    public ResponseEntity<Map<String, Object>> getBranchFinancialData(
            @RequestParam String branchCode,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String transactionType,
            HttpSession session) {
        
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(null);
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "HQ_FINANCIAL_MANAGE")) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "재무 관리 권한이 없습니다."
            ));
        }
        
        try {
            log.info("🏦 지점별 재무 현황 조회 요청: branchCode={}", branchCode);
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
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(null);
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "HQ_FINANCIAL_MANAGE")) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "재무 관리 권한이 없습니다."
            ));
        }
        
        try {
            log.info("🏭 PL/SQL 전사 통합 재무 현황 조회: 시작일={}, 종료일={}", startDate, endDate);
            
            // 날짜 범위 설정 (기본: 현재 월)
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : 
                LocalDate.now().withDayOfMonth(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : 
                LocalDate.now();
            
            // PL/SQL 프로시저를 통한 통합 재무 데이터 조회
            Map<String, Object> consolidatedData = plSqlFinancialService.getConsolidatedFinancialData(start, end);
            
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
            @RequestParam(required = false) String branchCode,
            HttpSession session) {
        
        // 동적 권한 체크
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            return ResponseEntity.status(401).body(null);
        }
        
        if (!dynamicPermissionService.hasPermission(currentUser, "HQ_DASHBOARD_VIEW")) {
            return ResponseEntity.status(403).body(null);
        }
        
        try {
            log.info("📊 PL/SQL 재무 보고서 조회: 유형={}, 기간={}, 지점={}", reportType, period, branchCode);
            
            // 기본값 설정
            String type = reportType != null ? reportType : "monthly";
            String targetPeriod = period != null ? period : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            
            Map<String, Object> reportData = new HashMap<>();
            
            // PL/SQL 프로시저를 통한 보고서 생성
            switch (type) {
                case "monthly":
                    String[] monthParts = targetPeriod.split("-");
                    int year = Integer.parseInt(monthParts[0]);
                    int month = Integer.parseInt(monthParts[1]);
                    reportData = plSqlFinancialService.generateMonthlyFinancialReport(year, month, branchCode);
                    break;
                case "quarterly":
                    String[] quarterParts = targetPeriod.split("-Q");
                    int quarterYear = Integer.parseInt(quarterParts[0]);
                    int quarter = Integer.parseInt(quarterParts[1]);
                    reportData = plSqlFinancialService.generateQuarterlyFinancialReport(quarterYear, quarter, branchCode);
                    break;
                case "yearly":
                    int reportYear = Integer.parseInt(targetPeriod);
                    reportData = plSqlFinancialService.generateYearlyFinancialReport(reportYear, branchCode);
                    break;
                default:
                    String[] defaultParts = targetPeriod.split("-");
                    int defaultYear = Integer.parseInt(defaultParts[0]);
                    int defaultMonth = Integer.parseInt(defaultParts[1]);
                    reportData = plSqlFinancialService.generateMonthlyFinancialReport(defaultYear, defaultMonth, branchCode);
            }
            
            log.info("✅ PL/SQL 재무 보고서 조회 완료: 유형={}, 기간={}", type, targetPeriod);
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
