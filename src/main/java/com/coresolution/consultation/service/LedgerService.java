package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.Ledger;

import java.time.LocalDate;
import java.util.List;

/**
 * 원장 Service 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface LedgerService {
    
    /**
     * 분개 전기 시 원장 자동 생성/업데이트
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    void updateLedgerFromJournalEntry(String tenantId, Long accountId, LocalDate entryDate, 
                                      java.math.BigDecimal debitAmount, java.math.BigDecimal creditAmount);
    
    /**
     * 계정별 원장 조회
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    List<Ledger> getLedgersByAccount(String tenantId, Long accountId);
    
    /**
     * 기간별 원장 조회
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    List<Ledger> getLedgersByPeriod(String tenantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 계정 잔액 조회
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    java.math.BigDecimal getAccountBalance(String tenantId, Long accountId, LocalDate asOfDate);
}

