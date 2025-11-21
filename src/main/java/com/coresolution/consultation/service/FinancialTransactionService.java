package com.coresolution.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.coresolution.consultation.dto.FinancialDashboardResponse;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.FinancialTransaction;
import com.coresolution.consultation.entity.User;

/**
 * 회계 거래 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface FinancialTransactionService {
    
    /**
     * 회계 거래 생성
     */
    FinancialTransactionResponse createTransaction(FinancialTransactionRequest request, User currentUser);
    
    /**
     * 회계 거래 수정
     */
    FinancialTransactionResponse updateTransaction(Long id, FinancialTransactionRequest request, User currentUser);
    
    /**
     * 회계 거래 삭제
     */
    void deleteTransaction(Long id, User currentUser);
    
    /**
     * 회계 거래 조회
     */
    FinancialTransactionResponse getTransaction(Long id);
    
    /**
     * 회계 거래 목록 조회 (페이징)
     */
    Page<FinancialTransactionResponse> getTransactions(Pageable pageable);
    
    /**
     * 거래 유형별 목록 조회
     */
    Page<FinancialTransactionResponse> getTransactionsByType(FinancialTransaction.TransactionType type, Pageable pageable);
    
    /**
     * 카테고리별 목록 조회
     */
    Page<FinancialTransactionResponse> getTransactionsByCategory(String category, Pageable pageable);
    
    /**
     * 기간별 목록 조회
     */
    Page<FinancialTransactionResponse> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * 승인 대기 거래 목록 조회
     */
    List<FinancialTransactionResponse> getPendingTransactions();
    
    /**
     * 거래 승인
     */
    FinancialTransactionResponse approveTransaction(Long id, String comment, User approver);
    
    /**
     * 거래 거부
     */
    FinancialTransactionResponse rejectTransaction(Long id, String comment, User approver);
    
    /**
     * 재무 대시보드 데이터 조회
     */
    FinancialDashboardResponse getFinancialDashboard(LocalDate startDate, LocalDate endDate);
    
    /**
     * 수입/지출 통계 조회
     */
    BigDecimal getTotalIncome(LocalDate startDate, LocalDate endDate);
    BigDecimal getTotalExpense(LocalDate startDate, LocalDate endDate);
    BigDecimal getNetProfit(LocalDate startDate, LocalDate endDate);
    
    /**
     * 카테고리별 통계 조회
     */
    List<FinancialDashboardResponse.CategoryFinancialData> getIncomeByCategory(LocalDate startDate, LocalDate endDate);
    List<FinancialDashboardResponse.CategoryFinancialData> getExpenseByCategory(LocalDate startDate, LocalDate endDate);
    
    /**
     * 월별 통계 조회
     */
    List<FinancialDashboardResponse.MonthlyFinancialData> getMonthlyFinancialData(LocalDate startDate, LocalDate endDate);
    
    /**
     * 급여 관련 거래 생성
     */
    FinancialTransactionResponse createSalaryTransaction(Long salaryCalculationId, String description);
    
    /**
     * 구매 관련 거래 생성
     */
    FinancialTransactionResponse createPurchaseTransaction(Long purchaseRequestId, String description);
    
    /**
     * 결제 관련 거래 생성 (카테고리 포함)
     */
    FinancialTransactionResponse createPaymentTransaction(Long paymentId, String description, String category, String subcategory);
    
    /**
     * 임대료 거래 생성
     */
    FinancialTransactionResponse createRentTransaction(BigDecimal amount, LocalDate transactionDate, String description);
    
    /**
     * 관리비 거래 생성
     */
    FinancialTransactionResponse createManagementFeeTransaction(BigDecimal amount, LocalDate transactionDate, String description);
    
    /**
     * 세금 거래 생성
     */
    FinancialTransactionResponse createTaxTransaction(BigDecimal amount, LocalDate transactionDate, String description);
    
    /**
     * 지점별 재무 데이터 조회
     */
    Map<String, Object> getBranchFinancialData(String branchCode, LocalDate startDate, LocalDate endDate, 
                                              String category, String transactionType);
    
    /**
     * 지점별 재무 거래 목록 조회 (페이징)
     */
    Page<FinancialTransactionResponse> getTransactionsByBranch(String branchCode, String transactionType, 
                                                              String category, String startDate, String endDate, 
                                                              Pageable pageable);
}
