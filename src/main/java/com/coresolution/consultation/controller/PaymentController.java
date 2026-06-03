package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.dto.PaymentWebhookRequest;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 컨트롤러
 *
 * <p>P0 보안 가드(2026-06-03 라운드 2): 상담사(CONSULTANT)·전문가 역할은 결제 정보 일체를
 * 조회·수정·통계 조회할 수 없도록 메서드 단위 {@link PreAuthorize} 가드를 명시한다.
 * 결제 단건 조회와 결제자별 목록은 CLIENT 가 호출하는 경우 {@link #assertClientOwnsPayment(HttpSession, String)} 또는
 * {@link #assertClientIsSelf(HttpSession, Long)} 로 소유자 검증을 수행한다.
 *
 * <p>SecurityConfig 매트릭스에도 {@code /api/v1/payments/**} 가 {@code authenticated()} 로 등록되어
 * 2중 방어선(매트릭스 + 메서드 가드)을 구성한다. 웹훅 경로(`/webhook`, `/webhooks/**`)는 매트릭스에서
 * permitAll 로 면제된다.
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-01-05
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("isAuthenticated()")
public class PaymentController extends BaseApiController {

    /** 결제 단건 / 결제자별 조회 허용 역할(소유자 검증 병행). */
    private static final String ROLES_READ_PAYMENT = "hasAnyRole('ADMIN','STAFF','CLIENT')";

    /** 결제 생성·상태 변경·취소·환불·통계 등 관리자 전용 역할. */
    private static final String ROLES_MANAGE_PAYMENT = "hasAnyRole('ADMIN','STAFF')";

    /** CONSULTANT 가 결제 정보를 조회·수정·통계에 접근할 때 발생시키는 권한 거부 사유. */
    private static final String DENIAL_MESSAGE_PAYMENT_FORBIDDEN = "결제 정보 접근 권한이 없습니다.";

    /** CLIENT 가 본인 소유가 아닌 결제 정보를 조회할 때 발생시키는 권한 거부 사유. */
    private static final String DENIAL_MESSAGE_PAYMENT_OWNERSHIP = "본인 결제 정보만 조회할 수 있습니다.";

    private final PaymentService paymentService;
    private final DynamicPermissionService dynamicPermissionService;

    /**
     * 결제 생성 (테넌트 관리자 등 결제 권한 보유자)
     */
    @PostMapping
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(@Valid @RequestBody PaymentRequest request, HttpServletRequest httpRequest) {
        // 동적 권한 체크 - 결제 기능 접근 권한
        String userRole = (String) httpRequest.getAttribute("userRole");
        UserRole role = UserRole.fromString(userRole);

        if (!dynamicPermissionService.canAccessPayment(role)) {
            throw new AccessDeniedException(DENIAL_MESSAGE_PAYMENT_FORBIDDEN);
        }

        log.info("결제 생성 요청: {}", request.getOrderId());

        PaymentResponse response = paymentService.createPayment(request);

        return created("결제가 생성되었습니다.", response);
    }

    /**
     * 결제 단건 조회. CLIENT 호출 시 본인 소유 결제만 허용한다.
     */
    @GetMapping("/{paymentId}")
    @PreAuthorize(ROLES_READ_PAYMENT)
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
            @PathVariable String paymentId,
            HttpSession session) {
        log.info("결제 조회: {}", paymentId);

        PaymentResponse response = paymentService.getPayment(paymentId);
        assertClientOwnsPayment(session, response);

        return success(response);
    }

    /**
     * 결제 목록 조회 (결제자별). CLIENT 호출 시 본인 ID 만 허용한다.
     */
    @GetMapping("/payer/{payerId}")
    @PreAuthorize(ROLES_READ_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentsByPayerId(
            @PathVariable Long payerId,
            @PageableDefault(size = 20) Pageable pageable,
            HttpSession session) {
        log.info("결제자별 결제 목록 조회: {}", payerId);

        assertClientIsSelf(session, payerId);

        Page<PaymentResponse> payments = paymentService.getPaymentsByPayerId(payerId, pageable);

        return success(buildPaymentsPage(payments));
    }

    /**
     * 결제 목록 조회 (지점별). 관리자/스태프 전용.
     */
    @GetMapping("/branch/{branchId}")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentsByBranchId(
            @PathVariable Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("지점별 결제 목록 조회: {}", branchId);

        Page<PaymentResponse> payments = paymentService.getPaymentsByBranchId(branchId, pageable);

        return success(buildPaymentsPage(payments));
    }

    /**
     * 전체 결제 목록 조회 (관리자용)
     */
    @GetMapping
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPayments(@PageableDefault(size = 20) Pageable pageable) {
        log.info("전체 결제 목록 조회");

        Page<PaymentResponse> payments = paymentService.getAllPayments(pageable);

        return success(buildPaymentsPage(payments));
    }

    /**
     * 결제 상태 업데이트 (관리자/스태프 전용).
     */
    @PutMapping("/{paymentId}/status")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @PathVariable String paymentId,
            @RequestParam Payment.PaymentStatus status) {
        log.info("결제 상태 업데이트: {} -> {}", paymentId, status);

        PaymentResponse response = paymentService.updatePaymentStatus(paymentId, status);

        return updated("결제 상태가 업데이트되었습니다.", response);
    }

    /**
     * 결제 취소 (관리자/스태프 전용).
     */
    @PostMapping("/{paymentId}/cancel")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<PaymentResponse>> cancelPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) String reason) {
        log.info("결제 취소: {}, 사유: {}", paymentId, reason);

        PaymentResponse response = paymentService.cancelPayment(paymentId, reason);

        return success("결제가 취소되었습니다.", response);
    }

    /**
     * 결제 환불 (관리자/스태프 전용).
     */
    @PostMapping("/{paymentId}/refund")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String reason) {
        log.info("결제 환불: {}, 금액: {}, 사유: {}", paymentId, amount, reason);

        PaymentResponse response = paymentService.refundPayment(paymentId, amount, reason);

        return success("결제가 환불되었습니다.", response);
    }

    /**
     * 결제 검증 (관리자/스태프 전용).
     */
    @PostMapping("/{paymentId}/verify")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(
            @PathVariable String paymentId,
            @RequestParam BigDecimal amount) {
        log.info("결제 검증: {}, 금액: {}", paymentId, amount);

        boolean isValid = paymentService.verifyPayment(paymentId, amount);

        Map<String, Object> data = new HashMap<>();
        data.put("isValid", isValid);
        data.put("message", isValid ? "결제가 유효합니다." : "결제가 유효하지 않습니다.");

        return success(data);
    }

    /**
     * 결제 통계 조회 (관리자/스태프 전용).
     */
    @GetMapping("/statistics")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("결제 통계 조회: {} ~ {}", startDate, endDate);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();

        Map<String, Object> statistics = paymentService.getPaymentStatistics(start, end);

        return success(statistics);
    }

    /**
     * 지점별 결제 통계 조회 (관리자/스태프 전용).
     */
    @GetMapping("/statistics/branch/{branchId}")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBranchPaymentStatistics(
            @PathVariable Long branchId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("지점별 결제 통계 조회: {}, {} ~ {}", branchId, startDate, endDate);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();

        Map<String, Object> statistics = paymentService.getBranchPaymentStatistics(branchId, start, end);

        return success(statistics);
    }

    /**
     * 월별 결제 통계 조회 (관리자/스태프 전용).
     */
    @GetMapping("/statistics/monthly")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyPaymentStatistics(@RequestParam int year) {
        log.info("월별 결제 통계 조회: {}", year);

        List<Map<String, Object>> statistics = paymentService.getMonthlyPaymentStatistics(year);

        return success(statistics);
    }

    /**
     * 결제 방법별 통계 조회 (관리자/스태프 전용).
     */
    @GetMapping("/statistics/method")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentMethodStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("결제 방법별 통계 조회: {} ~ {}", startDate, endDate);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();

        Map<String, Object> statistics = paymentService.getPaymentMethodStatistics(start, end);

        return success(statistics);
    }

    /**
     * 결제 대행사별 통계 조회 (관리자/스태프 전용).
     */
    @GetMapping("/statistics/provider")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentProviderStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        log.info("결제 대행사별 통계 조회: {} ~ {}", startDate, endDate);

        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();

        Map<String, Object> statistics = paymentService.getPaymentProviderStatistics(start, end);

        return success(statistics);
    }

    /**
     * 결제 Webhook 엔드포인트 (PG 콜백, 인증 면제).
     */
    @PostMapping("/webhook")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleWebhook(@RequestBody PaymentWebhookRequest webhookRequest) {
        log.info("Webhook 수신: {}", webhookRequest.getPaymentId());

        boolean success = paymentService.processWebhook(webhookRequest);

        if (!success) {
            throw new RuntimeException("Webhook 처리 실패");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("message", "Webhook 처리 완료");

        return success(data);
    }

    /**
     * 만료된 결제 처리 (스케줄러용, 관리자/스태프 전용).
     */
    @PostMapping("/process-expired")
    @PreAuthorize(ROLES_MANAGE_PAYMENT)
    public ResponseEntity<ApiResponse<Map<String, Object>>> processExpiredPayments() {
        log.info("만료된 결제 처리 시작");

        int processedCount = paymentService.processExpiredPayments();

        Map<String, Object> data = new HashMap<>();
        data.put("processedCount", processedCount);
        data.put("message", "만료된 결제 " + processedCount + "건이 처리되었습니다.");

        return success(data);
    }

    // ==================== Private Helper Methods ====================

    /**
     * Page&lt;PaymentResponse&gt; 를 표준 응답 Map 으로 변환한다.
     *
     * @param payments 결제 응답 페이지
     * @return payments / totalElements / totalPages / currentPage / size 키를 가진 Map
     */
    private Map<String, Object> buildPaymentsPage(Page<PaymentResponse> payments) {
        Map<String, Object> data = new HashMap<>();
        data.put("payments", payments.getContent());
        data.put("totalElements", payments.getTotalElements());
        data.put("totalPages", payments.getTotalPages());
        data.put("currentPage", payments.getNumber());
        data.put("size", payments.getSize());
        return data;
    }

    /**
     * CLIENT 가 자신의 결제만 조회하도록 강제한다. ADMIN/STAFF 는 우회한다.
     *
     * @param session  현재 세션
     * @param response 조회된 결제 응답
     * @throws AccessDeniedException 본인 소유가 아닌 결제에 접근한 경우
     */
    private void assertClientOwnsPayment(HttpSession session, PaymentResponse response) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getRole() == null) {
            return;
        }
        if (currentUser.getRole() != UserRole.CLIENT) {
            return;
        }
        Long currentUserId = currentUser.getId();
        Long payerId = response != null ? response.getPayerId() : null;
        if (currentUserId == null || payerId == null || !payerId.equals(currentUserId)) {
            log.warn("[security] payment ownership denied: userId={}, payerId={}, paymentId={}",
                    currentUserId, payerId, response != null ? response.getPaymentId() : null);
            throw new AccessDeniedException(DENIAL_MESSAGE_PAYMENT_OWNERSHIP);
        }
    }

    /**
     * CLIENT 가 자신의 payerId 만 조회하도록 강제한다. ADMIN/STAFF 는 우회한다.
     *
     * @param session         현재 세션
     * @param requestedPayerId 요청된 payerId
     * @throws AccessDeniedException 본인이 아닌 다른 사용자의 결제 목록에 접근한 경우
     */
    private void assertClientIsSelf(HttpSession session, Long requestedPayerId) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null || currentUser.getRole() == null) {
            return;
        }
        if (currentUser.getRole() != UserRole.CLIENT) {
            return;
        }
        Long currentUserId = currentUser.getId();
        if (currentUserId == null || requestedPayerId == null || !requestedPayerId.equals(currentUserId)) {
            log.warn("[security] payments list ownership denied: userId={}, requestedPayerId={}",
                    currentUserId, requestedPayerId);
            throw new AccessDeniedException(DENIAL_MESSAGE_PAYMENT_OWNERSHIP);
        }
    }
}
