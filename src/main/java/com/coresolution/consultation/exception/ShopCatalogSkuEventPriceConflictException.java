package com.coresolution.consultation.exception;

/**
 * 동일 SKU 이벤트 가격 기간이 겹칠 때 발생한다.
 *
 * <p>{@link GlobalExceptionHandler} 가 HTTP 409 와 사용자 사유 문구로 응답한다.
 * 시스템 오류가 아니므로 500 으로 올리지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-11-11
 */
public class ShopCatalogSkuEventPriceConflictException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    /** 응답 {@code errorCode}. 화면은 {@code message} 를 사유로 쓴다. */
    public static final String ERROR_CODE = "SHOP_CATALOG_SKU_EVENT_PRICE_CONFLICT";

    /**
     * @param message 사용자에게 보여줄 겹침 사유
     */
    public ShopCatalogSkuEventPriceConflictException(String message) {
        super(message);
    }
}
