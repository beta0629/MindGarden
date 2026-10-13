package com.coresolution.consultation.constant;

/**
 * 상품 구성(몰 SKU 기반) 상수.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public final class ShopPackageCompositionConstants {

    private ShopPackageCompositionConstants() {
    }

    /** 레거시 구성 항목이 들어 있던 공통코드 extraData 키 */
    public static final String LEGACY_EXTRA_ITEMS_KEY = "items";

    /** 구성 항목 최소 수량 */
    public static final int MIN_QUANTITY = 1;

    /** 실물·비상담 상품의 회기 스냅샷 */
    public static final int NON_SESSION_COUNT = 0;

    public static final String MSG_ITEMS_REQUIRED = "구성 항목을 하나 이상 담아 주십시오.";
    public static final String MSG_ITEM_NOT_FOUND = "구성에 담을 상품을 찾을 수 없습니다.";
    public static final String MSG_ITEM_INACTIVE = "판매 중지되었거나 삭제된 상품은 구성에 담을 수 없습니다.";
    public static final String MSG_ITEM_OFFER_SKU = "내담자 전용 상품은 구성에 담을 수 없습니다.";
    public static final String MSG_ITEM_SELF = "상품 자신은 구성에 담을 수 없습니다.";
    public static final String MSG_ITEM_NESTED = "이미 구성이 있는 상품은 다른 구성에 담을 수 없습니다.";
    public static final String MSG_ITEM_DUPLICATE = "같은 상품이 구성에 두 번 담겼습니다. 수량으로 조정해 주십시오.";
    public static final String MSG_QUANTITY_INVALID = "수량은 1 이상이어야 합니다.";
    public static final String MSG_LEGACY_CLEAR_FAILED = "기존 구성 정보를 정리하지 못했습니다. 잠시 후 다시 시도해 주십시오.";
}
