package com.coresolution.consultation.dto.shop;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 주문 요약 응답.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderResponse {

    private String orderPublicId;
    private ShopClientOrderStatus status;
    private long subtotalMinor;
    private long pointsRedeemMinor;
    private long cashDueMinor;
    private List<ShopOrderLineResponse> lines;
}
