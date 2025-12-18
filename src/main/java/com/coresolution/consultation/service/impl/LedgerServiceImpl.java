package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.Account;
import com.coresolution.consultation.entity.erp.accounting.Ledger;
import com.coresolution.consultation.repository.AccountRepository;
import com.coresolution.consultation.repository.erp.accounting.LedgerRepository;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

/**
 * 원장 Service 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {
    
    private final LedgerRepository ledgerRepository;
    private final AccountRepository accountRepository;
    
    @Override
    @Transactional
    public void updateLedgerFromJournalEntry(String tenantId, Long accountId, LocalDate entryDate, 
                                            BigDecimal debitAmount, BigDecimal creditAmount) {
        // 0. 테넌트 컨텍스트 검증 (ERP 독립성 보장)
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치: 다른 테넌트의 원장에 접근할 수 없습니다.");
        }
        
        // 1. 계정 존재 여부 확인 (테넌트 검증)
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new IllegalArgumentException("계정을 찾을 수 없습니다: " + accountId));
        
        if (!account.getTenantId().equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치: 다른 테넌트의 계정입니다.");
        }
        
        // 2. 해당 월의 원장 조회 또는 생성
        YearMonth yearMonth = YearMonth.from(entryDate);
        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();
        
        Optional<Ledger> existingLedger = ledgerRepository.findByTenantIdAndAccountIdAndPeriod(
            tenantId, accountId, periodStart, periodEnd
        );
        
        Ledger ledger;
        if (existingLedger.isPresent()) {
            ledger = existingLedger.get();
            // 기존 원장 업데이트
            ledger.setTotalDebit(ledger.getTotalDebit().add(debitAmount != null ? debitAmount : BigDecimal.ZERO));
            ledger.setTotalCredit(ledger.getTotalCredit().add(creditAmount != null ? creditAmount : BigDecimal.ZERO));
        } else {
            // 새 원장 생성
            // 기초 잔액 계산: 이전 기간의 기말 잔액
            BigDecimal openingBalance = calculateOpeningBalance(tenantId, accountId, periodStart);
            
            ledger = Ledger.builder()
                .tenantId(tenantId)
                .account(account)
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .openingBalance(openingBalance)
                .totalDebit(debitAmount != null ? debitAmount : BigDecimal.ZERO)
                .totalCredit(creditAmount != null ? creditAmount : BigDecimal.ZERO)
                .build();
        }
        
        // 3. 기말 잔액 계산
        ledger.calculateClosingBalance();
        
        // 4. 저장
        ledgerRepository.save(ledger);
        
        log.info("원장 업데이트 완료: tenantId={}, accountId={}, period={}-{}, closingBalance={}", 
            tenantId, accountId, periodStart, periodEnd, ledger.getClosingBalance());
    }
    
    /**
     * 기초 잔액 계산 (이전 기간의 기말 잔액)
     */
    private BigDecimal calculateOpeningBalance(String tenantId, Long accountId, LocalDate periodStart) {
        // 이전 월의 원장 조회
        YearMonth previousMonth = YearMonth.from(periodStart).minusMonths(1);
        LocalDate prevPeriodStart = previousMonth.atDay(1);
        LocalDate prevPeriodEnd = previousMonth.atEndOfMonth();
        
        Optional<Ledger> previousLedger = ledgerRepository.findByTenantIdAndAccountIdAndPeriod(
            tenantId, accountId, prevPeriodStart, prevPeriodEnd
        );
        
        if (previousLedger.isPresent()) {
            return previousLedger.get().getClosingBalance();
        }
        
        // 이전 원장이 없으면 0
        return BigDecimal.ZERO;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Ledger> getLedgersByAccount(String tenantId, Long accountId) {
        // 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        return ledgerRepository.findByTenantIdAndAccountId(tenantId, accountId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Ledger> getLedgersByPeriod(String tenantId, LocalDate startDate, LocalDate endDate) {
        // 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        return ledgerRepository.findByTenantIdAndPeriod(tenantId, startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(String tenantId, Long accountId, LocalDate asOfDate) {
        // 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 해당 날짜가 포함된 기간의 원장 조회
        YearMonth yearMonth = YearMonth.from(asOfDate);
        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();
        
        Optional<Ledger> ledger = ledgerRepository.findByTenantIdAndAccountIdAndPeriod(
            tenantId, accountId, periodStart, periodEnd
        );
        
        if (ledger.isPresent()) {
            // 해당 기간의 원장이 있으면 기말 잔액 반환
            return ledger.get().getClosingBalance();
        }
        
        // 원장이 없으면 최신 원장의 기말 잔액 반환
        List<Ledger> latestLedgers = ledgerRepository.findLatestByTenantIdAndAccountId(tenantId, accountId);
        if (!latestLedgers.isEmpty()) {
            return latestLedgers.get(0).getClosingBalance();
        }
        return BigDecimal.ZERO;
    }
}

