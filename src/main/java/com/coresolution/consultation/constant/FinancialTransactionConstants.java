package com.coresolution.consultation.constant;

/**
 * 재무 거래 카테고리 관련 상수
 * <p>
 * 상담료: "CONSULTATION"과 "상담료"를 "상담료"로 통일.
 * 신규 거래는 "상담료" 사용, 기존 CONSULTATION 데이터는 필터 시 둘 다 매칭(하위호환).
 * </p>
 *
 * @author MindGarden
 * @since 2025-03-15
 */
public final class FinancialTransactionConstants {

    /** 상담료 카테고리 (통일된 표준값) */
    public static final String CATEGORY_CONSULTATION_FEE = "상담료";

    /** @deprecated 하위호환용. 신규 거래에는 CATEGORY_CONSULTATION_FEE 사용 */
    @Deprecated
    public static final String CATEGORY_CONSULTATION_LEGACY = "CONSULTATION";

    private FinancialTransactionConstants() {
    }

    /**
     * 상담료 카테고리 여부 (CONSULTATION 또는 상담료 둘 다 매칭)
     *
     * @param category 카테고리 문자열 (null 허용)
     * @return 상담료 계열 카테고리이면 true
     */
    public static boolean isConsultationCategory(String category) {
        if (category == null || category.isEmpty()) {
            return false;
        }
        return CATEGORY_CONSULTATION_FEE.equals(category) || CATEGORY_CONSULTATION_LEGACY.equals(category);
    }

    /**
     * 필터 기준으로 카테고리 매칭 여부
     * - 필터 null/빈값: 모두 통과
     * - 필터가 CONSULTATION 또는 상담료: 거래가 둘 중 하나면 매칭(하위호환)
     * - 그 외: 정확 일치
     *
     * @param filterCategory 필터에 선택된 카테고리
     * @param transactionCategory 거래의 카테고리
     * @return 필터 조건에 맞으면 true
     */
    public static boolean matchesConsultationFilter(String filterCategory, String transactionCategory) {
        if (filterCategory == null || filterCategory.isEmpty()) {
            return true;
        }
        if (!isConsultationCategory(filterCategory)) {
            return filterCategory.equals(transactionCategory);
        }
        return isConsultationCategory(transactionCategory);
    }

    /** 환불 관련 서브카테고리 (부채 계정 경유 분개 적용) */
    private static final java.util.Set<String> REFUND_SUBCATEGORIES = java.util.Set.of(
            "CONSULTATION_REFUND",
            "CONSULTATION_PARTIAL_REFUND",
            "SESSION_REFUND",
            "PARTIAL_SESSION_REFUND"
    );

    /**
     * 환불 거래 서브카테고리 여부 (환불부채 2단계 분개 대상)
     *
     * @param subcategory 거래 서브카테고리 (null 허용)
     * @return 환불 계열 서브카테고리이면 true
     */
    public static boolean isRefundSubcategory(String subcategory) {
        return subcategory != null && REFUND_SUBCATEGORIES.contains(subcategory);
    }
}
