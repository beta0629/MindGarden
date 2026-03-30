package com.coresolution.core.dto.academy;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 환불 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {
    
    /**
     * 환불 금액
     */
    @NotNull(message = "환불 금액은 필수입니다")
    private BigDecimal refundAmount;
    
    /**
     * 환불 사유
     */
    private String refundReason;
}

