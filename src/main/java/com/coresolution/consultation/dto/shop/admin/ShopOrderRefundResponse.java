package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 PAID 주문 전액 환불 결과.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderRefundResponse {

    private String orderPublicId;
    private ShopClientOrderStatus status;
    private String reasonCode;
    private long pointsRestoredMinor;
    private long pointsClawedBackMinor;
    /** PG 환불 API 연동 전 stub 상태 */
    private String pgRefundStatus;
}
