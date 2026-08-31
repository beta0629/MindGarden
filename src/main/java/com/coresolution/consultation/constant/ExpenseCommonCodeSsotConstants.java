package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 비용·수입 카테고리 공통코드 운영 SSOT 상수.
 * <p>
 * 테넌트에 해당 그룹 행이 있으면 tenant-only 로 list/read/write/delete 한다.
 * core 는 부트스트랩·미시드 폴백 원천이며 hybrid 동시 노출 금지.
 * </p>
 *
 * @author MindGarden
 * @since 2026-08-31
 */
public final class ExpenseCommonCodeSsotConstants {

    public static final String GROUP_EXPENSE_CATEGORY = "EXPENSE_CATEGORY";
    public static final String GROUP_EXPENSE_SUBCATEGORY = "EXPENSE_SUBCATEGORY";
    public static final String GROUP_INCOME_CATEGORY = "INCOME_CATEGORY";
    public static final String GROUP_INCOME_SUBCATEGORY = "INCOME_SUBCATEGORY";

    /**
     * 테넌트 행이 있으면 hybrid(core∪tenant) 대신 tenant-only.
     * 0건이면 core 읽기 전용 폴백.
     */
    public static final Set<String> TENANT_OPERATIONAL_SSOT_GROUPS = Set.of(
            GROUP_EXPENSE_CATEGORY,
            GROUP_EXPENSE_SUBCATEGORY,
            GROUP_INCOME_CATEGORY,
            GROUP_INCOME_SUBCATEGORY
    );

    /** 재무 거래 category 컬럼에 매핑되는 루트 그룹. */
    public static final Set<String> LEDGER_CATEGORY_GROUPS = Set.of(
            GROUP_EXPENSE_CATEGORY,
            GROUP_INCOME_CATEGORY
    );

    /** 재무 거래 subcategory 컬럼에 매핑되는 자식 그룹. */
    public static final Set<String> LEDGER_SUBCATEGORY_GROUPS = Set.of(
            GROUP_EXPENSE_SUBCATEGORY,
            GROUP_INCOME_SUBCATEGORY
    );

    public static final String MSG_CODE_IN_USE_BY_LEDGER =
            "재무 거래에서 사용 중인 코드입니다. 삭제할 수 없습니다.";

    /**
     * 장부(FT) 사용 중 삭제 거부 — 건수 포함.
     * <p>예: {@code String.format(MSG_CODE_IN_USE_BY_LEDGER_FMT, count)}</p>
     */
    public static final String MSG_CODE_IN_USE_BY_LEDGER_FMT =
            "재무 거래에서 사용 중인 코드입니다. (%d건) 삭제할 수 없습니다.";

    public static final String MSG_CODE_HAS_CHILD_SUBCATEGORIES =
            "하위 카테고리가 있어 삭제할 수 없습니다. 하위 코드를 먼저 삭제해 주세요.";

    /**
     * 동일 tenant+group 표시명(trim koreanName, 비면 codeLabel) 중복 생성·수정 거부.
     * <p>예: {@code String.format(MSG_DUPLICATE_DISPLAY_NAME_FMT, name)}</p>
     */
    public static final String MSG_DUPLICATE_DISPLAY_NAME_FMT =
            "같은 이름의 코드가 이미 있습니다: %s";

    /**
     * EXPENSE_CATEGORY 온보딩/시드 SSOT code_value
     * ({@code TenantOnboardingSalaryAndFinancialSeedDefinitions} / FinancialCommonCodeSeedStrings).
     */
    public static final Set<String> EXPENSE_CATEGORY_SEED_CODE_VALUES = Set.of(
            "SALARY",
            "RENT",
            "UTILITY",
            "OFFICE_SUPPLIES",
            "TAX",
            "MEAL",
            "MARKETING",
            "EQUIPMENT",
            "SOFTWARE",
            "CONSULTING",
            "OTHER"
    );

    /**
     * INCOME_CATEGORY 시드 SSOT code_value (상담료는 한글 code_value).
     */
    public static final Set<String> INCOME_CATEGORY_SEED_CODE_VALUES = Set.of(
            "상담료",
            "PACKAGE",
            "OTHER"
    );

    /**
     * EXPENSE_SUBCATEGORY 시드 SSOT code_value.
     */
    public static final Set<String> EXPENSE_SUBCATEGORY_SEED_CODE_VALUES = Set.of(
            "CONSULTANT_SALARY",
            "ADMIN_SALARY",
            "OFFICE_RENT",
            "MAINTENANCE_FEE",
            "ELECTRICITY",
            "WATER",
            "STATIONERY",
            "PRINTING",
            "INCOME_TAX",
            "VAT",
            "CORPORATE_TAX",
            "ONLINE_ADS",
            "OFFLINE_ADS",
            "COMPUTER",
            "FURNITURE",
            "LICENSE",
            "EXTERNAL_CONSULTING",
            "CONSULTATION_REFUND",
            "OTHER_EXPENSE"
    );

    /**
     * INCOME_SUBCATEGORY 시드 SSOT code_value.
     */
    public static final Set<String> INCOME_SUBCATEGORY_SEED_CODE_VALUES = Set.of(
            "INDIVIDUAL_CONSULTATION",
            "GROUP_CONSULTATION",
            "ADDITIONAL_CONSULTATION",
            "BASIC_PACKAGE",
            "PREMIUM_PACKAGE",
            "OTHER_INCOME"
    );

    private ExpenseCommonCodeSsotConstants() {
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 운영 SSOT(tenant-first) 그룹이면 true
     */
    public static boolean isTenantOperationalSsotGroup(String codeGroup) {
        return codeGroup != null && TENANT_OPERATIONAL_SSOT_GROUPS.contains(codeGroup);
    }

    /**
     * 표시명: trim(koreanName), 비어 있으면 trim(codeLabel).
     *
     * @param koreanName 한글명
     * @param codeLabel 라벨
     * @return 표시명 또는 null/blank
     */
    public static String resolveDisplayName(String koreanName, String codeLabel) {
        if (koreanName != null) {
            String trimmed = koreanName.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        if (codeLabel == null) {
            return null;
        }
        String label = codeLabel.trim();
        return label.isEmpty() ? null : label;
    }

    /**
     * 그룹별 시드 SSOT code_value 집합. 미해당 그룹은 빈 집합.
     *
     * @param codeGroup 코드 그룹
     * @return 시드 code_value 집합
     */
    public static Set<String> seedCodeValuesForGroup(String codeGroup) {
        if (GROUP_EXPENSE_CATEGORY.equals(codeGroup)) {
            return EXPENSE_CATEGORY_SEED_CODE_VALUES;
        }
        if (GROUP_INCOME_CATEGORY.equals(codeGroup)) {
            return INCOME_CATEGORY_SEED_CODE_VALUES;
        }
        if (GROUP_EXPENSE_SUBCATEGORY.equals(codeGroup)) {
            return EXPENSE_SUBCATEGORY_SEED_CODE_VALUES;
        }
        if (GROUP_INCOME_SUBCATEGORY.equals(codeGroup)) {
            return INCOME_SUBCATEGORY_SEED_CODE_VALUES;
        }
        return Set.of();
    }

    /**
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @return 해당 그룹 시드 SSOT code_value 이면 true
     */
    public static boolean isSeedSsotCodeValue(String codeGroup, String codeValue) {
        return codeValue != null && seedCodeValuesForGroup(codeGroup).contains(codeValue);
    }
}
