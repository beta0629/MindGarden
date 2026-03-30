package com.coresolution.core.service.billing;

import java.math.BigDecimal;

/**
 * 구독 환불 처리 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface SubscriptionRefundService {
    
    /**
     * 환불 금액 계산
     * 
     * @param subscriptionId 구독 ID
     * @param refundDays 환불할 일수 (null이면 전체 환불)
     * @return 환불 금액
     */
    BigDecimal calculateRefundAmount(String subscriptionId, Integer refundDays);
    
    /**
     * 환불 처리
     * 
     * @param subscriptionId 구독 ID
     * @param reason 환불 사유
     * @param refundDays 환불할 일수 (null이면 전체 환불)
     * @return 환불 금액
     */
    BigDecimal processRefund(String subscriptionId, String reason, Integer refundDays);
    
    /**
     * 부분 환불 가능 여부 확인
     * 
     * @param subscriptionId 구독 ID
     * @param refundDays 환불할 일수
     * @return 환불 가능 여부
     */
    boolean canRefund(String subscriptionId, Integer refundDays);
}

