package com.coresolution.consultation.dto.shop.admin;

import java.util.List;

/**
 * 상품 구성 조회 응답. 합계는 스냅샷 기준(Σ단가×수량, Σ회기×수량)이며 자동 재계산하지 않는다.
 *
 * @param packageCode 패키지 코드
 * @param items 구성 항목
 * @param totalPriceMinor 합계 금액(원)
 * @param totalSessions 합계 회기
 * @param priceChanged 항목 중 하나라도 현재가가 바뀌었으면 true
 * @param legacy 레거시 구성(extraData.items)이 남아 있으면 true. 다음 저장 때 비운다
 * @param legacyItemCount 레거시 항목 수
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopPackageCompositionResponse(
        String packageCode,
        List<ShopPackageCompositionItemView> items,
        long totalPriceMinor,
        int totalSessions,
        boolean priceChanged,
        boolean legacy,
        int legacyItemCount) {
}
