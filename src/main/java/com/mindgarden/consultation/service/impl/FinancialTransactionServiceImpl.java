package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.FinancialDashboardResponse;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.dto.FinancialTransactionResponse;
import com.mindgarden.consultation.entity.FinancialTransaction;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.entity.PurchaseRequest;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.FinancialTransactionRepository;
import com.mindgarden.consultation.repository.PaymentRepository;
import com.mindgarden.consultation.repository.PurchaseRequestRepository;
import com.mindgarden.consultation.repository.SalaryCalculationRepository;
import com.mindgarden.consultation.service.FinancialTransactionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회계 거래 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionServiceImpl implements FinancialTransactionService {
    
    private final FinancialTransactionRepository financialTransactionRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PaymentRepository paymentRepository;
    
    @Override
    public FinancialTransactionResponse createTransaction(FinancialTransactionRequest request, User currentUser) {
        log.info("💼 회계 거래 생성: 유형={}, 금액={}, 카테고리={}", 
                request.getTransactionType(), request.getAmount(), request.getCategory());
        
        // 권한 확인 (수퍼어드민 또는 어드민만 거래 생성 가능)
        if (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && !UserRole.ADMIN.equals(currentUser.getRole())) {
            throw new RuntimeException("회계 거래 생성 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.valueOf(request.getTransactionType()))
                .category(request.getCategory())
                .subcategory(request.getSubcategory())
                .amount(request.getAmount())
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .relatedEntityId(request.getRelatedEntityId())
                .relatedEntityType(request.getRelatedEntityType())
                .department(request.getDepartment())
                .projectCode(request.getProjectCode())
                .taxIncluded(request.getTaxIncluded() != null ? request.getTaxIncluded() : false)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .amountBeforeTax(request.getAmountBeforeTax() != null ? request.getAmountBeforeTax() : request.getAmount())
                .remarks(request.getRemarks())
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .build();
        
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        log.info("✅ 회계 거래 생성 완료: ID={}", savedTransaction.getId());
        return convertToResponse(savedTransaction);
    }
    
    @Override
    public FinancialTransactionResponse updateTransaction(Long id, FinancialTransactionRequest request, User currentUser) {
        log.info("💼 회계 거래 수정: ID={}", id);
        
        // 권한 확인
        if (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && !UserRole.ADMIN.equals(currentUser.getRole())) {
            throw new RuntimeException("회계 거래 수정 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        // 승인된 거래는 수정 불가
        if (transaction.isApproved()) {
            throw new RuntimeException("승인된 거래는 수정할 수 없습니다.");
        }
        
        // 거래 정보 업데이트
        transaction.setTransactionType(FinancialTransaction.TransactionType.valueOf(request.getTransactionType()));
        transaction.setCategory(request.getCategory());
        transaction.setSubcategory(request.getSubcategory());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setRelatedEntityId(request.getRelatedEntityId());
        transaction.setRelatedEntityType(request.getRelatedEntityType());
        transaction.setDepartment(request.getDepartment());
        transaction.setProjectCode(request.getProjectCode());
        transaction.setTaxIncluded(request.getTaxIncluded() != null ? request.getTaxIncluded() : false);
        transaction.setTaxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO);
        transaction.setAmountBeforeTax(request.getAmountBeforeTax() != null ? request.getAmountBeforeTax() : request.getAmount());
        transaction.setRemarks(request.getRemarks());
        
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        log.info("✅ 회계 거래 수정 완료: ID={}", savedTransaction.getId());
        return convertToResponse(savedTransaction);
    }
    
    @Override
    public void deleteTransaction(Long id, User currentUser) {
        log.info("💼 회계 거래 삭제: ID={}", id);
        
        // 수퍼어드민만 삭제 가능
        if (!UserRole.HQ_MASTER.equals(currentUser.getRole())) {
            throw new RuntimeException("회계 거래 삭제 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        // 승인된 거래는 삭제 불가 (논리 삭제)
        transaction.setIsDeleted(true);
        financialTransactionRepository.save(transaction);
        
        log.info("✅ 회계 거래 삭제 완료: ID={}", id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public FinancialTransactionResponse getTransaction(Long id) {
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        return convertToResponse(transaction);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactions(Pageable pageable) {
        Page<FinancialTransaction> transactions = financialTransactionRepository
                .findByIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(pageable);
        
        return transactions.map(this::convertToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactionsByType(FinancialTransaction.TransactionType type, Pageable pageable) {
        Page<FinancialTransaction> transactions = financialTransactionRepository
                .findByTransactionTypeAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(type, pageable);
        
        return transactions.map(this::convertToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactionsByCategory(String category, Pageable pageable) {
        Page<FinancialTransaction> transactions = financialTransactionRepository
                .findByCategoryAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(category, pageable);
        
        return transactions.map(this::convertToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<FinancialTransaction> transactions = financialTransactionRepository
                .findByTransactionDateBetweenAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(startDate, endDate, pageable);
        
        return transactions.map(this::convertToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialTransactionResponse> getPendingTransactions() {
        List<FinancialTransaction> transactions = financialTransactionRepository
                .findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(FinancialTransaction.TransactionStatus.PENDING);
        
        return transactions.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public FinancialTransactionResponse approveTransaction(Long id, String comment, User approver) {
        log.info("✅ 회계 거래 승인: ID={}, 승인자={}", id, approver.getEmail());
        
        // 수퍼어드민만 승인 가능
        if (!UserRole.HQ_MASTER.equals(approver.getRole())) {
            throw new RuntimeException("거래 승인 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        if (!transaction.isApprovable()) {
            throw new RuntimeException("승인 가능한 상태가 아닙니다.");
        }
        
        transaction.approve(approver, comment);
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        log.info("✅ 회계 거래 승인 완료: ID={}", savedTransaction.getId());
        return convertToResponse(savedTransaction);
    }
    
    @Override
    public FinancialTransactionResponse rejectTransaction(Long id, String comment, User approver) {
        log.info("❌ 회계 거래 거부: ID={}, 거부자={}", id, approver.getEmail());
        
        // 수퍼어드민만 거부 가능
        if (!UserRole.HQ_MASTER.equals(approver.getRole())) {
            throw new RuntimeException("거래 거부 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        if (!transaction.isApprovable()) {
            throw new RuntimeException("거부 가능한 상태가 아닙니다.");
        }
        
        transaction.reject(approver, comment);
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        log.info("❌ 회계 거래 거부 완료: ID={}", savedTransaction.getId());
        return convertToResponse(savedTransaction);
    }
    
    @Override
    @Transactional(readOnly = true)
    public FinancialDashboardResponse getFinancialDashboard(LocalDate startDate, LocalDate endDate) {
        log.info("📊 재무 대시보드 데이터 조회: {} ~ {}", startDate, endDate);
        
        // 기본 통계
        BigDecimal totalIncome = getTotalIncome(startDate, endDate);
        BigDecimal totalExpense = getTotalExpense(startDate, endDate);
        BigDecimal netProfit = totalIncome.subtract(totalExpense);
        
        // 승인 대기 건수
        Long pendingCount = financialTransactionRepository.countPendingApprovals();
        
        // 월별 데이터
        List<FinancialDashboardResponse.MonthlyFinancialData> monthlyData = getMonthlyFinancialData(startDate, endDate);
        
        // 카테고리별 데이터
        List<FinancialDashboardResponse.CategoryFinancialData> incomeByCategory = getIncomeByCategory(startDate, endDate);
        List<FinancialDashboardResponse.CategoryFinancialData> expenseByCategory = getExpenseByCategory(startDate, endDate);
        
        // 최근 거래 내역
        List<FinancialTransactionResponse> recentTransactions = financialTransactionRepository
                .findRecentTransactions(Pageable.ofSize(10))
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        // 급여 관련 데이터
        FinancialDashboardResponse.SalaryFinancialData salaryData = getSalaryFinancialData();
        
        // ERP 관련 데이터
        FinancialDashboardResponse.ErpFinancialData erpData = getErpFinancialData();
        
        // 결제 관련 데이터
        FinancialDashboardResponse.PaymentFinancialData paymentData = getPaymentFinancialData();
        
        return FinancialDashboardResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netProfit(netProfit)
                .totalTaxAmount(BigDecimal.ZERO) // TODO: 세금 계산 로직 추가
                .monthlyData(monthlyData)
                .incomeByCategory(incomeByCategory)
                .expenseByCategory(expenseByCategory)
                .recentTransactions(recentTransactions)
                .pendingApprovalCount(pendingCount)
                .salaryData(salaryData)
                .erpData(erpData)
                .paymentData(paymentData)
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalIncome(LocalDate startDate, LocalDate endDate) {
        return financialTransactionRepository.sumIncomeByDateRange(startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalExpense(LocalDate startDate, LocalDate endDate) {
        return financialTransactionRepository.sumExpenseByDateRange(startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getNetProfit(LocalDate startDate, LocalDate endDate) {
        return getTotalIncome(startDate, endDate).subtract(getTotalExpense(startDate, endDate));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.CategoryFinancialData> getIncomeByCategory(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = financialTransactionRepository.getIncomeByCategory(startDate, endDate);
        return convertToCategoryFinancialData(results);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.CategoryFinancialData> getExpenseByCategory(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = financialTransactionRepository.getExpenseByCategory(startDate, endDate);
        return convertToCategoryFinancialData(results);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.MonthlyFinancialData> getMonthlyFinancialData(LocalDate startDate, LocalDate endDate) {
        List<Object[]> results = financialTransactionRepository.getMonthlyFinancialData(startDate, endDate);
        Map<String, FinancialDashboardResponse.MonthlyFinancialData> monthlyMap = new HashMap<>();
        
        for (Object[] row : results) {
            Integer year = (Integer) row[0];
            Integer month = (Integer) row[1];
            String type = (String) row[2];
            BigDecimal amount = (BigDecimal) row[3];
            
            String monthKey = year + "-" + String.format("%02d", month);
            
            FinancialDashboardResponse.MonthlyFinancialData data = monthlyMap.computeIfAbsent(monthKey, k -> 
                FinancialDashboardResponse.MonthlyFinancialData.builder()
                    .month(year + "년 " + month + "월")
                    .income(BigDecimal.ZERO)
                    .expense(BigDecimal.ZERO)
                    .netProfit(BigDecimal.ZERO)
                    .transactionCount(0)
                    .build()
            );
            
            if ("INCOME".equals(type)) {
                data.setIncome(data.getIncome().add(amount));
            } else if ("EXPENSE".equals(type)) {
                data.setExpense(data.getExpense().add(amount));
            }
            
            data.setNetProfit(data.getIncome().subtract(data.getExpense()));
        }
        
        return new ArrayList<>(monthlyMap.values());
    }
    
    // 특화된 거래 생성 메서드들
    
    @Override
    public FinancialTransactionResponse createSalaryTransaction(Long salaryCalculationId, String description) {
        SalaryCalculation salary = salaryCalculationRepository.findById(salaryCalculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + salaryCalculationId));
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("급여")
                .subcategory("상담사급여")
                .amount(salary.getTotalSalary())
                .description(description != null ? description : "상담사 급여 지급")
                .transactionDate(salary.getPayDate())
                .relatedEntityId(salaryCalculationId)
                .relatedEntityType("SALARY")
                .taxIncluded(false)
                .taxAmount(salary.getTaxAmount())
                .amountBeforeTax(salary.getTotalSalary())
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createPurchaseTransaction(Long purchaseRequestId, String description) {
        PurchaseRequest purchase = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + purchaseRequestId));
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("구매")
                .subcategory("비품구매")
                .amount(purchase.getTotalAmount())
                .description(description != null ? description : purchase.getReason())
                .transactionDate(purchase.getCreatedAt().toLocalDate())
                .relatedEntityId(purchaseRequestId)
                .relatedEntityType("PURCHASE")
                .taxIncluded(true)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createPaymentTransaction(Long paymentId, String description, String category, String subcategory) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        // 부가세 계산 (결제 금액은 부가세 포함)
        com.mindgarden.consultation.util.TaxCalculationUtil.TaxCalculationResult taxResult = 
            com.mindgarden.consultation.util.TaxCalculationUtil.calculateTaxFromPayment(payment.getAmount());
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category(category != null ? category : "결제")
                .subcategory(subcategory != null ? subcategory : "상담료")
                .amount(payment.getAmount()) // 부가세 포함 금액
                .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                .description(description != null ? description : payment.getDescription())
                .transactionDate(payment.getCreatedAt().toLocalDate())
                .relatedEntityId(paymentId)
                .relatedEntityType("PAYMENT")
                .taxIncluded(true)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createRentTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("임대료")
                .subcategory("사무실임대료")
                .amount(amount)
                .description(description != null ? description : "사무실 임대료")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createManagementFeeTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("관리비")
                .subcategory("사무실관리비")
                .amount(amount)
                .description(description != null ? description : "사무실 관리비")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createTaxTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("EXPENSE")
                .category("세금")
                .subcategory("법인세")
                .amount(amount)
                .description(description != null ? description : "법인세")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    // 헬퍼 메서드들
    
    private FinancialTransactionResponse convertToResponse(FinancialTransaction transaction) {
        return FinancialTransactionResponse.builder()
                .id(transaction.getId())
                .transactionType(transaction.getTransactionType().name())
                .transactionTypeDisplayName(transaction.getTransactionType().getDisplayName())
                .category(transaction.getCategory())
                .subcategory(transaction.getSubcategory())
                .amount(transaction.getAmount())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .status(transaction.getStatus().name())
                .statusDisplayName(transaction.getStatus().getDisplayName())
                .approverName(transaction.getApprover() != null ? transaction.getApprover().getName() : null)
                .approvedAt(transaction.getApprovedAt())
                .approvalComment(transaction.getApprovalComment())
                .relatedEntityId(transaction.getRelatedEntityId())
                .relatedEntityType(transaction.getRelatedEntityType())
                .department(transaction.getDepartment())
                .projectCode(transaction.getProjectCode())
                .taxIncluded(transaction.getTaxIncluded())
                .taxAmount(transaction.getTaxAmount())
                .amountBeforeTax(transaction.getAmountBeforeTax())
                .remarks(transaction.getRemarks())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
    
    private List<FinancialDashboardResponse.CategoryFinancialData> convertToCategoryFinancialData(List<Object[]> results) {
        return results.stream()
                .map(row -> {
                    String category = (String) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    Long count = ((Number) row[2]).longValue();
                    
                    return FinancialDashboardResponse.CategoryFinancialData.builder()
                            .category(category)
                            .amount(amount)
                            .transactionCount(count.intValue())
                            .percentage("0%") // TODO: 비율 계산 로직 추가
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    private FinancialDashboardResponse.SalaryFinancialData getSalaryFinancialData() {
        // TODO: 급여 관련 통계 데이터 조회 로직 구현
        return FinancialDashboardResponse.SalaryFinancialData.builder()
                .totalSalaryPaid(BigDecimal.ZERO)
                .totalTaxWithheld(BigDecimal.ZERO)
                .consultantCount(0)
                .averageSalary(BigDecimal.ZERO)
                .salaryByGrade(new ArrayList<>())
                .build();
    }
    
    private FinancialDashboardResponse.ErpFinancialData getErpFinancialData() {
        // TODO: ERP 관련 통계 데이터 조회 로직 구현
        return FinancialDashboardResponse.ErpFinancialData.builder()
                .totalPurchaseAmount(BigDecimal.ZERO)
                .totalBudget(BigDecimal.ZERO)
                .usedBudget(BigDecimal.ZERO)
                .remainingBudget(BigDecimal.ZERO)
                .pendingRequests(0)
                .approvedRequests(0)
                .budgetByCategory(new ArrayList<>())
                .build();
    }
    
    private FinancialDashboardResponse.PaymentFinancialData getPaymentFinancialData() {
        // TODO: 결제 관련 통계 데이터 조회 로직 구현
        return FinancialDashboardResponse.PaymentFinancialData.builder()
                .totalPaymentAmount(BigDecimal.ZERO)
                .totalPaymentCount(0)
                .pendingPayments(0)
                .completedPayments(0)
                .failedPayments(0)
                .paymentByMethod(new HashMap<>())
                .paymentByProvider(new HashMap<>())
                .build();
    }
}
