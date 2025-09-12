package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.PaymentConstants;
import com.mindgarden.consultation.dto.PaymentRequest;
import com.mindgarden.consultation.dto.PaymentResponse;
import com.mindgarden.consultation.dto.PaymentWebhookRequest;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.repository.PaymentRepository;
import com.mindgarden.consultation.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 결제 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {
    
    private final PaymentRepository paymentRepository;
    
    @Override
    public PaymentResponse createPayment(PaymentRequest request) {
        log.info("결제 생성 요청: {}", request);
        
        // 결제 금액 검증
        validatePaymentAmount(request.getAmount());
        
        // 중복 결제 방지
        if (paymentRepository.existsByOrderIdAndStatusAndIsDeletedFalse(
                request.getOrderId(), Payment.PaymentStatus.APPROVED)) {
            throw new RuntimeException("이미 승인된 주문입니다.");
        }
        
        // 결제 엔티티 생성
        Payment payment = Payment.builder()
                .paymentId(generatePaymentId())
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.valueOf(request.getMethod()))
                .provider(Payment.PaymentProvider.valueOf(request.getProvider()))
                .payerId(request.getPayerId())
                .recipientId(request.getRecipientId())
                .branchId(request.getBranchId())
                .description(request.getDescription())
                .expiresAt(LocalDateTime.now().plusMinutes(request.getTimeoutMinutes()))
                .build();
        
        // 결제 저장
        payment = paymentRepository.save(payment);
        log.info("결제 생성 완료: ID={}, PaymentID={}", payment.getId(), payment.getPaymentId());
        
        // 외부 결제 시스템 연동 (토스페이먼츠/아임포트)
        String paymentUrl = createExternalPayment(payment);
        
        return buildPaymentResponse(payment, paymentUrl);
    }
    
    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(String paymentId) {
        log.info("결제 조회: {}", paymentId);
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        return buildPaymentResponse(payment, null);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentsByPayerId(Long payerId, Pageable pageable) {
        log.info("결제자별 결제 목록 조회: {}", payerId);
        
        Page<Payment> payments = paymentRepository.findByPayerIdAndIsDeletedFalse(payerId, pageable);
        
        return payments.map(payment -> buildPaymentResponse(payment, null));
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentsByBranchId(Long branchId, Pageable pageable) {
        log.info("지점별 결제 목록 조회: {}", branchId);
        
        Page<Payment> payments = paymentRepository.findByBranchIdAndIsDeletedFalse(branchId, pageable);
        
        return payments.map(payment -> buildPaymentResponse(payment, null));
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getAllPayments(Pageable pageable) {
        log.info("전체 결제 목록 조회");
        
        Page<Payment> payments = paymentRepository.findAll(pageable);
        
        return payments.map(payment -> buildPaymentResponse(payment, null));
    }
    
    @Override
    public List<Payment> getAllPayments() {
        log.info("전체 결제 목록 조회 (페이지네이션 없음)");
        
        return paymentRepository.findAll();
    }
    
    @Override
    public PaymentResponse updatePaymentStatus(String paymentId, Payment.PaymentStatus status) {
        log.info("결제 상태 업데이트: {} -> {}", paymentId, status);
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        // 상태 변경 검증
        validateStatusTransition(payment.getStatus(), status);
        
        payment.setStatus(status);
        
        // 상태별 추가 처리
        switch (status) {
            case APPROVED:
                payment.setApprovedAt(LocalDateTime.now());
                break;
            case CANCELLED:
                payment.setCancelledAt(LocalDateTime.now());
                break;
            case REFUNDED:
                payment.setRefundedAt(LocalDateTime.now());
                break;
            case PENDING:
            case PROCESSING:
            case FAILED:
            case EXPIRED:
                // 추가 처리 없음
                break;
        }
        
        payment = paymentRepository.save(payment);
        log.info("결제 상태 업데이트 완료: {}", paymentId);
        
        return buildPaymentResponse(payment, null);
    }
    
    @Override
    public PaymentResponse cancelPayment(String paymentId, String reason) {
        log.info("결제 취소: {}, 사유: {}", paymentId, reason);
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        // 취소 가능 여부 검증
        if (payment.getStatus() != Payment.PaymentStatus.PENDING && 
            payment.getStatus() != Payment.PaymentStatus.PROCESSING) {
            throw new RuntimeException("취소할 수 없는 결제 상태입니다.");
        }
        
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        payment.setCancelledAt(LocalDateTime.now());
        payment.setFailureReason(reason);
        
        payment = paymentRepository.save(payment);
        log.info("결제 취소 완료: {}", paymentId);
        
        return buildPaymentResponse(payment, null);
    }
    
    @Override
    public PaymentResponse refundPayment(String paymentId, BigDecimal amount, String reason) {
        log.info("결제 환불: {}, 금액: {}, 사유: {}", paymentId, amount, reason);
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        // 환불 가능 여부 검증
        if (payment.getStatus() != Payment.PaymentStatus.APPROVED) {
            throw new RuntimeException("환불할 수 없는 결제 상태입니다.");
        }
        
        // 환불 금액 검증
        BigDecimal refundAmount = amount != null ? amount : payment.getAmount();
        if (refundAmount.compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("환불 금액이 결제 금액을 초과할 수 없습니다.");
        }
        
        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        payment.setRefundedAt(LocalDateTime.now());
        payment.setFailureReason(reason);
        
        payment = paymentRepository.save(payment);
        log.info("결제 환불 완료: {}", paymentId);
        
        return buildPaymentResponse(payment, null);
    }
    
    @Override
    public boolean processWebhook(PaymentWebhookRequest webhookRequest) {
        log.info("Webhook 처리: {}", webhookRequest.getPaymentId());
        
        try {
            // Webhook 검증
            if (!verifyWebhook(webhookRequest)) {
                log.warn("Webhook 검증 실패: {}", webhookRequest.getPaymentId());
                return false;
            }
            
            // 결제 조회
            Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(webhookRequest.getPaymentId())
                    .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
            
            // 결제 상태 업데이트
            Payment.PaymentStatus newStatus = Payment.PaymentStatus.valueOf(webhookRequest.getStatus());
            updatePaymentStatus(webhookRequest.getPaymentId(), newStatus);
            
            // 외부 데이터 저장
            payment.setExternalResponse(webhookRequest.getExternalData().toString());
            payment.setWebhookData(webhookRequest.toString());
            paymentRepository.save(payment);
            
            log.info("Webhook 처리 완료: {}", webhookRequest.getPaymentId());
            return true;
            
        } catch (Exception e) {
            log.error("Webhook 처리 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean verifyPayment(String paymentId, BigDecimal amount) {
        log.info("결제 검증: {}, 금액: {}", paymentId, amount);
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        return payment.getStatus() == Payment.PaymentStatus.APPROVED && 
               payment.getAmount().compareTo(amount) == 0;
    }
    
    @Override
    public int processExpiredPayments() {
        log.info("만료된 결제 처리 시작");
        
        List<Payment> expiredPayments = paymentRepository.findExpiredPayments(LocalDateTime.now());
        
        for (Payment payment : expiredPayments) {
            payment.setStatus(Payment.PaymentStatus.EXPIRED);
            payment.setFailureReason("결제 만료");
            paymentRepository.save(payment);
        }
        
        log.info("만료된 결제 처리 완료: {}건", expiredPayments.size());
        return expiredPayments.size();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("결제 통계 조회: {} ~ {}", startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 총 결제 금액
        BigDecimal totalAmount = paymentRepository.getTotalAmountByDateRange(startDate, endDate);
        statistics.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        
        // 결제 상태별 건수
        List<Object[]> statusCounts = paymentRepository.getPaymentCountByStatus();
        Map<String, Long> statusStatistics = statusCounts.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        statistics.put("statusCounts", statusStatistics);
        
        // 결제 방법별 건수
        List<Object[]> methodCounts = paymentRepository.getPaymentCountByMethod();
        Map<String, Long> methodStatistics = methodCounts.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        statistics.put("methodCounts", methodStatistics);
        
        // 결제 대행사별 건수
        List<Object[]> providerCounts = paymentRepository.getPaymentCountByProvider();
        Map<String, Long> providerStatistics = providerCounts.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        statistics.put("providerCounts", providerStatistics);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBranchPaymentStatistics(Long branchId, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("지점별 결제 통계 조회: {}, {} ~ {}", branchId, startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 지점별 총 결제 금액
        BigDecimal totalAmount = paymentRepository.getTotalAmountByBranchId(branchId);
        statistics.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        
        // 지점별 월별 통계
        List<Object[]> monthlyStats = paymentRepository.getBranchMonthlyPaymentStatistics(startDate, endDate);
        List<Map<String, Object>> monthlyStatistics = monthlyStats.stream()
                .map(row -> {
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("branchId", row[0]);
                    monthData.put("year", row[1]);
                    monthData.put("month", row[2]);
                    monthData.put("count", row[3]);
                    monthData.put("amount", row[4]);
                    return monthData;
                })
                .collect(Collectors.toList());
        statistics.put("monthlyStatistics", monthlyStatistics);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPayerPaymentStatistics(Long payerId, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("결제자별 결제 통계 조회: {}, {} ~ {}", payerId, startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 결제자별 총 결제 금액
        BigDecimal totalAmount = paymentRepository.getTotalAmountByPayerId(payerId);
        statistics.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonthlyPaymentStatistics(int year) {
        log.info("월별 결제 통계 조회: {}", year);
        
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(year, 12, 31, 23, 59);
        
        List<Object[]> monthlyStats = paymentRepository.getMonthlyPaymentStatistics(startDate, endDate);
        
        return monthlyStats.stream()
                .map(row -> {
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("year", row[0]);
                    monthData.put("month", row[1]);
                    monthData.put("count", row[2]);
                    monthData.put("amount", row[3]);
                    return monthData;
                })
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentMethodStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("결제 방법별 통계 조회: {} ~ {}", startDate, endDate);
        
        // 결제 방법별 건수 조회 (날짜 범위 필터링은 추후 구현)
        List<Object[]> methodCounts = paymentRepository.getPaymentCountByMethod();
        
        Map<String, Long> methodStatistics = methodCounts.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("methodCounts", methodStatistics);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentProviderStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("결제 대행사별 통계 조회: {} ~ {}", startDate, endDate);
        
        // 결제 대행사별 건수 조회 (날짜 범위 필터링은 추후 구현)
        List<Object[]> providerCounts = paymentRepository.getPaymentCountByProvider();
        
        Map<String, Long> providerStatistics = providerCounts.stream()
                .collect(Collectors.toMap(
                    row -> (String) row[0],
                    row -> (Long) row[1]
                ));
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("providerCounts", providerStatistics);
        
        return statistics;
    }
    
    // ==================== Private Methods ====================
    
    private void validatePaymentAmount(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.valueOf(PaymentConstants.MIN_PAYMENT_AMOUNT)) < 0) {
            throw new RuntimeException(PaymentConstants.ERROR_INVALID_AMOUNT);
        }
        if (amount.compareTo(BigDecimal.valueOf(PaymentConstants.MAX_PAYMENT_AMOUNT)) > 0) {
            throw new RuntimeException(PaymentConstants.ERROR_INVALID_AMOUNT);
        }
    }
    
    private void validateStatusTransition(Payment.PaymentStatus currentStatus, Payment.PaymentStatus newStatus) {
        // 상태 전환 검증 로직
        if (currentStatus == Payment.PaymentStatus.APPROVED && newStatus == Payment.PaymentStatus.PENDING) {
            throw new RuntimeException("승인된 결제는 대기 상태로 변경할 수 없습니다.");
        }
    }
    
    private String generatePaymentId() {
        return "PAY_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String createExternalPayment(Payment payment) {
        log.info("외부 결제 시스템 연동 시작: paymentId={}, amount={}, method={}", 
                payment.getPaymentId(), payment.getAmount(), payment.getMethod());
        
        try {
            // 결제 금액 유효성 검사
            if (payment.getAmount().compareTo(BigDecimal.valueOf(PaymentConstants.MIN_PAYMENT_AMOUNT)) < 0 || 
                payment.getAmount().compareTo(BigDecimal.valueOf(PaymentConstants.MAX_PAYMENT_AMOUNT)) > 0) {
                throw new IllegalArgumentException(PaymentConstants.ERROR_INVALID_PAYMENT_AMOUNT);
            }
            
            // 외부 결제 시스템 API 호출을 위한 요청 데이터 구성
            Map<String, Object> paymentRequest = new HashMap<>();
            paymentRequest.put("paymentId", payment.getPaymentId());
            paymentRequest.put("amount", payment.getAmount());
            paymentRequest.put("currency", "KRW");
            paymentRequest.put("method", payment.getMethod());
            paymentRequest.put("description", payment.getDescription());
            paymentRequest.put("customerId", payment.getPayerId());
            paymentRequest.put("returnUrl", PaymentConstants.EXTERNAL_PAYMENT_BASE_URL + "/return");
            paymentRequest.put("cancelUrl", PaymentConstants.EXTERNAL_PAYMENT_BASE_URL + "/cancel");
            
            // 실제 외부 API 호출 (현재는 시뮬레이션)
            String apiUrl = PaymentConstants.EXTERNAL_PAYMENT_BASE_URL + PaymentConstants.EXTERNAL_PAYMENT_CREATE_ENDPOINT;
            log.info("외부 결제 API 호출: {}", apiUrl);
            
            // API 호출 시뮬레이션
            String paymentUrl = simulateExternalPaymentApi(paymentRequest);
            
            log.info(PaymentConstants.SUCCESS_PAYMENT_CREATED);
            return paymentUrl;
            
        } catch (Exception e) {
            log.error("외부 결제 시스템 연동 실패: {}", e.getMessage(), e);
            throw new RuntimeException(PaymentConstants.ERROR_EXTERNAL_PAYMENT_FAILED, e);
        }
    }
    
    private String simulateExternalPaymentApi(Map<String, Object> paymentRequest) {
        // 실제 구현에서는 RestTemplate 또는 WebClient를 사용하여 HTTP API 호출
        // 현재는 시뮬레이션을 위한 임시 URL 생성
        String paymentId = (String) paymentRequest.get("paymentId");
        return PaymentConstants.EXTERNAL_PAYMENT_BASE_URL + "/pay/" + paymentId;
    }
    
    private boolean verifyWebhook(PaymentWebhookRequest webhookRequest) {
        log.info("Webhook 서명 검증 시작: paymentId={}", webhookRequest.getPaymentId());
        
        try {
            // Webhook 서명 검증 로직
            String receivedSignature = webhookRequest.getSignature();
            String timestamp = webhookRequest.getTimestamp() != null ? webhookRequest.getTimestamp().toString() : null;
            String payload = webhookRequest.getExternalData() != null ? webhookRequest.getExternalData().toString() : "";
            
            if (receivedSignature == null || timestamp == null || payload == null) {
                log.warn("Webhook 필수 필드 누락: signature={}, timestamp={}, payload={}", 
                        receivedSignature != null, timestamp != null, payload != null);
                return false;
            }
            
            // 타임스탬프 유효성 검사 (5분 이내)
            long currentTime = System.currentTimeMillis() / 1000;
            long webhookTime = Long.parseLong(timestamp);
            if (Math.abs(currentTime - webhookTime) > 300) { // 5분 = 300초
                log.warn("Webhook 타임스탬프가 너무 오래됨: current={}, webhook={}", currentTime, webhookTime);
                return false;
            }
            
            // 서명 검증 (실제 구현에서는 HMAC-SHA256 사용)
            String expectedSignature = generateWebhookSignature(payload, timestamp);
            boolean isValid = expectedSignature.equals(receivedSignature);
            
            if (isValid) {
                log.info(PaymentConstants.SUCCESS_WEBHOOK_VERIFIED);
            } else {
                log.warn("Webhook 서명 검증 실패: expected={}, received={}", expectedSignature, receivedSignature);
            }
            
            return isValid;
            
        } catch (Exception e) {
            log.error("Webhook 검증 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
    
    private String generateWebhookSignature(String payload, String timestamp) {
        // 실제 구현에서는 HMAC-SHA256을 사용하여 서명 생성
        // 현재는 시뮬레이션을 위한 간단한 해시 생성
        String data = payload + timestamp + PaymentConstants.WEBHOOK_SECRET_KEY;
        return "sha256=" + Integer.toHexString(data.hashCode());
    }
    
    private PaymentResponse buildPaymentResponse(Payment payment, String paymentUrl) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentId(payment.getPaymentId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .status(payment.getStatus().toString())
                .method(payment.getMethod())
                .provider(payment.getProvider())
                .payerId(payment.getPayerId())
                .recipientId(payment.getRecipientId())
                .branchId(payment.getBranchId())
                .description(payment.getDescription())
                .failureReason(payment.getFailureReason())
                .approvedAt(payment.getApprovedAt())
                .cancelledAt(payment.getCancelledAt())
                .refundedAt(payment.getRefundedAt())
                .expiresAt(payment.getExpiresAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .paymentUrl(paymentUrl)
                .build();
    }
}
