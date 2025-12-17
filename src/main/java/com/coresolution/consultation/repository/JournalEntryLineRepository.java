package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.JournalEntryLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 분개 상세 라인 Repository
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, Long> {
    
    /**
     * 분개별 라인 목록 조회
     */
    @Query("SELECT l FROM JournalEntryLine l WHERE l.journalEntry.id = :journalEntryId AND l.isDeleted = false ORDER BY l.lineNumber")
    List<JournalEntryLine> findByJournalEntryId(@Param("journalEntryId") Long journalEntryId);
    
    /**
     * 테넌트별 계정별 라인 조회 (원장 생성용)
     */
    @Query("SELECT l FROM JournalEntryLine l WHERE l.tenantId = :tenantId AND l.accountId = :accountId AND l.journalEntry.entryStatus = 'POSTED' AND l.isDeleted = false")
    List<JournalEntryLine> findByTenantIdAndAccountIdAndPosted(@Param("tenantId") String tenantId, @Param("accountId") Long accountId);
}

