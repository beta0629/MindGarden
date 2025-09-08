package com.mindgarden.consultation.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.PaymentRequest;
import com.mindgarden.consultation.dto.PaymentResponse;
import com.mindgarden.consultation.dto.PaymentWebhookRequest;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.service.PaymentService;
import com.mindgarden.consultation.constant.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    /**
     * 결제 생성 (수퍼 어드민 전용)
     */
    @PostMapping
    public ResponseEntity<?> createPayment(@Valid @RequestBody PaymentRequest request, HttpServletRequest httpRequest) {
        // 수퍼 어드민 권한 체크
        String userRole = (String) httpRequest.getAttribute("userRole");
        if (!UserRole.SUPER_ADMIN.name().equals(userRole)) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 생성은 수퍼 어드민만 가능합니다.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(result);
        }
        try {
            log.info("결제 생성 요청: {}", request.getOrderId());
            
            PaymentResponse response = paymentService.createPayment(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "결제가 생성되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 생성 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 생성에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 조회
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPayment(@PathVariable String paymentId) {
        try {
            log.info("결제 조회: {}", paymentId);
            
            PaymentResponse response = paymentService.getPayment(paymentId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 목록 조회 (결제자별)
     */
    @GetMapping("/payer/{payerId}")
    public ResponseEntity<?> getPaymentsByPayerId(
            @PathVariable Long payerId,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            log.info("결제자별 결제 목록 조회: {}", payerId);
            
            Page<PaymentResponse> payments = paymentService.getPaymentsByPayerId(payerId, pageable);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", payments.getContent());
            result.put("totalElements", payments.getTotalElements());
            result.put("totalPages", payments.getTotalPages());
            result.put("currentPage", payments.getNumber());
            result.put("size", payments.getSize());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 목록 조회 (지점별)
     */
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<?> getPaymentsByBranchId(
            @PathVariable Long branchId,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            log.info("지점별 결제 목록 조회: {}", branchId);
            
            Page<PaymentResponse> payments = paymentService.getPaymentsByBranchId(branchId, pageable);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", payments.getContent());
            result.put("totalElements", payments.getTotalElements());
            result.put("totalPages", payments.getTotalPages());
            result.put("currentPage", payments.getNumber());
            result.put("size", payments.getSize());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("지점별 결제 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "지점별 결제 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 전체 결제 목록 조회 (관리자용)
     */
    @GetMapping
    public ResponseEntity<?> getAllPayments(@PageableDefault(size = 20) Pageable pageable) {
        try {
            log.info("전체 결제 목록 조회");
            
            Page<PaymentResponse> payments = paymentService.getAllPayments(pageable);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", payments.getContent());
            result.put("totalElements", payments.getTotalElements());
            result.put("totalPages", payments.getTotalPages());
            result.put("currentPage", payments.getNumber());
            result.put("size", payments.getSize());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("전체 결제 목록 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "전체 결제 목록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 상태 업데이트
     */
    @PutMapping("/{paymentId}/status")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable String paymentId,
            @RequestParam Payment.PaymentStatus status) {
        try {
            log.info("결제 상태 업데이트: {} -> {}", paymentId, status);
            
            PaymentResponse response = paymentService.updatePaymentStatus(paymentId, status);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "결제 상태가 업데이트되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 상태 업데이트 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 상태 업데이트에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 취소
     */
    @PostMapping("/{paymentId}/cancel")
    public ResponseEntity<?> cancelPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) String reason) {
        try {
            log.info("결제 취소: {}, 사유: {}", paymentId, reason);
            
            PaymentResponse response = paymentService.cancelPayment(paymentId, reason);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "결제가 취소되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 취소 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 취소에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 환불
     */
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<?> refundPayment(
            @PathVariable String paymentId,
            @RequestParam(required = false) BigDecimal amount,
            @RequestParam(required = false) String reason) {
        try {
            log.info("결제 환불: {}, 금액: {}, 사유: {}", paymentId, amount, reason);
            
            PaymentResponse response = paymentService.refundPayment(paymentId, amount, reason);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);
            result.put("message", "결제가 환불되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 환불 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 환불에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 검증
     */
    @PostMapping("/{paymentId}/verify")
    public ResponseEntity<?> verifyPayment(
            @PathVariable String paymentId,
            @RequestParam BigDecimal amount) {
        try {
            log.info("결제 검증: {}, 금액: {}", paymentId, amount);
            
            boolean isValid = paymentService.verifyPayment(paymentId, amount);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("isValid", isValid);
            result.put("message", isValid ? "결제가 유효합니다." : "결제가 유효하지 않습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 검증 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 검증에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getPaymentStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("결제 통계 조회: {} ~ {}", startDate, endDate);
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();
            
            Map<String, Object> statistics = paymentService.getPaymentStatistics(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", statistics);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 통계 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 지점별 결제 통계 조회
     */
    @GetMapping("/statistics/branch/{branchId}")
    public ResponseEntity<?> getBranchPaymentStatistics(
            @PathVariable Long branchId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("지점별 결제 통계 조회: {}, {} ~ {}", branchId, startDate, endDate);
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();
            
            Map<String, Object> statistics = paymentService.getBranchPaymentStatistics(branchId, start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", statistics);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("지점별 결제 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "지점별 결제 통계 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 월별 결제 통계 조회
     */
    @GetMapping("/statistics/monthly")
    public ResponseEntity<?> getMonthlyPaymentStatistics(@RequestParam int year) {
        try {
            log.info("월별 결제 통계 조회: {}", year);
            
            List<Map<String, Object>> statistics = paymentService.getMonthlyPaymentStatistics(year);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", statistics);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("월별 결제 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "월별 결제 통계 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 방법별 통계 조회
     */
    @GetMapping("/statistics/method")
    public ResponseEntity<?> getPaymentMethodStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("결제 방법별 통계 조회: {} ~ {}", startDate, endDate);
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();
            
            Map<String, Object> statistics = paymentService.getPaymentMethodStatistics(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", statistics);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 방법별 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 방법별 통계 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 대행사별 통계 조회
     */
    @GetMapping("/statistics/provider")
    public ResponseEntity<?> getPaymentProviderStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            log.info("결제 대행사별 통계 조회: {} ~ {}", startDate, endDate);
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : LocalDateTime.now().minusMonths(1);
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();
            
            Map<String, Object> statistics = paymentService.getPaymentProviderStatistics(start, end);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", statistics);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("결제 대행사별 통계 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "결제 대행사별 통계 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * 결제 Webhook 엔드포인트
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody PaymentWebhookRequest webhookRequest) {
        try {
            log.info("Webhook 수신: {}", webhookRequest.getPaymentId());
            
            boolean success = paymentService.processWebhook(webhookRequest);
            
            if (success) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Webhook 처리 완료"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Webhook 처리 실패"));
            }
            
        } catch (Exception e) {
            log.error("Webhook 처리 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Webhook 처리에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    
    /**
     * 만료된 결제 처리 (스케줄러용)
     */
    @PostMapping("/process-expired")
    public ResponseEntity<?> processExpiredPayments() {
        try {
            log.info("만료된 결제 처리 시작");
            
            int processedCount = paymentService.processExpiredPayments();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("processedCount", processedCount);
            result.put("message", "만료된 결제 " + processedCount + "건이 처리되었습니다.");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("만료된 결제 처리 실패: {}", e.getMessage(), e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "만료된 결제 처리에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
}
