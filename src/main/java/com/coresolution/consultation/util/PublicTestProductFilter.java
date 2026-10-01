package com.coresolution.consultation.util;

import java.util.Map;

/**
 * 공개 상품 목록에서 테스트·샘플 상품을 제외한다.
 * 이름·코드(SKU)·extraData.isTest·publicVisible=false.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
public final class PublicTestProductFilter {

    /** 공개 목록에 올리면 안 되는 테스트 SKU. */
    public static final String BLOCKED_PUBLIC_SKU = "SHOP-20260929-001";

    private PublicTestProductFilter() {
    }

    /**
     * 공개 페이지에 올리면 안 되는 테스트·샘플 상품인지.
     *
     * @param name 표시 이름
     * @param code 코드·SKU
     * @param extra extraData 맵 (없으면 빈 맵)
     * @return 제외해야 하면 true
     */
    public static boolean isExcluded(String name, String code, Map<String, Object> extra) {
        if (isBlockedSku(code) || isPublicVisibleFalse(extra) || isTestFlag(extra)) {
            return true;
        }
        return looksLikeTestLabel(name) || looksLikeTestLabel(code);
    }

    private static boolean isBlockedSku(String code) {
        return code != null && BLOCKED_PUBLIC_SKU.equalsIgnoreCase(code.trim());
    }

    private static boolean isPublicVisibleFalse(Map<String, Object> extra) {
        if (extra == null || extra.isEmpty()) {
            return false;
        }
        Object value = extra.get("publicVisible");
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean bool) {
            return Boolean.FALSE.equals(bool);
        }
        if (value instanceof String str) {
            return "false".equalsIgnoreCase(str.trim());
        }
        return false;
    }

    private static boolean isTestFlag(Map<String, Object> extra) {
        if (extra == null || extra.isEmpty()) {
            return false;
        }
        Object value = extra.get("isTest");
        if (value instanceof Boolean bool) {
            return Boolean.TRUE.equals(bool);
        }
        if (value instanceof String str) {
            return "true".equalsIgnoreCase(str.trim());
        }
        return false;
    }

    /**
     * @param label 이름 또는 코드
     * @return 테스트·샘플 표식이면 true
     */
    public static boolean looksLikeTestLabel(String label) {
        if (label == null || label.isBlank()) {
            return false;
        }
        String trimmed = label.trim();
        if (trimmed.contains("테스트") || trimmed.contains("샘플")) {
            return true;
        }
        String upper = trimmed.toUpperCase();
        return upper.startsWith("TEST_") || upper.contains("SAMPLE");
    }
}
