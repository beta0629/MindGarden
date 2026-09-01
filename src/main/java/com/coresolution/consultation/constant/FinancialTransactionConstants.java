package com.coresolution.consultation.constant;

/**
 * 재무 거래 카테고리 관련 상수
 * <p>
 * 상담료 SSOT: {@link #CATEGORY_CONSULTATION_FEE} ("상담료").
 * 레거시 "CONSULTATION" 은 읽기 하위호환·필터 매칭만 허용하고, 쓰기 경로는
 * {@link #remapCategoryToSsot(String, String)} 로 통일한다.
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

    /** 급여 지출 SSOT */
    public static final String CATEGORY_SALARY = "SALARY";

    /** 임대 지출 SSOT */
    public static final String CATEGORY_RENT = "RENT";

    /** 관리비 지출 SSOT (레거시 MANAGEMENT_FEE 통합) */
    public static final String CATEGORY_UTILITY = "UTILITY";

    /** 세금 지출 SSOT */
    public static final String CATEGORY_TAX = "TAX";

    /** 식대 지출 SSOT */
    public static final String CATEGORY_MEAL = "MEAL";

    /** 장비 지출 SSOT (구매 거래 write) */
    public static final String CATEGORY_EQUIPMENT = "EQUIPMENT";

    /** 기타(수입/지출 type 내) SSOT */
    public static final String CATEGORY_OTHER = "OTHER";

    /**
     * 레거시 FINANCIAL_CATEGORY BUDGET 조회 호환 (신규 write 금지).
     */
    public static final String LEGACY_CATEGORY_BUDGET = "BUDGET";

    /**
     * 매칭 연동 재무 거래 relatedEntityType (입금 확인 INCOME).
     */
    public static final String RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING = "CONSULTANT_CLIENT_MAPPING";

    /**
     * 추가 회기 매칭 연동 재무 거래 relatedEntityType (입금 확인 INCOME).
     */
    public static final String RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL =
            "CONSULTANT_CLIENT_MAPPING_ADDITIONAL";

    /**
     * 매칭 환불 EXPENSE relatedEntityType.
     */
    public static final String RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND =
            "CONSULTANT_CLIENT_MAPPING_REFUND";

    /**
     * 결제 연동 재무 거래 relatedEntityType.
     */
    public static final String RELATED_ENTITY_PAYMENT = "PAYMENT";

    private static final String TX_TYPE_INCOME = "INCOME";
    private static final String TX_TYPE_EXPENSE = "EXPENSE";

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

    /**
     * 쓰기 경로 category 를 확정 SSOT 로 재매핑한다.
     * <p>
     * 확정 쌍만 변환. PACKAGE·환불 subcategory 는 대상 아님.
     * INCOME 결제수단 category(카드결제/PAYMENT 등) 는 상담료로 통일한다.
     * </p>
     *
     * @param category 요청 category (null 허용)
     * @param transactionType INCOME 또는 EXPENSE (null 허용 — CONSULTATION 만 type 무관 변환)
     * @return SSOT category. null/빈값이면 그대로 반환
     */
    public static String remapCategoryToSsot(String category, String transactionType) {
        if (category == null || category.isEmpty()) {
            return category;
        }
        if (CATEGORY_CONSULTATION_LEGACY.equals(category)) {
            return CATEGORY_CONSULTATION_FEE;
        }

        String type = transactionType != null ? transactionType.trim().toUpperCase() : "";

        if (TX_TYPE_EXPENSE.equals(type)) {
            if ("급여".equals(category)) {
                return CATEGORY_SALARY;
            }
            if ("임대료".equals(category)) {
                return CATEGORY_RENT;
            }
            if ("MANAGEMENT_FEE".equals(category) || "관리비".equals(category)) {
                return CATEGORY_UTILITY;
            }
            if ("세금".equals(category)) {
                return CATEGORY_TAX;
            }
            if ("식대".equals(category)) {
                return CATEGORY_MEAL;
            }
            if ("기타".equals(category) || "기타잡비".equals(category)) {
                return CATEGORY_OTHER;
            }
        }

        if (TX_TYPE_INCOME.equals(type)) {
            if (isPaymentMethodAsIncomeCategory(category)) {
                return CATEGORY_CONSULTATION_FEE;
            }
            if ("기타".equals(category) || "기타수입".equals(category)) {
                return CATEGORY_OTHER;
            }
        }

        return category;
    }

    /**
     * INCOME category 에 결제수단이 들어간 레거시 값 여부.
     * (카드결제 등이 category 로 저장되어 상담료 GROUP BY 가 쪼개지던 누수)
     *
     * @param category category 문자열
     * @return 결제수단-as-category 이면 true
     */
    private static boolean isPaymentMethodAsIncomeCategory(String category) {
        return "카드결제".equals(category)
                || "현금결제".equals(category)
                || "계좌이체".equals(category)
                || "가상계좌".equals(category)
                || "기타결제".equals(category)
                || "PAYMENT".equals(category)
                || "결제".equals(category);
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

    /**
     * 환불 서브카테고리 SSOT 집합 — JPQL IN 절 등 외부 파라미터로 사용.
     *
     * <p>ERP P0-2 결산({@code FinancialPeriodServiceImpl}) 의 부가세 가드 산식에서
     * REFUND 합을 산출할 때 본 집합을 IN 절 인자로 사용한다.</p>
     *
     * @return 환불 서브카테고리 코드 불변 집합
     */
    public static java.util.Set<String> getRefundSubcategories() {
        return REFUND_SUBCATEGORIES;
    }
}
