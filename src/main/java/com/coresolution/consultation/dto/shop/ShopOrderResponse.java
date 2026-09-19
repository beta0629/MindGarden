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
    /** 주문에 연결된 최신 결제 PortOne paymentId (없으면 null) */
    private String paymentId;
    /** 최신 결제 상태명 (Payment.PaymentStatus.name, 없으면 null) */
    private String paymentStatus;
    private List<ShopOrderLineResponse> lines;
    /** PAID 이후 기록된 SKU 단위 이행 이벤트 (없으면 빈 목록) */
    private List<ShopOrderFulfillmentLineResponse> fulfillmentLines;
    /** 내담자 fulfill-retry 1회 소진 여부 (어드민 재시도는 무시) */
    private Boolean clientFulfillRetryAttempted;
}
