package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.entity.RecurringExpense;
import com.mindgarden.consultation.repository.RecurringExpenseRepository;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.RecurringExpenseService;
import com.mindgarden.consultation.util.TaxCalculationUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 반복 지출 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecurringExpenseServiceImpl implements RecurringExpenseService {
    
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final FinancialTransactionService financialTransactionService;
    
    // ==================== 반복 지출 관리 ====================
    
    @Override
    public RecurringExpense createRecurringExpense(RecurringExpense recurringExpense) {
        log.info("반복 지출 생성: {}", recurringExpense.getExpenseName());
        
        if (recurringExpense.getCreatedAt() == null) {
            recurringExpense.setCreatedAt(LocalDate.now());
        }
        if (recurringExpense.getUpdatedAt() == null) {
            recurringExpense.setUpdatedAt(LocalDateTime.now());
        }
        
        // 다음 처리 예정일 계산
        if (recurringExpense.getNextDueDate() == null) {
            recurringExpense.setNextDueDate(calculateNextDueDate(recurringExpense.getStartDate(), 
                recurringExpense.getRecurrenceDay()));
        }
        
        return recurringExpenseRepository.save(recurringExpense);
    }
    
    @Override
    public RecurringExpense updateRecurringExpense(Long id, RecurringExpense recurringExpense) {
        log.info("반복 지출 수정: id={}", id);
        
        RecurringExpense existingExpense = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));
        
        existingExpense.setExpenseName(recurringExpense.getExpenseName());
        existingExpense.setExpenseType(recurringExpense.getExpenseType());
        existingExpense.setCategory(recurringExpense.getCategory());
        existingExpense.setSubcategory(recurringExpense.getSubcategory());
        existingExpense.setDescription(recurringExpense.getDescription());
        existingExpense.setAmount(recurringExpense.getAmount());
        existingExpense.setRecurrenceType(recurringExpense.getRecurrenceType());
        existingExpense.setRecurrenceDay(recurringExpense.getRecurrenceDay());
        existingExpense.setEndDate(recurringExpense.getEndDate());
        existingExpense.setAutoProcess(recurringExpense.getAutoProcess());
        existingExpense.setNotificationDaysBefore(recurringExpense.getNotificationDaysBefore());
        existingExpense.setSupplierName(recurringExpense.getSupplierName());
        existingExpense.setSupplierContact(recurringExpense.getSupplierContact());
        existingExpense.setPaymentMethod(recurringExpense.getPaymentMethod());
        existingExpense.setAccountNumber(recurringExpense.getAccountNumber());
        existingExpense.setIsVatApplicable(recurringExpense.getIsVatApplicable());
        existingExpense.setUpdatedAt(LocalDateTime.now());
        
        return recurringExpenseRepository.save(existingExpense);
    }
    
    @Override
    public boolean deleteRecurringExpense(Long id) {
        log.info("반복 지출 삭제: id={}", id);
        
        RecurringExpense recurringExpense = recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));
        
        recurringExpense.setIsActive(false);
        recurringExpense.setUpdatedAt(LocalDateTime.now());
        recurringExpenseRepository.save(recurringExpense);
        
        return true;
    }
    
    @Override
    @Transactional(readOnly = true)
    public RecurringExpense getRecurringExpenseById(Long id) {
        log.info("반복 지출 조회: id={}", id);
        return recurringExpenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getAllActiveRecurringExpenses() {
        log.info("모든 활성 반복 지출 조회");
        return recurringExpenseRepository.findByIsActiveTrue();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getRecurringExpensesByType(String expenseType) {
        log.info("지출 유형별 반복 지출 조회: {}", expenseType);
        return recurringExpenseRepository.findByExpenseTypeAndIsActiveTrue(expenseType);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getDueRecurringExpenses(LocalDate targetDate) {
        log.info("처리 예정인 반복 지출 조회: {}", targetDate);
        return recurringExpenseRepository.findByNextDueDateLessThanEqualAndIsActiveTrue(targetDate);
    }
    
    // ==================== 자동 처리 ====================
    
    @Override
    public int processDueRecurringExpenses(LocalDate targetDate) {
        log.info("처리 예정인 반복 지출 자동 처리 시작: {}", targetDate);
        
        List<RecurringExpense> dueExpenses = getDueRecurringExpenses(targetDate);
        int processedCount = 0;
        
        for (RecurringExpense expense : dueExpenses) {
            try {
                if (expense.getAutoProcess()) {
                    processRecurringExpense(expense.getId(), expense.getAmount());
                    processedCount++;
                    log.info("✅ 반복 지출 자동 처리 완료: {} - {}원", 
                        expense.getExpenseName(), expense.getAmount());
                }
            } catch (Exception e) {
                log.error("❌ 반복 지출 자동 처리 실패: {} - {}", 
                    expense.getExpenseName(), e.getMessage(), e);
            }
        }
        
        log.info("반복 지출 자동 처리 완료: {}건 처리", processedCount);
        return processedCount;
    }
    
    @Override
    public void processRecurringExpense(Long recurringExpenseId, BigDecimal customAmount) {
        log.info("반복 지출 수동 처리: id={}, 금액={}", recurringExpenseId, customAmount);
        
        RecurringExpense recurringExpense = getRecurringExpenseById(recurringExpenseId);
        
        // 실제 처리 금액 결정
        BigDecimal processAmount = customAmount != null ? customAmount : recurringExpense.getAmount();
        
        // 부가세 계산
        TaxCalculationUtil.TaxCalculationResult taxResult;
        if (recurringExpense.getIsVatApplicable()) {
            // 부가세 적용: 입력 금액은 부가세 제외 금액으로 간주
            taxResult = TaxCalculationUtil.calculateTaxForExpense(processAmount);
        } else {
            // 부가세 미적용 (급여 등)
            taxResult = new TaxCalculationUtil.TaxCalculationResult(
                processAmount, processAmount, BigDecimal.ZERO);
        }
        
        // 재무 거래 기록 생성
        try {
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("EXPENSE")
                    .category(recurringExpense.getCategory())
                    .subcategory(recurringExpense.getSubcategory())
                    .amount(taxResult.getAmountIncludingTax()) // 부가세 포함 금액
                    .amountBeforeTax(taxResult.getAmountExcludingTax()) // 부가세 제외 금액
                    .taxAmount(taxResult.getVatAmount()) // 부가세 금액
                    .description(String.format("%s - %s", 
                        recurringExpense.getExpenseName(), 
                        recurringExpense.getDescription()))
                    .transactionDate(LocalDate.now())
                    .relatedEntityId(recurringExpenseId)
                    .relatedEntityType("RECURRING_EXPENSE")
                    .taxIncluded(recurringExpense.getIsVatApplicable())
                    .build();
            
            financialTransactionService.createTransaction(request, null);
            log.info("✅ 반복 지출 재무 거래 기록 생성 완료");
        } catch (Exception e) {
            log.error("반복 지출 재무 거래 기록 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("재무 거래 기록 생성 실패", e);
        }
        
        // 반복 지출 상태 업데이트
        recurringExpense.setLastProcessedDate(LocalDate.now());
        recurringExpense.setTotalProcessedCount(recurringExpense.getTotalProcessedCount() + 1);
        recurringExpense.setNextDueDate(calculateNextDueDate(LocalDate.now(), 
            recurringExpense.getRecurrenceDay()));
        recurringExpense.setUpdatedAt(LocalDateTime.now());
        recurringExpenseRepository.save(recurringExpense);
        
        log.info("✅ 반복 지출 처리 완료: {} - {}원", 
            recurringExpense.getExpenseName(), processAmount);
    }
    
    @Override
    public void pauseRecurringExpense(Long id, String reason) {
        log.info("반복 지출 일시 중단: id={}, 사유={}", id, reason);
        
        RecurringExpense recurringExpense = getRecurringExpenseById(id);
        recurringExpense.setIsActive(false);
        recurringExpense.setDescription(recurringExpense.getDescription() + 
            String.format(" [일시중단: %s]", reason));
        recurringExpense.setUpdatedAt(LocalDateTime.now());
        recurringExpenseRepository.save(recurringExpense);
    }
    
    @Override
    public void resumeRecurringExpense(Long id) {
        log.info("반복 지출 재개: id={}", id);
        
        RecurringExpense recurringExpense = getRecurringExpenseById(id);
        recurringExpense.setIsActive(true);
        recurringExpense.setUpdatedAt(LocalDateTime.now());
        recurringExpenseRepository.save(recurringExpense);
    }
    
    // ==================== 통계 및 분석 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRecurringExpenseStatus() {
        log.info("반복 지출 현황 조회");
        
        List<RecurringExpense> activeExpenses = getAllActiveRecurringExpenses();
        
        Map<String, Object> status = new HashMap<>();
        
        // 총 반복 지출 금액
        BigDecimal totalAmount = activeExpenses.stream()
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        status.put("totalAmount", totalAmount);
        
        // 유형별 현황
        Map<String, BigDecimal> byType = activeExpenses.stream()
                .collect(Collectors.groupingBy(
                    RecurringExpense::getExpenseType,
                    Collectors.reducing(BigDecimal.ZERO, RecurringExpense::getAmount, BigDecimal::add)
                ));
        status.put("byType", byType);
        
        // 활성 반복 지출 수
        status.put("activeCount", activeExpenses.size());
        
        // 자동 처리 설정된 수
        long autoProcessCount = activeExpenses.stream()
                .filter(RecurringExpense::getAutoProcess)
                .count();
        status.put("autoProcessCount", autoProcessCount);
        
        return status;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyRecurringExpenseForecast() {
        log.info("월별 반복 지출 예상 금액 조회");
        
        List<RecurringExpense> activeExpenses = getAllActiveRecurringExpenses();
        
        Map<String, Object> forecast = new HashMap<>();
        
        // 월별 예상 금액 계산
        BigDecimal monthlyAmount = activeExpenses.stream()
                .filter(expense -> "MONTHLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal quarterlyAmount = activeExpenses.stream()
                .filter(expense -> "QUARTERLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(3), 2, java.math.RoundingMode.HALF_UP); // 분기별을 월별로 변환
        
        BigDecimal yearlyAmount = activeExpenses.stream()
                .filter(expense -> "YEARLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP); // 연별을 월별로 변환
        
        BigDecimal totalMonthlyForecast = monthlyAmount.add(quarterlyAmount).add(yearlyAmount);
        
        forecast.put("monthlyAmount", monthlyAmount);
        forecast.put("quarterlyAmount", quarterlyAmount);
        forecast.put("yearlyAmount", yearlyAmount);
        forecast.put("totalMonthlyForecast", totalMonthlyForecast);
        
        return forecast;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRecurringExpenseHistory(String startDate, String endDate) {
        log.info("반복 지출 처리 내역 조회: {} ~ {}", startDate, endDate);
        
        // TODO: FinancialTransaction에서 반복 지출 관련 거래 조회
        Map<String, Object> history = new HashMap<>();
        history.put("startDate", startDate);
        history.put("endDate", endDate);
        history.put("message", "반복 지출 처리 내역 조회 기능은 추후 구현 예정");
        
        return history;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getUpcomingRecurringExpenses(int daysAhead) {
        log.info("처리 예정 알림 목록 조회: {}일 후까지", daysAhead);
        
        LocalDate targetDate = LocalDate.now().plusDays(daysAhead);
        return recurringExpenseRepository.findByNextDueDateBetweenAndIsActiveTrue(
            LocalDate.now(), targetDate);
    }
    
    // ==================== 헬퍼 메서드 ====================
    
    /**
     * 다음 처리 예정일 계산
     */
    private LocalDate calculateNextDueDate(LocalDate baseDate, Integer dayOfMonth) {
        LocalDate nextDate = baseDate.withDayOfMonth(Math.min(dayOfMonth, baseDate.lengthOfMonth()));
        
        // 이미 지난 날짜면 다음 달로 설정
        if (nextDate.isBefore(LocalDate.now())) {
            nextDate = nextDate.plusMonths(1);
            nextDate = nextDate.withDayOfMonth(Math.min(dayOfMonth, nextDate.lengthOfMonth()));
        }
        
        return nextDate;
    }
}
