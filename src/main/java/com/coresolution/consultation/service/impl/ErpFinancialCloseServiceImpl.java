package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.YearMonth;

import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.exception.TaxIntegrityException;
import com.coresolution.consultation.service.erp.ErpFinancialCloseService;
import com.coresolution.consultation.service.erp.FinancialPeriodService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ERP 재무 마감 서비스 구현체 (P0-2 PR-B 실구현).
 *
 * <p>합의서 §2 / §4.1: 일/월 마감은 {@link FinancialPeriodService#closePeriod} 로 위임,
 * 주 마감(Q1 default)은 dry-run 로그만 출력하고 별도 결재 시 활성화한다.</p>
 *
 * <p>본 클래스는 단일 테넌트 1건 마감을 담당하며, 다 테넌트 루프는 상위
 * {@code ErpAutomationScheduler} 의 {@code runPerTenant} 가 책임진다.</p>
 *
 * @author CoreSolution
 * @since 2026-03-04
 * @updated 2026-06-06 PR-B 실구현 (Q1~Q9 default 수용)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ErpFinancialCloseServiceImpl implements ErpFinancialCloseService {

    private final FinancialPeriodService financialPeriodService;

    @Override
    public void performDailyClose(String tenantId, LocalDate targetDate) {
        log.info("[ErpFinancialClose] 일 마감 진입: tenantId={}, targetDate={}", tenantId, targetDate);
        try {
            financialPeriodService.closePeriod(tenantId, targetDate, PeriodType.DAY);
        } catch (TaxIntegrityException e) {
            // Q8 부가세 가드 — 데이터 보정 필요(운영 runbook §P1-B). 테넌트 격리: throw 하지 않고 WARN.
            log.warn(
                "[ErpFinancialClose][Q8] 부가세 가드 위반으로 일 마감 차단(데이터 보정 필요): tenantId={} targetDate={}"
                + " expected={} actual={} diff={}",
                tenantId, targetDate, e.getExpected(), e.getActual(),
                e.getExpected().subtract(e.getActual()).abs());
        } catch (Exception e) {
            // Q9: retry 3회 소진 후에도 실패 시 status=OPEN 유지 (FinancialPeriodServiceImpl 내부)
            log.error("[ErpFinancialClose] 일 마감 실패(retry 소진): tenantId={} targetDate={} error={}",
                    tenantId, targetDate, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public void performWeeklyClose(String tenantId, LocalDate weekEndDate) {
        // Q1 default: 한국 회계 관행상 보편적이지 않음 → 시그니처/스케줄러만 유지하고 dry-run 로그만 출력.
        // 별도 결재 후 본 메서드를 closePeriod(WEEK) 호출로 교체할 것.
        log.info(
            "[ErpFinancialClose][Q1-default] 주 마감 dry-run only: tenantId={} weekEndDate={}"
            + " (별도 결재 후 활성화 예정)",
            tenantId, weekEndDate);
    }

    @Override
    public void performMonthlyClose(String tenantId, YearMonth yearMonth) {
        LocalDate periodStart = yearMonth.atDay(1);
        log.info("[ErpFinancialClose] 월 마감 진입: tenantId={}, yearMonth={}", tenantId, yearMonth);
        try {
            financialPeriodService.closePeriod(tenantId, periodStart, PeriodType.MONTH);
        } catch (TaxIntegrityException e) {
            log.warn(
                "[ErpFinancialClose][Q8] 부가세 가드 위반으로 월 마감 차단(데이터 보정 필요): tenantId={} yearMonth={}"
                + " expected={} actual={} diff={}",
                tenantId, yearMonth, e.getExpected(), e.getActual(),
                e.getExpected().subtract(e.getActual()).abs());
        } catch (Exception e) {
            log.error("[ErpFinancialClose] 월 마감 실패(retry 소진): tenantId={} yearMonth={} error={}",
                    tenantId, yearMonth, e.getMessage(), e);
            throw e;
        }
    }
}
