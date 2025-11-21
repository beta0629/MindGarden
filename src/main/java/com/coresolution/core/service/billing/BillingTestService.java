package com.coresolution.core.service.billing;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 결제 테스트 서비스 인터페이스
 * 등록된 카드로 결제 승인 요청 및 취소/환불 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
public interface BillingTestService {
    
    /**
     * 등록된 결제 수단으로 결제 승인 요청 (테스트용)
     * 
     * @param paymentMethodId 결제 수단 ID
     * @param amount 결제 금액
     * @param orderId 주문 ID
     * @param orderName 주문명
     * @param customerKey 고객 키
     * @return 결제 승인 결과
     */
    Map<String, Object> approvePaymentWithBillingKey(
        String paymentMethodId,
        BigDecimal amount,
        String orderId,
        String orderName,
        String customerKey
    );
    
    /**
     * 결제 취소 (테스트용)
     * 
     * @param paymentKey 결제 키 (토스페이먼츠에서 받은 paymentKey)
     * @param cancelReason 취소 사유
     * @return 취소 결과
     */
    Map<String, Object> cancelPayment(String paymentKey, String cancelReason);
    
    /**
     * 결제 환불 (테스트용)
     * 
     * @param paymentKey 결제 키
     * @param cancelAmount 환불 금액
     * @param cancelReason 환불 사유
     * @return 환불 결과
     */
    Map<String, Object> refundPayment(String paymentKey, BigDecimal cancelAmount, String cancelReason);
    
    /**
     * 일회용 결제 승인 (테스트용)
     * 프론트엔드에서 받은 paymentKey로 결제 승인
     * 
     * @param paymentKey 결제 키 (프론트엔드에서 받은 paymentKey)
     * @param amount 결제 금액
     * @param orderId 주문번호
     * @return 결제 승인 결과
     */
    Map<String, Object> approveOneTimePayment(
        String paymentKey,
        BigDecimal amount,
        String orderId
    );
}

