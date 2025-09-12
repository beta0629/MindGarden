package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 실패 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailureResponse {
    
    /**
     * 결제 ID
     */
    private String paymentId;
    
    /**
     * 주문 ID
     */
    private String orderId;
    
    /**
     * 처리 결과
     */
    private boolean success;
    
    /**
     * 실패 상태
     */
    private String status;
    
    /**
     * 실패 사유
     */
    private String failureReason;
    
    /**
     * 재시도 가능 여부
     */
    private boolean retryable;
    
    /**
     * 재시도 URL (재시도 가능한 경우)
     */
    private String retryUrl;
    
    /**
     * 처리 시간
     */
    private LocalDateTime processedAt;
    
    /**
     * 추가 정보
     */
    private String additionalInfo;
}
