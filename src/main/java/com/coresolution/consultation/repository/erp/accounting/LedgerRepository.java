package com.coresolution.consultation.repository.erp.accounting;

import com.coresolution.consultation.entity.erp.accounting.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 원장 Repository
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Repository
public interface LedgerRepository extends JpaRepository<Ledger, Long> {
    
    /**
     * 테넌트별 계정별 원장 조회 (Account JOIN FETCH로 LazyInitializationException 방지)
     */
    @Query("SELECT l FROM Ledger l JOIN FETCH l.account WHERE l.tenantId = :tenantId AND l.account.id = :accountId ORDER BY l.periodStart DESC")
    List<Ledger> findByTenantIdAndAccountId(@Param("tenantId") String tenantId, @Param("accountId") Long accountId);
    
    /**
     * 테넌트별 기간별 원장 조회 (요청 기간과 겹치는 원장 포함).
     * 원장은 월 단위(periodEnd=월 말일)이므로, 요청이 당월 1일~오늘이어도 해당 월 원장이 조회되도록
     * periodStart <= endDate AND periodEnd >= startDate 조건 사용.
     */
    @Query("SELECT DISTINCT l FROM Ledger l JOIN FETCH l.account WHERE l.tenantId = :tenantId AND l.periodStart <= :endDate AND l.periodEnd >= :startDate ORDER BY l.account.id, l.periodStart")
    List<Ledger> findByTenantIdAndPeriod(@Param("tenantId") String tenantId,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);
    
    /**
     * 테넌트별 계정별 기간별 원장 조회 (유니크)
     */
    @Query("SELECT l FROM Ledger l JOIN FETCH l.account WHERE l.tenantId = :tenantId AND l.account.id = :accountId AND l.periodStart = :periodStart AND l.periodEnd = :periodEnd")
    Optional<Ledger> findByTenantIdAndAccountIdAndPeriod(@Param("tenantId") String tenantId,
                                                          @Param("accountId") Long accountId,
                                                          @Param("periodStart") LocalDate periodStart,
                                                          @Param("periodEnd") LocalDate periodEnd);
    
    /**
     * 테넌트별 계정별 최신 원장 조회 (기간 종료일 기준)
     */
    @Query("SELECT l FROM Ledger l JOIN FETCH l.account WHERE l.tenantId = :tenantId AND l.account.id = :accountId ORDER BY l.periodEnd DESC")
    List<Ledger> findLatestByTenantIdAndAccountId(@Param("tenantId") String tenantId, @Param("accountId") Long accountId);
}

