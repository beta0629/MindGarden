package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.RecurringExpenseService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;

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

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final String RELATED_ENTITY_TYPE_PREFIX = "RECURRING_EXPENSE_";

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final FinancialTransactionService financialTransactionService;
    private final FinancialTransactionRepository financialTransactionRepository;

    // ==================== 반복 지출 관리 ====================

    @Override
    public RecurringExpense createRecurringExpense(RecurringExpense recurringExpense) {
        log.info("반복 지출 생성: {}", recurringExpense.getExpenseName());

        String tenantId = TenantContextHolder.getRequiredTenantId();
        recurringExpense.setTenantId(tenantId);

        if (recurringExpense.getRecurrenceType() == null) {
            recurringExpense.setRecurrenceType("MONTHLY");
        }
        if (recurringExpense.getRecurrenceDay() == null) {
            recurringExpense.setRecurrenceDay(1);
        }
        if (recurringExpense.getAutoProcess() == null) {
            recurringExpense.setAutoProcess(true);
        }
        if (recurringExpense.getIsActive() == null) {
            recurringExpense.setIsActive(true);
        }
        if (recurringExpense.getIsVatApplicable() == null) {
            recurringExpense.setIsVatApplicable(true);
        }
        if (!Boolean.TRUE.equals(recurringExpense.getAutoProcess())) {
            if (recurringExpense.getAmount() == null) {
                recurringExpense.setAmount(BigDecimal.ZERO);
            }
            if (recurringExpense.getPaymentMethod() == null) {
                recurringExpense.setPaymentMethod(
                        com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD);
            }
        }

        if (recurringExpense.getNextDueDate() == null && recurringExpense.getStartDate() != null) {
            recurringExpense.setNextDueDate(resolveTransactionDate(
                YearMonth.from(recurringExpense.getStartDate()),
                recurringExpense.getRecurrenceDay()));
        }

        RecurringExpense saved = recurringExpenseRepository.save(recurringExpense);
        if (Boolean.TRUE.equals(saved.getIsActive()) && Boolean.TRUE.equals(saved.getAutoProcess())) {
            catchUpMonthlyRecurringExpenses();
        }
        return saved;
    }

    @Override
    public RecurringExpense updateRecurringExpense(Long id, RecurringExpense recurringExpense) {
        log.info("반복 지출 수정: id={}", id);

        RecurringExpense existingExpense = recurringExpenseRepository.findByTenantIdAndId(
                TenantContextHolder.getRequiredTenantId(), id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));

        existingExpense.setExpenseName(recurringExpense.getExpenseName());
        existingExpense.setExpenseType(recurringExpense.getExpenseType());
        existingExpense.setCategory(recurringExpense.getCategory());
        existingExpense.setSubcategory(recurringExpense.getSubcategory());
        existingExpense.setDescription(recurringExpense.getDescription());
        existingExpense.setAmount(recurringExpense.getAmount());
        existingExpense.setRecurrenceType(recurringExpense.getRecurrenceType());
        existingExpense.setRecurrenceDay(recurringExpense.getRecurrenceDay());
        existingExpense.setStartDate(recurringExpense.getStartDate());
        existingExpense.setEndDate(recurringExpense.getEndDate());
        existingExpense.setAutoProcess(recurringExpense.getAutoProcess());
        existingExpense.setIsActive(recurringExpense.getIsActive());
        existingExpense.setNotificationDaysBefore(recurringExpense.getNotificationDaysBefore());
        existingExpense.setSupplierName(recurringExpense.getSupplierName());
        existingExpense.setSupplierContact(recurringExpense.getSupplierContact());
        existingExpense.setPaymentMethod(recurringExpense.getPaymentMethod());
        existingExpense.setAccountNumber(recurringExpense.getAccountNumber());
        existingExpense.setIsVatApplicable(recurringExpense.getIsVatApplicable());
        existingExpense.setUpdatedAt(LocalDateTime.now());

        RecurringExpense saved = recurringExpenseRepository.save(existingExpense);
        if (Boolean.TRUE.equals(saved.getIsActive()) && Boolean.TRUE.equals(saved.getAutoProcess())) {
            catchUpMonthlyRecurringExpenses();
        }
        return saved;
    }

    @Override
    public boolean deleteRecurringExpense(Long id) {
        log.info("반복 지출 soft-delete: id={}", id);

        RecurringExpense recurringExpense = recurringExpenseRepository.findByTenantIdAndId(
                TenantContextHolder.getRequiredTenantId(), id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));

        // soft-delete만 수행. isActive=false로 대체하지 않음. 기등록 FT는 유지.
        recurringExpense.delete();
        recurringExpenseRepository.save(recurringExpense);

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public RecurringExpense getRecurringExpenseById(Long id) {
        log.info("반복 지출 조회: id={}", id);
        return recurringExpenseRepository.findByTenantIdAndId(
                TenantContextHolder.getRequiredTenantId(), id)
                .orElseThrow(() -> new RuntimeException("반복 지출을 찾을 수 없습니다: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getAllActiveRecurringExpenses() {
        log.info("모든 활성 반복 지출 조회");
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return recurringExpenseRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getAllRecurringExpensesForTenant() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return recurringExpenseRepository.findAllByTenantId(tenantId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecurringExpense> getAllRecurringExpensesForTenantWithMissingMonths() {
        List<RecurringExpense> expenses = getAllRecurringExpensesForTenant();
        for (RecurringExpense expense : expenses) {
            expense.setMissingMonths(computeMissingMonths(expense));
        }
        return expenses;
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return recurringExpenseRepository.findByTenantIdAndNextDueDateLessThanEqualAndIsActiveTrue(
            tenantId, targetDate);
    }

    // ==================== 자동 처리 ====================

    @Override
    public int processDueRecurringExpenses(LocalDate targetDate) {
        log.info("반복 지출 catch-up (process-due): {}", targetDate);
        return catchUpMonthlyRecurringExpenses();
    }

    @Override
    public int catchUpMonthlyRecurringExpenses() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        YearMonth currentMonth = YearMonth.now(SEOUL);
        List<RecurringExpense> activeExpenses =
            recurringExpenseRepository.findByTenantIdAndIsActiveTrue(tenantId);

        int createdCount = 0;
        for (RecurringExpense expense : activeExpenses) {
            if (!Boolean.TRUE.equals(expense.getAutoProcess())) {
                continue;
            }
            if (!"MONTHLY".equalsIgnoreCase(expense.getRecurrenceType())) {
                continue;
            }
            if (expense.getStartDate() == null || expense.getAmount() == null) {
                continue;
            }
            if (expense.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            YearMonth startMonth = YearMonth.from(expense.getStartDate());
            if (startMonth.isAfter(currentMonth)) {
                continue;
            }
            for (YearMonth ym = startMonth; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
                if (postExpenseForMonthIfMissing(expense, ym, expense.getAmount())) {
                    createdCount++;
                }
            }
        }
        log.info("반복 지출 catch-up 완료: tenantId={}, created={}", tenantId, createdCount);
        return createdCount;
    }

    @Override
    public boolean recordRecurringExpenseMonth(Long recurringExpenseId, String yearMonthStr,
            BigDecimal amount) {
        log.info("변동 반복 지출 월별 기록: id={}, month={}, amount={}",
            recurringExpenseId, yearMonthStr, amount);

        RecurringExpense expense = getRecurringExpenseById(recurringExpenseId);
        if (Boolean.TRUE.equals(expense.getAutoProcess())) {
            throw new IllegalArgumentException("고정 금액 규칙은 월별 금액 입력 API를 사용할 수 없습니다.");
        }
        if (!Boolean.TRUE.equals(expense.getIsActive())) {
            throw new IllegalArgumentException("비활성 규칙은 기록할 수 없습니다.");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
        }
        if (yearMonthStr == null || yearMonthStr.isBlank()) {
            throw new IllegalArgumentException("기록할 연월을 입력해주세요.");
        }

        YearMonth yearMonth = YearMonth.parse(yearMonthStr.trim());
        YearMonth currentMonth = YearMonth.now(SEOUL);
        if (yearMonth.isAfter(currentMonth)) {
            throw new IllegalArgumentException("미래 달은 기록할 수 없습니다.");
        }
        if (expense.getStartDate() == null) {
            throw new IllegalArgumentException("시작 달이 설정되지 않았습니다.");
        }
        YearMonth startMonth = YearMonth.from(expense.getStartDate());
        if (yearMonth.isBefore(startMonth)) {
            throw new IllegalArgumentException("시작 달 이전은 기록할 수 없습니다.");
        }

        return postExpenseForMonthIfMissing(expense, yearMonth, amount);
    }

    @Override
    public void processRecurringExpense(Long recurringExpenseId, BigDecimal customAmount) {
        log.info("반복 지출 수동 처리: id={}, 금액={}", recurringExpenseId, customAmount);

        RecurringExpense recurringExpense = getRecurringExpenseById(recurringExpenseId);
        YearMonth targetMonth = YearMonth.now(SEOUL);
        BigDecimal amount = customAmount != null ? customAmount : recurringExpense.getAmount();
        postExpenseForMonth(recurringExpense, targetMonth, amount);
    }

    @Override
    public void pauseRecurringExpense(Long id, String reason) {
        log.info("반복 지출 일시 중단: id={}, 사유={}", id, reason);

        RecurringExpense recurringExpense = getRecurringExpenseById(id);
        recurringExpense.setIsActive(false);
        recurringExpense.setDescription(recurringExpense.getDescription()
            + String.format(" [일시중단: %s]", reason));
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
        if (Boolean.TRUE.equals(recurringExpense.getAutoProcess())) {
            catchUpMonthlyRecurringExpenses();
        }
    }

    // ==================== 통계 및 분석 ====================

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRecurringExpenseStatus() {
        log.info("반복 지출 현황 조회");

        List<RecurringExpense> activeExpenses = getAllActiveRecurringExpenses();

        Map<String, Object> status = new HashMap<>();

        BigDecimal totalAmount = activeExpenses.stream()
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        status.put("totalAmount", totalAmount);

        Map<String, BigDecimal> byType = activeExpenses.stream()
                .collect(Collectors.groupingBy(
                    RecurringExpense::getExpenseType,
                    Collectors.reducing(BigDecimal.ZERO, RecurringExpense::getAmount, BigDecimal::add)
                ));
        status.put("byType", byType);
        status.put("activeCount", activeExpenses.size());

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

        BigDecimal monthlyAmount = activeExpenses.stream()
                .filter(expense -> "MONTHLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal quarterlyAmount = activeExpenses.stream()
                .filter(expense -> "QUARTERLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(3), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal yearlyAmount = activeExpenses.stream()
                .filter(expense -> "YEARLY".equals(expense.getRecurrenceType()))
                .map(RecurringExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP);

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

        LocalDate targetDate = LocalDate.now(SEOUL).plusDays(daysAhead);
        return recurringExpenseRepository.findByNextDueDateBetweenAndIsActiveTrue(
            LocalDate.now(SEOUL), targetDate);
    }

    // ==================== 헬퍼 메서드 ====================

    private boolean postExpenseForMonthIfMissing(RecurringExpense expense, YearMonth yearMonth,
            BigDecimal amount) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String relatedEntityType = buildRelatedEntityType(yearMonth);
        boolean exists = financialTransactionRepository
            .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                tenantId,
                expense.getId(),
                relatedEntityType,
                FinancialTransaction.TransactionType.EXPENSE);
        if (exists) {
            return false;
        }
        postExpenseForMonth(expense, yearMonth, amount);
        return true;
    }

    private List<String> computeMissingMonths(RecurringExpense expense) {
        if (Boolean.TRUE.equals(expense.getAutoProcess())) {
            return List.of();
        }
        if (!Boolean.TRUE.equals(expense.getIsActive())) {
            return List.of();
        }
        if (!"MONTHLY".equalsIgnoreCase(expense.getRecurrenceType())) {
            return List.of();
        }
        if (expense.getStartDate() == null) {
            return List.of();
        }

        String tenantId = TenantContextHolder.getRequiredTenantId();
        YearMonth currentMonth = YearMonth.now(SEOUL);
        YearMonth startMonth = YearMonth.from(expense.getStartDate());
        if (startMonth.isAfter(currentMonth)) {
            return List.of();
        }

        List<String> missing = new ArrayList<>();
        for (YearMonth ym = startMonth; !ym.isAfter(currentMonth); ym = ym.plusMonths(1)) {
            String relatedEntityType = buildRelatedEntityType(ym);
            boolean exists = financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                    tenantId,
                    expense.getId(),
                    relatedEntityType,
                    FinancialTransaction.TransactionType.EXPENSE);
            if (!exists) {
                missing.add(ym.toString());
            }
        }
        return missing;
    }

    private void postExpenseForMonth(RecurringExpense expense, YearMonth yearMonth, BigDecimal amount) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        String relatedEntityType = buildRelatedEntityType(yearMonth);
        LocalDate transactionDate = resolveTransactionDate(yearMonth, expense.getRecurrenceDay());

        BigDecimal paymentAmount = amount != null ? amount : expense.getAmount();
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("반복 지출 금액은 0보다 커야 합니다.");
        }

        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
            .transactionType("EXPENSE")
            .category(expense.getCategory())
            .subcategory(expense.getSubcategory())
            .amount(paymentAmount)
            .amountBeforeTax(paymentAmount)
            .taxAmount(BigDecimal.ZERO)
            .description(expense.getExpenseName())
            .transactionDate(transactionDate)
            .relatedEntityId(expense.getId())
            .relatedEntityType(relatedEntityType)
            .taxIncluded(true)
            .build();

        financialTransactionService.createTransaction(request, null);

        expense.setLastProcessedDate(transactionDate);
        expense.setTotalProcessedCount(
            expense.getTotalProcessedCount() != null ? expense.getTotalProcessedCount() + 1 : 1);
        expense.setNextDueDate(resolveTransactionDate(yearMonth.plusMonths(1), expense.getRecurrenceDay()));
        expense.setUpdatedAt(LocalDateTime.now());
        recurringExpenseRepository.save(expense);

        log.info("반복 지출 월별 기록: tenantId={}, ruleId={}, month={}, amount={}",
            tenantId, expense.getId(), yearMonth, paymentAmount);
    }

    static String buildRelatedEntityType(YearMonth yearMonth) {
        return RELATED_ENTITY_TYPE_PREFIX + yearMonth.toString().replace('-', '_');
    }

    static LocalDate resolveTransactionDate(YearMonth yearMonth, Integer recurrenceDay) {
        int requestedDay = recurrenceDay != null && recurrenceDay > 0 ? recurrenceDay : 1;
        int day = Math.min(requestedDay, yearMonth.lengthOfMonth());
        return yearMonth.atDay(day);
    }
}
