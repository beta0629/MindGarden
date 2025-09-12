package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.PaymentStatusResponse;
import com.mindgarden.consultation.entity.Payment;

/**
 * 결제 상태 관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface PaymentStatusService {
    
    /**
     * 실시간 결제 상태 확인
     * 
     * @param paymentId 결제 ID
     * @return 최신 결제 상태
     */
    PaymentStatusResponse checkPaymentStatus(String paymentId);
    
    /**
     * 결제 상태 업데이트
     * 
     * @param paymentId 결제 ID
     * @param newStatus 새로운 상태
     * @return 업데이트 결과
     */
    boolean updatePaymentStatus(String paymentId, Payment.PaymentStatus newStatus);
    
    /**
     * 결제 상태 동기화 (외부 시스템과)
     * 
     * @param paymentId 결제 ID
     * @return 동기화 결과
     */
    boolean syncPaymentStatus(String paymentId);
    
    /**
     * 만료된 결제 처리
     * 
     * @return 처리된 결제 수
     */
    int processExpiredPayments();
    
    /**
     * 결제 상태 알림 전송
     * 
     * @param paymentId 결제 ID
     * @param status 상태
     * @return 전송 결과
     */
    boolean sendPaymentNotification(String paymentId, String status);
}
