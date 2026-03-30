package com.coresolution.core.service.billing.impl;

import com.coresolution.core.domain.billing.PaymentMethod;
import com.coresolution.core.repository.billing.PaymentMethodRepository;
import com.coresolution.core.service.billing.BillingTestService;
import com.coresolution.consultation.service.impl.TossPaymentServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 결제 테스트 서비스 구현
 * 등록된 카드로 결제 승인 요청 및 취소/환불 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BillingTestServiceImpl implements BillingTestService {
    
    private final PaymentMethodRepository paymentMethodRepository;
    private final TossPaymentServiceImpl tossPaymentService;
    
    @Override
    public Map<String, Object> approvePaymentWithBillingKey(
            String paymentMethodId,
            BigDecimal amount,
            String orderId,
            String orderName,
            String customerKey) {
        
        log.info("등록된 결제 수단으로 결제 승인 요청: paymentMethodId={}, amount={}, orderId={}", 
            paymentMethodId, amount, orderId);
        
        try {
            // 1. 결제 수단 조회
            PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodId(paymentMethodId)
                .orElseThrow(() -> new IllegalArgumentException("결제 수단을 찾을 수 없습니다: " + paymentMethodId));
            
            // 2. billingKey 추출 (원본 토큰 사용)
            String billingKey = paymentMethod.getPaymentMethodToken();
            
            if (billingKey == null || billingKey.isEmpty()) {
                throw new IllegalArgumentException("결제 수단에 billingKey가 없습니다: " + paymentMethodId);
            }
            
            log.info("billingKey로 결제 승인 요청: billingKey={}, amount={}", billingKey, amount);
            
            // 3. 토스페이먼츠 SDK를 통한 결제 승인 API 호출
            Map<String, Object> result = tossPaymentService.approvePaymentWithBillingKey(
                billingKey, amount, orderId, orderName, customerKey);
            
            return result;
            
        } catch (Exception e) {
            log.error("결제 승인 요청 실패: paymentMethodId={}, error={}", paymentMethodId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "결제 승인 요청 실패: " + e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Map<String, Object> cancelPayment(String paymentKey, String cancelReason) {
        log.info("결제 취소 요청: paymentKey={}, reason={}", paymentKey, cancelReason);
        
        try {
            // 토스페이먼츠 SDK를 통한 결제 취소
            boolean success = tossPaymentService.cancelPayment(paymentKey, cancelReason);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", success);
            result.put("paymentKey", paymentKey);
            result.put("message", success ? "결제 취소 성공" : "결제 취소 실패");
            
            return result;
            
        } catch (Exception e) {
            log.error("결제 취소 실패: paymentKey={}, error={}", paymentKey, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "결제 취소 실패: " + e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Map<String, Object> refundPayment(String paymentKey, BigDecimal cancelAmount, String cancelReason) {
        log.info("결제 환불 요청: paymentKey={}, amount={}, reason={}", paymentKey, cancelAmount, cancelReason);
        
        try {
            // 토스페이먼츠 SDK를 통한 결제 환불
            boolean success = tossPaymentService.refundPayment(paymentKey, cancelAmount, cancelReason);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", success);
            result.put("paymentKey", paymentKey);
            result.put("cancelAmount", cancelAmount);
            result.put("message", success ? "결제 환불 성공" : "결제 환불 실패");
            
            return result;
            
        } catch (Exception e) {
            log.error("결제 환불 실패: paymentKey={}, error={}", paymentKey, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "결제 환불 실패: " + e.getMessage());
            return errorResult;
        }
    }
    
    @Override
    public Map<String, Object> approveOneTimePayment(
            String paymentKey,
            BigDecimal amount,
            String orderId) {
        
        log.info("일회용 결제 승인 요청: paymentKey={}, amount={}, orderId={}", paymentKey, amount, orderId);
        
        try {
            // 토스페이먼츠 SDK를 통한 일회용 결제 승인
            Map<String, Object> result = tossPaymentService.approveOneTimePayment(paymentKey, amount, orderId);
            
            return result;
            
        } catch (Exception e) {
            log.error("일회용 결제 승인 실패: paymentKey={}, error={}", paymentKey, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "일회용 결제 승인 요청 실패: " + e.getMessage());
            return errorResult;
        }
    }
    
}

