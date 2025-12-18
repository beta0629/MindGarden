package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.erp.accounting.Ledger;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 재무제표 Service 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialStatementServiceImpl implements FinancialStatementService {
    
    private final LedgerService ledgerService;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateIncomeStatement(String tenantId, LocalDate startDate, LocalDate endDate) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        log.info("손익계산서 생성: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        // 1. 기간별 원장 조회
        List<Ledger> ledgers = ledgerService.getLedgersByPeriod(tenantId, startDate, endDate);
        
        // 2. 수익 계정 합계 (REVENUE)
        BigDecimal totalRevenue = ledgers.stream()
            .filter(l -> isRevenueAccount(l))
            .map(l -> l.getTotalCredit().subtract(l.getTotalDebit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 3. 비용 계정 합계 (EXPENSES)
        BigDecimal totalExpenses = ledgers.stream()
            .filter(l -> isExpenseAccount(l))
            .map(l -> l.getTotalDebit().subtract(l.getTotalCredit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 4. 순이익 계산
        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);
        
        // 5. 결과 구성
        Map<String, Object> result = new HashMap<>();
        result.put("tenantId", tenantId);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("revenue", Map.of(
            "total", totalRevenue,
            "items", getRevenueItems(ledgers)
        ));
        result.put("expenses", Map.of(
            "total", totalExpenses,
            "items", getExpenseItems(ledgers)
        ));
        result.put("netIncome", netIncome);
        
        log.info("손익계산서 생성 완료: revenue={}, expenses={}, netIncome={}", 
            totalRevenue, totalExpenses, netIncome);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateBalanceSheet(String tenantId, LocalDate asOfDate) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        log.info("재무상태표 생성: tenantId={}, asOfDate={}", tenantId, asOfDate);
        
        // 1. 모든 계정의 잔액 조회 (asOfDate 기준)
        // 원장이 없는 경우를 대비해 기간별로 조회
        LocalDate periodStart = asOfDate.withDayOfMonth(1);
        LocalDate periodEnd = asOfDate.withDayOfMonth(asOfDate.lengthOfMonth());
        
        List<Ledger> ledgers = ledgerService.getLedgersByPeriod(tenantId, periodStart, periodEnd);
        
        // 2. 자산 계정 합계
        BigDecimal totalAssets = ledgers.stream()
            .filter(l -> isAssetAccount(l))
            .map(Ledger::getClosingBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 3. 부채 계정 합계
        BigDecimal totalLiabilities = ledgers.stream()
            .filter(l -> isLiabilityAccount(l))
            .map(Ledger::getClosingBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 4. 자본 계정 합계
        BigDecimal totalEquity = ledgers.stream()
            .filter(l -> isEquityAccount(l))
            .map(Ledger::getClosingBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 5. 검증: 자산 = 부채 + 자본
        BigDecimal liabilitiesPlusEquity = totalLiabilities.add(totalEquity);
        boolean isBalanced = totalAssets.compareTo(liabilitiesPlusEquity) == 0;
        
        // 6. 결과 구성
        Map<String, Object> result = new HashMap<>();
        result.put("tenantId", tenantId);
        result.put("asOfDate", asOfDate);
        result.put("assets", Map.of(
            "total", totalAssets,
            "items", getAssetItems(ledgers)
        ));
        result.put("liabilities", Map.of(
            "total", totalLiabilities,
            "items", getLiabilityItems(ledgers)
        ));
        result.put("equity", Map.of(
            "total", totalEquity,
            "items", getEquityItems(ledgers)
        ));
        result.put("isBalanced", isBalanced);
        result.put("balanceCheck", Map.of(
            "assets", totalAssets,
            "liabilitiesPlusEquity", liabilitiesPlusEquity,
            "difference", totalAssets.subtract(liabilitiesPlusEquity)
        ));
        
        log.info("재무상태표 생성 완료: assets={}, liabilities={}, equity={}, isBalanced={}", 
            totalAssets, totalLiabilities, totalEquity, isBalanced);
        
        return result;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateCashFlowStatement(String tenantId, LocalDate startDate, LocalDate endDate) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        log.info("현금흐름표 생성: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);
        
        // 1. 기간별 원장 조회
        List<Ledger> ledgers = ledgerService.getLedgersByPeriod(tenantId, startDate, endDate);
        
        // 2. 영업 활동 현금흐름 (수익 - 비용)
        BigDecimal operatingCashFlow = ledgers.stream()
            .filter(l -> isOperatingAccount(l))
            .map(l -> l.getTotalCredit().subtract(l.getTotalDebit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 3. 투자 활동 현금흐름 (고정자산 관련)
        BigDecimal investingCashFlow = ledgers.stream()
            .filter(l -> isInvestingAccount(l))
            .map(l -> l.getTotalDebit().subtract(l.getTotalCredit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 4. 재무 활동 현금흐름 (부채/자본 관련)
        BigDecimal financingCashFlow = ledgers.stream()
            .filter(l -> isFinancingAccount(l))
            .map(l -> l.getTotalCredit().subtract(l.getTotalDebit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 5. 순현금 증가액
        BigDecimal netCashIncrease = operatingCashFlow.add(investingCashFlow).add(financingCashFlow);
        
        // 6. 결과 구성
        Map<String, Object> result = new HashMap<>();
        result.put("tenantId", tenantId);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("operatingActivities", Map.of(
            "cashFlow", operatingCashFlow,
            "items", getOperatingItems(ledgers)
        ));
        result.put("investingActivities", Map.of(
            "cashFlow", investingCashFlow,
            "items", getInvestingItems(ledgers)
        ));
        result.put("financingActivities", Map.of(
            "cashFlow", financingCashFlow,
            "items", getFinancingItems(ledgers)
        ));
        result.put("netCashIncrease", netCashIncrease);
        
        log.info("현금흐름표 생성 완료: operating={}, investing={}, financing={}, netIncrease={}", 
            operatingCashFlow, investingCashFlow, financingCashFlow, netCashIncrease);
        
        return result;
    }
    
    // ========== 계정 타입 판별 메서드 ==========
    // TODO: 실제 계정 타입은 Account 엔티티나 공통코드에서 조회해야 함
    // 현재는 간단한 구현으로 진행 (표준 문서에 따라 확장 필요)
    
    private boolean isRevenueAccount(Ledger ledger) {
        // 수익 계정 판별 로직
        // 실제로는 Account.accountType 또는 공통코드에서 조회
        return ledger.getAccount().getAccountNumber().contains("REVENUE") 
            || ledger.getAccount().getAccountNumber().contains("수익");
    }
    
    private boolean isExpenseAccount(Ledger ledger) {
        // 비용 계정 판별 로직
        return ledger.getAccount().getAccountNumber().contains("EXPENSE")
            || ledger.getAccount().getAccountNumber().contains("비용");
    }
    
    private boolean isAssetAccount(Ledger ledger) {
        // 자산 계정 판별 로직
        return ledger.getAccount().getAccountNumber().contains("ASSET")
            || ledger.getAccount().getAccountNumber().contains("자산");
    }
    
    private boolean isLiabilityAccount(Ledger ledger) {
        // 부채 계정 판별 로직
        return ledger.getAccount().getAccountNumber().contains("LIABILITY")
            || ledger.getAccount().getAccountNumber().contains("부채");
    }
    
    private boolean isEquityAccount(Ledger ledger) {
        // 자본 계정 판별 로직
        return ledger.getAccount().getAccountNumber().contains("EQUITY")
            || ledger.getAccount().getAccountNumber().contains("자본");
    }
    
    private boolean isOperatingAccount(Ledger ledger) {
        // 영업 활동 계정 판별 로직
        return isRevenueAccount(ledger) || isExpenseAccount(ledger);
    }
    
    private boolean isInvestingAccount(Ledger ledger) {
        // 투자 활동 계정 판별 로직 (고정자산)
        return ledger.getAccount().getAccountNumber().contains("FIXED")
            || ledger.getAccount().getAccountNumber().contains("고정");
    }
    
    private boolean isFinancingAccount(Ledger ledger) {
        // 재무 활동 계정 판별 로직 (부채/자본)
        return isLiabilityAccount(ledger) || isEquityAccount(ledger);
    }
    
    // ========== 상세 항목 추출 메서드 ==========
    
    private List<Map<String, Object>> getRevenueItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isRevenueAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("amount", l.getTotalCredit().subtract(l.getTotalDebit()));
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getExpenseItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isExpenseAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("amount", l.getTotalDebit().subtract(l.getTotalCredit()));
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getAssetItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isAssetAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("balance", l.getClosingBalance());
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getLiabilityItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isLiabilityAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("balance", l.getClosingBalance());
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getEquityItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isEquityAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("balance", l.getClosingBalance());
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getOperatingItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isOperatingAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("cashFlow", l.getTotalCredit().subtract(l.getTotalDebit()));
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getInvestingItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isInvestingAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("cashFlow", l.getTotalDebit().subtract(l.getTotalCredit()));
                return item;
            })
            .collect(Collectors.toList());
    }
    
    private List<Map<String, Object>> getFinancingItems(List<Ledger> ledgers) {
        return ledgers.stream()
            .filter(this::isFinancingAccount)
            .map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("accountId", l.getAccount().getId());
                item.put("accountName", l.getAccount().getAccountHolder());
                item.put("cashFlow", l.getTotalCredit().subtract(l.getTotalDebit()));
                return item;
            })
            .collect(Collectors.toList());
    }
}

