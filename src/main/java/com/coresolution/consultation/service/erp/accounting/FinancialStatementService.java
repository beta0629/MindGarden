package com.coresolution.consultation.service.erp.accounting;

import java.time.LocalDate;
import java.util.Map;

/**
 * 재무제표 Service 인터페이스
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
public interface FinancialStatementService {
    
    /**
     * 손익계산서 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    Map<String, Object> generateIncomeStatement(String tenantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 재무상태표 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    Map<String, Object> generateBalanceSheet(String tenantId, LocalDate asOfDate);
    
    /**
     * 현금흐름표 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    Map<String, Object> generateCashFlowStatement(String tenantId, LocalDate startDate, LocalDate endDate);
}

