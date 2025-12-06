package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.FinancialDashboardResponse;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.FinancialTransaction;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.PurchaseRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.FinancialTransactionRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.FinancialTransactionService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 회계 거래 서비스 구현체
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FinancialTransactionServiceImpl extends BaseTenantAwareService implements FinancialTransactionService {
    
    private final FinancialTransactionRepository financialTransactionRepository;
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PaymentRepository paymentRepository;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final CommonCodeService commonCodeService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final UserRepository userRepository;
    
    @Override
    public FinancialTransactionResponse createTransaction(FinancialTransactionRequest request, User currentUser) {
        log.info("💼 회계 거래 생성: 유형={}, 금액={}, 카테고리={}", 
                request.getTransactionType(), request.getAmount(), request.getCategory());
        
        if (currentUser != null) {
            if (!currentUser.getRole().isAdmin()) {
                throw new RuntimeException("회계 거래 생성 권한이 없습니다.");
            }
            log.info("💼 사용자 권한 확인 완료: {}", currentUser.getRole());
        } else {
            log.info("💼 시스템 자동 거래 생성 (권한 검사 우회)");
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
                .branchCode(null) // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
                .taxIncluded(request.getTaxIncluded() != null ? request.getTaxIncluded() : false)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .amountBeforeTax(request.getAmountBeforeTax() != null ? request.getAmountBeforeTax() : request.getAmount())
                .remarks(request.getRemarks())
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .build();
        
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        try {
            String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
            if (incomeType.equals(request.getTransactionType()) && savedTransaction.getBranchCode() != null) {
                realTimeStatisticsService.updateFinancialStatisticsOnPayment(
                    savedTransaction.getBranchCode(),
                    savedTransaction.getAmount().longValue(),
                    savedTransaction.getTransactionDate()
                );
            } else {
                String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
                String refundType = getSafeCodeName("SUBCATEGORY", "CONSULTATION_REFUND", "CONSULTATION_REFUND");
                String partialRefundType = getSafeCodeName("SUBCATEGORY", "CONSULTATION_PARTIAL_REFUND", "CONSULTATION_PARTIAL_REFUND");
                
                if (expenseType.equals(request.getTransactionType()) && 
                    (refundType.equals(savedTransaction.getSubcategory()) ||
                     partialRefundType.equals(savedTransaction.getSubcategory()))) {
                    if (savedTransaction.getRelatedEntityId() != null && savedTransaction.getBranchCode() != null) {
                        realTimeStatisticsService.updateStatisticsOnRefund(
                            null, // 상담사 ID (추후 매핑에서 조회)
                            savedTransaction.getBranchCode(),
                            savedTransaction.getAmount().longValue(),
                            savedTransaction.getTransactionDate()
                        );
                    }
                }
            }
            
            log.info("✅ 회계 거래 생성시 실시간 통계 업데이트 완료: transactionId={}", savedTransaction.getId());
        } catch (Exception e) {
            log.error("❌ 회계 거래 생성시 실시간 통계 업데이트 실패: {}", e.getMessage(), e);
        }
        
        log.info("✅ 회계 거래 생성 완료: ID={}", savedTransaction.getId());
        return convertToResponse(savedTransaction);
    }
    
    @Override
    public FinancialTransactionResponse updateTransaction(Long id, FinancialTransactionRequest request, User currentUser) {
        log.info("💼 회계 거래 수정: ID={}", id);
        
        if (!currentUser.getRole().isAdmin()) {
            throw new RuntimeException("회계 거래 수정 권한이 없습니다.");
        }
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
        if (transaction.isApproved()) {
            throw new RuntimeException("승인된 거래는 수정할 수 없습니다.");
        }
        
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
        transaction.setBranchCode(request.getBranchCode());
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
        
        FinancialTransaction transaction = financialTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다: " + id));
        
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
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .findByStatusAndIsDeletedFalseOrderByCreatedAtDesc(FinancialTransaction.TransactionStatus.PENDING);
        
        return transactions.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public FinancialTransactionResponse approveTransaction(Long id, String comment, User approver) {
        log.info("✅ 회계 거래 승인: ID={}, 승인자={}", id, approver.getEmail());
        
        if (!approver.getRole().isAdmin()) {
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
        
        if (!approver.getRole().isAdmin()) {
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
        
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new FinancialDashboardResponse();
        }
        
        BigDecimal totalIncome = getTotalIncome(startDate, endDate);
        BigDecimal totalExpense = getTotalExpense(startDate, endDate);
        BigDecimal netProfit = totalIncome.subtract(totalExpense);
        
        Long pendingCount = financialTransactionRepository.countPendingApprovals(tenantId);
        
        List<FinancialDashboardResponse.MonthlyFinancialData> monthlyData = getMonthlyFinancialData(startDate, endDate);
        
        List<FinancialDashboardResponse.CategoryFinancialData> incomeByCategory = getIncomeByCategory(startDate, endDate);
        List<FinancialDashboardResponse.CategoryFinancialData> expenseByCategory = getExpenseByCategory(startDate, endDate);
        
        List<FinancialTransactionResponse> recentTransactions = financialTransactionRepository
                .findRecentTransactions(tenantId, Pageable.ofSize(10))
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        FinancialDashboardResponse.SalaryFinancialData salaryData = getSalaryFinancialData();
        
        FinancialDashboardResponse.ErpFinancialData erpData = getErpFinancialData();
        
        FinancialDashboardResponse.PaymentFinancialData paymentData = getPaymentFinancialData();
        
        BigDecimal totalTaxAmount = getTotalTaxAmount(startDate, endDate);
        
        return FinancialDashboardResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netProfit(netProfit)
                .totalTaxAmount(totalTaxAmount)
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
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return BigDecimal.ZERO;
        }
        return financialTransactionRepository.sumIncomeByDateRange(tenantId, startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalExpense(LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return BigDecimal.ZERO;
        }
        return financialTransactionRepository.sumExpenseByDateRange(tenantId, startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getNetProfit(LocalDate startDate, LocalDate endDate) {
        return getTotalIncome(startDate, endDate).subtract(getTotalExpense(startDate, endDate));
    }
    
     /**
     * 총 세금 계산
     /**
     * 
     /**
     * @param startDate 시작일
     /**
     * @param endDate 종료일
     /**
     * @return 총 세금 금액
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalTaxAmount(LocalDate startDate, LocalDate endDate) {
        try {
            log.info("💰 총 세금 계산 시작: {} ~ {}", startDate, endDate);
            
            String taxCategory = getSafeCodeName("FINANCIAL_CATEGORY", "TAX", "세금");
            List<FinancialTransaction> taxTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(taxCategory);
            
            List<FinancialTransaction> filteredTaxTransactions = taxTransactions.stream()
                    .filter(t -> !t.getTransactionDate().isBefore(startDate) && !t.getTransactionDate().isAfter(endDate))
                    .collect(Collectors.toList());
            
            BigDecimal totalTaxAmount = filteredTaxTransactions.stream()
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String paymentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PAYMENT", "결제");
            List<FinancialTransaction> paymentTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(paymentCategory);
            
            BigDecimal totalVatAmount = paymentTransactions.stream()
                    .filter(t -> !t.getTransactionDate().isBefore(startDate) && !t.getTransactionDate().isAfter(endDate))
                    .filter(t -> t.getTaxAmount() != null)
                    .map(FinancialTransaction::getTaxAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal grandTotalTax = totalTaxAmount.add(totalVatAmount);
            
            log.info("✅ 총 세금 계산 완료 - 직접 세금: {}, 부가세: {}, 총 세금: {}", 
                    totalTaxAmount, totalVatAmount, grandTotalTax);
            
            return grandTotalTax;
            
        } catch (Exception e) {
            log.error("❌ 총 세금 계산 중 오류 발생: {}", e.getMessage(), e);
            return BigDecimal.ZERO;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.CategoryFinancialData> getIncomeByCategory(LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        List<Object[]> results = financialTransactionRepository.getIncomeByCategory(tenantId, startDate, endDate);
        return convertToCategoryFinancialData(results);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.CategoryFinancialData> getExpenseByCategory(LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        List<Object[]> results = financialTransactionRepository.getExpenseByCategory(tenantId, startDate, endDate);
        return convertToCategoryFinancialData(results);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialDashboardResponse.MonthlyFinancialData> getMonthlyFinancialData(LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantIdOrNull();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        List<Object[]> results = financialTransactionRepository.getMonthlyFinancialData(tenantId, startDate, endDate);
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
            
            String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
            String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
            
            if (incomeType.equals(type)) {
                data.setIncome(data.getIncome().add(amount));
            } else if (expenseType.equals(type)) {
                data.setExpense(data.getExpense().add(amount));
            }
            
            data.setNetProfit(data.getIncome().subtract(data.getExpense()));
        }
        
        return new ArrayList<>(monthlyMap.values());
    }
    
    
    @Override
    public FinancialTransactionResponse createSalaryTransaction(Long salaryCalculationId, String description) {
        SalaryCalculation salary = salaryCalculationRepository.findById(salaryCalculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + salaryCalculationId));
        
        String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
        String salaryCategory = getSafeCodeName("FINANCIAL_CATEGORY", "SALARY", "급여");
        String consultantSalarySubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "CONSULTANT_SALARY", "상담사급여");
        String salaryEntityType = getSafeCodeName("ENTITY_TYPE", "SALARY", "SALARY");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(expenseType)
                .category(salaryCategory)
                .subcategory(consultantSalarySubcategory)
                .amount(salary.getNetSalary())
                .description(description != null ? description : "상담사 급여 지급")
                .transactionDate(salary.getCalculationPeriodEnd())
                .relatedEntityId(salaryCalculationId)
                .relatedEntityType(salaryEntityType)
                .taxIncluded(false)
                .taxAmount(salary.getDeductions())
                .amountBeforeTax(salary.getGrossSalary())
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createPurchaseTransaction(Long purchaseRequestId, String description) {
        PurchaseRequest purchase = purchaseRequestRepository.findById(purchaseRequestId)
                .orElseThrow(() -> new RuntimeException("구매 요청을 찾을 수 없습니다: " + purchaseRequestId));
        
        String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
        String purchaseCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PURCHASE", "구매");
        String equipmentPurchaseSubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "EQUIPMENT_PURCHASE", "비품구매");
        String purchaseEntityType = getSafeCodeName("ENTITY_TYPE", "PURCHASE", "PURCHASE");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(expenseType)
                .category(purchaseCategory)
                .subcategory(equipmentPurchaseSubcategory)
                .amount(purchase.getTotalAmount())
                .description(description != null ? description : purchase.getReason())
                .transactionDate(purchase.getCreatedAt().toLocalDate())
                .relatedEntityId(purchaseRequestId)
                .relatedEntityType(purchaseEntityType)
                .taxIncluded(true)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createPaymentTransaction(Long paymentId, String description, String category, String subcategory) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다: " + paymentId));
        
        com.coresolution.consultation.util.TaxCalculationUtil.TaxCalculationResult taxResult = 
            com.coresolution.consultation.util.TaxCalculationUtil.calculateTaxFromPayment(payment.getAmount());
        
        String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
        String paymentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PAYMENT", "결제");
        String consultationFeeSubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "CONSULTATION_FEE", "상담료");
        String paymentEntityType = getSafeCodeName("ENTITY_TYPE", "PAYMENT", "PAYMENT");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(incomeType)
                .category(category != null ? category : paymentCategory)
                .subcategory(subcategory != null ? subcategory : consultationFeeSubcategory)
                .amount(payment.getAmount()) // 부가세 포함 금액
                .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                .description(description != null ? description : payment.getDescription())
                .transactionDate(payment.getCreatedAt().toLocalDate())
                .relatedEntityId(paymentId)
                .relatedEntityType(paymentEntityType)
                .taxIncluded(true)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createRentTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
        String rentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "RENT", "임대료");
        String officeRentSubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "OFFICE_RENT", "사무실임대료");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(expenseType)
                .category(rentCategory)
                .subcategory(officeRentSubcategory)
                .amount(amount)
                .description(description != null ? description : "사무실 임대료")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createManagementFeeTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
        String managementFeeCategory = getSafeCodeName("FINANCIAL_CATEGORY", "MANAGEMENT_FEE", "관리비");
        String officeManagementFeeSubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "OFFICE_MANAGEMENT_FEE", "사무실관리비");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(expenseType)
                .category(managementFeeCategory)
                .subcategory(officeManagementFeeSubcategory)
                .amount(amount)
                .description(description != null ? description : "사무실 관리비")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    @Override
    public FinancialTransactionResponse createTaxTransaction(BigDecimal amount, LocalDate transactionDate, String description) {
        String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
        String taxCategory = getSafeCodeName("FINANCIAL_CATEGORY", "TAX", "세금");
        String corporateTaxSubcategory = getSafeCodeName("FINANCIAL_SUBCATEGORY", "CORPORATE_TAX", "법인세");
        
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType(expenseType)
                .category(taxCategory)
                .subcategory(corporateTaxSubcategory)
                .amount(amount)
                .description(description != null ? description : "법인세")
                .transactionDate(transactionDate)
                .taxIncluded(false)
                .build();
        
        return createTransaction(request, null); // 시스템 자동 생성
    }
    
    
    private FinancialTransactionResponse convertToResponse(FinancialTransaction transaction) {
        FinancialTransactionResponse.FinancialTransactionResponseBuilder builder = FinancialTransactionResponse.builder()
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
                .branchCode(null) // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
                .taxIncluded(transaction.getTaxIncluded())
                .taxAmount(transaction.getTaxAmount())
                .amountBeforeTax(transaction.getAmountBeforeTax())
                .remarks(transaction.getRemarks())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt());
        
        if ("CONSULTANT_CLIENT_MAPPING".equals(transaction.getRelatedEntityType()) 
                || "CONSULTANT_CLIENT_MAPPING_REFUND".equals(transaction.getRelatedEntityType())) {
            if (transaction.getRelatedEntityId() != null) {
                try {
                    ConsultantClientMapping mapping = consultantClientMappingRepository
                            .findById(transaction.getRelatedEntityId())
                            .orElse(null);
                    
                    if (mapping != null) {
                        String consultantName = mapping.getConsultant() != null ? mapping.getConsultant().getName() : null;
                        String clientName = mapping.getClient() != null ? mapping.getClient().getName() : null;
                        builder.consultantName(consultantName);
                        builder.clientName(clientName);
                        log.debug("✅ 매핑 정보 포함: mappingId={}, 상담사={}, 내담자={}", 
                                transaction.getRelatedEntityId(), consultantName, clientName);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ 매핑 정보 조회 실패: mappingId={}, error={}", 
                            transaction.getRelatedEntityId(), e.getMessage());
                }
            }
        }
        
        return builder.build();
    }
    
    private List<FinancialDashboardResponse.CategoryFinancialData> convertToCategoryFinancialData(List<Object[]> results) {
        BigDecimal totalAmount = results.stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return results.stream()
                .map(row -> {
                    String category = (String) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    Long count = ((Number) row[2]).longValue();
                    
                    String percentage = calculatePercentage(amount, totalAmount);
                    
                    return FinancialDashboardResponse.CategoryFinancialData.builder()
                            .category(category)
                            .amount(amount)
                            .transactionCount(count.intValue())
                            .percentage(percentage)
                            .build();
                })
                .collect(Collectors.toList());
    }
    
     /**
     * 비율 계산 헬퍼 메서드
     /**
     * 
     /**
     * @param amount 개별 금액
     /**
     * @param totalAmount 총 금액
     /**
     * @return 비율 문자열 (예: "25.5%")
     */
    private String calculatePercentage(BigDecimal amount, BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return "0%";
        }
        
        try {
            BigDecimal percentage = amount
                    .divide(totalAmount, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            
            percentage = percentage.setScale(1, RoundingMode.HALF_UP);
            
            return percentage.toString() + "%";
            
        } catch (Exception e) {
            log.warn("비율 계산 중 오류 발생: amount={}, totalAmount={}, error={}", 
                    amount, totalAmount, e.getMessage());
            return "0%";
        }
    }
    
    private FinancialDashboardResponse.SalaryFinancialData getSalaryFinancialData() {
        try {
            String salaryCategory = getSafeCodeName("FINANCIAL_CATEGORY", "SALARY", "급여");
            List<FinancialTransaction> salaryTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(salaryCategory);
            
            BigDecimal totalSalaryPaid = salaryTransactions.stream()
                    .filter(t -> "INCOME".equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String taxCategory = getSafeCodeName("FINANCIAL_CATEGORY", "TAX", "세금");
            BigDecimal totalTaxWithheld = salaryTransactions.stream()
                    .filter(t -> taxCategory.equals(t.getCategory()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String tenantId = getTenantIdOrNull();
            long consultantCount = tenantId != null ? 
                    userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CONSULTANT).size() : 0;
            
            BigDecimal averageSalary = consultantCount > 0 ? 
                    totalSalaryPaid.divide(BigDecimal.valueOf(consultantCount), 2, RoundingMode.HALF_UP) : 
                    BigDecimal.ZERO;
            
            List<FinancialDashboardResponse.SalaryByGrade> salaryByGrade = new ArrayList<>();
            
            log.info("✅ 급여 통계 데이터 조회 완료 - 총 급여: {}, 상담사 수: {}, 평균 급여: {}", 
                    totalSalaryPaid, consultantCount, averageSalary);
            
            return FinancialDashboardResponse.SalaryFinancialData.builder()
                    .totalSalaryPaid(totalSalaryPaid)
                    .totalTaxWithheld(totalTaxWithheld)
                    .consultantCount((int) consultantCount)
                    .averageSalary(averageSalary)
                    .salaryByGrade(salaryByGrade)
                    .build();
                    
        } catch (Exception e) {
            log.error("❌ 급여 통계 데이터 조회 중 오류 발생: {}", e.getMessage(), e);
            
            return FinancialDashboardResponse.SalaryFinancialData.builder()
                    .totalSalaryPaid(BigDecimal.ZERO)
                    .totalTaxWithheld(BigDecimal.ZERO)
                    .consultantCount(0)
                    .averageSalary(BigDecimal.ZERO)
                    .salaryByGrade(new ArrayList<>())
                    .build();
        }
    }
    
    private FinancialDashboardResponse.ErpFinancialData getErpFinancialData() {
        try {
            String purchaseCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PURCHASE", "구매");
            String budgetCategory = getSafeCodeName("FINANCIAL_CATEGORY", "BUDGET", "예산");
            List<FinancialTransaction> purchaseTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(purchaseCategory);
            List<FinancialTransaction> budgetTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(budgetCategory);
            
            BigDecimal totalPurchaseAmount = purchaseTransactions.stream()
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
            BigDecimal totalBudget = budgetTransactions.stream()
                    .filter(t -> incomeType.equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
            BigDecimal usedBudget = budgetTransactions.stream()
                    .filter(t -> expenseType.equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal remainingBudget = totalBudget.subtract(usedBudget);
            
            int pendingRequests = 0; // 구매 요청 기능은 향후 구현 예정
            
            int approvedRequests = 0; // 구매 요청 기능은 향후 구현 예정
            
            List<FinancialDashboardResponse.BudgetByCategory> budgetByCategory = budgetTransactions.stream()
                    .collect(Collectors.groupingBy(
                            FinancialTransaction::getCategory,
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ))
                    .entrySet().stream()
                    .map(entry -> {
                        String category = entry.getKey();
                        BigDecimal categoryTotalBudget = entry.getValue();
                        
                        String categoryExpenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
                        BigDecimal categoryUsedBudget = financialTransactionRepository
                                .findByCategoryAndIsDeletedFalse(category)
                                .stream()
                                .filter(t -> categoryExpenseType.equals(t.getTransactionType().name()))
                                .map(FinancialTransaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        
                        BigDecimal categoryRemainingBudget = categoryTotalBudget.subtract(categoryUsedBudget);
                        
                        return FinancialDashboardResponse.BudgetByCategory.builder()
                                .category(category)
                                .totalBudget(categoryTotalBudget)
                                .usedBudget(categoryUsedBudget)
                                .remainingBudget(categoryRemainingBudget)
                                .build();
                    })
                    .collect(Collectors.toList());
            
            log.info("✅ ERP 통계 데이터 조회 완료 - 총 구매: {}, 총 예산: {}, 사용 예산: {}, 잔여 예산: {}", 
                    totalPurchaseAmount, totalBudget, usedBudget, remainingBudget);
            
            return FinancialDashboardResponse.ErpFinancialData.builder()
                    .totalPurchaseAmount(totalPurchaseAmount)
                    .totalBudget(totalBudget)
                    .usedBudget(usedBudget)
                    .remainingBudget(remainingBudget)
                    .pendingRequests(pendingRequests)
                    .approvedRequests(approvedRequests)
                    .budgetByCategory(budgetByCategory)
                    .build();
                    
        } catch (Exception e) {
            log.error("❌ ERP 통계 데이터 조회 중 오류 발생: {}", e.getMessage(), e);
            
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
    }
    
    private FinancialDashboardResponse.PaymentFinancialData getPaymentFinancialData() {
        try {
            String paymentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PAYMENT", "결제");
            List<FinancialTransaction> paymentTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(paymentCategory);
            
            BigDecimal totalPaymentAmount = paymentTransactions.stream()
                    .filter(t -> "INCOME".equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            int totalPaymentCount = paymentTransactions.size();
            
            // 표준화 2025-12-05: tenantId 필터링 필수 (BaseTenantAwareService 상속)
            String tenantId = getTenantId();
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            int pendingPayments = (int) consultantClientMappingRepository.countByTenantIdAndPaymentStatus(tenantId, ConsultantClientMapping.PaymentStatus.PENDING);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            int completedPayments = (int) consultantClientMappingRepository.countByTenantIdAndPaymentStatus(tenantId, ConsultantClientMapping.PaymentStatus.APPROVED);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            int failedPayments = (int) consultantClientMappingRepository.countByTenantIdAndPaymentStatus(tenantId, ConsultantClientMapping.PaymentStatus.REJECTED);
            
            Map<String, BigDecimal> paymentByMethod = paymentTransactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getDescription() != null ? t.getDescription() : "UNKNOWN",
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            Map<String, BigDecimal> paymentByProvider = paymentTransactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCategory() != null ? t.getCategory() : "UNKNOWN",
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            log.info("✅ 결제 통계 데이터 조회 완료 - 총 결제: {}, 총 건수: {}, 대기: {}, 완료: {}, 실패: {}", 
                    totalPaymentAmount, totalPaymentCount, pendingPayments, completedPayments, failedPayments);
            
            return FinancialDashboardResponse.PaymentFinancialData.builder()
                    .totalPaymentAmount(totalPaymentAmount)
                    .totalPaymentCount(totalPaymentCount)
                    .pendingPayments(pendingPayments)
                    .completedPayments(completedPayments)
                    .failedPayments(failedPayments)
                    .paymentByMethod(paymentByMethod)
                    .paymentByProvider(paymentByProvider)
                    .build();
                    
        } catch (Exception e) {
            log.error("❌ 결제 통계 데이터 조회 중 오류 발생: {}", e.getMessage(), e);
            
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
    
    @Override
    public Map<String, Object> getBranchFinancialData(String branchCode, LocalDate startDate, LocalDate endDate, 
                                                     String category, String transactionType) {
        try {
            String tenantId = getTenantIdOrNull();
            log.info("🏢 재무 데이터 조회 (테넌트 전체): tenantId={}, 시작일={}, 종료일={}, 카테고리={}, 유형={}", 
                    tenantId, startDate, endDate, category, transactionType);
            
            List<FinancialTransaction> allTransactions = financialTransactionRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            log.info("🔍 전체 거래 내역 수: {}", allTransactions.size());
            
            List<FinancialTransaction> transactions = allTransactions
                    .stream()
                    .filter(t -> !startDate.isAfter(t.getTransactionDate()) && !endDate.isBefore(t.getTransactionDate()))
                    .filter(t -> category == null || category.isEmpty() || category.equals(t.getCategory()))
                    .filter(t -> transactionType == null || transactionType.isEmpty() || 
                            transactionType.equals(t.getTransactionType().name()))
                    .collect(Collectors.toList());
            
            log.info("🔍 필터링된 거래 내역 수: {}, 기간: {}~{}", 
                    transactions.size(), startDate, endDate);
            
            BigDecimal totalRevenue = transactions.stream()
                    .filter(t -> FinancialTransaction.TransactionType.INCOME.equals(t.getTransactionType()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpenses = transactions.stream()
                    .filter(t -> FinancialTransaction.TransactionType.EXPENSE.equals(t.getTransactionType()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netProfit = totalRevenue.subtract(totalExpenses);
            
            List<Map<String, Object>> transactionList = transactions.stream()
                    .map(this::convertTransactionToMap)
                    .collect(Collectors.toList());
            
            Map<String, BigDecimal> categoryBreakdown = transactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCategory() != null ? t.getCategory() : "기타",
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            Map<String, BigDecimal> monthlyStats = transactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getTransactionDate().getYear() + "-" + 
                                 String.format("%02d", t.getTransactionDate().getMonthValue()),
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            Map<String, Object> result = new HashMap<>();
            result.put("summary", Map.of(
                "totalRevenue", totalRevenue.longValue(),
                "totalExpenses", totalExpenses.longValue(),
                "netProfit", netProfit.longValue(),
                "transactionCount", transactions.size()
            ));
            result.put("transactions", transactionList);
            result.put("categoryBreakdown", categoryBreakdown);
            result.put("monthlyStats", monthlyStats);
            
            log.info("✅ 재무 데이터 조회 완료 (테넌트 전체): 수익={}, 지출={}, 순이익={}", 
                    totalRevenue, totalExpenses, netProfit);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 재무 데이터 조회 실패 (테넌트 전체): 오류={}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("summary", Map.of(
                "totalRevenue", 0L,
                "totalExpenses", 0L,
                "netProfit", 0L,
                "transactionCount", 0
            ));
            result.put("transactions", List.of());
            result.put("categoryBreakdown", Map.of());
            result.put("monthlyStats", Map.of());
            
            return result;
        }
    }
    
     /**
     * FinancialTransaction을 Map으로 변환
     */
    private Map<String, Object> convertTransactionToMap(FinancialTransaction transaction) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", transaction.getId());
        map.put("date", transaction.getTransactionDate().toString());
        map.put("type", transaction.getTransactionType().name());
        map.put("category", transaction.getCategory());
        map.put("subcategory", transaction.getSubcategory());
        map.put("description", transaction.getDescription());
        map.put("amount", transaction.getAmount().longValue());
        map.put("status", transaction.getStatus() != null ? transaction.getStatus().name() : "UNKNOWN");
        return map;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactionsByBranch(String branchCode, String transactionType, 
                                                                     String category, String startDate, String endDate, 
                                                                     Pageable pageable) {
        try {
            String tenantId = getTenantIdOrNull();
            log.info("🏢 재무 거래 목록 조회 (테넌트 전체): tenantId={}, 유형={}, 카테고리={}, 시작일={}, 종료일={}", 
                    tenantId, transactionType, category, startDate, endDate);
            
            List<FinancialTransaction> allTransactions = financialTransactionRepository
                    .findByTenantIdAndIsDeletedFalse(tenantId);
            
            log.info("🔍 전체 재무 거래 조회 완료: {}건", allTransactions.size());
            
            List<FinancialTransaction> filteredTransactions = allTransactions.stream()
                    .filter(t -> {
                        if (transactionType != null && !transactionType.isEmpty() && !"ALL".equals(transactionType)) {
                            return transactionType.equals(t.getTransactionType().name());
                        }
                        return true;
                    })
                    .filter(t -> {
                        if (category != null && !category.isEmpty() && !"ALL".equals(category)) {
                            return category.equals(t.getCategory());
                        }
                        return true;
                    })
                    .filter(t -> {
                        if (startDate != null && !startDate.isEmpty()) {
                            LocalDate start = LocalDate.parse(startDate);
                            if (t.getTransactionDate().isBefore(start)) {
                                return false;
                            }
                        }
                        if (endDate != null && !endDate.isEmpty()) {
                            LocalDate end = LocalDate.parse(endDate);
                            if (t.getTransactionDate().isAfter(end)) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .collect(Collectors.toList());
            
            log.info("🔍 필터링 결과: 전체={}건, 필터링 후={}건", allTransactions.size(), filteredTransactions.size());
            
            filteredTransactions.stream().limit(5).forEach(t -> 
                log.info("📊 거래 샘플: ID={}, 지점={}, 유형={}, 금액={}", 
                    t.getId(), t.getBranchCode(), t.getTransactionType(), t.getAmount())
            );
            
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredTransactions.size());
            List<FinancialTransaction> pageContent = filteredTransactions.subList(start, end);
            
            List<FinancialTransactionResponse> responseContent = pageContent.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            
            Page<FinancialTransactionResponse> result = new org.springframework.data.domain.PageImpl<>(
                    responseContent, pageable, filteredTransactions.size());
            
            log.info("✅ 재무 거래 조회 완료 (테넌트 전체): 전체={}, 필터링후={}건", 
                    allTransactions.size(), filteredTransactions.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 재무 거래 조회 실패 (테넌트 전체): 오류={}", e.getMessage(), e);
            throw new RuntimeException("재무 거래 조회에 실패했습니다: " + e.getMessage());
        }
    }
    
     /**
     * 안전한 공통 코드명 조회 (오류 시 기본값 반환)
     /**
     * 
     /**
     * @param codeGroup 코드 그룹
     /**
     * @param codeValue 코드 값
     /**
     * @param defaultValue 기본값
     /**
     * @return 코드명 또는 기본값
     */
    private String getSafeCodeName(String codeGroup, String codeValue, String defaultValue) {
        try {
            String codeName = commonCodeService.getCodeName(codeGroup, codeValue);
            return codeName != null ? codeName : defaultValue;
        } catch (Exception e) {
            log.warn("공통 코드 조회 실패, 기본값 사용: {} - {} -> {}", codeGroup, codeValue, defaultValue);
            return defaultValue;
        }
    }
}
