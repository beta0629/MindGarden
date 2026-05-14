package com.coresolution.consultation.dto.shop;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PG 결제 생성 요청 (기본 CARD/TOSS).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPreparePaymentRequest {

    @Size(max = 32)
    private String paymentMethod;

    @Size(max = 32)
    private String paymentProvider;
}
