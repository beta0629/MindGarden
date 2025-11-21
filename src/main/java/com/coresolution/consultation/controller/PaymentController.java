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
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/payments", "/api/payments"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("isAuthenticated()")
public class PaymentController extends BaseApiController {
    
    private final PaymentService paymentService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 결제 생성 (수퍼 어드민 전용)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(@Valid @RequestBody PaymentRequest request, HttpServletRequest httpRequest) {
        // 동적 권한 체크 - 결제 기능 접근 권한
        String userRole = (String) httpRequest.getAttribute("userRole");
        UserRole role = UserRole.fromString(userRole);
        
        if (!dynamicPermissionService.canAccessPayment(role)) {
            throw new org.springframework.security.access.AccessDeniedException("결제 기능 접근 권한이 없습니다.");
        }
        
        log.info("결제 생성 요청: {}", request.getOrderId());
        
        PaymentResponse response = paymentService.createPayment(request);
        
        return created("결제가 생성되었습니다.", response);
    }
    
    /**
     * 결제 조회
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable String paymentId) {
        log.info("결제 조회: {}", paymentId);
        
        PaymentResponse response = paymentService.getPayment(paymentId);
        
        return success(response);
    }
    
    /**
     * 결제 목록 조회 (결제자별)
     */
    @GetMapping("/payer/{payerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentsByPayerId(
            @PathVariable Long payerId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("결제자별 결제 목록 조회: {}", payerId);
        
        Page<PaymentResponse> payments = paymentService.getPaymentsByPayerId(payerId, pageable);
        
        Map<String, Object> data = new HashMap<>();
        data.put("payments", payments.getContent());
        data.put("totalElements", payments.getTotalElements());
        data.put("totalPages", payments.getTotalPages());
        data.put("currentPage", payments.getNumber());
        data.put("size", payments.getSize());
        
        return success(data);
    }
    
    /**
     * 결제 목록 조회 (지점별)
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentsByBranchId(
            @PathVariable Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("지점별 결제 목록 조회: {}", branchId);
        
        Page<PaymentResponse> payments = paymentService.getPaymentsByBranchId(branchId, pageable);
        
        Map<String, Object> data = new HashMap<>();
        data.put("payments", payments.getContent());
        data.put("totalElements", payments.getTotalElements());
        data.put("totalPages", payments.getTotalPages());
        data.put("currentPage", payments.getNumber());
        data.put("size", payments.getSize());
        
        return success(data);
    }
    
    /**
     * 전체 결제 목록 조회 (관리자용)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPayments(@PageableDefault(size = 20) Pageable pageable) {
        log.info("전체 결제 목록 조회");
        
        Page<PaymentResponse> payments = paymentService.getAllPayments(pageable);
        
        Map<String, Object> data = new HashMap<>();
        data.put("payments", payments.getContent());
        data.put("totalElements", payments.getTotalElements());
        data.put("totalPages", payments.getTotalPages());
        data.put("currentPage", payments.getNumber());
        data.put("size", payments.getSize());
        
        return success(data);
    }
    
    /**
     * 결제 상태 업데이트
     */
    @PutMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @PathVariable String paymentId,
            @RequestParam Payment.PaymentStatus status) {
        log.info("결제 상태 업데이트: {} -> {}", paymentId, status);
        
        PaymentResponse response = paymentService.updatePaymentStatus(paymentId, status);
        
        return updated("결제 상태가 업데이트되었습니다.", response);
    }
    
    /**
     * 결제 취소
     */
    @PostMapping("/{paymentId}/cancel")
    public ResponseEntity<ApiResponse<PaymentResponse>> cancelPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) String reason) {
        log.info("결제 취소: {}, 사유: {}", paymentId, reason);
        
        PaymentResponse response = paymentService.cancelPayment(paymentId, reason);
        
        return success("결제가 취소되었습니다.", response);
    }
    
    /**
     * 결제 환불
     */
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String reason) {
        log.info("결제 환불: {}, 금액: {}, 사유: {}", paymentId, amount, reason);
        
        PaymentResponse response = paymentService.refundPayment(paymentId, amount, reason);
        
        return success("결제가 환불되었습니다.", response);
    }
    
    /**
     * 결제 검증
     */
    @PostMapping("/{paymentId}/verify")
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
     * 결제 통계 조회
     */
    @GetMapping("/statistics")
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
     * 지점별 결제 통계 조회
     */
    @GetMapping("/statistics/branch/{branchId}")
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
     * 월별 결제 통계 조회
     */
    @GetMapping("/statistics/monthly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyPaymentStatistics(@RequestParam int year) {
        log.info("월별 결제 통계 조회: {}", year);
        
        List<Map<String, Object>> statistics = paymentService.getMonthlyPaymentStatistics(year);
        
        return success(statistics);
    }
    
    /**
     * 결제 방법별 통계 조회
     */
    @GetMapping("/statistics/method")
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
     * 결제 대행사별 통계 조회
     */
    @GetMapping("/statistics/provider")
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
     * 결제 Webhook 엔드포인트
     */
    @PostMapping("/webhook")
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
     * 만료된 결제 처리 (스케줄러용)
     */
    @PostMapping("/process-expired")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processExpiredPayments() {
        log.info("만료된 결제 처리 시작");
        
        int processedCount = paymentService.processExpiredPayments();
        
        Map<String, Object> data = new HashMap<>();
        data.put("processedCount", processedCount);
        data.put("message", "만료된 결제 " + processedCount + "건이 처리되었습니다.");
        
        return success(data);
    }
}
