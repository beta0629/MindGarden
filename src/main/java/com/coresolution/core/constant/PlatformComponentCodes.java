package com.coresolution.core.constant;

/**
 * 플랫폼 {@code component_catalog.component_code} SSOT.
 * SHOP_REWARD §7, MULTI_TENANT §3.1 step 4.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
public final class PlatformComponentCodes {

    /** 내담자 카탈로그·장바구니·체크아웃 */
    public static final String CLIENT_SHOP = "CLIENT_SHOP";

    /** 포인트 잔액·체크아웃 사용·적립 */
    public static final String CLIENT_REWARD = "CLIENT_REWARD";

    /** 어드민 SKU·가격·리워드 정책 */
    public static final String ADMIN_SHOP_CATALOG = "ADMIN_SHOP_CATALOG";

    private PlatformComponentCodes() {
    }
}
