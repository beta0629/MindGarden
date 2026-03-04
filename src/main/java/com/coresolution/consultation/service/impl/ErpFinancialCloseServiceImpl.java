package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.YearMonth;

import com.coresolution.consultation.service.erp.ErpFinancialCloseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ERP 재무 마감 서비스 구현체 (스텁)
 * 정기 일/주/월 마감 로직은 추후 PL/SQL 또는 집계 서비스 연동 시 구현.
 *
 * @author CoreSolution
 * @since 2026-03-04
 */
@Slf4j
@Service
public class ErpFinancialCloseServiceImpl implements ErpFinancialCloseService {

    @Override
    public void performDailyClose(String tenantId, LocalDate targetDate) {
        log.debug("[ErpFinancialClose] 일 마감 스텁 실행: tenantId={}, targetDate={}", tenantId, targetDate);
    }

    @Override
    public void performWeeklyClose(String tenantId, LocalDate weekEndDate) {
        log.debug("[ErpFinancialClose] 주 마감 스텁 실행: tenantId={}, weekEndDate={}", tenantId, weekEndDate);
    }

    @Override
    public void performMonthlyClose(String tenantId, YearMonth yearMonth) {
        log.debug("[ErpFinancialClose] 월 마감 스텁 실행: tenantId={}, yearMonth={}", tenantId, yearMonth);
    }
}
