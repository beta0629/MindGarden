package com.coresolution.core.controller.billing;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.service.billing.BillingTestService;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 빌링 결제 테스트 컨트롤러 (로컬 전용).
 *
 * <p>빈 등록은 {@code local} 프로필에서만 수행되며({@code isDev=true} 조건 포함),
 * 모든 엔드포인트는 {@link Environment#acceptsProfiles(String...)} 로 한 번 더 fail-closed 가드한다.
 *
 * <p>URL 경로는 기존 {@code /api/v1/billing/test/**} 를 유지하여 local QA 스크립트 호환을 보장한다.
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2026-09-08
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Profile("local")
@ConditionalOnProperty(name = "isDev", havingValue = "true")
public class BillingTestController extends BaseApiController {

    private static final String LOCAL_PROFILE = "local";
    private static final String FORBIDDEN_MESSAGE =
            "이 API는 로컬 개발 환경에서만 사용할 수 있습니다. / This API is available only in the local profile.";

    private final BillingTestService billingTestService;
    private final Environment environment;

    /**
     * local 프로필이 아니면 403 본문을 반환한다. 통과 시 null.
     *
     * @return 403 ResponseEntity 또는 null
     */
    private ResponseEntity<Map<String, Object>> forbidUnlessLocal() {
        if (!environment.acceptsProfiles(LOCAL_PROFILE)) {
            log.warn("🚫 non-local profile에서 빌링 테스트 API 차단");
            return ResponseEntity.status(403)
                    .body(Map.of("error", FORBIDDEN_MESSAGE));
        }
        return null;
    }

    /**
     * 등록된 결제 수단으로 결제 승인 테스트 (테스트용)
     * POST /api/v1/billing/test/approve-payment
     *
     * @param request 결제 승인 요청 본문
     * @return 승인 결과
     */
    @PostMapping("/test/approve-payment")
    public ResponseEntity<?> testApprovePayment(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("결제 승인 테스트 요청: {}", request);

        String paymentMethodId = (String) request.get("paymentMethodId");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = request.get("orderId") != null
                ? (String) request.get("orderId")
                : "test-order-" + UUID.randomUUID().toString();
        String orderName = request.get("orderName") != null
                ? (String) request.get("orderName")
                : "테스트 결제";
        String customerKey = (String) request.get("customerKey");

        Map<String, Object> result = billingTestService.approvePaymentWithBillingKey(
                paymentMethodId, amount, orderId, orderName, customerKey);

        log.info("✅ 결제 승인 테스트 완료: success={}", result.get("success"));
        return success(result);
    }

    /**
     * 결제 취소 테스트 (테스트용)
     * POST /api/v1/billing/test/cancel-payment
     *
     * @param request 결제 취소 요청 본문
     * @return 취소 결과
     */
    @PostMapping("/test/cancel-payment")
    public ResponseEntity<?> testCancelPayment(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

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
     *
     * @param request 결제 환불 요청 본문
     * @return 환불 결과
     */
    @PostMapping("/test/refund-payment")
    public ResponseEntity<?> testRefundPayment(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("결제 환불 테스트 요청: {}", request);

        String paymentKey = (String) request.get("paymentKey");
        java.math.BigDecimal cancelAmount =
                new java.math.BigDecimal(request.get("cancelAmount").toString());
        String cancelReason = request.get("cancelReason") != null
                ? (String) request.get("cancelReason")
                : "테스트 환불";

        Map<String, Object> result =
                billingTestService.refundPayment(paymentKey, cancelAmount, cancelReason);

        log.info("✅ 결제 환불 테스트 완료: success={}", result.get("success"));
        return success(result);
    }

    /**
     * 결제 승인 → 취소 전체 테스트 (테스트용)
     * POST /api/v1/billing/test/full-payment-test
     *
     * @param request 전체 플로우 요청 본문
     * @return 승인·취소 결과
     */
    @PostMapping("/test/full-payment-test")
    public ResponseEntity<?> testFullPaymentFlow(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        log.info("결제 전체 플로우 테스트 요청: {}", request);

        String paymentMethodId = (String) request.get("paymentMethodId");
        java.math.BigDecimal amount = new java.math.BigDecimal(request.get("amount").toString());
        String orderId = request.get("orderId") != null
                ? (String) request.get("orderId")
                : "test-order-" + UUID.randomUUID().toString();
        String orderName = request.get("orderName") != null
                ? (String) request.get("orderName")
                : "테스트 결제";
        String customerKey = (String) request.get("customerKey");

        Map<String, Object> fullResult = new HashMap<>();

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

        log.info("2단계: 결제 취소 요청");
        Map<String, Object> cancelResult =
                billingTestService.cancelPayment(paymentKey, "테스트 완료 후 취소");
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
     * @param request 일회용 결제 승인 요청 본문
     * @return 승인 결과
     */
    @PostMapping("/test/approve-one-time-payment")
    public ResponseEntity<?> testApproveOneTimePayment(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

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

        Map<String, Object> result =
                billingTestService.approveOneTimePayment(paymentKey, amount, orderId);

        log.info("✅ 일회용 결제 승인 테스트 완료: success={}", result.get("success"));
        return success(result);
    }

    /**
     * 일회용 결제 승인 → 취소 전체 테스트 (테스트용)
     * POST /api/v1/billing/test/full-one-time-payment-test
     *
     * @param request 일회용 전체 플로우 요청 본문
     * @return 승인·취소 결과
     */
    @PostMapping("/test/full-one-time-payment-test")
    public ResponseEntity<?> testFullOneTimePaymentFlow(
            @RequestBody Map<String, Object> request) {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

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

        log.info("1단계: 일회용 결제 승인 요청");
        Map<String, Object> approveResult =
                billingTestService.approveOneTimePayment(paymentKey, amount, orderId);
        fullResult.put("approve", approveResult);

        if (!Boolean.TRUE.equals(approveResult.get("success"))) {
            fullResult.put("message", "일회용 결제 승인 실패로 테스트 중단");
            return success(fullResult);
        }

        String approvedPaymentKey = (String) approveResult.get("paymentKey");
        log.info("✅ 일회용 결제 승인 성공: paymentKey={}", approvedPaymentKey);

        log.info("2단계: 결제 취소 요청");
        Map<String, Object> cancelResult =
                billingTestService.cancelPayment(approvedPaymentKey, "테스트 완료 후 취소");
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
