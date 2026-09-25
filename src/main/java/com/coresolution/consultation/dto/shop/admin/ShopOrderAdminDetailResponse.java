package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.ShopOrderLineResponse;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 온라인 주문 상세.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderAdminDetailResponse {

    private String orderPublicId;
    private ShopClientOrderStatus status;
    private long subtotalMinor;
    private long pointsRedeemMinor;
    private long cashDueMinor;
    private Long clientId;
    private LocalDateTime createdAt;
    /** PortOne 등 PG paymentId (없으면 null) */
    private String paymentId;
    /** Payment.PaymentStatus name (APPROVED 등, 없으면 null) */
    private String paymentStatus;
    /** PortOne/Payment.amount SSOT (없으면 null) */
    private Long pgAmount;
    /**
     * PortOne live status (CANCELLED/PAID/…); null if unknown/unavailable.
     */
    private String pgStatus;
    private List<ShopOrderLineResponse> lines;
    private List<ShopOrderFulfillmentEventSummary> fulfillmentEvents;
    /** 어드민 soft-delete 가능 여부 (상태·환불 진행 가드 반영) */
    private boolean deletable;
}
