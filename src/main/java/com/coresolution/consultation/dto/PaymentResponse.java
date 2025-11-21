package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    
    /**
     * 결제 ID
     */
    private Long id;
    
    /**
     * 결제 고유 ID
     */
    private String paymentId;
    
    /**
     * 주문 ID
     */
    private String orderId;
    
    /**
     * 결제 금액
     */
    private BigDecimal amount;
    
    /**
     * 결제 상태
     */
    private String status;
    
    /**
     * 결제 방법
     */
    private Payment.PaymentMethod method;
    
    /**
     * 결제 대행사
     */
    private Payment.PaymentProvider provider;
    
    /**
     * 결제자 ID
     */
    private Long payerId;
    
    /**
     * 수취인 ID
     */
    private Long recipientId;
    
    /**
     * 지점 ID
     */
    private Long branchId;
    
    /**
     * 결제 설명
     */
    private String description;
    
    /**
     * 실패 사유
     */
    private String failureReason;
    
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
     * 결제 만료 시간
     */
    private LocalDateTime expiresAt;
    
    /**
     * 생성 시간
     */
    private LocalDateTime createdAt;
    
    /**
     * 수정 시간
     */
    private LocalDateTime updatedAt;
    
    /**
     * 외부 결제 시스템 URL (결제 페이지로 이동할 URL)
     */
    private String paymentUrl;
    
    /**
     * 외부 결제 시스템에서 제공하는 결제 키
     */
    private String externalPaymentKey;
    
    /**
     * 추가 메타데이터
     */
    private String metadata;
}
