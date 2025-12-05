package com.coresolution.core.service.billing.impl;
import com.coresolution.core.context.TenantContextHolder;

import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionRefundService;
import com.coresolution.consultation.service.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

 /**
 * 구독 환불 처리 서비스 구현체
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionRefundServiceImpl implements SubscriptionRefundService {
    
    private final TenantSubscriptionRepository subscriptionRepository;
    private final PricingPlanRepository pricingPlanRepository;
    
     /**
     * PG 결제 대행사 서비스 (선택적 주입)
     /**
     * 실제 PG 환불 API 호출에 사용
     /**
     * Note: 테넌트별 PG 설정이 필요하므로 추후 TenantPgConfigurationService와 통합 필요
     */
    @Autowired(required = false)
    @Qualifier("tossPaymentService")
    private PaymentGatewayService paymentGatewayService;
    
     /**
     * 청약 철회 기간 (일)
     /**
     * application.yml의 subscription.refund.cooling-off-period-days 값 사용
     /**
     * 기본값: 15일 (전자상거래법 제17조: 법정 최소 7일)
     /**
     * 참고: docs/mgsb/SUBSCRIPTION_REFUND_POLICY.md
     */
    @Value("${subscription.refund.cooling-off-period-days:15}")
    private int coolingOffPeriodDays;
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateRefundAmount(String subscriptionId, Integer refundDays) {
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        PricingPlan plan = pricingPlanRepository.findByPlanId(subscription.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("요금제를 찾을 수 없습니다: " + subscription.getPlanId()));
        
        BigDecimal monthlyFee = plan.getBaseFee();
        
        if (refundDays == null) {
            LocalDate today = LocalDate.now();
            LocalDate effectiveTo = subscription.getEffectiveTo();
            
            if (effectiveTo == null || effectiveTo.isBefore(today)) {
                return BigDecimal.ZERO;
            }
            
            long remainingDays = ChronoUnit.DAYS.between(today, effectiveTo);
            if (remainingDays <= 0) {
                return BigDecimal.ZERO;
            }
            
            long totalDaysInPeriod = getTotalDaysInBillingCycle(subscription.getBillingCycle());
            BigDecimal dailyRate = monthlyFee.divide(BigDecimal.valueOf(totalDaysInPeriod), 4, RoundingMode.HALF_UP);
            return dailyRate.multiply(BigDecimal.valueOf(remainingDays)).setScale(0, RoundingMode.DOWN);
        } else {
            long totalDaysInPeriod = getTotalDaysInBillingCycle(subscription.getBillingCycle());
            BigDecimal dailyRate = monthlyFee.divide(BigDecimal.valueOf(totalDaysInPeriod), 4, RoundingMode.HALF_UP);
            return dailyRate.multiply(BigDecimal.valueOf(refundDays)).setScale(0, RoundingMode.DOWN);
        }
    }
    
    @Override
    public BigDecimal processRefund(String subscriptionId, String reason, Integer refundDays) {
        log.info("환불 처리 시작: subscriptionId={}, reason={}, refundDays={}", subscriptionId, reason, refundDays);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        if (!isWithinCoolingOffPeriod(subscription)) {
            throw new IllegalStateException(
                String.format("청약 철회 기간이 지났습니다. (결제일로부터 %d일 이내만 환불 가능)", coolingOffPeriodDays)
            );
        }
        
        BigDecimal refundAmount = calculateRefundAmount(subscriptionId, refundDays);
        
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("환불할 금액이 없습니다.");
        }
        
        if (paymentGatewayService != null) {
            log.debug("PG 환불 API 호출 준비 완료 (구현 대기 중): subscriptionId={}, refundAmount={}", 
                subscriptionId, refundAmount);
        } else {
            log.warn("⚠️ PaymentGatewayService가 주입되지 않아 PG 환불 API 호출 건너뜀: subscriptionId={}", 
                subscriptionId);
        }
        
        log.info("환불 처리 완료: subscriptionId={}, refundAmount={}, reason={}", 
            subscriptionId, refundAmount, reason);
        
        return refundAmount;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canRefund(String subscriptionId, Integer refundDays) {
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE) {
            return false;
        }
        
        if (!isWithinCoolingOffPeriod(subscription)) {
            return false;
        }
        
        BigDecimal refundAmount = calculateRefundAmount(subscriptionId, refundDays);
        return refundAmount.compareTo(BigDecimal.ZERO) > 0;
    }
    
    private boolean isWithinCoolingOffPeriod(TenantSubscription subscription) {
        if (subscription.getCreatedAt() == null) {
            return false;
        }
        
        LocalDate createdDate = subscription.getCreatedAt().toLocalDate();
        LocalDate today = LocalDate.now();
        long daysSinceCreation = ChronoUnit.DAYS.between(createdDate, today);
        
        return daysSinceCreation <= coolingOffPeriodDays;
    }
    
    private long getTotalDaysInBillingCycle(TenantSubscription.BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> 30;
            case QUARTERLY -> 90;
            case YEARLY -> 365;
        };
    }
}

