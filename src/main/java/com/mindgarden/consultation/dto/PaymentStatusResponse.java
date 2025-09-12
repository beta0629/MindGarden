package com.mindgarden.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 상태 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    
    /**
     * 결제 ID
     */
    private String paymentId;
    
    /**
     * 주문 ID
     */
    private String orderId;
    
    /**
     * 결제 상태
     */
    private String status;
    
    /**
     * 결제 금액
     */
    private BigDecimal amount;
    
    /**
     * 결제 승인 시간
     */
    private LocalDateTime approvedAt;
    
    /**
     * 결제 취소 시간
     */
    private LocalDateTime cancelledAt;
    
    /**
     * 결제 실패 사유
     */
    private String failureReason;
    
    /**
     * 외부 결제 시스템 데이터
     */
    private String externalData;
}
