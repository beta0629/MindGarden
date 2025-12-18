package com.coresolution.consultation.service.erp.accounting;

import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;

import java.util.List;

/**
 * 회계 Service 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface AccountingService {
    
    /**
     * 분개 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry createJournalEntry(String tenantId, AccountingEntry entry, List<com.coresolution.consultation.entity.JournalEntryLine> lines);
    
    /**
     * 분개 승인
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry approveJournalEntry(String tenantId, Long entryId, Long approverId, String comment);
    
    /**
     * 분개 전기 (원장 자동 생성)
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry postJournalEntry(String tenantId, Long entryId);
    
    /**
     * 분개 목록 조회
     */
    List<AccountingEntry> getJournalEntries(String tenantId);
    
    /**
     * 분개 상세 조회
     */
    AccountingEntry getJournalEntry(String tenantId, Long entryId);
    
    /**
     * FinancialTransaction에서 분개 자동 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry createJournalEntryFromTransaction(com.coresolution.consultation.entity.FinancialTransaction transaction);
    
    /**
     * 분개 수정 (DRAFT 상태에서만 가능)
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry updateJournalEntry(String tenantId, Long entryId, AccountingEntry entry, List<com.coresolution.consultation.entity.JournalEntryLine> lines);
}

