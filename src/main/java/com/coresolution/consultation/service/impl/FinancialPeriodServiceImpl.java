package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.PeriodStatus;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.exception.TaxIntegrityException;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.erp.FinancialPeriodService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link FinancialPeriodService} 구현체 — 합의서 §4.1 / §4.2 / §4.3 SSOT.
 *
 * <ul>
 *   <li><b>Q7</b> dry-run 토글: {@code mindgarden.scheduler.financial-close.dry-run} (default {@code true}).
 *       true 시 합산만 수행, row 미삽입.</li>
 *   <li><b>Q8</b> 부가세 가드: tax_amount 합 vs expected = 10% × (INCOME − REFUND). 차이 발생 시
 *       {@link TaxIntegrityException} throw → 마감 차단.</li>
 *   <li><b>Q9</b> retry: {@code @Retryable} maxAttempts=3, backoff 30s. 최종 실패 시 status=OPEN 유지.</li>
 *   <li><b>Q6</b> reopen: HQ_ADMIN 만, 사유 ≥ 20자, audit 기록 필수.</li>
 * </ul>
 *
 * <p>트랜잭션 단위는 <b>테넌트별 마감 1건</b> 으로 한정한다. 상위 스케줄러
 * ({@code ErpAutomationScheduler}) 가 테넌트 루프 안에서 본 메서드를 호출하므로, 본 클래스의
 * {@link Transactional} 은 테넌트 1건 작업 단위이다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialPeriodServiceImpl implements FinancialPeriodService {

    /** 부가세율(10%) — 한국 부가가치세 기본율. 변경 시 별도 결재 + 세무사 검토 필요. */
    static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    /** 부가세 가드 허용 오차 (1원). 단순 반올림 차이는 통과시키되 누적 누락은 차단. */
    static final BigDecimal TAX_TOLERANCE = BigDecimal.ONE;

    /** 재오픈 사유 최소 글자수 (Q6). */
    static final int REOPEN_REASON_MIN_LENGTH = 20;

    private final FinancialPeriodRepository financialPeriodRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final AuditLogService auditLogService;

    @Value("${mindgarden.scheduler.financial-close.dry-run:true}")
    private boolean dryRun;

    @Override
    @Transactional(readOnly = true)
    public boolean isPeriodClosed(String tenantId, LocalDate date, PeriodType type) {
        if (tenantId == null || tenantId.isEmpty() || date == null || type == null) {
            return false;
        }
        return financialPeriodRepository
                .findClosedByTenantIdAndDate(tenantId, date, type)
                .isPresent();
    }

    @Override
    @Transactional
    @Retryable(
        value = { Exception.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 30000),
        exclude = { TaxIntegrityException.class, IllegalArgumentException.class,
                    IllegalStateException.class, AccessDeniedException.class }
    )
    public FinancialPeriod closePeriod(String tenantId, LocalDate periodStart, PeriodType type) {
        validateTenantAndDate(tenantId, periodStart, type);

        LocalDate periodEnd = resolvePeriodEnd(periodStart, type);

        // 1) 합산 (테넌트 격리 SQL — status 무관, soft delete 만 제외)
        BigDecimal incomeSum = nullToZero(financialTransactionRepository
                .sumAmountForCloseByType(
                        tenantId, FinancialTransaction.TransactionType.INCOME, periodStart, periodEnd));
        BigDecimal expenseSum = nullToZero(financialTransactionRepository
                .sumAmountForCloseByType(
                        tenantId, FinancialTransaction.TransactionType.EXPENSE, periodStart, periodEnd));
        BigDecimal refundSum = nullToZero(financialTransactionRepository
                .sumRefundForClose(
                        tenantId, periodStart, periodEnd,
                        FinancialTransactionConstants.getRefundSubcategories()));
        BigDecimal taxSum = nullToZero(financialTransactionRepository
                .sumIncomeTaxAmountForClose(tenantId, periodStart, periodEnd));

        BigDecimal netAmount = incomeSum.subtract(expenseSum);

        // 2) 부가세 가드 (Q8) — TaxIntegrityException 은 retry 제외(exclude)
        validateTaxIntegrity(tenantId, incomeSum, refundSum, taxSum);

        // 3) dry-run 분기 (Q7)
        if (dryRun) {
            log.info(
                "[DRY-RUN] would-close period type={} tenantId={} period={}~{} income={} expense={}"
                + " refund={} tax={} net={}",
                type, tenantId, periodStart, periodEnd,
                incomeSum, expenseSum, refundSum, taxSum, netAmount);
            return FinancialPeriod.builder()
                    .tenantId(tenantId)
                    .periodType(type)
                    .periodStart(periodStart)
                    .periodEnd(periodEnd)
                    .status(PeriodStatus.OPEN)
                    .totalIncome(incomeSum)
                    .totalExpense(expenseSum)
                    .netAmount(netAmount)
                    .totalTaxAmount(taxSum)
                    .totalRefund(refundSum)
                    .build();
        }

        // 4) UPSERT (Q4) — 시드 백필 row 가 있으면 UPDATE, 없으면 INSERT.
        FinancialPeriod period = financialPeriodRepository
                .findByTenantIdAndPeriodTypeAndPeriodStart(tenantId, type, periodStart)
                .orElseGet(() -> FinancialPeriod.builder()
                        .tenantId(tenantId)
                        .periodType(type)
                        .periodStart(periodStart)
                        .periodEnd(periodEnd)
                        .status(PeriodStatus.OPEN)
                        .build());

        period.setPeriodEnd(periodEnd);
        period.setTotalIncome(incomeSum);
        period.setTotalExpense(expenseSum);
        period.setNetAmount(netAmount);
        period.setTotalTaxAmount(taxSum);
        period.setTotalRefund(refundSum);
        period.setStatus(PeriodStatus.CLOSED);
        period.setClosedAt(LocalDateTime.now());
        period.setClosedBy(resolveCloser());

        FinancialPeriod saved = financialPeriodRepository.save(period);

        // 5) audit 기록 (Q9 — 마감 결과 추적)
        try {
            auditLogService.log(
                    tenantId,
                    null,
                    "SYSTEM",
                    null,
                    AuditAction.FINANCIAL_PERIOD_CLOSE,
                    "FINANCIAL_PERIOD",
                    saved.getId());
        } catch (Exception auditError) {
            // audit 실패는 마감 자체를 롤백하지 않는다 — 별도 모니터링.
            log.warn("[ErpFinancialClose] audit 기록 실패: tenantId={}, periodId={}, error={}",
                    tenantId, saved.getId(), auditError.getMessage());
        }

        log.info(
            "[ErpFinancialClose] CLOSED type={} tenantId={} period={}~{} income={} expense={}"
            + " net={} version={}",
            type, tenantId, periodStart, periodEnd,
            incomeSum, expenseSum, netAmount, saved.getVersion());
        return saved;
    }

    @Override
    @Transactional
    public FinancialPeriod reopenPeriod(String tenantId, Long periodId, String reason, String reopenedBy) {
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("tenantId 는 필수입니다.");
        }
        if (periodId == null) {
            throw new IllegalArgumentException("periodId 는 필수입니다.");
        }
        if (reason == null || reason.trim().length() < REOPEN_REASON_MIN_LENGTH) {
            throw new IllegalArgumentException(
                    "재오픈 사유는 " + REOPEN_REASON_MIN_LENGTH + "자 이상 입력해야 합니다.");
        }
        if (reopenedBy == null || reopenedBy.isEmpty()) {
            throw new AccessDeniedException("재오픈 호출자(HQ_ADMIN) 식별자가 필요합니다.");
        }

        FinancialPeriod period = financialPeriodRepository.findById(periodId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "마감 기간을 찾을 수 없습니다: id=" + periodId));

        // 멀티테넌트 격리 — 다른 테넌트 의 row 재오픈 차단
        if (!tenantId.equals(period.getTenantId())) {
            throw new AccessDeniedException(
                    "다른 테넌트의 마감 기간은 재오픈할 수 없습니다.");
        }

        if (period.getStatus() != PeriodStatus.CLOSED) {
            throw new IllegalStateException(
                    "CLOSED 상태가 아닌 기간은 재오픈할 수 없습니다: 현재 status=" + period.getStatus());
        }

        period.setStatus(PeriodStatus.REOPENED);
        period.setReopenedAt(LocalDateTime.now());
        period.setReopenedBy(reopenedBy);
        period.setReopenReason(reason.trim());

        FinancialPeriod saved = financialPeriodRepository.save(period);

        // audit 기록 (Q6 필수)
        Long actorUserId = parseLongOrNull(reopenedBy);
        auditLogService.log(
                tenantId,
                actorUserId,
                "ADMIN",
                null,
                AuditAction.FINANCIAL_PERIOD_REOPEN,
                "FINANCIAL_PERIOD",
                saved.getId());

        log.info("[ErpFinancialClose] REOPENED tenantId={} periodId={} reopenedBy={} reasonLen={}",
                tenantId, saved.getId(), reopenedBy, reason.trim().length());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialPeriod getPeriodStatus(String tenantId, LocalDate date, PeriodType type) {
        if (tenantId == null || tenantId.isEmpty() || date == null || type == null) {
            return null;
        }
        // 1) 닫힌 기간 우선 조회
        Optional<FinancialPeriod> closed = financialPeriodRepository
                .findClosedByTenantIdAndDate(tenantId, date, type);
        if (closed.isPresent()) {
            return closed.get();
        }
        // 2) OPEN 기간 (시드 백필) 조회
        LocalDate start = type == PeriodType.MONTH ? date.withDayOfMonth(1) : date;
        return financialPeriodRepository
                .findByTenantIdAndPeriodTypeAndPeriodStart(tenantId, type, start)
                .orElse(null);
    }

    // ===== 내부 헬퍼 =====

    private void validateTenantAndDate(String tenantId, LocalDate periodStart, PeriodType type) {
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("tenantId 는 필수입니다.");
        }
        if (periodStart == null) {
            throw new IllegalArgumentException("periodStart 는 필수입니다.");
        }
        if (type == null) {
            throw new IllegalArgumentException("PeriodType 은 필수입니다.");
        }
    }

    private LocalDate resolvePeriodEnd(LocalDate periodStart, PeriodType type) {
        switch (type) {
            case DAY:
                return periodStart;
            case WEEK:
                return periodStart.plus(6, ChronoUnit.DAYS);
            case MONTH:
                return YearMonth.from(periodStart).atEndOfMonth();
            default:
                throw new IllegalArgumentException("지원하지 않는 PeriodType: " + type);
        }
    }

    /**
     * Q8 부가세 정합성 검증.
     *
     * <p>expected_tax = 10% × (INCOME 합 − REFUND 합).
     * 실제 누적 tax_amount 와의 차이가 {@link #TAX_TOLERANCE} (=1원) 초과면 마감 차단.</p>
     */
    private void validateTaxIntegrity(
            String tenantId, BigDecimal incomeSum, BigDecimal refundSum, BigDecimal taxSum) {
        BigDecimal taxableBase = incomeSum.subtract(refundSum);
        BigDecimal expectedTax = taxableBase
                .multiply(VAT_RATE)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal actualTax = taxSum.setScale(2, RoundingMode.HALF_UP);
        BigDecimal diff = expectedTax.subtract(actualTax).abs();
        if (diff.compareTo(TAX_TOLERANCE) > 0) {
            log.error(
                "[ErpFinancialClose][Q8] 부가세 누적 차이 감지: tenantId={} income={} refund={}"
                + " expectedTax={} actualTax={} diff={}",
                tenantId, incomeSum, refundSum, expectedTax, actualTax, diff);
            throw new TaxIntegrityException(tenantId, expectedTax, actualTax);
        }
    }

    private String resolveCloser() {
        // SYSTEM cron 기본. 어드민 수동 마감 화면 추가 시 SecurityContext 또는 인자로 주입 예정.
        return "SYSTEM";
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static Long parseLongOrNull(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
