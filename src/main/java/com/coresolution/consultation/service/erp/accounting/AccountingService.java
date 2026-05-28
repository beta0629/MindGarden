package com.coresolution.consultation.service.erp.accounting;

import com.coresolution.consultation.dto.AccountTypeForJournalDto;
import com.coresolution.consultation.dto.erp.accounting.AccountingEntryDetailDto;
import com.coresolution.consultation.dto.erp.accounting.AccountingEntryListDto;
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
     * 분개 생성.
     * <p>
     * 응답 직렬화 시 {@link AccountingEntry#getLines()} LAZY 컬렉션 접근으로
     * {@code LazyInitializationException} 이 발생하지 않도록 트랜잭션 경계 안에서
     * DTO 로 매핑하여 반환한다. 변경계 GET sweep (PR #19) 과 동일 패턴.
     *
     * @param tenantId 테넌트 ID (필수)
     * @param entry    분개 엔티티 (요청 변환 결과)
     * @param lines    분개 라인 목록
     * @return 생성된 분개 상세 DTO (라인 포함)
     */
    AccountingEntryDetailDto createJournalEntry(String tenantId, AccountingEntry entry,
            List<JournalEntryLine> lines);

    /**
     * 분개 승인.
     * <p>
     * 응답 직렬화 시 LAZY 회피를 위해 트랜잭션 경계 안에서 DTO 로 매핑한다.
     *
     * @param tenantId   테넌트 ID (필수)
     * @param entryId    분개 ID
     * @param approverId 승인자 ID (null 허용 — 자동승인)
     * @param comment    승인 코멘트
     * @return 승인된 분개 상세 DTO (라인 포함)
     */
    AccountingEntryDetailDto approveJournalEntry(String tenantId, Long entryId, Long approverId,
            String comment);

    /**
     * 분개 전기 (원장 자동 생성).
     * <p>
     * 응답 직렬화 시 LAZY 회피를 위해 트랜잭션 경계 안에서 DTO 로 매핑한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @param entryId  분개 ID
     * @return 전기된 분개 상세 DTO (라인 포함)
     */
    AccountingEntryDetailDto postJournalEntry(String tenantId, Long entryId);
    
    /**
     * 분개 목록 조회.
     * <p>
     * 응답 직렬화 시 {@link AccountingEntry#getLines()} LAZY 컬렉션 접근으로
     * {@code LazyInitializationException} 이 발생하지 않도록 트랜잭션 경계 안에서
     * DTO 로 매핑하여 반환한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return 분개 목록 DTO (라인 포함)
     */
    List<AccountingEntryListDto> getJournalEntries(String tenantId);

    /**
     * 분개 상세 조회.
     * <p>
     * 응답 직렬화 시 LAZY 회피를 위해 트랜잭션 경계 안에서 DTO 로 매핑한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @param entryId  분개 ID
     * @return 분개 상세 DTO
     */
    AccountingEntryDetailDto getJournalEntry(String tenantId, Long entryId);
    
    /**
     * FinancialTransaction에서 분개 자동 생성
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    AccountingEntry createJournalEntryFromTransaction(FinancialTransaction transaction);
    
    /**
     * 분개 수정 (DRAFT 상태에서만 가능).
     * <p>
     * 응답 직렬화 시 LAZY 회피를 위해 트랜잭션 경계 안에서 DTO 로 매핑한다.
     *
     * @param tenantId 테넌트 ID (필수)
     * @param entryId  분개 ID (DRAFT 상태여야 함)
     * @param entry    수정할 분개 엔티티 (요청 변환 결과)
     * @param lines    교체할 분개 라인 목록
     * @return 수정된 분개 상세 DTO (라인 포함)
     */
    AccountingEntryDetailDto updateJournalEntry(String tenantId, Long entryId,
            AccountingEntry entry, List<JournalEntryLine> lines);

    /**
     * INCOME 거래 백필: 해당 테넌트의 financial_transactions(INCOME, 미삭제)에 대해 분개가 없으면 생성.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return processedCount(처리 건수), failedCount(실패 건수), skippedCount(이미 분개 있음 스킵 건수)
     */
    Map<String, Long> backfillJournalEntriesFromIncomeTransactions(String tenantId);

    /**
     * 테넌트별 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH, LIABILITY, VAT_PAYABLE, WITHHOLDING_PAYABLE) 계정 매핑이 없으면 기본 계정 및 공통코드 시딩.
     * 온보딩 시 호출되며, 이미 있으면 스킵.
     *
     * @param tenantId 테넌트 ID (필수)
     */
    void ensureErpAccountMappingForTenant(String tenantId);

    /**
     * 분개용 계정과목 목록 조회. CommonCode(ERP_ACCOUNT_TYPE) + extraData.accountId 기반.
     * 빈 목록이면 빈 리스트 반환.
     *
     * @param tenantId 테넌트 ID (필수)
     * @return accountId, label, codeValue 목록
     */
    List<AccountTypeForJournalDto> getAccountTypesForJournal(String tenantId);
}

