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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final ConsultantClientMappingRepository consultantClientMappingRepository;
    private final CommonCodeService commonCodeService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final UserRepository userRepository;
    
    @Override
    public FinancialTransactionResponse createTransaction(FinancialTransactionRequest request, User currentUser) {
        log.info("💼 회계 거래 생성: 유형={}, 금액={}, 카테고리={}", 
                request.getTransactionType(), request.getAmount(), request.getCategory());
        
        // 권한 확인 (시스템 자동 처리가 아닌 경우에만)
        if (currentUser != null) {
            if (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
                !UserRole.ADMIN.equals(currentUser.getRole()) && 
                !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole())) {
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
                .branchCode(request.getBranchCode())
                .taxIncluded(request.getTaxIncluded() != null ? request.getTaxIncluded() : false)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .amountBeforeTax(request.getAmountBeforeTax() != null ? request.getAmountBeforeTax() : request.getAmount())
                .remarks(request.getRemarks())
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .build();
        
        FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
        
        // 🚀 실시간 통계 업데이트 추가
        try {
            // 거래 유형에 따른 통계 업데이트
            String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
            if (incomeType.equals(request.getTransactionType()) && savedTransaction.getBranchCode() != null) {
                // 수입 거래시 재무 통계 업데이트 (상담료 수입 등)
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
                    // 환불 거래시 환불 통계 업데이트
                    if (savedTransaction.getRelatedEntityId() != null && savedTransaction.getBranchCode() != null) {
                        // 관련 상담사 ID를 추출하여 환불 통계 업데이트 (추후 매핑 테이블 조회 로직 추가 가능)
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
        
        // 권한 확인
        if (!UserRole.HQ_MASTER.equals(currentUser.getRole()) && 
            !UserRole.ADMIN.equals(currentUser.getRole()) && 
            !UserRole.BRANCH_SUPER_ADMIN.equals(currentUser.getRole())) {
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
        
        // 총 세금 계산
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
    
    /**
     * 총 세금 계산
     * 
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 총 세금 금액
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalTaxAmount(LocalDate startDate, LocalDate endDate) {
        try {
            log.info("💰 총 세금 계산 시작: {} ~ {}", startDate, endDate);
            
            // 세금 관련 거래 조회 (공통 코드에서 카테고리명 조회)
            String taxCategory = getSafeCodeName("FINANCIAL_CATEGORY", "TAX", "세금");
            List<FinancialTransaction> taxTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(taxCategory);
            
            // 기간 필터링
            List<FinancialTransaction> filteredTaxTransactions = taxTransactions.stream()
                    .filter(t -> !t.getTransactionDate().isBefore(startDate) && !t.getTransactionDate().isAfter(endDate))
                    .collect(Collectors.toList());
            
            // 총 세금 금액 계산
            BigDecimal totalTaxAmount = filteredTaxTransactions.stream()
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 부가세 별도 계산 (공통 코드에서 결제 카테고리명 조회)
            String paymentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PAYMENT", "결제");
            List<FinancialTransaction> paymentTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(paymentCategory);
            
            BigDecimal totalVatAmount = paymentTransactions.stream()
                    .filter(t -> !t.getTransactionDate().isBefore(startDate) && !t.getTransactionDate().isAfter(endDate))
                    .filter(t -> t.getTaxAmount() != null)
                    .map(FinancialTransaction::getTaxAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 총 세금 = 직접 세금 + 부가세
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
    
    // 특화된 거래 생성 메서드들
    
    @Override
    public FinancialTransactionResponse createSalaryTransaction(Long salaryCalculationId, String description) {
        SalaryCalculation salary = salaryCalculationRepository.findById(salaryCalculationId)
                .orElseThrow(() -> new RuntimeException("급여 계산을 찾을 수 없습니다: " + salaryCalculationId));
        
        // 공통 코드에서 카테고리 조회
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
        
        // 공통 코드에서 카테고리 조회
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
        
        // 부가세 계산 (결제 금액은 부가세 포함)
        com.coresolution.consultation.util.TaxCalculationUtil.TaxCalculationResult taxResult = 
            com.coresolution.consultation.util.TaxCalculationUtil.calculateTaxFromPayment(payment.getAmount());
        
        // 공통 코드에서 카테고리 조회
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
        // 공통 코드에서 카테고리 조회
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
        // 공통 코드에서 카테고리 조회
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
        // 공통 코드에서 카테고리 조회
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
    
    // 헬퍼 메서드들
    
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
                .branchCode(transaction.getBranchCode())
                .taxIncluded(transaction.getTaxIncluded())
                .taxAmount(transaction.getTaxAmount())
                .amountBeforeTax(transaction.getAmountBeforeTax())
                .remarks(transaction.getRemarks())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt());
        
        // 매핑 정보 조회 (CONSULTANT_CLIENT_MAPPING 관련 거래인 경우)
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
        // 총 금액 계산 (비율 계산을 위해)
        BigDecimal totalAmount = results.stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return results.stream()
                .map(row -> {
                    String category = (String) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    Long count = ((Number) row[2]).longValue();
                    
                    // 비율 계산
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
     * 
     * @param amount 개별 금액
     * @param totalAmount 총 금액
     * @return 비율 문자열 (예: "25.5%")
     */
    private String calculatePercentage(BigDecimal amount, BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return "0%";
        }
        
        try {
            // 비율 계산: (개별 금액 / 총 금액) * 100
            BigDecimal percentage = amount
                    .divide(totalAmount, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            
            // 소수점 1자리까지 반올림
            percentage = percentage.setScale(1, RoundingMode.HALF_UP);
            
            return percentage.toString() + "%";
            
        } catch (Exception e) {
            log.warn("비율 계산 중 오류 발생: amount={}, totalAmount={}, error={}", 
                    amount, totalAmount, e.getMessage());
            return "0%";
        }
    }
    
    private FinancialDashboardResponse.SalaryFinancialData getSalaryFinancialData() {
        // 급여 관련 통계 데이터 조회 로직 구현
        try {
            // 급여 관련 거래 조회 (공통 코드에서 급여 카테고리명 조회)
            String salaryCategory = getSafeCodeName("FINANCIAL_CATEGORY", "SALARY", "급여");
            List<FinancialTransaction> salaryTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(salaryCategory);
            
            // 총 급여 지급액 계산
            BigDecimal totalSalaryPaid = salaryTransactions.stream()
                    .filter(t -> "INCOME".equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 총 세금 공제액 계산 (공통 코드에서 세금 카테고리명 조회)
            String taxCategory = getSafeCodeName("FINANCIAL_CATEGORY", "TAX", "세금");
            BigDecimal totalTaxWithheld = salaryTransactions.stream()
                    .filter(t -> taxCategory.equals(t.getCategory()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 상담사 수 조회 (임시로 기본값 사용)
            long consultantCount = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT).size();
            
            // 평균 급여 계산
            BigDecimal averageSalary = consultantCount > 0 ? 
                    totalSalaryPaid.divide(BigDecimal.valueOf(consultantCount), 2, RoundingMode.HALF_UP) : 
                    BigDecimal.ZERO;
            
            // 등급별 급여 통계 (임시로 기본값 사용)
            List<FinancialDashboardResponse.SalaryByGrade> salaryByGrade = new ArrayList<>();
            // 등급별 급여 통계는 PL/SQL 프로시저로 처리됨
            
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
            
            // 오류 발생 시 기본값 반환
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
        // ERP 관련 통계 데이터 조회 로직 구현
        try {
            // ERP 관련 거래 조회 (공통 코드에서 카테고리명 조회)
            String purchaseCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PURCHASE", "구매");
            String budgetCategory = getSafeCodeName("FINANCIAL_CATEGORY", "BUDGET", "예산");
            List<FinancialTransaction> purchaseTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(purchaseCategory);
            List<FinancialTransaction> budgetTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(budgetCategory);
            
            // 총 구매 금액 계산
            BigDecimal totalPurchaseAmount = purchaseTransactions.stream()
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 총 예산 계산
            String incomeType = getSafeCodeName("TRANSACTION_TYPE", "INCOME", "INCOME");
            BigDecimal totalBudget = budgetTransactions.stream()
                    .filter(t -> incomeType.equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 사용된 예산 계산
            String expenseType = getSafeCodeName("TRANSACTION_TYPE", "EXPENSE", "EXPENSE");
            BigDecimal usedBudget = budgetTransactions.stream()
                    .filter(t -> expenseType.equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 잔여 예산 계산
            BigDecimal remainingBudget = totalBudget.subtract(usedBudget);
            
            // 대기 중인 요청 수 (실제 구현에서는 PurchaseRequest 엔티티 조회 필요)
            int pendingRequests = 0; // 구매 요청 기능은 향후 구현 예정
            
            // 승인된 요청 수 (실제 구현에서는 PurchaseRequest 엔티티 조회 필요)
            int approvedRequests = 0; // 구매 요청 기능은 향후 구현 예정
            
            // 카테고리별 예산 통계
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
                        
                        // 실제 사용량 계산 - 해당 카테고리의 지출 거래 조회
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
            
            // 오류 발생 시 기본값 반환
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
        // 결제 관련 통계 데이터 조회 로직 구현
        try {
            // 결제 관련 거래 조회 (공통 코드에서 카테고리명 조회)
            String paymentCategory = getSafeCodeName("FINANCIAL_CATEGORY", "PAYMENT", "결제");
            List<FinancialTransaction> paymentTransactions = financialTransactionRepository
                    .findByCategoryAndIsDeletedFalse(paymentCategory);
            
            // 총 결제 금액 계산
            BigDecimal totalPaymentAmount = paymentTransactions.stream()
                    .filter(t -> "INCOME".equals(t.getTransactionType().name()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 총 결제 건수
            int totalPaymentCount = paymentTransactions.size();
            
            // 결제 상태별 통계 (ConsultantClientMapping의 PaymentStatus 조회)
            int pendingPayments = (int) consultantClientMappingRepository.countByPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING);
            int completedPayments = (int) consultantClientMappingRepository.countByPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
            int failedPayments = (int) consultantClientMappingRepository.countByPaymentStatus(ConsultantClientMapping.PaymentStatus.REJECTED);
            
            // 결제 수단별 통계
            Map<String, BigDecimal> paymentByMethod = paymentTransactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getDescription() != null ? t.getDescription() : "UNKNOWN",
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            // 결제 제공업체별 통계
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
            
            // 오류 발생 시 기본값 반환
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
            log.info("🏢 지점별 재무 데이터 조회: 지점={}, 시작일={}, 종료일={}, 카테고리={}, 유형={}", 
                    branchCode, startDate, endDate, category, transactionType);
            
            // 지점별 거래 내역 조회 (삭제되지 않은 거래만)
            String tenantId = TenantContextHolder.getTenantId();
            List<FinancialTransaction> allTransactions = financialTransactionRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            log.info("🔍 전체 거래 내역 수: {}", allTransactions.size());
            
            List<FinancialTransaction> transactions = allTransactions
                    .stream()
                    .filter(t -> branchCode.equals(t.getBranchCode()))
                    .filter(t -> !startDate.isAfter(t.getTransactionDate()) && !endDate.isBefore(t.getTransactionDate()))
                    .filter(t -> category == null || category.isEmpty() || category.equals(t.getCategory()))
                    .filter(t -> transactionType == null || transactionType.isEmpty() || 
                            transactionType.equals(t.getTransactionType().name()))
                    .collect(Collectors.toList());
            
            log.info("🔍 필터링된 거래 내역 수: {}, 지점: {}, 기간: {}~{}", 
                    transactions.size(), branchCode, startDate, endDate);
            
            // 수익/지출 계산
            BigDecimal totalRevenue = transactions.stream()
                    .filter(t -> FinancialTransaction.TransactionType.INCOME.equals(t.getTransactionType()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal totalExpenses = transactions.stream()
                    .filter(t -> FinancialTransaction.TransactionType.EXPENSE.equals(t.getTransactionType()))
                    .map(FinancialTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal netProfit = totalRevenue.subtract(totalExpenses);
            
            // 거래 내역 변환
            List<Map<String, Object>> transactionList = transactions.stream()
                    .map(this::convertTransactionToMap)
                    .collect(Collectors.toList());
            
            // 카테고리별 분석
            Map<String, BigDecimal> categoryBreakdown = transactions.stream()
                    .collect(Collectors.groupingBy(
                            t -> t.getCategory() != null ? t.getCategory() : "기타",
                            Collectors.reducing(BigDecimal.ZERO, 
                                    FinancialTransaction::getAmount, 
                                    BigDecimal::add)
                    ));
            
            // 월별 통계 (간단한 형태로)
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
            
            log.info("✅ 지점별 재무 데이터 조회 완료: 지점={}, 수익={}, 지출={}, 순이익={}", 
                    branchCode, totalRevenue, totalExpenses, netProfit);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 지점별 재무 데이터 조회 실패: 지점={}, 오류={}", branchCode, e.getMessage(), e);
            
            // 오류 시 기본값 반환
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
            log.info("🏢 지점별 재무 거래 목록 조회: 지점={}, 유형={}, 카테고리={}, 시작일={}, 종료일={}", 
                    branchCode, transactionType, category, startDate, endDate);
            
            // 모든 거래 조회 후 필터링
            Page<FinancialTransaction> allTransactions = financialTransactionRepository
                    .findByIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(
                        org.springframework.data.domain.PageRequest.of(0, 10000)); // 더 많은 데이터 가져오기
            
            log.info("🔍 전체 재무 거래 조회 완료: {}건", allTransactions.getTotalElements());
            
            // 지점별 필터링 적용
            List<FinancialTransaction> filteredTransactions = allTransactions.getContent().stream()
                    .filter(t -> {
                        // 지점코드 필터링 디버깅
                        if (branchCode != null && !branchCode.isEmpty()) {
                            boolean matches = branchCode.equals(t.getBranchCode());
                            if (!matches) {
                                log.info("🔍 지점코드 불일치: 요청={}, 거래={} (거래ID={})", branchCode, t.getBranchCode(), t.getId());
                            } else {
                                log.info("✅ 지점코드 일치: 요청={}, 거래={} (거래ID={})", branchCode, t.getBranchCode(), t.getId());
                            }
                            return matches;
                        }
                        log.info("🔍 지점코드 필터링 없음 - 모든 거래 포함");
                        return true;
                    })
                    .filter(t -> {
                        // 거래 유형 필터링
                        if (transactionType != null && !transactionType.isEmpty() && !"ALL".equals(transactionType)) {
                            return transactionType.equals(t.getTransactionType().name());
                        }
                        return true;
                    })
                    .filter(t -> {
                        // 카테고리 필터링
                        if (category != null && !category.isEmpty() && !"ALL".equals(category)) {
                            return category.equals(t.getCategory());
                        }
                        return true;
                    })
                    .filter(t -> {
                        // 날짜 범위 필터링
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
            
            log.info("🔍 필터링 결과: 전체={}건, 지점 필터링 후={}건", allTransactions.getTotalElements(), filteredTransactions.size());
            
            // 처음 몇 개 거래의 지점코드 출력 (디버깅)
            filteredTransactions.stream().limit(5).forEach(t -> 
                log.info("📊 거래 샘플: ID={}, 지점={}, 유형={}, 금액={}", 
                    t.getId(), t.getBranchCode(), t.getTransactionType(), t.getAmount())
            );
            
            // 페이징 처리
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filteredTransactions.size());
            List<FinancialTransaction> pageContent = filteredTransactions.subList(start, end);
            
            // FinancialTransactionResponse로 변환
            List<FinancialTransactionResponse> responseContent = pageContent.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            
            // Page 객체 생성
            Page<FinancialTransactionResponse> result = new org.springframework.data.domain.PageImpl<>(
                    responseContent, pageable, filteredTransactions.size());
            
            log.info("✅ 지점별 재무 거래 조회 완료: 지점={}, 전체={}, 필터링후={}건", 
                    branchCode, allTransactions.getTotalElements(), filteredTransactions.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 지점별 재무 거래 조회 실패: 지점={}, 오류={}", branchCode, e.getMessage(), e);
            throw new RuntimeException("지점별 재무 거래 조회에 실패했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 안전한 공통 코드명 조회 (오류 시 기본값 반환)
     * 
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @param defaultValue 기본값
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
