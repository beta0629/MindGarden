package com.coresolution.core.service.billing;

import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;

import java.util.List;

/**
 * 구독 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SubscriptionService {
    
    /**
     * 구독 생성
     */
    SubscriptionResponse createSubscription(SubscriptionCreateRequest request);
    
    /**
     * 구독 활성화 (첫 결제 수행)
     */
    SubscriptionResponse activateSubscription(String subscriptionId);
    
    /**
     * 구독 조회
     */
    SubscriptionResponse getSubscription(String subscriptionId);
    
    /**
     * 테넌트별 구독 조회
     */
    SubscriptionResponse getSubscriptionByTenant(String tenantId);
    
    /**
     * 구독 취소
     */
    SubscriptionResponse cancelSubscription(String subscriptionId);
    
    /**
     * 구독 만료 처리
     */
    SubscriptionResponse expireSubscription(String subscriptionId, String reason);
    
    /**
     * 구독 일시정지
     */
    SubscriptionResponse suspendSubscription(String subscriptionId, String reason);
    
    /**
     * 구독 재개
     */
    SubscriptionResponse resumeSubscription(String subscriptionId);
    
    /**
     * 구독 환불 처리
     */
    SubscriptionResponse refundSubscription(String subscriptionId, String reason, Integer refundDays);
    
    /**
     * 구독 업그레이드 (요금제 변경 - 상위 요금제)
     */
    SubscriptionResponse upgradeSubscription(String subscriptionId, String newPlanId, boolean applyImmediately);
    
    /**
     * 구독 다운그레이드 (요금제 변경 - 하위 요금제)
     */
    SubscriptionResponse downgradeSubscription(String subscriptionId, String newPlanId, boolean applyImmediately);
    
    /**
     * 구독 요금제 변경 (업그레이드/다운그레이드 통합)
     */
    SubscriptionResponse changePlan(String subscriptionId, String newPlanId, boolean applyImmediately);
}

