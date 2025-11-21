package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.PaymentFailureRequest;
import com.coresolution.consultation.dto.PaymentFailureResponse;
import com.coresolution.consultation.dto.PaymentRefundRequest;
import com.coresolution.consultation.dto.PaymentRefundResponse;

/**
 * 결제 실패/취소/환불 처리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface PaymentFailureService {
    
    /**
     * 결제 실패 처리
     * 
     * @param request 결제 실패 요청
     * @return 실패 처리 결과
     */
    PaymentFailureResponse handlePaymentFailure(PaymentFailureRequest request);
    
    /**
     * 결제 취소 처리
     * 
     * @param paymentId 결제 ID
     * @param reason 취소 사유
     * @return 취소 처리 결과
     */
    boolean cancelPayment(String paymentId, String reason);
    
    /**
     * 결제 환불 처리
     * 
     * @param request 환불 요청
     * @return 환불 처리 결과
     */
    PaymentRefundResponse processRefund(PaymentRefundRequest request);
    
    /**
     * 결제 재시도 처리
     * 
     * @param paymentId 결제 ID
     * @return 재시도 처리 결과
     */
    boolean retryPayment(String paymentId);
    
    /**
     * 결제 실패 통계 조회
     * 
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 실패 통계
     */
    Object getFailureStatistics(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
}
