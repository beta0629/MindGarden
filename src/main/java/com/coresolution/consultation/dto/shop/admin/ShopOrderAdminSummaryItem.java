package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.PaymentSource;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 온라인 주문 목록 항목.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderAdminSummaryItem {

    private String orderPublicId;
    private ShopClientOrderStatus status;
    private long subtotalMinor;
    private long pointsRedeemMinor;
    private long cashDueMinor;
    private Long clientId;
    private LocalDateTime createdAt;
    /** Payment.PaymentStatus name (APPROVED/REFUNDED 등, 없으면 null) */
    private String paymentStatus;
    /** PortOne/Payment.amount SSOT (없으면 null) */
    private Long pgAmount;
    /**
     * 결제 채널 — 온라인 주문은 ONLINE.
     * <p>SSOT: docs/project-management/PAYMENT_SOURCE_ONLINE_MANUAL_MAPPING_RULES_20260318.md</p>
     */
    private PaymentSource paymentSource;
    /** Payment.PaymentProvider name (없으면 null) */
    private String paymentProvider;
    /** 어드민 soft-delete 가능 여부 (상태·환불 진행 가드 반영) */
    private boolean deletable;
}
