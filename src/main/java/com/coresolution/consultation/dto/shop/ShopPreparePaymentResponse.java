package com.coresolution.consultation.dto.shop;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 결제 생성 응답 (기존 {@link com.coresolution.consultation.dto.PaymentResponse} 축약).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPreparePaymentResponse {

    private String orderPublicId;
    private String paymentId;
    private BigDecimal cashAmount;
    private String paymentUrl;
    private String paymentStatus;
}
