package com.coresolution.consultation.dto.shop;

import java.util.List;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 결제창 사용자 취소 처리 결과.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopUserCancelPaymentResponse {

    private String orderPublicId;
    /** CANCELLED | PAID | UNVERIFIED | NOT_CANCELLABLE */
    private String outcome;
    private ShopClientOrderStatus orderStatus;
    /** PAID 일 때 정상 결제 확인(verify)에 쓸 결제 ID */
    private String paymentId;
    /** CART | BUY_NOW — 취소 후 돌아갈 화면 */
    private String checkoutSource;
    /** 주문 라인 SKU (바로 구매는 1건) */
    private List<String> skuCodes;
}
