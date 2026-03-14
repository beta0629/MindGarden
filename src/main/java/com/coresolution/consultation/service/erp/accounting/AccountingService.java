package com.coresolution.consultation.service.erp.accounting;

import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

import java.util.List;
import java.util.Map;

/**
 * 회계 Service 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface AccountingService {
    
    /**
     * 분개 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry createJournalEntry(String tenantId, AccountingEntry entry, List<JournalEntryLine> lines);
    
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
    AccountingEntry createJournalEntryFromTransaction(FinancialTransaction transaction);
    
    /**
     * 분개 수정 (DRAFT 상태에서만 가능)
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry updateJournalEntry(String tenantId, Long entryId, AccountingEntry entry, List<JournalEntryLine> lines);

    /**
     * INCOME 거래 백필: 해당 테넌트의 financial_transactions(INCOME, 미삭제)에 대해 분개가 없으면 생성.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return processedCount(처리 건수), failedCount(실패 건수), skippedCount(이미 분개 있음 스킵 건수)
     */
    Map<String, Long> backfillJournalEntriesFromIncomeTransactions(String tenantId);

    /**
     * 테넌트별 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH) 계정 매핑이 없으면 기본 계정 및 공통코드 시딩.
     * 온보딩 시 호출되며, 이미 있으면 스킵.
     *
     * @param tenantId 테넌트 ID (필수)
     */
    void ensureErpAccountMappingForTenant(String tenantId);
}

