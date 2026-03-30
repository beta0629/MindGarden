package com.coresolution.consultation.repository.erp.accounting;

import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 분개 Repository
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Repository
public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, Long> {
    
    /**
     * 테넌트별 분개 목록 조회
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.isDeleted = false ORDER BY e.entryDate DESC, e.entryNumber DESC")
    List<AccountingEntry> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 테넌트별 분개 번호로 조회
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.entryNumber = :entryNumber AND e.isDeleted = false")
    Optional<AccountingEntry> findByTenantIdAndEntryNumber(@Param("tenantId") String tenantId, @Param("entryNumber") String entryNumber);
    
    /**
     * 테넌트별 기간별 분개 조회
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.entryDate >= :startDate AND e.entryDate <= :endDate AND e.isDeleted = false ORDER BY e.entryDate DESC")
    List<AccountingEntry> findByTenantIdAndPeriod(@Param("tenantId") String tenantId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);
    
    /**
     * 테넌트별 연도별 최대 시퀀스 조회 (분개 번호 생성용)
     */
    @Query("SELECT MAX(CAST(SUBSTRING(e.entryNumber, LENGTH(e.entryNumber) - 3) AS int)) FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.entryNumber LIKE :pattern")
    Integer findMaxSequenceByTenantIdAndYear(@Param("tenantId") String tenantId, @Param("pattern") String pattern);
    
    /**
     * 테넌트별 전기된 분개 조회 (원장 생성용)
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.entryStatus = 'POSTED' AND e.isDeleted = false ORDER BY e.entryDate, e.entryNumber")
    List<AccountingEntry> findPostedEntriesByTenantId(@Param("tenantId") String tenantId);

    /**
     * 테넌트별 분개 ID 조회 (tenant_id WHERE 조건으로 격리 보장)
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.id = :id AND e.isDeleted = false")
    Optional<AccountingEntry> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);

    /**
     * financial_transaction_id로 분개 조회 (중복 방지용)
     */
    @Query("SELECT e FROM AccountingEntry e WHERE e.tenantId = :tenantId AND e.financialTransactionId = :financialTransactionId AND e.isDeleted = false")
    Optional<AccountingEntry> findByTenantIdAndFinancialTransactionId(@Param("tenantId") String tenantId,
            @Param("financialTransactionId") Long financialTransactionId);
}

