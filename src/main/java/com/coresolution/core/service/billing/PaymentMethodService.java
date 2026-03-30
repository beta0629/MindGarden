package com.coresolution.core.service.billing;

import com.coresolution.core.controller.dto.billing.PaymentMethodCreateRequest;
import com.coresolution.core.controller.dto.billing.PaymentMethodResponse;

import java.util.List;

/**
 * 결제 수단 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface PaymentMethodService {
    
    /**
     * 결제 수단 생성 (토큰 저장 및 검증)
     */
    PaymentMethodResponse createPaymentMethod(PaymentMethodCreateRequest request);
    
    /**
     * 결제 수단 조회
     */
    PaymentMethodResponse getPaymentMethod(String paymentMethodId);
    
    /**
     * 테넌트의 결제 수단 목록 조회
     */
    List<PaymentMethodResponse> getPaymentMethodsByTenant(String tenantId);
    
    /**
     * 기본 결제 수단 설정
     */
    PaymentMethodResponse setDefaultPaymentMethod(String paymentMethodId, String tenantId);
    
    /**
     * 결제 수단 삭제 (소프트 삭제)
     */
    void deletePaymentMethod(String paymentMethodId);
    
    /**
     * 결제 수단 업데이트 (새 토큰으로 교체)
     */
    PaymentMethodResponse updatePaymentMethod(String paymentMethodId, PaymentMethodCreateRequest request);
}

