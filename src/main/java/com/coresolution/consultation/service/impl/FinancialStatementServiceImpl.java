package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.erp.accounting.Ledger;
import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.core.context.TenantIsolationValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 재무제표 Service 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialStatementServiceImpl implements FinancialStatementService {

    private static final String ERP_ACCOUNT_TYPE_GROUP = "ERP_ACCOUNT_TYPE";

    private final LedgerService ledgerService;
    private final CommonCodeService commonCodeService;
    private final FinancialPeriodRepository financialPeriodRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateIncomeStatement(String tenantId, LocalDate startDate, LocalDate endDate) {
        TenantIsolationValidator.requireTenantIdMatch(tenantId);
        log.info("손익계산서 생성: tenantId={}, startDate={}, endDate={}", tenantId, startDate, endDate);

        // ERP P0-2 PR-B (합의서 §2 Q5): 닫힌 월 기간(CLOSED/REOPENED) 은 financial_period 스냅샷 사용,
        // 미마감 월/일 기간은 ledger 라이브 합산. 본 메서드는 IS 기간이 월 단위로 정렬된 경우 (어드민
        // 결산 화면 일반 흐름) 스냅샷을 우선 적용한다.
        List<FinancialPeriod> closedMonthlySnapshots = financialPeriodRepository
                .findClosedByTenantIdAndDateRange(tenantId, startDate, endDate, PeriodType.MONTH);

        BigDecimal snapshotRevenue = BigDecimal.ZERO;
        BigDecimal snapshotExpenses = BigDecimal.ZERO;
        // 스냅샷이 커버하는 일자 — 라이브 합산에서 제외하기 위한 윈도우 식별.
        LocalDate liveStart = startDate;
        LocalDate liveEnd = endDate;
        if (!closedMonthlySnapshots.isEmpty()) {
            for (FinancialPeriod fp : closedMonthlySnapshots) {
                snapshotRevenue = snapshotRevenue.add(nullToZero(fp.getTotalIncome()));
                snapshotExpenses = snapshotExpenses.add(nullToZero(fp.getTotalExpense()));
            }
            // 합의서 §2 Q5 단순 통합: 닫힌 월의 합 + 미마감 일/월(라이브) 의 합. 본 PR 은 가장
            // 보편적인 케이스 — 요청 윈도우가 닫힌 월의 합집합 + 직전·당월 미마감 일자 — 를 우선
            // 지원하고, 비연속 윈도우는 ledger 라이브 합산과 스냅샷이 중복 합산되지 않도록
            // {@code liveStart} 를 마지막 닫힌 월 다음 달 1일로 시프트한다.
            FinancialPeriod last = closedMonthlySnapshots.get(closedMonthlySnapshots.size() - 1);
            LocalDate lastClosedEnd = last.getPeriodEnd();
            if (lastClosedEnd != null && !lastClosedEnd.isBefore(liveStart) && !lastClosedEnd.isAfter(liveEnd)) {
                liveStart = lastClosedEnd.plusDays(1);
            }
            log.info(
                "[FinancialStatement][Q5] 스냅샷 적용: tenantId={} closedMonths={} snapshotRevenue={}"
                + " snapshotExpenses={} liveWindow={}~{}",
                tenantId, closedMonthlySnapshots.size(), snapshotRevenue, snapshotExpenses,
                liveStart, liveEnd);
        }

        BigDecimal liveRevenue = BigDecimal.ZERO;
        BigDecimal liveExpenses = BigDecimal.ZERO;
        List<Ledger> ledgers = (liveStart != null && !liveStart.isAfter(liveEnd))
                ? ledgerService.getLedgersByPeriod(tenantId, liveStart, liveEnd)
                : java.util.Collections.emptyList();
        if (!ledgers.isEmpty()) {
            liveRevenue = ledgers.stream()
                .filter(this::isRevenueAccount)
                .map(l -> l.getTotalCredit().subtract(l.getTotalDebit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            liveExpenses = ledgers.stream()
                .filter(this::isExpenseAccount)
                .map(l -> l.getTotalDebit().subtract(l.getTotalCredit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal totalRevenue = snapshotRevenue.add(liveRevenue);
        BigDecimal totalExpenses = snapshotExpenses.add(liveExpenses);
        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);

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
        result.put("snapshotRevenue", snapshotRevenue);
        result.put("snapshotExpenses", snapshotExpenses);
        result.put("liveRevenue", liveRevenue);
        result.put("liveExpenses", liveExpenses);
        result.put("closedSnapshotCount", closedMonthlySnapshots.size());

        log.info(
            "손익계산서 생성 완료(스냅샷+라이브): revenue={}, expenses={}, netIncome={},"
            + " snapshotMonths={}",
            totalRevenue, totalExpenses, netIncome, closedMonthlySnapshots.size());

        return result;
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> generateBalanceSheet(String tenantId, LocalDate asOfDate) {
        TenantIsolationValidator.requireTenantIdMatch(tenantId);
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
        TenantIsolationValidator.requireTenantIdMatch(tenantId);
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
    
    // ========== 계정 타입 판별 메서드 (회계 계정 기준) ==========
    // 분류 우선순위: (1) ERP_ACCOUNT_TYPE 공통코드에 연결된 계정 ID (2) Account description/accountNumber 키워드
    // 표준: docs/standards/ERP_ADVANCEMENT_STANDARD.md, docs/planning/ERP_STATEMENTS_VS_OTHER_REPORTS_LINKAGE_PLAN.md

    private static boolean matchesKeyword(String text, String... keywords) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        String lower = text.toLowerCase();
        for (String k : keywords) {
            if (k != null && lower.contains(k.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * 테넌트별 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH) 공통코드 extraData에서 계정 ID 조회
     */
    private Long getErpAccountIdByType(String tenantId, String accountType) {
        if (tenantId == null || tenantId.isEmpty()) {
            return null;
        }
        try {
            Optional<CommonCode> code = commonCodeService.getTenantCodeByGroupAndValue(
                    tenantId, ERP_ACCOUNT_TYPE_GROUP, accountType);
            if (code.isEmpty()) {
                return null;
            }
            String extraData = code.get().getExtraData();
            if (extraData == null || !extraData.trim().startsWith("{")) {
                return null;
            }
            if (extraData.contains("\"accountId\"")) {
                String accountIdStr = extraData.replaceAll(".*\"accountId\"\\s*:\\s*(\\d+).*", "$1");
                if (!accountIdStr.equals(extraData)) {
                    return Long.parseLong(accountIdStr);
                }
            }
            return null;
        } catch (Exception e) {
            log.debug("ERP 계정 타입 ID 조회 실패: tenantId={}, accountType={}, error={}",
                    tenantId, accountType, e.getMessage());
            return null;
        }
    }

    private boolean isRevenueAccount(Ledger ledger) {
        String tenantId = ledger.getAccount() != null ? ledger.getAccount().getTenantId() : null;
        if (tenantId != null) {
            Long revenueAccountId = getErpAccountIdByType(tenantId, "REVENUE");
            if (revenueAccountId != null && ledger.getAccount().getId().equals(revenueAccountId)) {
                return true;
            }
        }
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "수익", "revenue", "income")
            || matchesKeyword(num, "revenue", "수익");
    }

    private boolean isExpenseAccount(Ledger ledger) {
        String tenantId = ledger.getAccount() != null ? ledger.getAccount().getTenantId() : null;
        if (tenantId != null) {
            Long expenseAccountId = getErpAccountIdByType(tenantId, "EXPENSE");
            if (expenseAccountId != null && ledger.getAccount().getId().equals(expenseAccountId)) {
                return true;
            }
        }
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "비용", "expense", "cost")
            || matchesKeyword(num, "expense", "비용");
    }

    private boolean isAssetAccount(Ledger ledger) {
        String tenantId = ledger.getAccount() != null ? ledger.getAccount().getTenantId() : null;
        if (tenantId != null) {
            Long cashAccountId = getErpAccountIdByType(tenantId, "CASH");
            if (cashAccountId != null && ledger.getAccount().getId().equals(cashAccountId)) {
                return true;
            }
        }
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "자산", "asset", "유동", "고정", "current", "fixed", "현금", "cash")
            || matchesKeyword(num, "asset", "자산", "cash", "현금");
    }
    
    private boolean isLiabilityAccount(Ledger ledger) {
        String tenantId = ledger.getAccount() != null ? ledger.getAccount().getTenantId() : null;
        if (tenantId != null) {
            Long liabilityAccountId = getErpAccountIdByType(tenantId, "LIABILITY");
            if (liabilityAccountId != null && ledger.getAccount().getId().equals(liabilityAccountId)) {
                return true;
            }
        }
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "부채", "liability", "유동부채", "비유동부채", "환불부채")
            || matchesKeyword(num, "liability", "부채");
    }
    
    private boolean isEquityAccount(Ledger ledger) {
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "자본", "equity", "자본금", "이익잉여금")
            || matchesKeyword(num, "equity", "자본");
    }
    
    private boolean isOperatingAccount(Ledger ledger) {
        return isRevenueAccount(ledger) || isExpenseAccount(ledger);
    }
    
    private boolean isInvestingAccount(Ledger ledger) {
        String desc = ledger.getAccount().getDescription();
        String num = ledger.getAccount().getAccountNumber();
        return matchesKeyword(desc, "고정자산", "fixed", "투자")
            || matchesKeyword(num, "fixed", "고정");
    }
    
    private boolean isFinancingAccount(Ledger ledger) {
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

