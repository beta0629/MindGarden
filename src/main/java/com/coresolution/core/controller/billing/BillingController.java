package com.coresolution.core.controller.billing;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.controller.dto.billing.PaymentMethodCreateRequest;
import com.coresolution.core.controller.dto.billing.PaymentMethodResponse;
import com.coresolution.core.controller.dto.billing.SubscriptionCreateRequest;
import com.coresolution.core.controller.dto.billing.SubscriptionResponse;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.billing.PaymentMethodService;
import com.coresolution.core.service.billing.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결제 시스템 API 컨트롤러
 *
 * <p>표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임.
 * P0: 모든 테넌트 스코프 연산은 {@link TenantAccessControlService#validateTenantAccess(String)} 로 fail-closed.</p>
 *
 * @author CoreSolution
 * @version 2.1.0
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
    private final TenantAccessControlService tenantAccessControlService;

    /**
     * 결제 수단 토큰 등록 및 검증
     * POST /api/v1/billing/payment-methods
     */
    @PostMapping("/payment-methods")
    public ResponseEntity<ApiResponse<PaymentMethodResponse>> createPaymentMethod(
            @RequestBody @Valid PaymentMethodCreateRequest request) {
        log.info("결제 수단 등록 요청: pgProvider={}", request.pgProvider());
        requireTenantAccess(request.tenantId());

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
        tenantAccessControlService.validateTenantAccess(response.tenantId());

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

        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        tenantAccessControlService.validateTenantAccess(tenantId);

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
        requireTenantAccess(request.tenantId());

        SubscriptionResponse response = subscriptionService.createSubscription(request);

        log.info("✅ 구독 생성 완료: subscriptionId={}", response.subscriptionId());
        return created("구독이 생성되었습니다.", response);
    }

    /**
     * 테넌트의 구독 목록 조회
     * GET /api/v1/billing/subscriptions?tenantId={tenantId}
     */
    @GetMapping("/subscriptions")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getSubscriptions(
            @RequestParam(required = false) String tenantId) {
        log.debug("구독 목록 조회 요청: tenantId={}", tenantId);

        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        tenantAccessControlService.validateTenantAccess(tenantId);

        List<SubscriptionResponse> subscriptions = subscriptionService.listSubscriptionsByTenant(tenantId);

        log.debug("✅ 구독 목록 조회 완료: tenantId={}, count={}", tenantId, subscriptions.size());
        return success(subscriptions);
    }

    /**
     * 구독 활성화 (첫 결제 수행)
     * POST /api/v1/billing/subscriptions/{subscriptionId}/activate
     */
    @PostMapping("/subscriptions/{subscriptionId}/activate")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> activateSubscription(
            @PathVariable String subscriptionId) {
        log.info("구독 활성화 요청: subscriptionId={}", subscriptionId);

        SubscriptionResponse existing = subscriptionService.getSubscription(subscriptionId);
        tenantAccessControlService.validateTenantAccess(existing.tenantId());

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
        tenantAccessControlService.validateTenantAccess(response.tenantId());

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

        SubscriptionResponse existing = subscriptionService.getSubscription(subscriptionId);
        tenantAccessControlService.validateTenantAccess(existing.tenantId());

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

        PaymentMethodResponse existing = paymentMethodService.getPaymentMethod(paymentMethodId);
        tenantAccessControlService.validateTenantAccess(existing.tenantId());

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

        PaymentMethodResponse existing = paymentMethodService.getPaymentMethod(paymentMethodId);
        tenantAccessControlService.validateTenantAccess(existing.tenantId());
        if (StringUtils.hasText(request.tenantId())) {
            tenantAccessControlService.validateTenantAccess(request.tenantId());
        }

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
        tenantAccessControlService.validateTenantAccess(tenantId);

        PaymentMethodResponse response = paymentMethodService.setDefaultPaymentMethod(paymentMethodId, tenantId);

        log.info("✅ 기본 결제 수단 설정 완료: paymentMethodId={}", paymentMethodId);
        return updated("기본 결제 수단이 설정되었습니다.", response);
    }

    /**
     * body/query tenantId 가 비어 있지 않은지 확인 후 테넌트 접근 검증.
     *
     * @param tenantId 요청 테넌트 ID
     * @throws IllegalArgumentException tenantId 누락
     */
    private void requireTenantAccess(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        tenantAccessControlService.validateTenantAccess(tenantId);
    }
}
