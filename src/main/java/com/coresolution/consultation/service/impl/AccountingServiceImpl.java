package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.AccountingEntry;
import com.coresolution.consultation.entity.JournalEntryLine;
import com.coresolution.consultation.repository.AccountingEntryRepository;
import com.coresolution.consultation.repository.JournalEntryLineRepository;
import com.coresolution.consultation.service.AccountingService;
import com.coresolution.consultation.service.LedgerService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
}

