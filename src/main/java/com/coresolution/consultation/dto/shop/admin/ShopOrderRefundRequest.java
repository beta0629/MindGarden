package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 어드민 PAID 주문 전액 환불 요청.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record ShopOrderRefundRequest(
        @NotBlank @Size(max = 64) String reasonCode
) {
}
