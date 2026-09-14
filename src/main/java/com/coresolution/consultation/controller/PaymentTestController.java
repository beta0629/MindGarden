package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentWebhookRequest;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.service.BankTransferService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.core.controller.BaseApiController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 테스트 컨트롤러 (로컬 전용).
 *
 * <p>빈 등록은 {@code local} 프로필에서만 수행되며({@code isDev=true} 조건 포함),
 * 모든 엔드포인트는 {@link Environment#acceptsProfiles(String...)} 로 한 번 더 fail-closed 가드한다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/test/payment") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@Profile("local")
@ConditionalOnProperty(name = "isDev", havingValue = "true")
public class PaymentTestController extends BaseApiController {

    private static final String LOCAL_PROFILE = "local";
    private static final String FORBIDDEN_MESSAGE =
            "이 API는 로컬 개발 환경에서만 사용할 수 있습니다. / This API is available only in the local profile.";

    private final PaymentService paymentService;
    private final BankTransferService bankTransferService;
    private final Environment environment;
    private final Random random = new Random();

    @Value("${frontend.base-url:${FRONTEND_BASE_URL:http://localhost:3000}}")
    private String frontendBaseUrl;

    /**
     * local 프로필이 아니면 403 본문을 반환한다. 통과 시 null.
     *
     * @return 403 ResponseEntity 또는 null
     */
    private ResponseEntity<Map<String, Object>> forbidUnlessLocal() {
        if (!environment.acceptsProfiles(LOCAL_PROFILE)) {
            log.warn("🚫 non-local profile에서 결제 테스트 API 차단");
            return ResponseEntity.status(403)
                    .body(Map.of("error", FORBIDDEN_MESSAGE));
        }
        return null;
    }

    /**
     * 프론트엔드 기본 URL 반환
     *
     * @return 프론트엔드 base URL
     */
    private String getFrontendBaseUrl() {
        // 환경변수 우선 확인
        String envUrl = System.getenv("FRONTEND_BASE_URL");
        if (envUrl != null && !envUrl.trim().isEmpty()) {
            return envUrl;
        }

        // 프로퍼티 값 사용
        if (frontendBaseUrl != null && !frontendBaseUrl.trim().isEmpty()) {
            return frontendBaseUrl;
        }

        // 기본값
        return "http://localhost:3000";
    }

    /**
     * 테스트 결제 생성
     *
     * @param method 결제 수단
     * @param provider 결제 제공자
     * @param amount 금액
     * @param payerId 결제자 ID
     * @return 생성 결과
     */
    @PostMapping("/create")
    public ResponseEntity<?> createTestPayment(
            @RequestParam(defaultValue = "CARD") String method,
            @RequestParam(defaultValue = "TOSS") String provider,
            @RequestParam(defaultValue = "100000") Long amount,
            @RequestParam(defaultValue = "1") Long payerId) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        PaymentRequest request = PaymentRequest.builder()
                .orderId("TEST_ORDER_" + System.currentTimeMillis())
                .amount(BigDecimal.valueOf(amount))
                .method(method)
                .provider(provider)
                .payerId(payerId)
                .recipientId(1L) // 테스트 수취인
                .branchId(1L) // 테스트 지점
                .description("테스트 결제 - " + method + " " + provider)
                .timeoutMinutes(30)
                .successUrl(getFrontendBaseUrl() + "/payment/success")
                .failUrl(getFrontendBaseUrl() + "/payment/fail")
                .cancelUrl(getFrontendBaseUrl() + "/payment/cancel")
                .build();

        var response = paymentService.createPayment(request);

        return created("테스트 결제가 생성되었습니다.", response);
    }

    /**
     * 다양한 결제 시나리오 테스트
     *
     * @return 시나리오 결과
     */
    @PostMapping("/scenarios")
    public ResponseEntity<?> testPaymentScenarios() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        List<Map<String, Object>> results = new ArrayList<>();

        // 시나리오 1: 카드 결제 성공
        results.add(testScenario("카드 결제 성공", "CARD", "TOSS", 50000L, true));

        // 시나리오 2: 계좌이체 결제
        results.add(testScenario("계좌이체 결제", "BANK_TRANSFER", "IAMPORT", 100000L, true));

        // 시나리오 3: 가상계좌 결제
        results.add(testScenario("가상계좌 결제", "VIRTUAL_ACCOUNT", "TOSS", 200000L, true));

        // 시나리오 4: 모바일 결제
        results.add(testScenario("모바일 결제", "MOBILE", "KAKAO", 75000L, true));

        // 시나리오 5: 결제 실패 (금액 초과)
        results.add(testScenario("결제 실패 (금액 초과)", "CARD", "TOSS", 20000000L, false));

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("scenarios", results);
        result.put("message", "결제 시나리오 테스트가 완료되었습니다.");

        return ResponseEntity.ok(result);
    }

    /**
     * 결제 상태 변경 테스트
     *
     * @param paymentId 결제 ID
     * @param status 변경할 상태
     * @return 상태 변경 결과
     */
    @PostMapping("/status-test")
    public ResponseEntity<?> testPaymentStatusChanges(
            @RequestParam String paymentId,
            @RequestParam(defaultValue = "APPROVED") String status) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            Payment.PaymentStatus paymentStatus = Payment.PaymentStatus.valueOf(status);
            var response = paymentService.updatePaymentStatus(paymentId, paymentStatus);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "결제 상태가 " + status + "로 변경되었습니다.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("결제 상태 변경 테스트 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 상태 변경에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Webhook 테스트
     *
     * @param paymentId 결제 ID
     * @param status 웹훅 상태
     * @return 웹훅 처리 결과
     */
    @PostMapping("/webhook-test")
    public ResponseEntity<?> testWebhook(
            @RequestParam String paymentId,
            @RequestParam(defaultValue = "APPROVED") String status) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            PaymentWebhookRequest webhookRequest = PaymentWebhookRequest.builder()
                    .paymentId(paymentId)
                    .orderId("TEST_ORDER_" + System.currentTimeMillis())
                    .status(status)
                    .amount(BigDecimal.valueOf(100000))
                    .method("CARD")
                    .provider("TOSS")
                    .approvedAt(LocalDateTime.now())
                    .externalPaymentKey("ext_" + System.currentTimeMillis())
                    .signature("test_signature")
                    .timestamp(System.currentTimeMillis())
                    .build();

            boolean success = paymentService.processWebhook(webhookRequest);

            Map<String, Object> result = new HashMap<>();
            result.put("success", success);
            result.put("message", success ? "Webhook 처리가 성공했습니다." : "Webhook 처리가 실패했습니다.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Webhook 테스트 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Webhook 테스트에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 결제 통계 테스트
     *
     * @return 통계 조회 결과
     */
    @GetMapping("/statistics-test")
    public ResponseEntity<?> testPaymentStatistics() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            LocalDateTime startDate = LocalDateTime.now().minusDays(30);
            LocalDateTime endDate = LocalDateTime.now();

            var statistics = paymentService.getPaymentStatistics(startDate, endDate);
            var methodStats = paymentService.getPaymentMethodStatistics(startDate, endDate);
            var providerStats = paymentService.getPaymentProviderStatistics(startDate, endDate);
            var monthlyStats = paymentService.getMonthlyPaymentStatistics(2025);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", Map.of(
                "general", statistics,
                "method", methodStats,
                "provider", providerStats,
                "monthly", monthlyStats
            ));
            result.put("message", "결제 통계 테스트가 완료되었습니다.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("결제 통계 테스트 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 통계 테스트에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 입금 확인 테스트
     *
     * @param paymentId 결제 ID
     * @param amount 입금 금액
     * @param depositorName 입금자명
     * @return 입금 확인 결과
     */
    @PostMapping("/deposit-test")
    public ResponseEntity<?> testDepositConfirmation(
            @RequestParam String paymentId,
            @RequestParam Long amount,
            @RequestParam(defaultValue = "테스트입금자") String depositorName) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            boolean success = bankTransferService.confirmDeposit(paymentId, amount, depositorName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", success);
            result.put("message", success ? "입금 확인이 성공했습니다." : "입금 확인이 실패했습니다.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("입금 확인 테스트 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "입금 확인 테스트에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 결제 취소/환불 테스트
     *
     * @param paymentId 결제 ID
     * @param action cancel 또는 refund
     * @param amount 환불 금액 (선택)
     * @return 취소/환불 결과
     */
    @PostMapping("/cancel-refund-test")
    public ResponseEntity<?> testCancelRefund(
            @RequestParam String paymentId,
            @RequestParam(defaultValue = "cancel") String action,
            @RequestParam(required = false) Long amount) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            Object response;
            String message;

            if ("cancel".equals(action)) {
                response = paymentService.cancelPayment(paymentId, "테스트 취소");
                message = "결제 취소가 완료되었습니다.";
            } else {
                response = paymentService.refundPayment(paymentId,
                    amount != null ? BigDecimal.valueOf(amount) : null, "테스트 환불");
                message = "결제 환불이 완료되었습니다.";
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", message);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("결제 취소/환불 테스트 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 취소/환불 테스트에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * 대량 결제 데이터 생성
     *
     * @param count 생성 건수
     * @return 대량 생성 결과
     */
    @PostMapping("/bulk-create")
    public ResponseEntity<?> createBulkPayments(
            @RequestParam(defaultValue = "10") int count) {

        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        List<Map<String, Object>> results = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            try {
                String[] methods = {"CARD", "BANK_TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE", "CASH"};
                String[] providers = {"TOSS", "IAMPORT", "KAKAO", "NAVER"};

                String method = methods[random.nextInt(methods.length)];
                String provider = providers[random.nextInt(providers.length)];
                Long amount = (long) (random.nextInt(500000) + 10000); // 10,000 ~ 510,000

                PaymentRequest request = PaymentRequest.builder()
                        .orderId("BULK_ORDER_" + System.currentTimeMillis() + "_" + i)
                        .amount(BigDecimal.valueOf(amount))
                        .method(method)
                        .provider(provider)
                        .payerId((long) (random.nextInt(10) + 1))
                        .recipientId(1L)
                        .branchId((long) (random.nextInt(3) + 1))
                        .description("대량 테스트 결제 " + (i + 1))
                        .timeoutMinutes(30)
                        .build();

                var response = paymentService.createPayment(request);

                Map<String, Object> result = new HashMap<>();
                result.put("index", i + 1);
                result.put("success", true);
                result.put("paymentId", response.getPaymentId());
                result.put("amount", amount);
                result.put("method", method);
                result.put("provider", provider);

                results.add(result);

            } catch (Exception e) {
                Map<String, Object> result = new HashMap<>();
                result.put("index", i + 1);
                result.put("success", false);
                result.put("error", e.getMessage());
                results.add(result);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("results", results);
        response.put("totalCount", count);
        response.put("successCount", results.stream().mapToInt(r -> (Boolean) r.get("success") ? 1 : 0).sum());
        response.put("message", "대량 결제 데이터 생성이 완료되었습니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 결제 시스템 상태 확인
     *
     * @return 헬스 체크 결과
     */
    @GetMapping("/health")
    public ResponseEntity<?> checkPaymentSystemHealth() {
        ResponseEntity<Map<String, Object>> forbidden = forbidUnlessLocal();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            Map<String, Object> health = new HashMap<>();

            // 기본 통계 조회 테스트
            var statistics = paymentService.getPaymentStatistics(
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now()
            );
            health.put("statistics", "OK");

            // 미확인 입금 조회 테스트
            var unconfirmedDeposits = bankTransferService.getUnconfirmedDeposits();
            health.put("deposits", "OK");
            health.put("unconfirmedCount", unconfirmedDeposits.size());

            // 만료된 결제 처리 테스트
            int expiredCount = paymentService.processExpiredPayments();
            health.put("expiredProcessing", "OK");
            health.put("expiredCount", expiredCount);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("health", health);
            result.put("message", "결제 시스템이 정상적으로 작동하고 있습니다.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("결제 시스템 상태 확인 실패: {}", e.getMessage(), e);

            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 시스템 상태 확인에 실패했습니다: " + e.getMessage());

            return ResponseEntity.badRequest().body(result);
        }
    }

    // ==================== Private Methods ====================

    private Map<String, Object> testScenario(String name, String method, String provider, Long amount, boolean shouldSucceed) {
        Map<String, Object> result = new HashMap<>();
        result.put("scenario", name);
        result.put("method", method);
        result.put("provider", provider);
        result.put("amount", amount);

        try {
            PaymentRequest request = PaymentRequest.builder()
                    .orderId("SCENARIO_" + System.currentTimeMillis())
                    .amount(BigDecimal.valueOf(amount))
                    .method(method)
                    .provider(provider)
                    .payerId(1L)
                    .recipientId(1L)
                    .branchId(1L)
                    .description("시나리오 테스트: " + name)
                    .timeoutMinutes(30)
                    .build();

            var response = paymentService.createPayment(request);
            result.put("success", true);
            result.put("paymentId", response.getPaymentId());
            result.put("status", response.getStatus());

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("expectedFailure", !shouldSucceed);
        }

        return result;
    }
}
