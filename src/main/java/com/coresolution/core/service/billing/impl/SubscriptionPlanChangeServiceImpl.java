package com.coresolution.core.service.billing.impl;

import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionPlanChangeService;
import com.coresolution.consultation.service.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * 구독 요금제 변경 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionPlanChangeServiceImpl implements SubscriptionPlanChangeService {
    
    private final TenantSubscriptionRepository subscriptionRepository;
    private final PricingPlanRepository pricingPlanRepository;
    
    /**
     * PG 결제 대행사 서비스 (선택적 주입)
     * 실제 PG 결제/환불 API 호출에 사용
     * Note: 테넌트별 PG 설정이 필요하므로 추후 TenantPgConfigurationService와 통합 필요
     */
    @Autowired(required = false)
    @Qualifier("tossPaymentService")
    private PaymentGatewayService paymentGatewayService;
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculatePriceDifference(String subscriptionId, String newPlanId, boolean applyImmediately) {
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        PricingPlan currentPlan = pricingPlanRepository.findByPlanId(subscription.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("현재 요금제를 찾을 수 없습니다: " + subscription.getPlanId()));
        
        PricingPlan newPlan = pricingPlanRepository.findByPlanId(newPlanId)
                .orElseThrow(() -> new IllegalArgumentException("새 요금제를 찾을 수 없습니다: " + newPlanId));
        
        BigDecimal currentFee = currentPlan.getBaseFee();
        BigDecimal newFee = newPlan.getBaseFee();
        BigDecimal difference = newFee.subtract(currentFee);
        
        if (!applyImmediately) {
            // 다음 청구일 적용: 차액 없음 (다음 청구일부터 새 요금제 적용)
            return BigDecimal.ZERO;
        }
        
        // 즉시 적용: 남은 기간에 대한 일할 계산
        LocalDate today = LocalDate.now();
        LocalDate nextBillingDate = subscription.getNextBillingDate();
        
        if (nextBillingDate == null || nextBillingDate.isBefore(today)) {
            // 다음 청구일이 없거나 지났으면 전체 차액 반환
            return difference;
        }
        
        // 남은 일수 계산
        long remainingDays = ChronoUnit.DAYS.between(today, nextBillingDate);
        if (remainingDays <= 0) {
            return difference;
        }
        
        // 청구 주기에 따른 총 일수
        long totalDaysInPeriod = getTotalDaysInBillingCycle(subscription.getBillingCycle());
        
        // 일할 계산
        BigDecimal dailyDifference = difference.divide(BigDecimal.valueOf(totalDaysInPeriod), 4, RoundingMode.HALF_UP);
        BigDecimal proratedDifference = dailyDifference.multiply(BigDecimal.valueOf(remainingDays))
                .setScale(0, RoundingMode.HALF_UP);
        
        log.debug("요금제 변경 차액 계산: subscriptionId={}, currentPlan={}, newPlan={}, difference={}, prorated={}", 
            subscriptionId, currentPlan.getPlanCode(), newPlan.getPlanCode(), difference, proratedDifference);
        
        return proratedDifference;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canChangePlan(String subscriptionId, String newPlanId) {
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // ACTIVE 상태만 요금제 변경 가능
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE) {
            return false;
        }
        
        // 동일한 요금제로 변경 불가
        if (subscription.getPlanId().equals(newPlanId)) {
            return false;
        }
        
        // 새 요금제 존재 확인
        return pricingPlanRepository.findByPlanId(newPlanId).isPresent();
    }
    
    @Override
    public BigDecimal processPlanChange(String subscriptionId, String newPlanId, boolean applyImmediately) {
        log.info("요금제 변경 처리 시작: subscriptionId={}, newPlanId={}, applyImmediately={}", 
            subscriptionId, newPlanId, applyImmediately);
        
        if (!canChangePlan(subscriptionId, newPlanId)) {
            throw new IllegalStateException("요금제를 변경할 수 없습니다.");
        }
        
        // 차액 계산
        BigDecimal priceDifference = calculatePriceDifference(subscriptionId, newPlanId, applyImmediately);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // 요금제 변경
        subscription.setPlanId(newPlanId);
        
        if (applyImmediately) {
            // 즉시 적용: 차액 결제 또는 환불
            // Note: 테넌트별 PG 설정이 필요하므로 추후 TenantPgConfigurationService와 통합 필요
            // Note: TenantSubscription에 paymentId 필드 추가 필요 (또는 별도 결제 엔티티와 연결)
            if (priceDifference.compareTo(BigDecimal.ZERO) > 0) {
                // 추가 결제 필요
                // TODO: 실제 PG 결제 API 호출 구현
                // 1. PaymentRequest 생성 (차액 금액)
                // 2. PaymentGatewayService.createPayment() 호출
                // 3. 결제 성공 시 paymentId 저장
                log.info("요금제 업그레이드: 추가 결제 필요: {} (PG 연동 구현 대기 중)", priceDifference);
            } else if (priceDifference.compareTo(BigDecimal.ZERO) < 0) {
                // 환불 필요
                // TODO: 실제 PG 환불 API 호출 구현
                // 1. TenantSubscription에서 paymentId 조회
                // 2. PaymentGatewayService.refundPayment() 호출
                log.info("요금제 다운그레이드: 환불 필요: {} (PG 연동 구현 대기 중)", priceDifference.abs());
            }
        } else {
            // 다음 청구일 적용: 차액 없음
            log.info("요금제 변경: 다음 청구일({})부터 적용", subscription.getNextBillingDate());
        }
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("요금제 변경 처리 완료: subscriptionId={}, newPlanId={}, priceDifference={}", 
            subscriptionId, newPlanId, priceDifference);
        
        return priceDifference;
    }
    
    private long getTotalDaysInBillingCycle(TenantSubscription.BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> 30;
            case QUARTERLY -> 90;
            case YEARLY -> 365;
        };
    }
}

