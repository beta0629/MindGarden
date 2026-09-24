package com.coresolution.consultation.dto.shop;

import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.entity.ShopCatalogSku;

/**
 * 결제·카탈로그에 쓰는 판매 조건.
 * <p>요금 관리에 연결된 SKU는 상품명·단가·회기수를 패키지에서 읽고,
 * 연결이 없으면 SKU 저장값을 쓴다.</p>
 *
 * @param linked 패키지 요금 코드가 있으면 true
 * @param sellable 온라인 판매 가능 여부
 * @param title 노출 상품명
 * @param unitPriceMinor 단가(원)
 * @param sessionCount 회기수
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogOffer(
        boolean linked,
        boolean sellable,
        String title,
        long unitPriceMinor,
        int sessionCount
) {

    /**
     * 요금 관리에 연결되지 않은 SKU의 저장값.
     *
     * @param sku 카탈로그 SKU
     * @return 항상 sellable 인 오퍼 (가격 없음은 0)
     */
    public static ShopCatalogOffer unlinked(ShopCatalogSku sku) {
        int sessions = ShopSessionCountConstants.MIN_SESSION_COUNT;
        long price = 0L;
        String name = "";
        if (sku != null) {
            if (sku.getSessionCount() != null
                    && sku.getSessionCount() >= ShopSessionCountConstants.MIN_SESSION_COUNT) {
                sessions = sku.getSessionCount();
            }
            if (sku.getUnitPriceMinor() != null) {
                price = sku.getUnitPriceMinor();
            }
            if (sku.getTitle() != null) {
                name = sku.getTitle();
            }
        }
        return new ShopCatalogOffer(false, true, name, price, sessions);
    }
}
