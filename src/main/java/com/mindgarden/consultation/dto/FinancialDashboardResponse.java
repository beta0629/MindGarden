package com.mindgarden.consultation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 재무 대시보드 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialDashboardResponse {
    
    // 전체 통계
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netProfit;
    private BigDecimal totalTaxAmount;
    
    // 월별 통계
    private List<MonthlyFinancialData> monthlyData;
    
    // 카테고리별 통계
    private List<CategoryFinancialData> incomeByCategory;
    private List<CategoryFinancialData> expenseByCategory;
    
    // 최근 거래 내역
    private List<FinancialTransactionResponse> recentTransactions;
    
    // 승인 대기 건수
    private Long pendingApprovalCount;
    
    // 급여 관련 통계
    private SalaryFinancialData salaryData;
    
    // ERP 구매 관련 통계
    private ErpFinancialData erpData;
    
    // 결제 관련 통계
    private PaymentFinancialData paymentData;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyFinancialData {
        private String month;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal netProfit;
        private Integer transactionCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryFinancialData {
        private String category;
        private BigDecimal amount;
        private Integer transactionCount;
        private String percentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryFinancialData {
        private BigDecimal totalSalaryPaid;
        private BigDecimal totalTaxWithheld;
        private Integer consultantCount;
        private BigDecimal averageSalary;
        private List<SalaryByGrade> salaryByGrade;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryByGrade {
        private String grade;
        private String gradeDisplayName;
        private BigDecimal totalAmount;
        private Integer consultantCount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErpFinancialData {
        private BigDecimal totalPurchaseAmount;
        private BigDecimal totalBudget;
        private BigDecimal usedBudget;
        private BigDecimal remainingBudget;
        private Integer pendingRequests;
        private Integer approvedRequests;
        private List<BudgetByCategory> budgetByCategory;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetByCategory {
        private String category;
        private BigDecimal totalBudget;
        private BigDecimal usedBudget;
        private BigDecimal remainingBudget;
        private String usagePercentage;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentFinancialData {
        private BigDecimal totalPaymentAmount;
        private Integer totalPaymentCount;
        private Integer pendingPayments;
        private Integer completedPayments;
        private Integer failedPayments;
        private Map<String, BigDecimal> paymentByMethod;
        private Map<String, BigDecimal> paymentByProvider;
    }
}
