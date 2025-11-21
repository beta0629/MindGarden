package com.coresolution.core.service.billing;

import java.math.BigDecimal;

/**
 * 구독 요금제 변경 서비스
 * 업그레이드/다운그레이드 시 차액 계산 및 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SubscriptionPlanChangeService {
    
    /**
     * 요금제 변경 차액 계산
     * 
     * @param subscriptionId 구독 ID
     * @param newPlanId 새로운 요금제 ID
     * @param applyImmediately 즉시 적용 여부
     * @return 차액 (양수면 추가 결제, 음수면 환불)
     */
    BigDecimal calculatePriceDifference(String subscriptionId, String newPlanId, boolean applyImmediately);
    
    /**
     * 요금제 변경 가능 여부 확인
     * 
     * @param subscriptionId 구독 ID
     * @param newPlanId 새로운 요금제 ID
     * @return 변경 가능 여부
     */
    boolean canChangePlan(String subscriptionId, String newPlanId);
    
    /**
     * 요금제 변경 처리
     * 
     * @param subscriptionId 구독 ID
     * @param newPlanId 새로운 요금제 ID
     * @param applyImmediately 즉시 적용 여부
     * @return 차액
     */
    BigDecimal processPlanChange(String subscriptionId, String newPlanId, boolean applyImmediately);
}

