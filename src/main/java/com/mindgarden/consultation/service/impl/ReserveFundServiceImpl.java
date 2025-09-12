package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.FinancialTransactionRequest;
import com.mindgarden.consultation.entity.ReserveFund;
import com.mindgarden.consultation.repository.ReserveFundRepository;
import com.mindgarden.consultation.service.FinancialTransactionService;
import com.mindgarden.consultation.service.ReserveFundService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 적립금 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReserveFundServiceImpl implements ReserveFundService {
    
    private final ReserveFundRepository reserveFundRepository;
    private final FinancialTransactionService financialTransactionService;
    
    // ==================== 적립금 관리 ====================
    
    @Override
    public ReserveFund createReserveFund(ReserveFund reserveFund) {
        log.info("적립금 생성: {}", reserveFund.getFundName());
        
        if (reserveFund.getCreatedAt() == null) {
            reserveFund.setCreatedAt(LocalDateTime.now());
        }
        if (reserveFund.getUpdatedAt() == null) {
            reserveFund.setUpdatedAt(LocalDateTime.now());
        }
        
        return reserveFundRepository.save(reserveFund);
    }
    
    @Override
    public ReserveFund updateReserveFund(Long id, ReserveFund reserveFund) {
        log.info("적립금 수정: id={}", id);
        
        ReserveFund existingFund = reserveFundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("적립금을 찾을 수 없습니다: " + id));
        
        existingFund.setFundName(reserveFund.getFundName());
        existingFund.setFundType(reserveFund.getFundType());
        existingFund.setDescription(reserveFund.getDescription());
        existingFund.setTargetAmount(reserveFund.getTargetAmount());
        existingFund.setReserveRate(reserveFund.getReserveRate());
        existingFund.setAutoDeduct(reserveFund.getAutoDeduct());
        existingFund.setDeductFrom(reserveFund.getDeductFrom());
        existingFund.setStartDate(reserveFund.getStartDate());
        existingFund.setEndDate(reserveFund.getEndDate());
        existingFund.setIsActive(reserveFund.getIsActive());
        existingFund.setUpdatedAt(LocalDateTime.now());
        
        return reserveFundRepository.save(existingFund);
    }
    
    @Override
    public boolean deleteReserveFund(Long id) {
        log.info("적립금 삭제: id={}", id);
        
        ReserveFund reserveFund = reserveFundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("적립금을 찾을 수 없습니다: " + id));
        
        reserveFund.setIsActive(false);
        reserveFund.setUpdatedAt(LocalDateTime.now());
        reserveFundRepository.save(reserveFund);
        
        return true;
    }
    
    @Override
    @Transactional(readOnly = true)
    public ReserveFund getReserveFundById(Long id) {
        log.info("적립금 조회: id={}", id);
        return reserveFundRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("적립금을 찾을 수 없습니다: " + id));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ReserveFund> getAllActiveReserveFunds() {
        log.info("모든 활성 적립금 조회");
        return reserveFundRepository.findByIsActiveTrue();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ReserveFund> getReserveFundsByType(String fundType) {
        log.info("적립금 유형별 조회: {}", fundType);
        return reserveFundRepository.findByFundTypeAndIsActiveTrue(fundType);
    }
    
    // ==================== 적립금 운영 ====================
    
    @Override
    public void autoReserveFromIncome(BigDecimal incomeAmount, String description) {
        log.info("수입에서 자동 적립: 금액={}, 설명={}", incomeAmount, description);
        
        // 자동 적립이 활성화된 적립금들 조회
        List<ReserveFund> autoReserveFunds = reserveFundRepository.findByAutoDeductTrueAndIsActiveTrue();
        
        for (ReserveFund fund : autoReserveFunds) {
            if (fund.getReserveRate() != null && fund.getReserveRate().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal reserveAmount = incomeAmount.multiply(fund.getReserveRate());
                
                if (reserveAmount.compareTo(BigDecimal.ZERO) > 0) {
                    manualReserve(fund.getId(), reserveAmount, 
                        String.format("수입 자동 적립 - %s", description));
                    
                    log.info("💚 자동 적립 완료: {} - {}원", fund.getFundName(), reserveAmount);
                }
            }
        }
    }
    
    @Override
    public void manualReserve(Long reserveFundId, BigDecimal amount, String description) {
        log.info("수동 적립: 적립금ID={}, 금액={}", reserveFundId, amount);
        
        ReserveFund reserveFund = getReserveFundById(reserveFundId);
        
        // 적립금 증가
        BigDecimal newAmount = reserveFund.getCurrentAmount().add(amount);
        reserveFund.setCurrentAmount(newAmount);
        reserveFund.setUpdatedAt(LocalDateTime.now());
        reserveFundRepository.save(reserveFund);
        
        // 재무 거래 기록 생성 (지출로 기록)
        try {
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("EXPENSE")
                    .category("적립금")
                    .subcategory(reserveFund.getFundType())
                    .amount(amount)
                    .amountBeforeTax(amount) // 적립금은 부가세 없음
                    .taxAmount(BigDecimal.ZERO)
                    .description(String.format("%s 적립 - %s", reserveFund.getFundName(), description))
                    .transactionDate(LocalDate.now())
                    .relatedEntityId(reserveFundId)
                    .relatedEntityType("RESERVE_FUND")
                    .taxIncluded(false)
                    .build();
            
            financialTransactionService.createTransaction(request, null);
            log.info("✅ 적립금 재무 거래 기록 생성 완료");
        } catch (Exception e) {
            log.error("적립금 재무 거래 기록 생성 실패: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void useReserveFund(Long reserveFundId, BigDecimal amount, String purpose) {
        log.info("적립금 사용: 적립금ID={}, 금액={}, 목적={}", reserveFundId, amount, purpose);
        
        ReserveFund reserveFund = getReserveFundById(reserveFundId);
        
        // 잔액 확인
        if (reserveFund.getCurrentAmount().compareTo(amount) < 0) {
            throw new RuntimeException("적립금 잔액이 부족합니다. 현재: " + 
                reserveFund.getCurrentAmount() + ", 요청: " + amount);
        }
        
        // 적립금 감소
        BigDecimal newAmount = reserveFund.getCurrentAmount().subtract(amount);
        reserveFund.setCurrentAmount(newAmount);
        reserveFund.setUpdatedAt(LocalDateTime.now());
        reserveFundRepository.save(reserveFund);
        
        // 재무 거래 기록 생성 (수입으로 기록)
        try {
            FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                    .transactionType("INCOME")
                    .category("적립금사용")
                    .subcategory(reserveFund.getFundType())
                    .amount(amount)
                    .amountBeforeTax(amount) // 적립금 사용은 부가세 없음
                    .taxAmount(BigDecimal.ZERO)
                    .description(String.format("%s 사용 - %s", reserveFund.getFundName(), purpose))
                    .transactionDate(LocalDate.now())
                    .relatedEntityId(reserveFundId)
                    .relatedEntityType("RESERVE_FUND")
                    .taxIncluded(false)
                    .build();
            
            financialTransactionService.createTransaction(request, null);
            log.info("✅ 적립금 사용 재무 거래 기록 생성 완료");
        } catch (Exception e) {
            log.error("적립금 사용 재무 거래 기록 생성 실패: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void transferReserveFund(Long fromFundId, Long toFundId, BigDecimal amount, String reason) {
        log.info("적립금 이체: {} -> {}, 금액={}", fromFundId, toFundId, amount);
        
        ReserveFund fromFund = getReserveFundById(fromFundId);
        ReserveFund toFund = getReserveFundById(toFundId);
        
        // 출금
        useReserveFund(fromFundId, amount, String.format("이체 - %s", reason));
        
        // 입금
        manualReserve(toFundId, amount, String.format("이체 - %s", reason));
        
        log.info("✅ 적립금 이체 완료: {} -> {}", fromFund.getFundName(), toFund.getFundName());
    }
    
    // ==================== 통계 및 분석 ====================
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getReserveFundStatus() {
        log.info("적립금 현황 조회");
        
        List<ReserveFund> activeFunds = getAllActiveReserveFunds();
        
        Map<String, Object> status = new HashMap<>();
        
        // 총 적립금
        BigDecimal totalReserveAmount = activeFunds.stream()
                .map(ReserveFund::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        status.put("totalReserveAmount", totalReserveAmount);
        
        // 총 목표 금액
        BigDecimal totalTargetAmount = activeFunds.stream()
                .filter(fund -> fund.getTargetAmount() != null)
                .map(ReserveFund::getTargetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        status.put("totalTargetAmount", totalTargetAmount);
        
        // 달성률
        BigDecimal achievementRate = BigDecimal.ZERO;
        if (totalTargetAmount.compareTo(BigDecimal.ZERO) > 0) {
            achievementRate = totalReserveAmount.divide(totalTargetAmount, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        status.put("achievementRate", achievementRate);
        
        // 유형별 현황
        Map<String, BigDecimal> byType = activeFunds.stream()
                .collect(Collectors.groupingBy(
                    ReserveFund::getFundType,
                    Collectors.reducing(BigDecimal.ZERO, ReserveFund::getCurrentAmount, BigDecimal::add)
                ));
        status.put("byType", byType);
        
        // 활성 적립금 수
        status.put("activeFundCount", activeFunds.size());
        
        return status;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getReserveFundStatistics() {
        log.info("적립금 통계 조회");
        
        List<ReserveFund> allFunds = reserveFundRepository.findAll();
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 전체 통계
        statistics.put("totalFunds", allFunds.size());
        statistics.put("activeFunds", allFunds.stream().filter(ReserveFund::getIsActive).count());
        
        // 유형별 통계
        Map<String, Long> typeCount = allFunds.stream()
                .filter(ReserveFund::getIsActive)
                .collect(Collectors.groupingBy(ReserveFund::getFundType, Collectors.counting()));
        statistics.put("typeCount", typeCount);
        
        // 자동 적립 설정 통계
        long autoDeductCount = allFunds.stream()
                .filter(ReserveFund::getIsActive)
                .filter(ReserveFund::getAutoDeduct)
                .count();
        statistics.put("autoDeductCount", autoDeductCount);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getReserveFundUsageHistory(String startDate, String endDate) {
        log.info("적립금 사용 내역 조회: {} ~ {}", startDate, endDate);
        
        // TODO: FinancialTransaction에서 적립금 관련 거래 조회
        Map<String, Object> history = new HashMap<>();
        history.put("startDate", startDate);
        history.put("endDate", endDate);
        history.put("message", "적립금 사용 내역 조회 기능은 추후 구현 예정");
        
        return history;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTargetAchievementRate() {
        log.info("목표 달성률 계산");
        
        List<ReserveFund> fundsWithTarget = reserveFundRepository.findByTargetAmountNotNullAndIsActiveTrue();
        
        Map<String, Object> achievement = new HashMap<>();
        
        Map<String, Map<String, Object>> fundAchievements = new HashMap<>();
        
        for (ReserveFund fund : fundsWithTarget) {
            Map<String, Object> fundData = new HashMap<>();
            fundData.put("fundName", fund.getFundName());
            fundData.put("currentAmount", fund.getCurrentAmount());
            fundData.put("targetAmount", fund.getTargetAmount());
            
            BigDecimal rate = BigDecimal.ZERO;
            if (fund.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                rate = fund.getCurrentAmount().divide(fund.getTargetAmount(), 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }
            fundData.put("achievementRate", rate);
            
            fundAchievements.put(fund.getId().toString(), fundData);
        }
        
        achievement.put("fundAchievements", fundAchievements);
        achievement.put("totalFundsWithTarget", fundsWithTarget.size());
        
        return achievement;
    }
}
