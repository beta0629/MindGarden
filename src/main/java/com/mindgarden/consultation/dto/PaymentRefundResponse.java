package com.mindgarden.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 환불 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRefundResponse {
    
    /**
     * 결제 ID
     */
    private String paymentId;
    
    /**
     * 주문 ID
     */
    private String orderId;
    
    /**
     * 환불 ID (외부 시스템)
     */
    private String refundId;
    
    /**
     * 환불 금액
     */
    private BigDecimal refundAmount;
    
    /**
     * 환불 수수료
     */
    private BigDecimal refundFee;
    
    /**
     * 실제 환불 금액 (수수료 차감 후)
     */
    private BigDecimal actualRefundAmount;
    
    /**
     * 환불 상태
     */
    private String status;
    
    /**
     * 환불 사유
     */
    private String refundReason;
    
    /**
     * 처리 결과
     */
    private boolean success;
    
    /**
     * 환불 처리 시간
     */
    private LocalDateTime processedAt;
    
    /**
     * 환불 완료 예상 시간
     */
    private LocalDateTime estimatedCompletionAt;
    
    /**
     * 에러 메시지 (실패 시)
     */
    private String errorMessage;
    
    /**
     * 추가 정보
     */
    private String additionalInfo;
}
