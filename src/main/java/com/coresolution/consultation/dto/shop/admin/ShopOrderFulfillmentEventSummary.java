package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 주문 이행 이벤트 요약.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderFulfillmentEventSummary {

    private String skuCode;
    private String category;
    private String status;
    private String message;
    private LocalDateTime createdAt;
}
