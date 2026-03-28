package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.settlement.Settlement;
import com.coresolution.consultation.entity.erp.settlement.SettlementRule;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.erp.settlement.SettlementRepository;
import com.coresolution.consultation.repository.erp.settlement.SettlementRuleRepository;
import com.coresolution.consultation.service.erp.settlement.SettlementCalculationEngine;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 정산 Service 구현체
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {
    
    private final SettlementRuleRepository settlementRuleRepository;
    private final SettlementRepository settlementRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final SettlementCalculationEngine calculationEngine;
    
    @Override
    @Transactional
    public SettlementRule createRule(String tenantId, SettlementRule rule) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        rule.setTenantId(tenantId);
        SettlementRule saved = settlementRuleRepository.save(rule);
        
        log.info("정산 규칙 생성: tenantId={}, ruleId={}, ruleName={}", 
            tenantId, saved.getId(), saved.getRuleName());
        
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SettlementRule> getRules(String tenantId) {
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        return settlementRuleRepository.findActiveByTenantId(tenantId);
    }
    
    @Override
    @Transactional
    public Settlement calculateSettlement(String tenantId, String period) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 1. 기존 정산 확인
        if (settlementRepository.findByTenantIdAndPeriod(tenantId, period).isPresent()) {
            throw new IllegalStateException("이미 정산이 생성된 기간입니다: " + period);
        }
        
        // 2. 기간 파싱 (YYYYMM)
        YearMonth yearMonth = YearMonth.parse(period, DateTimeFormatter.ofPattern("yyyyMM"));
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        // 3. 매출 조회 (FinancialTransaction INCOME)
        List<FinancialTransaction> transactions = financialTransactionRepository
            .findByTenantIdAndIsDeletedFalse(tenantId)
            .stream()
            .filter(t -> !t.getTransactionDate().isBefore(startDate) 
                      && !t.getTransactionDate().isAfter(endDate))
            .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
            .collect(Collectors.toList());
        
        BigDecimal totalRevenue = transactions.stream()
            .map(FinancialTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        log.info("정산 계산 시작: tenantId={}, period={}, totalRevenue={}", 
            tenantId, period, totalRevenue);
        
        // 4. 활성 정산 규칙 조회
        List<SettlementRule> rules = settlementRuleRepository.findActiveByTenantId(tenantId);
        
        // 5. 수수료/로열티 계산
        BigDecimal commissionAmount = BigDecimal.ZERO;
        BigDecimal royaltyAmount = BigDecimal.ZERO;
        
        for (SettlementRule rule : rules) {
            BigDecimal calculated = calculationEngine.calculate(rule, totalRevenue);
            
            if (rule.getSettlementType() == SettlementRule.SettlementType.COMMISSION) {
                commissionAmount = commissionAmount.add(calculated);
            } else if (rule.getSettlementType() == SettlementRule.SettlementType.ROYALTY) {
                royaltyAmount = royaltyAmount.add(calculated);
            }
        }
        
        // 6. 정산 번호 생성
        String settlementNumber = generateSettlementNumber(tenantId, period);
        
        // 7. 정산 결과 생성
        Settlement settlement = Settlement.builder()
            .tenantId(tenantId)
            .settlementNumber(settlementNumber)
            .settlementPeriod(period)
            .totalRevenue(totalRevenue)
            .commissionAmount(commissionAmount)
            .royaltyAmount(royaltyAmount)
            .status(Settlement.SettlementStatus.PENDING)
            .build();
        
        settlement.calculateNetAmount();
        
        Settlement saved = settlementRepository.save(settlement);
        
        log.info("정산 계산 완료: tenantId={}, settlementId={}, netAmount={}", 
            tenantId, saved.getId(), saved.getNetSettlementAmount());
        
        return saved;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Settlement> getSettlements(String tenantId) {
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        return settlementRepository.findByTenantId(tenantId);
    }
    
    @Override
    @Transactional
    public Settlement approveSettlement(String tenantId, Long settlementId, Long approverId) {
        // 0. 테넌트 컨텍스트 검증
        String currentTenantId = TenantContextHolder.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
        
        // 1. 정산 조회
        Settlement settlement = settlementRepository.findByTenantIdAndId(tenantId, settlementId)
            .orElseThrow(() -> new IllegalArgumentException("정산을 찾을 수 없습니다: " + settlementId));

        // 2. 승인 가능 상태 확인
        if (settlement.getStatus() != Settlement.SettlementStatus.PENDING) {
            throw new IllegalStateException("승인 가능한 상태가 아닙니다: " + settlement.getStatus());
        }
        
        // 3. 승인 처리
        settlement.setStatus(Settlement.SettlementStatus.APPROVED);
        settlement.setApprovedBy(approverId);
        settlement.setApprovedAt(java.time.LocalDateTime.now());
        
        Settlement saved = settlementRepository.save(settlement);
        
        log.info("정산 승인 완료: tenantId={}, settlementId={}, approverId={}", 
            tenantId, settlementId, approverId);
        
        return saved;
    }
    
    /**
     * 정산 번호 생성 (테넌트별 독립 채번)
     * 형식: ST-{tenantId}-{YYYYMM}-{sequence}
     */
    private String generateSettlementNumber(String tenantId, String period) {
        String pattern = "ST-" + tenantId + "-" + period + "-%";
        
        Integer maxSequence = settlementRepository.findMaxSequenceByTenantIdAndPeriod(tenantId, pattern);
        int nextSequence = (maxSequence == null) ? 1 : maxSequence + 1;
        
        return String.format("ST-%s-%s-%04d", tenantId, period, nextSequence);
    }
}

