package com.coresolution.core.service.billing;

import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;

import java.time.LocalDate;
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
     * 테넌트별 구독 목록 조회 (삭제되지 않은 항목). 없으면 빈 리스트.
     *
     * @param tenantId 테넌트 ID
     * @return 구독 응답 목록
     */
    List<SubscriptionResponse> listSubscriptionsByTenant(String tenantId);
    
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

    /**
     * 유효 구독이 있는지.
     *
     * <p>{@code tenant_subscriptions} 에서 status=ACTIVE, is_deleted=false 이고
     * {@link com.coresolution.core.domain.TenantSubscription#isActive()} 와
     * {@link com.coresolution.core.domain.TenantSubscription#isEffective(LocalDate)} 를
     * 만족하는 행이 있으면 true. {@code tenants.subscription_status} 는 사용하지 않는다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param today    기준일. null 이면 Asia/Seoul 오늘
     * @return 유효 구독이 있으면 true
     */
    boolean hasEffectiveSubscription(String tenantId, LocalDate today);
}

