package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.dto.PaymentStatusResponse;

/**
 * 결제 대행사 연동 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface PaymentGatewayService {
    
    /**
     * 결제 요청 생성
     * 
     * @param request 결제 요청 정보
     * @return 결제 응답 (결제 페이지 URL 등)
     */
    PaymentResponse createPayment(PaymentRequest request);
    
    /**
     * 결제 상태 확인
     * 
     * @param paymentId 결제 ID
     * @return 결제 상태 정보
     */
    PaymentStatusResponse getPaymentStatus(String paymentId);
    
    /**
     * 결제 취소
     * 
     * @param paymentId 결제 ID
     * @param reason 취소 사유
     * @return 취소 결과
     */
    boolean cancelPayment(String paymentId, String reason);
    
    /**
     * 결제 환불
     * 
     * @param paymentId 결제 ID
     * @param amount 환불 금액
     * @param reason 환불 사유
     * @return 환불 결과
     */
    boolean refundPayment(String paymentId, java.math.BigDecimal amount, String reason);
    
    /**
     * Webhook 서명 검증
     * 
     * @param payload 요청 본문
     * @param signature 서명
     * @param timestamp 타임스탬프
     * @return 검증 결과
     */
    boolean verifyWebhookSignature(String payload, String signature, String timestamp);
}
