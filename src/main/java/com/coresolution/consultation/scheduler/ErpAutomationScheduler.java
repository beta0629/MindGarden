package com.coresolution.consultation.scheduler;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.consultation.service.PlSqlFinancialService;
import com.coresolution.consultation.service.erp.ErpFinancialCloseService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * ERP 자동화 스케줄러 (Phase 3-1 ~ 3-4)
 * 정기 일/주/월 마감, 재무제표·보고서 생성, 정산 배치, 원장 동기화, 통합 재무 갱신, 매핑 동기화.
 * docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md 기준.
 *
 * @author CoreSolution
 * @since 2026-03-04
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.erp-automation.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class ErpAutomationScheduler {

    private static final DateTimeFormatter YYYYMM = DateTimeFormatter.ofPattern("yyyyMM");

    private final TenantService tenantService;
    private final ErpFinancialCloseService erpFinancialCloseService;
    private final FinancialStatementService financialStatementService;
    private final ErpService erpService;
    private final SettlementService settlementService;
    private final PlSqlFinancialService plSqlFinancialService;
    private final PlSqlMappingSyncService plSqlMappingSyncService;

    /**
     * 정기 일 마감(재무) — 매일 00:10 (일별 통계 00:01 이후)
     */
    @Scheduled(cron = "${scheduler.erp-daily-close.cron:0 10 0 * * *}")
    public void scheduleDailyFinancialClose() {
        LocalDate targetDate = LocalDate.now().minusDays(1);
        runPerTenant("DailyFinancialClose", targetDate.toString(),
            () -> erpFinancialCloseService.performDailyClose(TenantContextHolder.getTenantId(), targetDate));
    }

    /**
     * 정기 월 마감(재무) — 매월 1일 00:20
     */
    @Scheduled(cron = "${scheduler.erp-monthly-close.cron:0 20 0 1 * *}")
    public void scheduleMonthlyFinancialClose() {
        YearMonth prevMonth = YearMonth.now().minusMonths(1);
        runPerTenant("MonthlyFinancialClose", prevMonth.toString(),
            () -> erpFinancialCloseService.performMonthlyClose(TenantContextHolder.getTenantId(), prevMonth));
    }

    /**
     * 재무제표 생성 — 매월 1일 00:25 (전월 기준 대차/손익/캐시플로우)
     */
    @Scheduled(cron = "${scheduler.erp-financial-statement.cron:0 25 0 1 * *}")
    public void scheduleFinancialStatementGeneration() {
        YearMonth prevMonth = YearMonth.now().minusMonths(1);
        LocalDate periodEnd = prevMonth.atEndOfMonth();
        LocalDate periodStart = prevMonth.atDay(1);
        runPerTenant("FinancialStatement", prevMonth.toString(), () -> {
            String tenantId = TenantContextHolder.getTenantId();
            try {
                financialStatementService.generateBalanceSheet(tenantId, periodEnd);
                financialStatementService.generateIncomeStatement(tenantId, periodStart, periodEnd);
                financialStatementService.generateCashFlowStatement(tenantId, periodStart, periodEnd);
                log.debug("[ErpAutomation] 재무제표 생성 완료: tenantId={}", tenantId);
            } catch (Exception e) {
                log.warn("[ErpAutomation] 재무제표 생성 실패: tenantId={}, error={}", tenantId, e.getMessage());
            }
        });
    }

    /**
     * 재무 보고서(일) 생성 — 매일 01:05 (전일 기준)
     */
    @Scheduled(cron = "${scheduler.erp-daily-report.cron:0 5 1 * * *}")
    public void scheduleDailyReportGeneration() {
        String reportDate = LocalDate.now().minusDays(1).toString();
        runPerTenant("DailyReport", reportDate, () -> {
            try {
                erpService.getDailyFinanceReport(reportDate, null);
                log.debug("[ErpAutomation] 일보 생성 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 일보 생성 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }

    /**
     * 재무 보고서(월) 생성 — 매월 1일 00:10 (전월 기준)
     */
    @Scheduled(cron = "${scheduler.erp-monthly-report.cron:0 10 0 1 * *}")
    public void scheduleMonthlyReportGeneration() {
        YearMonth prev = YearMonth.now().minusMonths(1);
        String year = String.valueOf(prev.getYear());
        String month = String.valueOf(prev.getMonthValue());
        runPerTenant("MonthlyReport", year + "-" + month, () -> {
            try {
                erpService.getMonthlyFinanceReport(year, month, null);
                log.debug("[ErpAutomation] 월보 생성 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 월보 생성 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }

    /**
     * 재무 보고서(년) 생성 — 매년 1월 1일 00:15 (전년 기준)
     */
    @Scheduled(cron = "${scheduler.erp-yearly-report.cron:0 15 0 1 1 *}")
    public void scheduleYearlyReportGeneration() {
        String year = String.valueOf(LocalDate.now().getYear() - 1);
        runPerTenant("YearlyReport", year, () -> {
            try {
                erpService.getYearlyFinanceReport(year);
                log.debug("[ErpAutomation] 연보 생성 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 연보 생성 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }

    /**
     * 정기 주 마감(재무) — 매주 월요일 00:15 (전주 종료일 기준)
     */
    @Scheduled(cron = "${scheduler.erp-weekly-close.cron:0 15 0 * * MON}")
    public void scheduleWeeklyFinancialClose() {
        final LocalDate weekEnd = LocalDate.now().minusWeeks(1).with(java.time.DayOfWeek.SUNDAY);
        runPerTenant("WeeklyFinancialClose", weekEnd.toString(),
            () -> erpFinancialCloseService.performWeeklyClose(TenantContextHolder.getTenantId(), weekEnd));
    }

    /**
     * 정산 배치 — 매월 1일 03:00 (전월 데이터 기준)
     */
    @Scheduled(cron = "${scheduler.erp-settlement.cron:0 0 3 1 * *}")
    public void scheduleSettlementBatch() {
        String period = YearMonth.now().minusMonths(1).format(YYYYMM);
        runPerTenant("SettlementBatch", period, () -> {
            String tenantId = TenantContextHolder.getTenantId();
            try {
                settlementService.calculateSettlement(tenantId, period);
                log.info("[ErpAutomation] 정산 배치 완료: tenantId={}, period={}", tenantId, period);
            } catch (IllegalStateException e) {
                if (e.getMessage() != null && e.getMessage().contains("이미 정산이 생성된 기간")) {
                    log.debug("[ErpAutomation] 정산 이미 존재: tenantId={}, period={}", tenantId, period);
                } else {
                    log.warn("[ErpAutomation] 정산 배치 실패: tenantId={}, period={}, error={}",
                        tenantId, period, e.getMessage());
                }
            } catch (Exception e) {
                log.warn("[ErpAutomation] 정산 배치 실패: tenantId={}, period={}, error={}",
                    tenantId, period, e.getMessage());
            }
        });
    }

    /**
     * 원장 동기화 — 매일 00:30 (경량 로직 또는 스텁)
     */
    @Scheduled(cron = "${scheduler.erp-ledger-sync.cron:0 30 0 * * *}")
    public void scheduleLedgerSync() {
        LocalDate targetDate = LocalDate.now().minusDays(1);
        runPerTenant("LedgerSync", targetDate.toString(),
            () -> log.debug("[ErpAutomation] 원장 동기화 스텁: tenantId={}, targetDate={}",
                TenantContextHolder.getTenantId(), targetDate));
    }

    /**
     * HQ/지점 통합 재무 갱신 — 매일 04:00 (전일 기준 캐시/스냅샷 갱신)
     */
    @Scheduled(cron = "${scheduler.erp-consolidated-refresh.cron:0 0 4 * * *}")
    public void scheduleConsolidatedFinancialRefresh() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        runPerTenant("ConsolidatedFinancialRefresh", yesterday.toString(), () -> {
            try {
                plSqlFinancialService.getConsolidatedFinancialData(yesterday, yesterday);
                plSqlFinancialService.getBranchFinancialBreakdown(yesterday, yesterday);
                log.debug("[ErpAutomation] 통합 재무 갱신 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 통합 재무 갱신 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }

    /**
     * 매핑 일괄 동기화(선택) — 매일 01:00
     */
    @Scheduled(cron = "${scheduler.erp-mapping-sync.cron:0 0 1 * * *}")
    public void scheduleMappingSync() {
        runPerTenant("MappingSync", "syncAll", () -> {
            try {
                plSqlMappingSyncService.syncAllMappings();
                log.debug("[ErpAutomation] 매핑 동기화 완료: tenantId={}", TenantContextHolder.getTenantId());
            } catch (Exception e) {
                log.warn("[ErpAutomation] 매핑 동기화 실패: tenantId={}, error={}",
                    TenantContextHolder.getTenantId(), e.getMessage());
            }
        });
    }

    private void runPerTenant(String jobName, String jobParam, Runnable runnable) {
        List<String> tenantIds = tenantService.getAllActiveTenantIds();
        log.info("[ErpAutomation] {} 시작: param={}, tenants={}", jobName, jobParam, tenantIds.size());
        for (String tenantId : tenantIds) {
            try {
                TenantContextHolder.setTenantId(tenantId);
                runnable.run();
            } catch (Exception e) {
                log.error("[ErpAutomation] {} 실패: tenantId={}, error={}", jobName, tenantId, e.getMessage(), e);
            } finally {
                TenantContextHolder.clear();
            }
        }
        log.info("[ErpAutomation] {} 완료: param={}", jobName, jobParam);
    }
}
