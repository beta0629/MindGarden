package com.coresolution.consultation.repository.erp.financial;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link FinancialPeriod} Repository — 재무 마감 기간 SSOT 조회/저장.
 *
 * <p>모든 쿼리에 {@code tenantId} 를 포함한다 (멀티테넌트 격리 표준).
 * tenantId 없이 조회하는 deprecated 메서드는 본 인터페이스에 추가하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Repository
public interface FinancialPeriodRepository extends JpaRepository<FinancialPeriod, Long> {

    /**
     * 테넌트 + 기간 단위 + 기간 시작일로 마감 기간 1행 조회.
     *
     * <p>UNIQUE 키 (tenant_id, period_type, period_start) 기반 — closePeriod 시 UPSERT 진입점.</p>
     *
     * @param tenantId 테넌트 ID (NOT NULL — 멀티테넌트 격리)
     * @param periodType 기간 단위 (DAY/WEEK/MONTH)
     * @param periodStart 기간 시작일 (포함)
     * @return 마감 기간 Optional
     */
    Optional<FinancialPeriod> findByTenantIdAndPeriodTypeAndPeriodStart(
            String tenantId, PeriodType periodType, LocalDate periodStart);

    /**
     * 특정 날짜를 포함하는 닫힌(CLOSED 또는 REOPENED) 기간 조회 — 거래 수정 가드용.
     *
     * <p>{@code FinancialTransactionServiceImpl.updateTransaction/deleteTransaction} 진입부에서
     * 거래일자가 닫힌 기간에 속하는지 판단하는 데 사용한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param date 거래일자 또는 검사 대상일
     * @param periodType 기간 단위 (보통 DAY)
     * @return 매칭되는 닫힌 기간 Optional (없으면 empty)
     */
    @Query("SELECT fp FROM FinancialPeriod fp "
            + "WHERE fp.tenantId = :tenantId "
            + "AND fp.periodType = :periodType "
            + "AND fp.status IN (com.coresolution.consultation.entity.erp.financial.PeriodStatus.CLOSED, "
            + "                  com.coresolution.consultation.entity.erp.financial.PeriodStatus.REOPENED) "
            + "AND :date BETWEEN fp.periodStart AND fp.periodEnd")
    Optional<FinancialPeriod> findClosedByTenantIdAndDate(
            @Param("tenantId") String tenantId,
            @Param("date") LocalDate date,
            @Param("periodType") PeriodType periodType);

    /**
     * 테넌트 + 기간 범위 내 OPEN 상태 기간 목록 — 라이브 합산 대상 식별용.
     *
     * <p>{@code FinancialStatementServiceImpl} (Q5) 가 닫힌 기간은 스냅샷, 미마감 기간은 라이브 합산
     * 으로 분리할 때 사용. 본 메서드는 OPEN 상태(즉, 라이브 대상)만 반환한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param from 시작일 (포함)
     * @param to 종료일 (포함)
     * @return OPEN 상태 기간 목록
     */
    @Query("SELECT fp FROM FinancialPeriod fp "
            + "WHERE fp.tenantId = :tenantId "
            + "AND fp.status = com.coresolution.consultation.entity.erp.financial.PeriodStatus.OPEN "
            + "AND fp.periodEnd >= :from "
            + "AND fp.periodStart <= :to "
            + "ORDER BY fp.periodStart ASC")
    List<FinancialPeriod> findOpenByTenantIdAndDateRange(
            @Param("tenantId") String tenantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * 테넌트 + 기간 범위 내 닫힌(CLOSED/REOPENED) 기간 목록 — Q5 스냅샷 합산용.
     *
     * @param tenantId 테넌트 ID
     * @param from 시작일 (포함)
     * @param to 종료일 (포함)
     * @param periodType 기간 단위
     * @return 닫힌 기간 목록
     */
    @Query("SELECT fp FROM FinancialPeriod fp "
            + "WHERE fp.tenantId = :tenantId "
            + "AND fp.periodType = :periodType "
            + "AND fp.status IN (com.coresolution.consultation.entity.erp.financial.PeriodStatus.CLOSED, "
            + "                  com.coresolution.consultation.entity.erp.financial.PeriodStatus.REOPENED) "
            + "AND fp.periodEnd >= :from "
            + "AND fp.periodStart <= :to "
            + "ORDER BY fp.periodStart ASC")
    List<FinancialPeriod> findClosedByTenantIdAndDateRange(
            @Param("tenantId") String tenantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("periodType") PeriodType periodType);
}
