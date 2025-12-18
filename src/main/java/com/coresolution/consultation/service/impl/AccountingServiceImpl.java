package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.erp.accounting.AccountingEntry;
import com.coresolution.consultation.entity.erp.accounting.JournalEntryLine;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.erp.accounting.AccountingEntryRepository;
import com.coresolution.consultation.repository.erp.accounting.JournalEntryLineRepository;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 회계 Service 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountingServiceImpl implements AccountingService {
    
    private final AccountingEntryRepository accountingEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;
    private final LedgerService ledgerService;
    private final CommonCodeService commonCodeService;
    
    @Override
    @Transactional
    public AccountingEntry createJournalEntry(String tenantId, AccountingEntry entry, List<JournalEntryLine> lines) {
        // 0. 테넌트 컨텍스트 검증 (ERP 독립성 보장)
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치: 다른 테넌트의 분개를 생성할 수 없습니다.");
        }
        
        // 1. 차변/대변 합계 계산
        BigDecimal totalDebit = lines.stream()
            .map(JournalEntryLine::getDebitAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCredit = lines.stream()
            .map(JournalEntryLine::getCreditAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 2. 차변/대변 균형 검증
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException(
                String.format("차변/대변 불균형: 차변=%s, 대변=%s", totalDebit, totalCredit)
            );
        }
        
        // 3. 분개 번호 생성 (없으면)
        if (entry.getEntryNumber() == null || entry.getEntryNumber().isEmpty()) {
            entry.setEntryNumber(generateEntryNumber(tenantId));
        }
        
        // 4. 분개 상태 설정
        entry.setEntryStatus(AccountingEntry.EntryStatus.DRAFT);
        entry.setTenantId(tenantId);
        entry.setTotalDebit(totalDebit);
        entry.setTotalCredit(totalCredit);
        
        // 5. 분개 저장
        AccountingEntry savedEntry = accountingEntryRepository.save(entry);
        
        // 6. 분개 상세 라인 저장
        for (int i = 0; i < lines.size(); i++) {
            JournalEntryLine line = lines.get(i);
            line.setJournalEntry(savedEntry);
            line.setTenantId(tenantId);
            line.setLineNumber(i + 1);
            journalEntryLineRepository.save(line);
        }
        
        log.info("분개 생성 완료: tenantId={}, entryNumber={}, totalDebit={}, totalCredit={}", 
            tenantId, savedEntry.getEntryNumber(), totalDebit, totalCredit);
        
        return savedEntry;
    }
    
    @Override
    @Transactional
    public AccountingEntry approveJournalEntry(String tenantId, Long entryId, Long approverId, String comment) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 1. 분개 조회 (테넌트 검증)
        AccountingEntry entry = accountingEntryRepository.findById(entryId)
            .orElseThrow(() -> new IllegalArgumentException("분개를 찾을 수 없습니다: " + entryId));
        
        if (!entry.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("다른 테넌트의 분개입니다.");
        }
        
        // 2. 승인 가능 상태 확인
        if (!entry.isApprovable()) {
            throw new IllegalStateException("승인 가능한 상태가 아닙니다: " + entry.getApprovalStatus());
        }
        
        // 3. 차변/대변 균형 확인
        if (!entry.isBalanced()) {
            throw new IllegalStateException("차변/대변 불균형: 승인할 수 없습니다.");
        }
        
        // 4. 승인 처리
        entry.approve(approverId, comment);
        entry.setEntryStatus(AccountingEntry.EntryStatus.APPROVED);
        
        AccountingEntry savedEntry = accountingEntryRepository.save(entry);
        
        log.info("분개 승인 완료: tenantId={}, entryId={}, entryNumber={}", 
            tenantId, entryId, savedEntry.getEntryNumber());
        
        return savedEntry;
    }
    
    @Override
    @Transactional
    public AccountingEntry postJournalEntry(String tenantId, Long entryId) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 1. 분개 조회 (테넌트 검증)
        AccountingEntry entry = accountingEntryRepository.findById(entryId)
            .orElseThrow(() -> new IllegalArgumentException("분개를 찾을 수 없습니다: " + entryId));
        
        if (!entry.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("다른 테넌트의 분개입니다.");
        }
        
        // 2. 승인 상태 확인
        if (entry.getEntryStatus() != AccountingEntry.EntryStatus.APPROVED) {
            throw new IllegalStateException("승인된 분개만 전기할 수 있습니다: " + entry.getEntryStatus());
        }
        
        // 3. 분개 상세 라인 조회
        List<JournalEntryLine> lines = journalEntryLineRepository.findByJournalEntryId(entryId);
        
        // 4. 원장 자동 생성/업데이트 (각 라인별)
        for (JournalEntryLine line : lines) {
            ledgerService.updateLedgerFromJournalEntry(
                tenantId,
                line.getAccountId(),
                entry.getEntryDate(),
                line.getDebitAmount(),
                line.getCreditAmount()
            );
        }
        
        // 5. 분개 전기 처리
        entry.setEntryStatus(AccountingEntry.EntryStatus.POSTED);
        entry.setPostedAt(LocalDateTime.now());
        
        AccountingEntry savedEntry = accountingEntryRepository.save(entry);
        
        log.info("분개 전기 완료: tenantId={}, entryId={}, entryNumber={}", 
            tenantId, entryId, savedEntry.getEntryNumber());
        
        return savedEntry;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AccountingEntry> getJournalEntries(String tenantId) {
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        return accountingEntryRepository.findByTenantId(tenantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountingEntry getJournalEntry(String tenantId, Long entryId) {
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        AccountingEntry entry = accountingEntryRepository.findById(entryId)
            .orElseThrow(() -> new IllegalArgumentException("분개를 찾을 수 없습니다: " + entryId));
        
        if (!entry.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("다른 테넌트의 분개입니다.");
        }
        
        return entry;
    }
    
    @Override
    @Transactional
    public AccountingEntry createJournalEntryFromTransaction(com.coresolution.consultation.entity.FinancialTransaction transaction) {
        String tenantId = transaction.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("FinancialTransaction에 tenantId가 없어 분개를 생성할 수 없습니다: transactionId={}", transaction.getId());
            return null;
        }
        
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            log.warn("테넌트 ID 불일치: 분개 생성 건너뜀. transactionTenantId={}, currentTenantId={}", tenantId, currentTenantId);
            return null;
        }
        
        try {
            // 1. 거래 유형에 따라 계정 매핑
            // TODO: 계정과목 마스터가 추가되면 동적으로 조회하도록 변경
            // 현재는 기본 계정 매핑 사용
            Long revenueAccountId = getDefaultAccountId(tenantId, "REVENUE"); // 수익 계정
            Long expenseAccountId = getDefaultAccountId(tenantId, "EXPENSE"); // 비용 계정
            Long cashAccountId = getDefaultAccountId(tenantId, "CASH"); // 현금 계정
            
            if (revenueAccountId == null || expenseAccountId == null || cashAccountId == null) {
                log.warn("기본 계정을 찾을 수 없어 분개를 생성할 수 없습니다: tenantId={}", tenantId);
                return null;
            }
            
            // 2. 분개 생성
            AccountingEntry entry = AccountingEntry.builder()
                .entryDate(transaction.getTransactionDate())
                .description(String.format("거래 자동 분개: %s", transaction.getDescription()))
                .build();
            
            java.util.List<JournalEntryLine> lines = new java.util.ArrayList<>();
            
            if (transaction.getTransactionType() == com.coresolution.consultation.entity.FinancialTransaction.TransactionType.INCOME) {
                // 수익 거래: 현금(차변) / 수익(대변)
                lines.add(JournalEntryLine.builder()
                    .accountId(cashAccountId)
                    .debitAmount(transaction.getAmount())
                    .creditAmount(BigDecimal.ZERO)
                    .description("수익 입금")
                    .build());
                
                lines.add(JournalEntryLine.builder()
                    .accountId(revenueAccountId)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(transaction.getAmount())
                    .description(transaction.getDescription())
                    .build());
            } else if (transaction.getTransactionType() == com.coresolution.consultation.entity.FinancialTransaction.TransactionType.EXPENSE) {
                // 비용 거래: 비용(차변) / 현금(대변)
                lines.add(JournalEntryLine.builder()
                    .accountId(expenseAccountId)
                    .debitAmount(transaction.getAmount())
                    .creditAmount(BigDecimal.ZERO)
                    .description(transaction.getDescription())
                    .build());
                
                lines.add(JournalEntryLine.builder()
                    .accountId(cashAccountId)
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(transaction.getAmount())
                    .description("비용 지출")
                    .build());
            } else {
                log.warn("지원하지 않는 거래 유형: {}", transaction.getTransactionType());
                return null;
            }
            
            // 3. 분개 저장
            AccountingEntry saved = createJournalEntry(tenantId, entry, lines);
            
            log.info("FinancialTransaction에서 분개 자동 생성 완료: transactionId={}, entryId={}, entryNumber={}", 
                transaction.getId(), saved.getId(), saved.getEntryNumber());
            
            return saved;
        } catch (Exception e) {
            log.error("FinancialTransaction에서 분개 생성 실패: transactionId={}, error={}", 
                transaction.getId(), e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 기본 계정 ID 조회 (공통코드에서 동적 조회)
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     * 하드코딩 금지 원칙 준수
     */
    private Long getDefaultAccountId(String tenantId, String accountType) {
        try {
            // 공통코드에서 계정 타입별 기본 계정 ID 조회
            // 코드 그룹: ERP_ACCOUNT_TYPE
            // 코드 값: REVENUE, EXPENSE, CASH 등
            Optional<CommonCode> accountCode = commonCodeService.getTenantCodeByGroupAndValue(
                tenantId, 
                "ERP_ACCOUNT_TYPE", 
                accountType
            );
            
            if (accountCode.isPresent()) {
                CommonCode code = accountCode.get();
                
                // 1. extraData 필드에서 계정 ID 조회 (JSON 형태: {"accountId": 123})
                if (code.getExtraData() != null && !code.getExtraData().trim().isEmpty()) {
                    try {
                        // 간단한 JSON 파싱 ({"accountId": 123} 형식)
                        String extraData = code.getExtraData().trim();
                        if (extraData.startsWith("{") && extraData.contains("accountId")) {
                            String accountIdStr = extraData.replaceAll(".*\"accountId\"\\s*:\\s*(\\d+).*", "$1");
                            if (!accountIdStr.equals(extraData)) {
                                return Long.parseLong(accountIdStr);
                            }
                        }
                    } catch (NumberFormatException e) {
                        log.warn("계정 ID 파싱 실패 (extraData): tenantId={}, accountType={}, extraData={}", 
                            tenantId, accountType, code.getExtraData());
                    }
                }
                
                // 2. codeDescription 필드에서 계정 ID 조회 (형식: "accountId:123" 또는 "123")
                if (code.getCodeDescription() != null && !code.getCodeDescription().trim().isEmpty()) {
                    try {
                        String description = code.getCodeDescription().trim();
                        String accountIdStr = description.contains(":") 
                            ? description.split(":")[1].trim() 
                            : description.trim();
                        return Long.parseLong(accountIdStr);
                    } catch (NumberFormatException e) {
                        log.warn("계정 ID 파싱 실패 (codeDescription): tenantId={}, accountType={}, description={}", 
                            tenantId, accountType, code.getCodeDescription());
                    }
                }
            }
            
            // 공통코드에 없거나 계정 ID가 없으면 null 반환 (분개 생성 실패 처리)
            log.warn("기본 계정을 찾을 수 없습니다: tenantId={}, accountType={}, codeGroup=ERP_ACCOUNT_TYPE", 
                tenantId, accountType);
            return null;
        } catch (Exception e) {
            log.error("기본 계정 ID 조회 실패: tenantId={}, accountType={}, error={}", 
                tenantId, accountType, e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * 분개 번호 생성 (테넌트별 독립 채번)
     * 형식: JE-{tenantId}-{YYYY}-{sequence}
     * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
     */
    private String generateEntryNumber(String tenantId) {
        int currentYear = java.time.LocalDate.now().getYear();
        String pattern = "JE-" + tenantId + "-" + currentYear + "-%";
        
        Integer maxSequence = accountingEntryRepository.findMaxSequenceByTenantIdAndYear(tenantId, pattern);
        int nextSequence = (maxSequence == null) ? 1 : maxSequence + 1;
        
        return String.format("JE-%s-%d-%04d", tenantId, currentYear, nextSequence);
    }
    
    @Override
    @Transactional
    public AccountingEntry updateJournalEntry(String tenantId, Long entryId, AccountingEntry entry, List<JournalEntryLine> lines) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 1. 분개 조회 (테넌트 검증)
        AccountingEntry existingEntry = accountingEntryRepository.findById(entryId)
            .orElseThrow(() -> new IllegalArgumentException("분개를 찾을 수 없습니다: " + entryId));
        
        if (!existingEntry.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("다른 테넌트의 분개입니다.");
        }
        
        // 2. DRAFT 상태 확인 (DRAFT 상태에서만 수정 가능)
        if (existingEntry.getEntryStatus() != AccountingEntry.EntryStatus.DRAFT) {
            throw new IllegalStateException("DRAFT 상태의 분개만 수정할 수 있습니다. 현재 상태: " + existingEntry.getEntryStatus());
        }
        
        // 3. 차변/대변 합계 계산
        BigDecimal totalDebit = lines.stream()
            .map(JournalEntryLine::getDebitAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCredit = lines.stream()
            .map(JournalEntryLine::getCreditAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 4. 차변/대변 균형 검증
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException(
                String.format("차변/대변 불균형: 차변=%s, 대변=%s", totalDebit, totalCredit)
            );
        }
        
        // 5. 분개 정보 업데이트
        existingEntry.setEntryDate(entry.getEntryDate());
        existingEntry.setDescription(entry.getDescription());
        existingEntry.setTotalDebit(totalDebit);
        existingEntry.setTotalCredit(totalCredit);
        
        // 6. 기존 라인 삭제 (soft delete)
        List<JournalEntryLine> existingLines = journalEntryLineRepository.findByJournalEntryId(entryId);
        for (JournalEntryLine existingLine : existingLines) {
            existingLine.setIsDeleted(true);
            existingLine.setDeletedAt(LocalDateTime.now());
            journalEntryLineRepository.save(existingLine);
        }
        
        // 7. 새 라인 저장
        for (int i = 0; i < lines.size(); i++) {
            JournalEntryLine line = lines.get(i);
            line.setId(null); // 새로 생성
            line.setJournalEntry(existingEntry);
            line.setTenantId(tenantId);
            line.setLineNumber(i + 1);
            line.setIsDeleted(false);
            journalEntryLineRepository.save(line);
        }
        
        // 8. 분개 저장
        AccountingEntry savedEntry = accountingEntryRepository.save(existingEntry);
        
        log.info("분개 수정 완료: tenantId={}, entryId={}, entryNumber={}", 
            tenantId, entryId, savedEntry.getEntryNumber());
        
        return savedEntry;
    }
}

