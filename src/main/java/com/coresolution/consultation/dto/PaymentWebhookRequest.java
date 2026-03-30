package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 Webhook 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookRequest {
    
    /**
     * 결제 고유 ID
     */
    @NotBlank(message = "결제 ID는 필수입니다.")
    private String paymentId;
    
    /**
     * 주문 ID
     */
    @NotBlank(message = "주문 ID는 필수입니다.")
    private String orderId;
    
    /**
     * 결제 상태
     */
    @NotBlank(message = "결제 상태는 필수입니다.")
    private String status;
    
    /**
     * 결제 금액
     */
    @NotNull(message = "결제 금액은 필수입니다.")
    private BigDecimal amount;
    
    /**
     * 결제 방법
     */
    private String method;
    
    /**
     * 결제 대행사
     */
    private String provider;
    
    /**
     * 결제 승인 시간
     */
    private LocalDateTime approvedAt;
    
    /**
     * 결제 취소 시간
     */
    private LocalDateTime cancelledAt;
    
    /**
     * 환불 시간
     */
    private LocalDateTime refundedAt;
    
    /**
     * 실패 사유
     */
    private String failureReason;
    
    /**
     * 외부 결제 시스템에서 제공하는 결제 키
     */
    private String externalPaymentKey;
    
    /**
     * 외부 결제 시스템 응답 데이터
     */
    private Map<String, Object> externalData;
    
    /**
     * Webhook 서명
     */
    private String signature;
    
    /**
     * Webhook 타임스탬프
     */
    private Long timestamp;
    
    /**
     * 추가 메타데이터
     */
    private Map<String, Object> metadata;
}
