package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 환불 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRefundRequest {
    
    /**
     * 결제 ID
     */
    @NotBlank(message = "결제 ID는 필수입니다.")
    private String paymentId;
    
    /**
     * 주문 ID
     */
    @NotBlank(message = "주문 ID는 필수입니다.")
    private String orderId;
    
    /**
     * 환불 금액
     */
    @NotNull(message = "환불 금액은 필수입니다.")
    @Positive(message = "환불 금액은 양수여야 합니다.")
    private BigDecimal refundAmount;
    
    /**
     * 환불 사유
     */
    @NotBlank(message = "환불 사유는 필수입니다.")
    private String refundReason;
    
    /**
     * 환불 요청자 ID
     */
    @NotBlank(message = "환불 요청자 ID는 필수입니다.")
    private String requesterId;
    
    /**
     * 환불 요청 시간
     */
    @NotNull(message = "환불 요청 시간은 필수입니다.")
    private LocalDateTime requestedAt;
    
    /**
     * 환불 수수료
     */
    private BigDecimal refundFee;
    
    /**
     * 부분 환불 여부
     */
    private boolean partialRefund;
    
    /**
     * 환불 승인 여부 (관리자 승인 필요 시)
     */
    private boolean approved;
    
    /**
     * 환불 승인자 ID
     */
    private String approverId;
    
    /**
     * 추가 메타데이터
     */
    private String metadata;
}
