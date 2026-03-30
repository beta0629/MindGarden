package com.coresolution.core.controller.billing;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.controller.dto.billing.PaymentMethodCreateRequest;
import com.coresolution.core.controller.dto.billing.PaymentMethodResponse;
import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.billing.PaymentMethodService;
import com.coresolution.core.service.billing.SubscriptionService;
import com.coresolution.core.service.billing.BillingTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 결제 시스템 API 컨트롤러
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BillingController extends BaseApiController {
    
    private final PaymentMethodService paymentMethodService;
    private final SubscriptionService subscriptionService;
    private final BillingTestService billingTestService;
    
    /**
     * 결제 수단 토큰 등록 및 검증
     * POST /api/v1/billing/payment-methods
     */
    @PostMapping("/payment-methods")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> createPaymentMethod(
            @RequestBody @Valid PaymentMethodCreateRequest request) {
        log.info("결제 수단 등록 요청: pgProvider={}", request.pgProvider());
        
        PaymentMethodResponse response = paymentMethodService.createPaymentMethod(request);
        
        log.info("✅ 결제 수단 등록 완료: paymentMethodId={}", response.paymentMethodId());
        return created("결제 수단이 등록되었습니다.", response);
    }
    
    /**
     * 결제 수단 조회
     * GET /api/v1/billing/payment-methods/{paymentMethodId}
     */
    @GetMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> getPaymentMethod(
            @PathVariable String paymentMethodId) {
        log.debug("결제 수단 조회 요청: paymentMethodId={}", paymentMethodId);
        
        PaymentMethodResponse response = paymentMethodService.getPaymentMethod(paymentMethodId);
        
        return success(response);
    }
    
    /**
     * 테넌트의 결제 수단 목록 조회
     * GET /api/v1/billing/payment-methods?tenantId={tenantId}
     */
    @GetMapping("/payment-methods")
    public ResponseEntity<ApiResponse<List<PaymentMethodResponse>>> getPaymentMethods(
            @RequestParam(required = false) String tenantId) {
        log.debug("결제 수단 목록 조회 요청: tenantId={}", tenantId);
        
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        
        List<PaymentMethodResponse> paymentMethods = paymentMethodService.getPaymentMethodsByTenant(tenantId);
        
        log.debug("✅ 결제 수단 목록 조회 완료: tenantId={}, count={}", tenantId, paymentMethods.size());
        return success(paymentMethods);
    }
    
    /**
     * 구독 생성
     * POST /api/v1/billing/subscriptions
     */
    @PostMapping("/subscriptions")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(
            @RequestBody @Valid SubscriptionCreateRequest request) {
        log.info("구독 생성 요청: planId={}, tenantId={}", request.planId(), request.tenantId());
        
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        
        log.info("✅ 구독 생성 완료: subscriptionId={}", response.subscriptionId());
        return created("구독이 생성되었습니다.", response);
    }
    
    /**
     * 구독 활성화 (첫 결제 수행)
     * POST /api/v1/billing/subscriptions/{subscriptionId}/activate
     */
    @PostMapping("/subscriptions/{subscriptionId}/activate")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateSubscription(
            @PathVariable String subscriptionId) {
        log.info("구독 활성화 요청: subscriptionId={}", subscriptionId);
        
        SubscriptionResponse response = subscriptionService.activateSubscription(subscriptionId);
        
        log.info("✅ 구독 활성화 완료: subscriptionId={}", subscriptionId);
        return updated("구독이 활성화되었습니다.", response);
    }
    
    /**
     * 구독 정보 조회
     * GET /api/v1/billing/subscriptions/{subscriptionId}
     */
    @GetMapping("/subscriptions/{subscriptionId}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscription(
            @PathVariable String subscriptionId) {
        log.debug("구독 조회 요청: subscriptionId={}", subscriptionId);
        
        SubscriptionResponse response = subscriptionService.getSubscription(subscriptionId);
        
        return success(response);
    }
    
    /**
     * 구독 취소
     * POST /api/v1/billing/subscriptions/{subscriptionId}/cancel
     */
    @PostMapping("/subscriptions/{subscriptionId}/cancel")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscription(
            @PathVariable String subscriptionId) {
        log.info("구독 취소 요청: subscriptionId={}", subscriptionId);
        
        SubscriptionResponse response = subscriptionService.cancelSubscription(subscriptionId);
        
        log.info("✅ 구독 취소 완료: subscriptionId={}", subscriptionId);
        return updated("구독이 취소되었습니다.", response);
    }
    
    /**
     * 결제 수단 삭제
     * DELETE /api/v1/billing/payment-methods/{paymentMethodId}
     */
    @DeleteMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<ApiResponse<Void>> deletePaymentMethod(
            @PathVariable String paymentMethodId) {
        log.info("결제 수단 삭제 요청: paymentMethodId={}", paymentMethodId);
        
        paymentMethodService.deletePaymentMethod(paymentMethodId);
        
        log.info("✅ 결제 수단 삭제 완료: paymentMethodId={}", paymentMethodId);
        return success("결제 수단이 삭제되었습니다.", null);
    }
    
    /**
     * 결제 수단 업데이트 (새 토큰으로 교체)
     * PUT /api/v1/billing/payment-methods/{paymentMethodId}
     */
    @PutMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> updatePaymentMethod(
            @PathVariable String paymentMethodId,
            @RequestBody @Valid PaymentMethodCreateRequest request) {
        log.info("결제 수단 업데이트 요청: paymentMethodId={}", paymentMethodId);
        
        PaymentMethodResponse response = paymentMethodService.updatePaymentMethod(paymentMethodId, request);
        
        log.info("✅ 결제 수단 업데이트 완료: paymentMethodId={}", paymentMethodId);
        return updated("결제 수단이 업데이트되었습니다.", response);
    }
    
    /**
     * 기본 결제 수단 설정
     * PUT /api/v1/billing/payment-methods/{paymentMethodId}/set-default?tenantId={tenantId}
     */
    @PutMapping("/payment-methods/{paymentMethodId}/set-default")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> setDefaultPaymentMethod(
            @PathVariable String paymentMethodId,
            @RequestParam String tenantId) {
        log.info("기본 결제 수단 설정 요청: paymentMethodId={}, tenantId={}", paymentMethodId, tenantId);
        
        PaymentMethodResponse response = paymentMethodService.setDefaultPaymentMethod(paymentMethodId, tenantId);
        
        log.info("✅ 기본 결제 수단 설정 완료: paymentMethodId={}", paymentMethodId);
        return updated("기본 결제 수단이 설정되었습니다.", response);
    }
    
    /**
     * 등록된 결제 수단으로 결제 승인 테스트 (테스트용)
     * POST /api/v1/billing/test/approve-payment
     */
    @PostMapping("/test/approve-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testApprovePayment(
            @RequestBody Map<String, Object> request) {
        log.info("결제 승인 테스트 요청: {}", request);
        
        String paymentMethodId = (String) request.get("paymentMethodId");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = request.get("orderId") != null ? (String) request.get("orderId") : "test-order-" + UUID.randomUUID().toString();
        String orderName = request.get("orderName") != null ? (String) request.get("orderName") : "테스트 결제";
        String customerKey = (String) request.get("customerKey");
        
        Map<String, Object> result = billingTestService.approvePaymentWithBillingKey(
            paymentMethodId, amount, orderId, orderName, customerKey);
        
        log.info("✅ 결제 승인 테스트 완료: success={}", result.get("success"));
        return success(result);
    }
    
    /**
     * 결제 취소 테스트 (테스트용)
     * POST /api/v1/billing/test/cancel-payment
     */
    @PostMapping("/test/cancel-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testCancelPayment(
            @RequestBody Map<String, Object> request) {
        log.info("결제 취소 테스트 요청: {}", request);
        
        String paymentKey = (String) request.get("paymentKey");
        String cancelReason = request.get("cancelReason") != null 
            ? (String) request.get("cancelReason") 
            : "테스트 취소";
        
        Map<String, Object> result = billingTestService.cancelPayment(paymentKey, cancelReason);
        
        log.info("✅ 결제 취소 테스트 완료: success={}", result.get("success"));
        return success(result);
    }
    
    /**
     * 결제 환불 테스트 (테스트용)
     * POST /api/v1/billing/test/refund-payment
     */
    @PostMapping("/test/refund-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testRefundPayment(
            @RequestBody Map<String, Object> request) {
        log.info("결제 환불 테스트 요청: {}", request);
        
        String paymentKey = (String) request.get("paymentKey");
        java.math.BigDecimal cancelAmount = new java.math.BigDecimal(request.get("cancelAmount").toString());
        String cancelReason = request.get("cancelReason") != null 
            ? (String) request.get("cancelReason") 
            : "테스트 환불";
        
        Map<String, Object> result = billingTestService.refundPayment(paymentKey, cancelAmount, cancelReason);
        
        log.info("✅ 결제 환불 테스트 완료: success={}", result.get("success"));
        return success(result);
    }
    
    /**
     * 결제 승인 → 취소 전체 테스트 (테스트용)
     * POST /api/v1/billing/test/full-payment-test
     */
    @PostMapping("/test/full-payment-test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testFullPaymentFlow(
            @RequestBody Map<String, Object> request) {
        log.info("결제 전체 플로우 테스트 요청: {}", request);
        
        String paymentMethodId = (String) request.get("paymentMethodId");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = request.get("orderId") != null ? (String) request.get("orderId") : "test-order-" + UUID.randomUUID().toString();
        String orderName = request.get("orderName") != null ? (String) request.get("orderName") : "테스트 결제";
        String customerKey = (String) request.get("customerKey");
        
        Map<String, Object> fullResult = new HashMap<>();
        
        // 1. 결제 승인
        log.info("1단계: 결제 승인 요청");
        Map<String, Object> approveResult = billingTestService.approvePaymentWithBillingKey(
            paymentMethodId, amount, orderId, orderName, customerKey);
        fullResult.put("approve", approveResult);
        
        if (!Boolean.TRUE.equals(approveResult.get("success"))) {
            fullResult.put("message", "결제 승인 실패로 테스트 중단");
            return success(fullResult);
        }
        
        String paymentKey = (String) approveResult.get("paymentKey");
        log.info("✅ 결제 승인 성공: paymentKey={}", paymentKey);
        
        // 2. 결제 취소
        log.info("2단계: 결제 취소 요청");
        Map<String, Object> cancelResult = billingTestService.cancelPayment(paymentKey, "테스트 완료 후 취소");
        fullResult.put("cancel", cancelResult);
        
        if (!Boolean.TRUE.equals(cancelResult.get("success"))) {
            fullResult.put("message", "결제 취소 실패");
            return success(fullResult);
        }
        
        log.info("✅ 결제 취소 성공: paymentKey={}", paymentKey);
        fullResult.put("success", true);
        fullResult.put("message", "결제 승인 → 취소 전체 플로우 테스트 완료");
        
        return success(fullResult);
    }
    
    /**
     * 일회용 결제 승인 테스트 (테스트용)
     * POST /api/v1/billing/test/approve-one-time-payment
     * 
     * 프론트엔드에서 payment.requestPayment()로 결제창을 열고,
     * 사용자가 결제를 완료하면 successUrl로 리다이렉트되며 paymentKey가 전달됩니다.
     * 이 paymentKey를 사용하여 백엔드에서 결제를 승인합니다.
     */
    @PostMapping("/test/approve-one-time-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testApproveOneTimePayment(
            @RequestBody Map<String, Object> request) {
        log.info("일회용 결제 승인 테스트 요청: {}", request);
        
        String paymentKey = (String) request.get("paymentKey");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = (String) request.get("orderId");
        
        if (paymentKey == null || paymentKey.isEmpty()) {
            throw new IllegalArgumentException("paymentKey는 필수입니다.");
        }
        if (orderId == null || orderId.isEmpty()) {
            throw new IllegalArgumentException("orderId는 필수입니다.");
        }
        
        Map<String, Object> result = billingTestService.approveOneTimePayment(paymentKey, amount, orderId);
        
        log.info("✅ 일회용 결제 승인 테스트 완료: success={}", result.get("success"));
        return success(result);
    }
    
    /**
     * 일회용 결제 승인 → 취소 전체 테스트 (테스트용)
     * POST /api/v1/billing/test/full-one-time-payment-test
     */
    @PostMapping("/test/full-one-time-payment-test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testFullOneTimePaymentFlow(
            @RequestBody Map<String, Object> request) {
        log.info("일회용 결제 전체 플로우 테스트 요청: {}", request);
        
        String paymentKey = (String) request.get("paymentKey");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = (String) request.get("orderId");
        
        if (paymentKey == null || paymentKey.isEmpty()) {
            throw new IllegalArgumentException("paymentKey는 필수입니다.");
        }
        if (orderId == null || orderId.isEmpty()) {
            throw new IllegalArgumentException("orderId는 필수입니다.");
        }
        
        Map<String, Object> fullResult = new HashMap<>();
        
        // 1. 일회용 결제 승인
        log.info("1단계: 일회용 결제 승인 요청");
        Map<String, Object> approveResult = billingTestService.approveOneTimePayment(paymentKey, amount, orderId);
        fullResult.put("approve", approveResult);
        
        if (!Boolean.TRUE.equals(approveResult.get("success"))) {
            fullResult.put("message", "일회용 결제 승인 실패로 테스트 중단");
            return success(fullResult);
        }
        
        String approvedPaymentKey = (String) approveResult.get("paymentKey");
        log.info("✅ 일회용 결제 승인 성공: paymentKey={}", approvedPaymentKey);
        
        // 2. 결제 취소
        log.info("2단계: 결제 취소 요청");
        Map<String, Object> cancelResult = billingTestService.cancelPayment(approvedPaymentKey, "테스트 완료 후 취소");
        fullResult.put("cancel", cancelResult);
        
        if (!Boolean.TRUE.equals(cancelResult.get("success"))) {
            fullResult.put("message", "결제 취소 실패");
            return success(fullResult);
        }
        
        log.info("✅ 결제 취소 성공: paymentKey={}", approvedPaymentKey);
        fullResult.put("success", true);
        fullResult.put("message", "일회용 결제 승인 → 취소 전체 플로우 테스트 완료");
        
        return success(fullResult);
    }
}

