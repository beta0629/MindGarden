package com.mindgarden.consultation.dto;

import com.mindgarden.consultation.constant.PaymentConstants;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 결제 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    
    /**
     * 주문 ID
     */
    @NotBlank(message = "주문 ID는 필수입니다.")
    @Size(max = 100, message = "주문 ID는 100자를 초과할 수 없습니다.")
    private String orderId;
    
    /**
     * 결제 금액
     */
    @NotNull(message = "결제 금액은 필수입니다.")
    @DecimalMin(value = "1000", message = "결제 금액은 최소 1,000원 이상이어야 합니다.")
    @DecimalMax(value = "10000000", message = "결제 금액은 최대 10,000,000원을 초과할 수 없습니다.")
    private BigDecimal amount;
    
    /**
     * 결제 방법
     */
    @NotBlank(message = "결제 방법은 필수입니다.")
    @Pattern(regexp = "^(CARD|BANK_TRANSFER|VIRTUAL_ACCOUNT|MOBILE|CASH)$", 
             message = "유효하지 않은 결제 방법입니다.")
    private String method;
    
    /**
     * 결제 대행사
     */
    @NotBlank(message = "결제 대행사는 필수입니다.")
    @Pattern(regexp = "^(TOSS|IAMPORT|KAKAO|NAVER|PAYPAL)$", 
             message = "유효하지 않은 결제 대행사입니다.")
    private String provider;
    
    /**
     * 결제자 ID
     */
    @NotNull(message = "결제자 ID는 필수입니다.")
    @Positive(message = "결제자 ID는 양수여야 합니다.")
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
    @Size(max = 500, message = "결제 설명은 500자를 초과할 수 없습니다.")
    private String description;
    
    /**
     * 결제 만료 시간 (분)
     */
    @Min(value = 1, message = "결제 만료 시간은 최소 1분 이상이어야 합니다.")
    @Max(value = 1440, message = "결제 만료 시간은 최대 24시간(1440분)을 초과할 수 없습니다.")
    @Builder.Default
    private Integer timeoutMinutes = PaymentConstants.PAYMENT_TIMEOUT_MINUTES;
    
    /**
     * 성공 후 리다이렉트 URL
     */
    @Size(max = 500, message = "리다이렉트 URL은 500자를 초과할 수 없습니다.")
    private String successUrl;
    
    /**
     * 실패 후 리다이렉트 URL
     */
    @Size(max = 500, message = "리다이렉트 URL은 500자를 초과할 수 없습니다.")
    private String failUrl;
    
    /**
     * 취소 후 리다이렉트 URL
     */
    @Size(max = 500, message = "리다이렉트 URL은 500자를 초과할 수 없습니다.")
    private String cancelUrl;
    
    /**
     * 추가 메타데이터 (JSON 형태)
     */
    private String metadata;
}
