package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제 실패 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailureRequest {
    
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
     * 실패 사유 코드
     */
    @NotBlank(message = "실패 사유 코드는 필수입니다.")
    private String failureCode;
    
    /**
     * 실패 사유 설명
     */
    @NotBlank(message = "실패 사유 설명은 필수입니다.")
    private String failureReason;
    
    /**
     * 결제 금액
     */
    @NotNull(message = "결제 금액은 필수입니다.")
    private BigDecimal amount;
    
    /**
     * 실패 시간
     */
    @NotNull(message = "실패 시간은 필수입니다.")
    private LocalDateTime failedAt;
    
    /**
     * 에러 코드 (외부 시스템)
     */
    private String errorCode;
    
    /**
     * 에러 메시지 (외부 시스템)
     */
    private String errorMessage;
    
    /**
     * 재시도 가능 여부
     */
    private boolean retryable;
    
    /**
     * 추가 메타데이터
     */
    private String metadata;
}
