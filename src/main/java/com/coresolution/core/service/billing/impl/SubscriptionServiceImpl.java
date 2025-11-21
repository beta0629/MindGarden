package com.coresolution.core.service.billing.impl;

import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;
import com.coresolution.core.domain.TenantSubscription;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.billing.PaymentMethodRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.service.billing.SubscriptionPlanChangeService;
import com.coresolution.core.service.billing.SubscriptionRefundService;
import com.coresolution.core.service.billing.SubscriptionService;
import com.coresolution.consultation.service.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 구독 서비스 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionServiceImpl implements SubscriptionService {
    
    private final TenantSubscriptionRepository subscriptionRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final SubscriptionRefundService refundService;
    private final SubscriptionPlanChangeService planChangeService;
    
    /**
     * PG 결제 대행사 서비스 (선택적 주입)
     * 실제 PG 결제 API 호출에 사용
     * Note: 테넌트별 PG 설정이 필요하므로 추후 TenantPgConfigurationService와 통합 필요
     */
    @Autowired(required = false)
    @Qualifier("tossPaymentService")
    private PaymentGatewayService paymentGatewayService;
    
    @Override
    public SubscriptionResponse createSubscription(SubscriptionCreateRequest request) {
        log.info("구독 생성 요청: planId={}, tenantId={}", request.planId(), request.tenantId());
        
        // 요금제 확인
        if (!pricingPlanRepository.findByPlanId(request.planId()).isPresent()) {
            throw new IllegalArgumentException("요금제를 찾을 수 없습니다: " + request.planId());
        }
        
        // 결제 수단 확인
        paymentMethodRepository.findByPaymentMethodId(request.paymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + request.paymentMethodId()));
        
        // 청구 주기 파싱
        TenantSubscription.BillingCycle billingCycle = parseBillingCycle(request.billingCycle());
        
        // 구독 엔티티 생성
        TenantSubscription subscription = TenantSubscription.builder()
                .subscriptionId(UUID.randomUUID().toString())
                .tenantId(request.tenantId())
                .planId(request.planId())
                .status(TenantSubscription.SubscriptionStatus.DRAFT)
                .effectiveFrom(LocalDate.now())
                .billingCycle(billingCycle)
                .paymentMethod(request.paymentMethodId())
                .autoRenewal(request.autoRenewal() != null ? request.autoRenewal() : true)
                .build();
        
        // 다음 청구일 계산
        subscription.setNextBillingDate(calculateNextBillingDate(LocalDate.now(), billingCycle));
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 생성 완료: subscriptionId={}", subscription.getSubscriptionId());
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse activateSubscription(String subscriptionId) {
        log.info("구독 활성화 요청: subscriptionId={}", subscriptionId);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // 상태 변경: DRAFT -> PENDING_ACTIVATION -> ACTIVE
        if (subscription.getStatus() == TenantSubscription.SubscriptionStatus.DRAFT) {
            subscription.setStatus(TenantSubscription.SubscriptionStatus.PENDING_ACTIVATION);
        }
        
        // 실제 PG 결제 수행 (첫 결제)
        // Note: 테넌트별 PG 설정이 필요하므로 추후 TenantPgConfigurationService와 통합 필요
        // Note: PaymentRequest 생성 및 PaymentGatewayService.createPayment() 호출 필요
        // 현재는 상태만 ACTIVE로 변경 (실제 PG 연동은 추후 구현)
        if (paymentGatewayService != null) {
            // TODO: 실제 PG 결제 API 호출 구현
            // 1. PricingPlan에서 금액 조회
            // 2. PaymentRequest 생성
            // 3. PaymentGatewayService.createPayment() 호출
            // 4. 결제 성공 시 paymentId를 TenantSubscription에 저장
            log.debug("PG 결제 API 호출 준비 완료 (구현 대기 중): subscriptionId={}", subscriptionId);
        } else {
            log.warn("⚠️ PaymentGatewayService가 주입되지 않아 PG 결제 API 호출 건너뜀: subscriptionId={}", 
                subscriptionId);
        }
        
        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);
        subscription.setEffectiveFrom(LocalDate.now());
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 활성화 완료: subscriptionId={}", subscription.getSubscriptionId());
        
        return toResponse(subscription);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscription(String subscriptionId) {
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        return toResponse(subscription);
    }
    
    @Override
    @Transactional(readOnly = true)
    public SubscriptionResponse getSubscriptionByTenant(String tenantId) {
        TenantSubscription subscription = subscriptionRepository
                .findFirstByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("테넌트의 구독을 찾을 수 없습니다: " + tenantId));
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse cancelSubscription(String subscriptionId) {
        log.info("구독 취소 요청: subscriptionId={}", subscriptionId);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // ACTIVE 상태만 취소 가능
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("활성 상태의 구독만 취소할 수 있습니다. 현재 상태: " + subscription.getStatus());
        }
        
        subscription.setStatus(TenantSubscription.SubscriptionStatus.CANCELLED);
        subscription.setEffectiveTo(LocalDate.now());
        subscription.setAutoRenewal(false);
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 취소 완료: subscriptionId={}", subscription.getSubscriptionId());
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse expireSubscription(String subscriptionId, String reason) {
        log.info("구독 만료 처리: subscriptionId={}, reason={}", subscriptionId, reason);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // ACTIVE 또는 SUSPENDED 상태만 만료 가능
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE &&
            subscription.getStatus() != TenantSubscription.SubscriptionStatus.SUSPENDED) {
            throw new IllegalStateException("활성 또는 일시정지 상태의 구독만 만료할 수 있습니다. 현재 상태: " + subscription.getStatus());
        }
        
        subscription.setStatus(TenantSubscription.SubscriptionStatus.TERMINATED);
        subscription.setEffectiveTo(LocalDate.now());
        subscription.setAutoRenewal(false);
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 만료 처리 완료: subscriptionId={}, reason={}", subscriptionId, reason);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse suspendSubscription(String subscriptionId, String reason) {
        log.info("구독 일시정지 요청: subscriptionId={}, reason={}", subscriptionId, reason);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // ACTIVE 상태만 일시정지 가능
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("활성 상태의 구독만 일시정지할 수 있습니다. 현재 상태: " + subscription.getStatus());
        }
        
        subscription.setStatus(TenantSubscription.SubscriptionStatus.SUSPENDED);
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 일시정지 완료: subscriptionId={}, reason={}", subscriptionId, reason);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse resumeSubscription(String subscriptionId) {
        log.info("구독 재개 요청: subscriptionId={}", subscriptionId);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // SUSPENDED 상태만 재개 가능
        if (subscription.getStatus() != TenantSubscription.SubscriptionStatus.SUSPENDED) {
            throw new IllegalStateException("일시정지 상태의 구독만 재개할 수 있습니다. 현재 상태: " + subscription.getStatus());
        }
        
        subscription.setStatus(TenantSubscription.SubscriptionStatus.ACTIVE);
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 재개 완료: subscriptionId={}", subscriptionId);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse refundSubscription(String subscriptionId, String reason, Integer refundDays) {
        log.info("구독 환불 처리: subscriptionId={}, reason={}, refundDays={}", subscriptionId, reason, refundDays);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        // 환불 가능 여부 확인
        if (!refundService.canRefund(subscriptionId, refundDays)) {
            throw new IllegalStateException("환불할 수 없는 구독입니다.");
        }
        
        // 환불 금액 계산 및 처리
        BigDecimal refundAmount = refundService.processRefund(subscriptionId, reason, refundDays);
        
        // 구독 상태 변경
        if (refundDays == null) {
            // 전체 환불: 구독 취소
            subscription.setStatus(TenantSubscription.SubscriptionStatus.CANCELLED);
            subscription.setEffectiveTo(LocalDate.now());
            subscription.setAutoRenewal(false);
        } else {
            // 부분 환불: 상태 유지 (필요시 SUSPENDED로 변경 가능)
            // 부분 환불은 구독을 유지하되, 환불 금액만 처리
        }
        
        subscription = subscriptionRepository.save(subscription);
        
        log.info("구독 환불 처리 완료: subscriptionId={}, refundAmount={}, refundDays={}", 
            subscriptionId, refundAmount, refundDays);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse upgradeSubscription(String subscriptionId, String newPlanId, boolean applyImmediately) {
        log.info("구독 업그레이드 요청: subscriptionId={}, newPlanId={}, applyImmediately={}", 
            subscriptionId, newPlanId, applyImmediately);
        
        // 요금제 변경 처리
        BigDecimal priceDifference = planChangeService.processPlanChange(subscriptionId, newPlanId, applyImmediately);
        
        if (priceDifference.compareTo(BigDecimal.ZERO) <= 0) {
            log.warn("업그레이드인데 차액이 0 이하: subscriptionId={}, priceDifference={}", 
                subscriptionId, priceDifference);
        }
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        log.info("구독 업그레이드 완료: subscriptionId={}, newPlanId={}, priceDifference={}", 
            subscriptionId, newPlanId, priceDifference);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse downgradeSubscription(String subscriptionId, String newPlanId, boolean applyImmediately) {
        log.info("구독 다운그레이드 요청: subscriptionId={}, newPlanId={}, applyImmediately={}", 
            subscriptionId, newPlanId, applyImmediately);
        
        // 요금제 변경 처리
        BigDecimal priceDifference = planChangeService.processPlanChange(subscriptionId, newPlanId, applyImmediately);
        
        if (priceDifference.compareTo(BigDecimal.ZERO) >= 0) {
            log.warn("다운그레이드인데 차액이 0 이상: subscriptionId={}, priceDifference={}", 
                subscriptionId, priceDifference);
        }
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        log.info("구독 다운그레이드 완료: subscriptionId={}, newPlanId={}, priceDifference={}", 
            subscriptionId, newPlanId, priceDifference);
        
        return toResponse(subscription);
    }
    
    @Override
    public SubscriptionResponse changePlan(String subscriptionId, String newPlanId, boolean applyImmediately) {
        log.info("구독 요금제 변경 요청: subscriptionId={}, newPlanId={}, applyImmediately={}", 
            subscriptionId, newPlanId, applyImmediately);
        
        // 요금제 변경 처리 (업그레이드/다운그레이드 자동 판단)
        BigDecimal priceDifference = planChangeService.processPlanChange(subscriptionId, newPlanId, applyImmediately);
        
        TenantSubscription subscription = subscriptionRepository.findBySubscriptionId(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독을 찾을 수 없습니다: " + subscriptionId));
        
        String changeType = priceDifference.compareTo(BigDecimal.ZERO) > 0 ? "업그레이드" : "다운그레이드";
        log.info("구독 요금제 변경 완료: subscriptionId={}, newPlanId={}, type={}, priceDifference={}", 
            subscriptionId, newPlanId, changeType, priceDifference);
        
        return toResponse(subscription);
    }
    
    private TenantSubscription.BillingCycle parseBillingCycle(String billingCycle) {
        if (billingCycle == null || billingCycle.isEmpty()) {
            return TenantSubscription.BillingCycle.MONTHLY;
        }
        
        try {
            return TenantSubscription.BillingCycle.valueOf(billingCycle.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("알 수 없는 청구 주기: {}, 기본값 MONTHLY 사용", billingCycle);
            return TenantSubscription.BillingCycle.MONTHLY;
        }
    }
    
    private LocalDate calculateNextBillingDate(LocalDate from, TenantSubscription.BillingCycle cycle) {
        return switch (cycle) {
            case MONTHLY -> from.plusMonths(1);
            case QUARTERLY -> from.plusMonths(3);
            case YEARLY -> from.plusYears(1);
        };
    }
    
    private SubscriptionResponse toResponse(TenantSubscription subscription) {
        return new SubscriptionResponse(
                subscription.getSubscriptionId(),
                subscription.getTenantId(),
                subscription.getPlanId(),
                subscription.getStatus().name(),
                subscription.getEffectiveFrom(),
                subscription.getEffectiveTo(),
                subscription.getBillingCycle() != null ? subscription.getBillingCycle().name() : "MONTHLY",
                subscription.getPaymentMethod(),
                subscription.getAutoRenewal(),
                subscription.getNextBillingDate(),
                subscription.getCreatedAt(),
                subscription.getUpdatedAt()
        );
    }
}

